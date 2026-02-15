import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { triggerMatchReminder } from '@/lib/notifications/triggers';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * GET /api/cron/match-reminder
 * Vercel Cron Job — runs every 15 minutes.
 * Finds matches starting within the next 75 minutes that haven't been reminded yet,
 * then sends push + email reminders to all participants.
 */
export async function GET(request: NextRequest) {
  // Verify Vercel Cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const supabase = getAdminClient();

  const now = new Date();
  const in75min = new Date(now.getTime() + 75 * 60 * 1000);

  // Find matches starting within 75 minutes that haven't been reminded
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, title, scheduled_at, reminder_sent')
    .in('status', ['open', 'full', 'confirmed'])
    .gte('scheduled_at', now.toISOString())
    .lte('scheduled_at', in75min.toISOString())
    .or('reminder_sent.is.null,reminder_sent.eq.false');

  if (error) {
    console.error('[cron/match-reminder] Query error:', error);
    return NextResponse.json({ error: 'Erreur requête' }, { status: 500 });
  }

  if (!matches?.length) {
    return NextResponse.json({ reminded: 0 });
  }

  let reminded = 0;

  for (const match of matches) {
    try {
      await triggerMatchReminder(match.id);

      // Mark as reminded to avoid duplicates
      await supabase
        .from('matches')
        .update({ reminder_sent: true })
        .eq('id', match.id);

      reminded++;
    } catch (err) {
      console.error(`[cron/match-reminder] Error for match ${match.id}:`, err);
    }
  }

  return NextResponse.json({ reminded, total: matches.length });
}
