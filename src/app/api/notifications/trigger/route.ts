import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  triggerMatchJoin,
  triggerMatchLeave,
  triggerMatchCancelled,
  triggerMatchCompleted,
  triggerGroupJoin,
  triggerNewChatMessage,
  triggerTournamentUpdate,
  triggerTournamentNextMatch,
  triggerTournamentRegistration,
} from '@/lib/notifications/triggers';

type TriggerAction =
  | 'match_join'
  | 'match_leave'
  | 'match_cancelled'
  | 'match_completed'
  | 'group_join'
  | 'new_chat_message'
  | 'tournament_update'
  | 'tournament_next_match'
  | 'tournament_registration';

interface TriggerPayload {
  action: TriggerAction;
  data: {
    match_id?: string;
    group_id?: string;
    conversation_id?: string;
    tournament_id?: string;
    user_id?: string;
    user_ids?: string[];
    preview?: string;
    message?: string;
    captain_name?: string;
    partner_id?: string;
  };
}

/**
 * POST /api/notifications/trigger
 * Client-side fire-and-forget endpoint.
 * Authenticates the user, then dispatches to the correct trigger function.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body: TriggerPayload = await request.json();
    const { action, data } = body;

    if (!action || !data) {
      return NextResponse.json({ error: 'Action et data requis' }, { status: 400 });
    }

    // Fire-and-forget: we respond immediately and process in background
    // Use waitUntil-like pattern with non-blocking execution
    const triggerPromise = executeTrigger(action, data, user.id);

    // In Edge Runtime we could use waitUntil, but in Node we just fire-and-forget
    triggerPromise.catch((err) => {
      console.error('[notifications/trigger] Error:', action, err);
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[notifications/trigger]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

async function executeTrigger(
  action: TriggerAction,
  data: TriggerPayload['data'],
  userId: string,
) {
  switch (action) {
    case 'match_join':
      if (data.match_id) await triggerMatchJoin(data.match_id, data.user_id ?? userId);
      break;
    case 'match_leave':
      if (data.match_id) await triggerMatchLeave(data.match_id, data.user_id ?? userId);
      break;
    case 'match_cancelled':
      if (data.match_id) await triggerMatchCancelled(data.match_id);
      break;
    case 'match_completed':
      if (data.match_id) await triggerMatchCompleted(data.match_id);
      break;
    case 'group_join':
      if (data.group_id) await triggerGroupJoin(data.group_id, data.user_id ?? userId);
      break;
    case 'new_chat_message':
      if (data.conversation_id) {
        await triggerNewChatMessage(data.conversation_id, userId, data.preview ?? '');
      }
      break;
    case 'tournament_update':
      if (data.tournament_id) {
        await triggerTournamentUpdate(data.tournament_id, data.message ?? 'Mise a jour du tournoi');
      }
      break;
    case 'tournament_next_match':
      if (data.tournament_id && data.user_ids) {
        await triggerTournamentNextMatch(data.tournament_id, data.user_ids);
      }
      break;
    case 'tournament_registration':
      if (data.tournament_id && data.partner_id) {
        await triggerTournamentRegistration(
          data.tournament_id,
          data.partner_id,
          data.captain_name ?? 'Un joueur',
        );
      }
      break;
    default:
      console.warn('[notifications/trigger] Unknown action:', action);
  }
}
