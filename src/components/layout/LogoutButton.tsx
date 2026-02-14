'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      <LogOut className="mr-2 h-4 w-4" />
      Se déconnecter
    </Button>
  );
}
