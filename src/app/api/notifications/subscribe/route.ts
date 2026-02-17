import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit, getRateLimitId } from '@/lib/api-utils';
import { RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const rateLimited = applyRateLimit(getRateLimitId(request, user.id), RATE_LIMITS.mutation, 'notif:subscribe');
    if (rateLimited) return rateLimited;

    const subscription = await request.json();

    // Store the push subscription as JSON string in push_token
    const { error } = await supabase
      .from('profiles')
      .update({ push_token: JSON.stringify(subscription) })
      .eq('id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[notifications/subscribe]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    await supabase
      .from('profiles')
      .update({ push_token: null })
      .eq('id', user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[notifications/unsubscribe]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
