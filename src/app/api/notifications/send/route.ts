import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendPushNotification, type PushPayload } from '@/lib/notifications/push';

export async function POST(request: NextRequest) {
  try {
    // Verify API key (internal use only)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { user_ids, payload, type }: { user_ids: string[]; payload: PushPayload; type?: string } =
      await request.json();

    if (!user_ids?.length || !payload?.title) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get push tokens for target users
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, push_token')
      .in('id', user_ids)
      .not('push_token', 'is', null);

    const results: { sent: number; expired: number; failed: number } = {
      sent: 0,
      expired: 0,
      failed: 0,
    };

    for (const profile of profiles ?? []) {
      if (!profile.push_token) continue;

      try {
        const subscription = JSON.parse(profile.push_token);
        const result = await sendPushNotification(subscription, payload);

        if (result.success) {
          results.sent++;
        } else if (result.expired) {
          results.expired++;
          // Clean up expired subscription
          await supabase
            .from('profiles')
            .update({ push_token: null })
            .eq('id', profile.id);
        } else {
          results.failed++;
        }
      } catch {
        results.failed++;
      }
    }

    // Also store in notifications table
    const notifications = user_ids.map((userId) => ({
      user_id: userId,
      type: (type ?? 'system') as 'system',
      title: payload.title,
      body: payload.body,
      data: { url: payload.url, tag: payload.tag },
    }));

    await supabase.from('notifications').insert(notifications);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('[notifications/send]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
