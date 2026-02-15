import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { MatchStatus, MatchType } from '@/types';
import { Clock, MapPin, ChevronRight, Users } from 'lucide-react';
import SuggestionsSection from '@/components/accueil/SuggestionsSection';
import FabButton from '@/components/accueil/FabButton';

interface MatchData {
  id: string;
  title: string | null;
  scheduled_at: string;
  location_name: string | null;
  status: MatchStatus;
  max_players: number;
  match_type: MatchType;
  cost_per_player?: number;
  match_participants: { player_id: string }[];
}

interface ParticipantWithMatch {
  match_id: string;
  status: string;
  matches: MatchData | MatchData[];
}

interface NormalizedParticipant {
  match_id: string;
  status: string;
  matches: MatchData;
}

interface GroupData {
  id: string;
  name: string;
  city: string | null;
  member_count: number;
}

export const metadata = { title: 'Accueil' };

export default async function AccueilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, level, level_score, city, total_matches, wins, win_rate')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/onboarding');

  // Fetch upcoming matches (user's matches)
  const { data: upcomingMatches } = await supabase
    .from('match_participants')
    .select(`
      match_id,
      status,
      matches (
        id,
        title,
        scheduled_at,
        location_name,
        status,
        max_players,
        match_type,
        match_participants (player_id)
      )
    `)
    .eq('player_id', user.id)
    .in('status', ['confirmed', 'invited'])
    .order('created_at', { ascending: false })
    .limit(5);

  const myMatches = (upcomingMatches ?? []).filter((mp: ParticipantWithMatch) => {
    const match = Array.isArray(mp.matches) ? mp.matches[0] : mp.matches;
    return match && ['open', 'full', 'confirmed'].includes(match.status);
  }).map((mp: ParticipantWithMatch): NormalizedParticipant => ({
    ...mp,
    matches: Array.isArray(mp.matches) ? mp.matches[0] : mp.matches,
  }));

  // Fetch open matches nearby
  const { data: openMatches } = await supabase
    .from('matches')
    .select('id, title, scheduled_at, location_name, status, max_players, match_type, cost_per_player, match_participants (player_id)')
    .eq('status', 'open')
    .order('scheduled_at', { ascending: true })
    .limit(5);

  // Fetch user's groups
  const { data: myGroups } = await supabase
    .from('group_members')
    .select(`
      group_id,
      groups (id, name, city, member_count)
    `)
    .eq('user_id', user.id)
    .limit(4);

  const groups = (myGroups ?? []).map((gm: { group_id: string; groups: GroupData | GroupData[] }) => {
    return Array.isArray(gm.groups) ? gm.groups[0] : gm.groups;
  }).filter((g): g is GroupData => Boolean(g));

  const matchTypeLabel = (type: string) => {
    switch (type) {
      case 'friendly': return 'Amical';
      case 'competitive': return 'Classé';
      case 'tournament': return 'Tournoi';
      default: return type;
    }
  };

  const matchTypeBg = (type: string) => {
    switch (type) {
      case 'friendly': return 'bg-green-padel/20 text-green-padel-light';
      case 'competitive': return 'bg-amber-500/20 text-amber-400';
      case 'tournament': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-white/20 text-white';
    }
  };

  return (
    <div className="space-y-6 pb-4">
      {/* ── Mes prochains matchs ── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-navy">
            <span className="mr-1.5">🎾</span>Mes prochains matchs
          </h2>
          <Link href="/matchs" className="text-[13px] font-semibold text-green-padel">
            Voir tout
          </Link>
        </div>

        {myMatches.length > 0 ? (
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-none">
            {myMatches.map((mp) => {
              const m = mp.matches;
              const playerCount = m.match_participants?.length ?? 0;
              return (
                <Link
                  key={mp.match_id}
                  href={`/matchs/${m.id}`}
                  className="relative min-w-[240px] shrink-0 overflow-hidden rounded-xl bg-navy-gradient p-4 shadow-padel-md"
                >
                  {/* Decorative circle */}
                  <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-green-padel/10" />

                  {/* Match type badge */}
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${matchTypeBg(m.match_type)}`}>
                    {matchTypeLabel(m.match_type)}
                  </span>

                  <p className="mt-2.5 text-[16px] font-bold text-white">
                    {m.title ?? 'Match'}
                  </p>

                  <div className="mt-1 flex items-center gap-1 text-[13px] text-gray-300">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(m.scheduled_at).toLocaleDateString('fr-FR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}{' '}
                    {new Date(m.scheduled_at).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>

                  {m.location_name && (
                    <div className="mt-1 flex items-center gap-1 text-[12px] text-gray-300">
                      <MapPin className="h-3.5 w-3.5" />
                      {m.location_name}
                    </div>
                  )}

                  {/* Player avatars + count */}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {Array.from({ length: Math.min(playerCount, 4) }).map((_, i) => (
                        <div
                          key={i}
                          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-navy bg-green-padel/20 text-[13px]"
                        >
                          🎾
                        </div>
                      ))}
                    </div>
                    <span className="text-[12px] font-semibold text-lime-padel">
                      {playerCount}/{m.max_players}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <p className="text-sm font-medium text-muted-foreground">Aucun match prévu</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Crée ou rejoins un match pour commencer
            </p>
          </div>
        )}
      </section>

      {/* ── Matchs ouverts à proximité ── */}
      <section>
        <h2 className="mb-3 text-[17px] font-bold text-navy">
          <span className="mr-1.5">🔥</span>Matchs ouverts à proximité
        </h2>

        {(openMatches ?? []).length > 0 ? (
          <div className="space-y-2.5">
            {(openMatches ?? []).map((m) => {
              const playerCount = m.match_participants?.length ?? 0;
              return (
                <Link
                  key={m.id}
                  href={`/matchs/${m.id}`}
                  className="flex items-center gap-3.5 rounded-xl bg-white p-4 shadow-padel transition-transform active:scale-[0.98]"
                >
                  {/* Icon */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-green-subtle text-[22px]">
                    🎾
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[15px] font-bold text-navy">
                        {m.title ?? 'Match'}
                      </span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${matchTypeBg(m.match_type).replace('text-green-padel-light', 'text-green-700').replace('text-amber-400', 'text-amber-700').replace('text-purple-400', 'text-purple-700')}`}>
                        {matchTypeLabel(m.match_type)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12px] text-gray-400">
                      {new Date(m.scheduled_at).toLocaleDateString('fr-FR', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}{' '}
                      {new Date(m.scheduled_at).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {m.location_name && ` · ${m.location_name}`}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    {m.cost_per_player != null && (
                      <p className="text-[14px] font-bold text-green-padel">{m.cost_per_player}€</p>
                    )}
                    <p className="text-[11px] text-gray-400">{playerCount}/{m.max_players}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucun match ouvert pour le moment</p>
        )}
      </section>

      {/* ── Joueurs compatibles ── */}
      <section>
        <h2 className="mb-3 text-[17px] font-bold text-navy">
          <span className="mr-1.5">⚡</span>Joueurs compatibles
        </h2>
        <SuggestionsSection />
      </section>

      {/* ── Mes groupes ── */}
      <section>
        <h2 className="mb-3 text-[17px] font-bold text-navy">
          <span className="mr-1.5">👥</span>Mes groupes
        </h2>

        {groups.length > 0 ? (
          <div className="space-y-2">
            {groups.map((g) => (
              <Link
                key={g.id}
                href={`/groupes/${g.id}`}
                className="flex items-center gap-3 rounded-xl bg-white p-3.5 shadow-padel"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-lime-padel/15 text-[22px]">
                  👥
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold text-navy">{g.name}</p>
                  <p className="text-[12px] text-gray-400">
                    {g.member_count} membre{g.member_count > 1 ? 's' : ''}
                    {g.city && ` · ${g.city}`}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
              </Link>
            ))}
          </div>
        ) : (
          <Link
            href="/groupes"
            className="flex items-center gap-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground"
          >
            <Users className="h-5 w-5" />
            Rejoins un groupe pour jouer régulièrement
          </Link>
        )}
      </section>

      {/* FAB Button */}
      <FabButton />
    </div>
  );
}
