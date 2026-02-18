import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { triggerMatchReminder } from '@/lib/notifications/triggers';

/**
 * GET /api/cron/match-reminder
 * Vercel Cron Job — runs once daily at 8:00 AM UTC.
 * Finds all matches scheduled today that haven't been reminded yet,
 * then sends push + email reminders to all participants.
 *
 * Note: Vercel Hobby plan limits cron to 1x/day.
 * Upgrade to Pro for more frequent schedules (e.g. every 15 min).
 */
export async function GET(request: NextRequest) {
  // Verify Vercel Cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const supabase = createAdminClient();

  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setUTCHours(23, 59, 59, 999);

  // Find all matches scheduled today that haven't been reminded
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, title, scheduled_at, reminder_sent')
    .in('status', ['open', 'full', 'confirmed'])
    .gte('scheduled_at', now.toISOString())
    .lte('scheduled_at', endOfDay.toISOString())
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
