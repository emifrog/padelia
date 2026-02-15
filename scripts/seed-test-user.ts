import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function seedTestUser() {
  const email = 'test@test.fr';
  const password = 'Test123!';
  const fullName = 'Test';

  // Clean up any existing user
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existing = existingUsers?.users.find((u) => u.email === email);
  if (existing) {
    console.log('Deleting existing user...');
    await supabase.from('profiles').delete().eq('id', existing.id);
    await supabase.auth.admin.deleteUser(existing.id);
  }

  // The trigger handle_new_user may have issues.
  // First, drop the trigger temporarily, create user, insert profile manually, then recreate trigger.
  // We can't run raw SQL, so let's try a workaround:
  // Use the Management API with fetch to drop/create trigger

  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!
    .replace('https://', '')
    .replace('.supabase.co', '');

  // Try creating user - if trigger fails, we need to fix the trigger SQL
  // Let's see if the error gives more info with a direct REST call
  console.log('Creating user via REST API directly...');

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`,
    {
      method: 'POST',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          username: 'test',
        },
      }),
    },
  );

  const result = await res.json();

  if (!res.ok) {
    console.error('Error:', res.status, JSON.stringify(result, null, 2));

    if (result.msg?.includes('Database') || result.message?.includes('Database')) {
      console.log('\n--- DIAGNOSIS ---');
      console.log('The handle_new_user() trigger is failing when inserting into profiles.');
      console.log('Please run this SQL in Supabase SQL Editor to fix it:\n');
      console.log(`
-- First, drop the broken trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Then create the user manually in the Supabase Auth dashboard
-- (Authentication > Users > Add User > test@test.fr / Test123! / Auto Confirm)

-- After creating the user, run this to create the profile:
-- INSERT INTO profiles (id, email, full_name, username)
-- SELECT id, email, 'Test', 'test' FROM auth.users WHERE email = 'test@test.fr';

-- Finally, recreate the trigger for future signups:
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      'player_' || substr(NEW.id::text, 1, 8)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`);
    }
  } else {
    console.log('Test user created successfully!');
    console.log('  Email:', email);
    console.log('  Password:', password);
    console.log('  User ID:', result.id);

    // Verify profile was created
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name, username')
      .eq('id', result.id)
      .single();
    console.log('  Profile:', profile ? 'auto-created' : 'MISSING - manual insert needed');
  }
}

seedTestUser();
