import { createClient } from '@supabase/supabase-js';
import { sendPushNotification, type PushPayload } from './push';
import { sendEmail, matchReminderEmail } from './email';

// ── Admin client (service role, server-side only) ──

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ── Helpers ──

interface NotificationTarget {
  id: string;
  push_token: string | null;
  email: string | null;
  notification_preferences: Record<string, boolean> | null;
}

/** Send push to a list of users, respecting preferences */
async function sendPushToUsers(
  users: NotificationTarget[],
  payload: PushPayload,
  preferenceKey: string,
  notificationType: string,
) {
  const supabase = getAdminClient();

  for (const user of users) {
    // Check preference
    const prefs = user.notification_preferences ?? {};
    if (prefs[preferenceKey] === false) continue;

    // Send push
    if (user.push_token) {
      try {
        const subscription = JSON.parse(user.push_token);
        const result = await sendPushNotification(subscription, payload);
        if (result.expired) {
          await supabase.from('profiles').update({ push_token: null }).eq('id', user.id);
        }
      } catch {
        // Silently fail push
      }
    }

    // Store in-app notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: notificationType,
      title: payload.title,
      body: payload.body,
      data: { url: payload.url, tag: payload.tag },
    });
  }
}

async function getMatchOrganizer(matchId: string): Promise<NotificationTarget | null> {
  const supabase = getAdminClient();
  const { data } = await supabase
    .from('matches')
    .select('organizer_id')
    .eq('id', matchId)
    .single();

  if (!data?.organizer_id) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, push_token, email, notification_preferences')
    .eq('id', data.organizer_id)
    .single();

  return profile as NotificationTarget | null;
}

async function getMatchParticipants(matchId: string, excludeUserId?: string): Promise<NotificationTarget[]> {
  const supabase = getAdminClient();
  const { data: participants } = await supabase
    .from('match_participants')
    .select('player_id')
    .eq('match_id', matchId)
    .in('status', ['confirmed', 'invited']);

  if (!participants?.length) return [];

  const playerIds = participants
    .map((p) => p.player_id)
    .filter((id) => id !== excludeUserId);

  if (!playerIds.length) return [];

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, push_token, email, notification_preferences')
    .in('id', playerIds);

  return (profiles ?? []) as NotificationTarget[];
}

// ── Trigger Functions ──

/**
 * Notify organizer when a player joins their match
 */
export async function triggerMatchJoin(matchId: string, joinerId: string) {
  const supabase = getAdminClient();

  // Get joiner name
  const { data: joiner } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', joinerId)
    .single();

  // Get match info
  const { data: match } = await supabase
    .from('matches')
    .select('title, organizer_id')
    .eq('id', matchId)
    .single();

  if (!match?.organizer_id || match.organizer_id === joinerId) return;

  // Get organizer
  const organizer = await getMatchOrganizer(matchId);
  if (!organizer) return;

  const payload: PushPayload = {
    title: 'Nouveau joueur !',
    body: `${joiner?.full_name ?? 'Un joueur'} a rejoint "${match.title ?? 'ton match'}"`,
    url: `/matchs/${matchId}`,
    tag: `match-join-${matchId}`,
  };

  await sendPushToUsers([organizer], payload, 'push_match_update', 'match_update');
}

/**
 * Notify organizer when a player leaves their match
 */
export async function triggerMatchLeave(matchId: string, leaverId: string) {
  const supabase = getAdminClient();

  const { data: leaver } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', leaverId)
    .single();

  const { data: match } = await supabase
    .from('matches')
    .select('title, organizer_id')
    .eq('id', matchId)
    .single();

  if (!match?.organizer_id || match.organizer_id === leaverId) return;

  const organizer = await getMatchOrganizer(matchId);
  if (!organizer) return;

  const payload: PushPayload = {
    title: 'Joueur parti',
    body: `${leaver?.full_name ?? 'Un joueur'} a quitté "${match.title ?? 'ton match'}"`,
    url: `/matchs/${matchId}`,
    tag: `match-leave-${matchId}`,
  };

  await sendPushToUsers([organizer], payload, 'push_match_update', 'match_update');
}

/**
 * Notify all participants when a match is cancelled
 */
export async function triggerMatchCancelled(matchId: string) {
  const supabase = getAdminClient();

  const { data: match } = await supabase
    .from('matches')
    .select('title, organizer_id')
    .eq('id', matchId)
    .single();

  const participants = await getMatchParticipants(matchId, match?.organizer_id);
  if (!participants.length) return;

  const payload: PushPayload = {
    title: 'Match annulé',
    body: `Le match "${match?.title ?? 'Match'}" a été annulé`,
    url: `/matchs/${matchId}`,
    tag: `match-cancelled-${matchId}`,
  };

  await sendPushToUsers(participants, payload, 'push_match_update', 'match_update');
}

/**
 * Notify all participants when a match is completed (scores saved)
 */
export async function triggerMatchCompleted(matchId: string) {
  const supabase = getAdminClient();

  const { data: match } = await supabase
    .from('matches')
    .select('title')
    .eq('id', matchId)
    .single();

  const participants = await getMatchParticipants(matchId);
  if (!participants.length) return;

  const payload: PushPayload = {
    title: 'Match terminé !',
    body: `Les résultats de "${match?.title ?? 'ton match'}" sont disponibles. N'oublie pas de noter tes partenaires !`,
    url: `/matchs/${matchId}`,
    tag: `match-completed-${matchId}`,
  };

  await sendPushToUsers(participants, payload, 'push_match_update', 'match_update');
}

/**
 * Notify group admins when a new member joins
 */
export async function triggerGroupJoin(groupId: string, joinerId: string) {
  const supabase = getAdminClient();

  const { data: joiner } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', joinerId)
    .single();

  const { data: group } = await supabase
    .from('groups')
    .select('name')
    .eq('id', groupId)
    .single();

  // Get admins
  const { data: admins } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('role', 'admin');

  if (!admins?.length) return;

  const adminIds = admins.map((a) => a.user_id).filter((id) => id !== joinerId);
  if (!adminIds.length) return;

  const { data: adminProfiles } = await supabase
    .from('profiles')
    .select('id, push_token, email, notification_preferences')
    .in('id', adminIds);

  if (!adminProfiles?.length) return;

  const payload: PushPayload = {
    title: 'Nouveau membre',
    body: `${joiner?.full_name ?? 'Un joueur'} a rejoint "${group?.name ?? 'ton groupe'}"`,
    url: `/groupes/${groupId}`,
    tag: `group-join-${groupId}`,
  };

  await sendPushToUsers(adminProfiles as NotificationTarget[], payload, 'push_group_activity', 'group_invite');
}

/**
 * Notify conversation members when a new message is sent
 * (except the sender)
 */
export async function triggerNewChatMessage(
  conversationId: string,
  senderId: string,
  preview: string,
) {
  const supabase = getAdminClient();

  // Get sender name
  const { data: sender } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', senderId)
    .single();

  // Get other members of the conversation
  const { data: members } = await supabase
    .from('conversation_members')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .neq('user_id', senderId);

  if (!members?.length) return;

  const memberIds = members.map((m) => m.user_id);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, push_token, email, notification_preferences')
    .in('id', memberIds);

  if (!profiles?.length) return;

  const truncated = preview.length > 60 ? preview.slice(0, 60) + '…' : preview;

  const payload: PushPayload = {
    title: sender?.full_name ?? 'Nouveau message',
    body: truncated,
    url: `/chat/${conversationId}`,
    tag: `chat-${conversationId}`,
  };

  await sendPushToUsers(profiles as NotificationTarget[], payload, 'push_new_message', 'chat_message');
}

/**
 * Send match reminder to all participants
 * Called by cron job 1 hour before match
 */
export async function triggerMatchReminder(matchId: string) {
  const supabase = getAdminClient();

  const { data: match } = await supabase
    .from('matches')
    .select('title, scheduled_at')
    .eq('id', matchId)
    .single();

  if (!match) return;

  const participants = await getMatchParticipants(matchId);
  if (!participants.length) return;

  const dateStr = new Date(match.scheduled_at).toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Push notification
  const payload: PushPayload = {
    title: 'Match dans 1h !',
    body: `"${match.title ?? 'Ton match'}" commence à ${dateStr}`,
    url: `/matchs/${matchId}`,
    tag: `match-reminder-${matchId}`,
  };

  await sendPushToUsers(participants, payload, 'push_match_update', 'match_reminder');

  // Email reminder
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://padelia-beta.vercel.app';
  const matchUrl = `${appUrl}/matchs/${matchId}`;
  const emailTemplate = matchReminderEmail(match.title ?? 'Match de padel', dateStr, matchUrl);

  for (const participant of participants) {
    const prefs = participant.notification_preferences ?? {};
    if (prefs.email_match_reminder === false || !participant.email) continue;

    await sendEmail({
      to: participant.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });
  }
}

// ── Tournament Notifications ──

/**
 * Notify all tournament participants of an update
 */
export async function triggerTournamentUpdate(tournamentId: string, message: string) {
  const supabase = getAdminClient();

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('name')
    .eq('id', tournamentId)
    .single();

  // Get all players from non-withdrawn teams
  const { data: teams } = await supabase
    .from('tournament_teams')
    .select('player_ids')
    .eq('tournament_id', tournamentId)
    .is('withdrawn_at', null);

  if (!teams?.length) return;

  const allPlayerIds = [...new Set(teams.flatMap((t) => t.player_ids ?? []))];
  if (!allPlayerIds.length) return;

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, push_token, email, notification_preferences')
    .in('id', allPlayerIds);

  if (!profiles?.length) return;

  const payload: PushPayload = {
    title: tournament?.name ?? 'Tournoi',
    body: message,
    url: `/tournois/${tournamentId}`,
    tag: `tournament-update-${tournamentId}`,
  };

  await sendPushToUsers(profiles as NotificationTarget[], payload, 'push_match_update', 'tournament_update');
}

/**
 * Notify a team about their next match in the tournament
 */
export async function triggerTournamentNextMatch(tournamentId: string, teamPlayerIds: string[]) {
  const supabase = getAdminClient();

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('name')
    .eq('id', tournamentId)
    .single();

  if (!teamPlayerIds.length) return;

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, push_token, email, notification_preferences')
    .in('id', teamPlayerIds);

  if (!profiles?.length) return;

  const payload: PushPayload = {
    title: 'Prochain match !',
    body: `Votre equipe avance au tour suivant dans "${tournament?.name ?? 'le tournoi'}"`,
    url: `/tournois/${tournamentId}`,
    tag: `tournament-next-${tournamentId}`,
  };

  await sendPushToUsers(profiles as NotificationTarget[], payload, 'push_match_update', 'tournament_reminder');
}

/**
 * Notify a partner that they've been registered for a tournament
 */
export async function triggerTournamentRegistration(
  tournamentId: string,
  partnerId: string,
  captainName: string,
) {
  const supabase = getAdminClient();

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('name')
    .eq('id', tournamentId)
    .single();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, push_token, email, notification_preferences')
    .eq('id', partnerId)
    .single();

  if (!profile) return;

  const payload: PushPayload = {
    title: 'Inscription tournoi',
    body: `${captainName} t'a inscrit au tournoi "${tournament?.name ?? 'un tournoi'}"`,
    url: `/tournois/${tournamentId}`,
    tag: `tournament-register-${tournamentId}`,
  };

  await sendPushToUsers([profile as NotificationTarget], payload, 'push_match_update', 'tournament_update');
}
