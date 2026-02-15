import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MATCH_TYPE_LABELS, MATCH_TYPE_COLORS, MATCH_STATUS_LABELS, MATCH_STATUS_COLORS } from '@/lib/constants/match';
import { LEVEL_LABELS } from '@/types';
import type { MatchType, MatchStatus, PlayerLevel } from '@/types';
import { Calendar, Clock, MapPin, Users, Euro, ChevronLeft, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import MatchActions from '@/components/match/MatchActions';
import ScoreSection from '@/components/match/ScoreSection';
import PeerFeedbackForm from '@/components/match/PeerFeedbackForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: match } = await supabase
    .from('matches')
    .select('title')
    .eq('id', id)
    .single();
  return { title: match?.title ?? 'Match' };
}

export default async function MatchDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch match
  const { data: match } = await supabase
    .from('matches')
    .select('*')
    .eq('id', id)
    .single();

  if (!match) notFound();

  // Fetch participants with profiles
  const { data: participants } = await supabase
    .from('match_participants')
    .select(`
      id,
      player_id,
      role,
      status,
      team,
      position,
      payment_status,
      rating_given,
      profiles (
        full_name,
        username,
        avatar_url,
        level,
        level_score,
        preferred_side
      )
    `)
    .eq('match_id', id)
    .in('status', ['confirmed', 'invited']);

  // Fetch organizer
  const { data: organizer } = await supabase
    .from('profiles')
    .select('full_name, username')
    .eq('id', match.organizer_id)
    .single();

  const date = new Date(match.scheduled_at);
  const isOrganizer = match.organizer_id === user.id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentParticipant = (participants ?? []).find((p: any) => p.player_id === user.id);
  const isParticipant = !!currentParticipant;
  const participantCount = participants?.length ?? 0;
  const canJoin = !isParticipant && match.status === 'open' && participantCount < match.max_players;
  const canLeave = isParticipant && !isOrganizer && ['open', 'full', 'confirmed'].includes(match.status);
  const canComplete = isOrganizer && ['confirmed', 'full'].includes(match.status);
  const isCompleted = match.status === 'completed';

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/matchs"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-navy">{match.title ?? 'Match'}</h1>
          <p className="text-xs text-gray-400">
            Organisé par {organizer?.full_name ?? 'Inconnu'}
          </p>
        </div>
        <div className="flex gap-1.5">
          <Badge className={cn('text-xs', MATCH_TYPE_COLORS[match.match_type as MatchType])}>
            {MATCH_TYPE_LABELS[match.match_type as MatchType]}
          </Badge>
          <Badge className={cn('text-xs', MATCH_STATUS_COLORS[match.status as MatchStatus])}>
            {MATCH_STATUS_LABELS[match.status as MatchStatus]}
          </Badge>
        </div>
      </div>

      {/* Description */}
      {match.description && (
        <p className="text-sm text-gray-400">{match.description}</p>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-padel">
          <Calendar className="h-5 w-5 text-green-padel" />
          <div>
            <p className="text-sm font-medium">
              {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <p className="text-xs text-gray-400">
              {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-padel">
          <Clock className="h-5 w-5 text-green-padel" />
          <div>
            <p className="text-sm font-medium">{match.duration_minutes} min</p>
            <p className="text-xs text-gray-400">Durée</p>
          </div>
        </div>
        {match.location_name && (
          <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-padel">
            <MapPin className="h-5 w-5 text-green-padel" />
            <div>
              <p className="text-sm font-medium">{match.location_name}</p>
              <p className="text-xs text-gray-400">Lieu</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-padel">
          <Users className="h-5 w-5 text-green-padel" />
          <div>
            <p className="text-sm font-medium">{participantCount}/{match.max_players}</p>
            <p className="text-xs text-gray-400">Joueurs</p>
          </div>
        </div>
        {match.cost_per_player > 0 && (
          <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-padel">
            <Euro className="h-5 w-5 text-green-padel" />
            <div>
              <p className="text-sm font-medium">{match.cost_per_player}€</p>
              <p className="text-xs text-gray-400">Par joueur</p>
            </div>
          </div>
        )}
        {(match.min_level || match.max_level) && (
          <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-padel">
            <Trophy className="h-5 w-5 text-green-padel" />
            <div>
              <p className="text-sm font-medium">
                {match.min_level ? LEVEL_LABELS[match.min_level as PlayerLevel] : '—'}
                {' → '}
                {match.max_level ? LEVEL_LABELS[match.max_level as PlayerLevel] : '—'}
              </p>
              <p className="text-xs text-gray-400">Niveau requis</p>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Participants list */}
      <div className="space-y-3">
        <h2 className="font-semibold text-navy">Joueurs ({participantCount}/{match.max_players})</h2>
        {(participants ?? []).length > 0 ? (
          <div className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(participants ?? []).map((p: any) => {
              const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
              return (
                <div key={p.id} className="flex items-center justify-between rounded-xl bg-white p-3 shadow-padel">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-padel/10 text-sm font-bold text-green-padel">
                      {profile?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{profile?.full_name ?? 'Joueur'}</p>
                      <p className="text-xs text-gray-400">
                        {profile?.level_score ?? '—'} · @{profile?.username ?? ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {p.team && (
                      <Badge variant="outline" className="text-xs">
                        Équipe {p.team}
                      </Badge>
                    )}
                    {p.role === 'organizer' && (
                      <Badge className="text-xs bg-green-padel/10 text-green-padel">Orga</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Aucun joueur pour le moment</p>
        )}
      </div>

      {/* Scores section (if completed) */}
      {isCompleted && match.score_team_a && (
        <>
          <Separator />
          <div className="space-y-3">
            <h2 className="font-semibold text-navy">Résultat</h2>
            <div className="flex items-center justify-center gap-6 rounded-xl bg-white p-4 shadow-padel">
              <div className={cn('text-center', match.winner_team === 'A' && 'text-green-padel')}>
                <p className="text-3xl font-bold">{match.score_team_a}</p>
                <p className="text-xs text-gray-400">Équipe A</p>
              </div>
              <span className="text-lg text-gray-400">—</span>
              <div className={cn('text-center', match.winner_team === 'B' && 'text-green-padel')}>
                <p className="text-3xl font-bold">{match.score_team_b}</p>
                <p className="text-xs text-gray-400">Équipe B</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Peer feedback (if completed and participant) */}
      {isCompleted && isParticipant && (
        <>
          <Separator />
          <div className="space-y-3">
            <h2 className="font-semibold text-navy">Feedback</h2>
            <PeerFeedbackForm
              matchId={match.id}
              participants={(participants ?? []).map((p: { player_id: string; rating_given: number | null; profiles: { full_name: string } | { full_name: string }[] }) => ({
                player_id: p.player_id,
                full_name: (Array.isArray(p.profiles) ? p.profiles[0] : p.profiles)?.full_name ?? 'Joueur',
                rating_given: p.rating_given,
              }))}
              currentUserId={user.id}
            />
          </div>
        </>
      )}

      {/* Score input (if organizer can complete) */}
      {canComplete && (
        <>
          <Separator />
          <ScoreSection matchId={match.id} maxPlayers={match.max_players} />
        </>
      )}

      {/* Actions */}
      <MatchActions
        matchId={match.id}
        canJoin={canJoin}
        canLeave={canLeave}
        isOrganizer={isOrganizer}
        matchStatus={match.status}
      />
    </div>
  );
}
