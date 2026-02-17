import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Settings, UserPlus, Play, XCircle } from 'lucide-react';
import TournamentInfo from '@/components/tournament/TournamentInfo';
import TeamList from '@/components/tournament/TeamList';
import BracketView from '@/components/tournament/BracketView';
import type { Tournament, TournamentBracket } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('tournaments')
    .select('name')
    .eq('id', id)
    .single();
  return { title: data?.name ?? 'Tournoi' };
}

export default async function TournamentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: tournament },
    { data: rawTeams },
    { data: rawBrackets },
  ] = await Promise.all([
    supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('tournament_teams')
      .select('id, name, seed, payment_status, captain_id, player_ids, tournament_id')
      .eq('tournament_id', id)
      .is('withdrawn_at', null)
      .order('seed', { ascending: true, nullsFirst: false }),
    supabase
      .from('tournament_brackets')
      .select('*')
      .eq('tournament_id', id)
      .order('round', { ascending: true })
      .order('position', { ascending: true }),
  ]);

  if (!tournament) notFound();

  const typedTournament = tournament as Tournament;
  const brackets = (rawBrackets ?? []) as TournamentBracket[];

  // Fetch profiles for all players in teams
  const allPlayerIds = (rawTeams ?? []).flatMap((t) => t.player_ids ?? []);
  const uniquePlayerIds = [...new Set(allPlayerIds)];

  let profilesMap: Record<string, { full_name: string; avatar_url: string | null }> = {};

  if (uniquePlayerIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', uniquePlayerIds);

    profilesMap = (profiles ?? []).reduce(
      (acc, p) => {
        acc[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
        return acc;
      },
      {} as typeof profilesMap,
    );
  }

  const teamsWithProfiles = (rawTeams ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    seed: t.seed,
    payment_status: t.payment_status,
    captain_id: t.captain_id,
    player_ids: t.player_ids ?? [],
    profiles: (t.player_ids ?? []).map((pid: string) => profilesMap[pid] ?? { full_name: 'Joueur', avatar_url: null }),
  }));

  // Build teams map for bracket view: team_id → { id, name }
  const teamsMap: Record<string, { id: string; name: string }> = {};
  for (const t of teamsWithProfiles) {
    teamsMap[t.id] = { id: t.id, name: t.name };
  }

  const isOrganizer = user && typedTournament.organizer_id === user.id;
  const isRegistered = user && teamsWithProfiles.some((t) =>
    t.captain_id === user.id || (t.player_ids ?? []).includes(user.id),
  );
  const canRegister =
    user &&
    !isRegistered &&
    typedTournament.status === 'registration_open' &&
    typedTournament.team_count < typedTournament.max_teams;

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/tournois"
          className="flex items-center gap-1 text-[14px] font-semibold text-gray-500"
        >
          <ArrowLeft className="h-4 w-4" />
          Tournois
        </Link>

        {isOrganizer && typedTournament.status === 'draft' && (
          <div className="flex gap-2">
            <Link
              href={`/tournois/${id}`}
              className="flex items-center gap-1 rounded-full bg-navy px-3 py-1.5 text-[12px] font-semibold text-white"
            >
              <Settings className="h-3.5 w-3.5" />
              Gerer
            </Link>
          </div>
        )}
      </div>

      {/* Title */}
      <h1 className="text-[24px] font-extrabold text-navy">{typedTournament.name}</h1>

      {/* Tournament info */}
      <TournamentInfo tournament={typedTournament} />

      {/* Organizer actions */}
      {isOrganizer && (
        <OrganizerActions tournament={typedTournament} teamCount={teamsWithProfiles.length} />
      )}

      {/* Register CTA */}
      {canRegister && (
        <Link
          href={`/tournois/${id}/inscrire`}
          className="flex items-center justify-center gap-2 rounded-xl bg-green-padel py-3 text-[15px] font-bold text-white shadow-padel-md transition-transform active:scale-[0.98]"
        >
          <UserPlus className="h-5 w-5" />
          S&apos;inscrire
        </Link>
      )}

      {/* Already registered indicator */}
      {isRegistered && !isOrganizer && (
        <div className="rounded-xl bg-green-50 p-3 text-center text-[14px] font-semibold text-green-700">
          Tu es inscrit a ce tournoi
        </div>
      )}

      {/* Bracket view */}
      {brackets.length > 0 && (
        <BracketView
          brackets={brackets}
          teamsMap={teamsMap}
          isOrganizer={!!isOrganizer}
          tournamentId={id}
        />
      )}

      {/* Teams */}
      <div className="space-y-3">
        <h3 className="text-[14px] font-bold text-navy">
          Equipes inscrites ({teamsWithProfiles.length}/{typedTournament.max_teams})
        </h3>
        <TeamList teams={teamsWithProfiles} />
      </div>
    </div>
  );
}

// ─── Organizer actions (client island) ──────────────────────────
function OrganizerActions({ tournament, teamCount }: { tournament: Tournament; teamCount: number }) {
  return (
    <div className="space-y-2">
      {tournament.status === 'draft' && (
        <form action={`/api/tournaments/${tournament.id}/status`} method="POST">
          <input type="hidden" name="status" value="registration_open" />
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-padel py-3 text-[15px] font-bold text-white shadow-padel-md transition-transform active:scale-[0.98]"
          >
            <Play className="h-5 w-5" />
            Ouvrir les inscriptions
          </button>
        </form>
      )}

      {tournament.status === 'registration_open' && (
        <form action={`/api/tournaments/${tournament.id}/status`} method="POST">
          <input type="hidden" name="status" value="registration_closed" />
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-500 py-3 text-[15px] font-bold text-white shadow-padel-md transition-transform active:scale-[0.98]"
          >
            <XCircle className="h-5 w-5" />
            Fermer les inscriptions
          </button>
        </form>
      )}

      {(tournament.status === 'registration_closed' || tournament.status === 'registration_open') &&
        teamCount >= 4 && (
          <form action={`/api/tournaments/${tournament.id}/generate-bracket`} method="POST">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-[15px] font-bold text-white shadow-padel-md transition-transform active:scale-[0.98]"
            >
              Generer le bracket
            </button>
          </form>
        )}
    </div>
  );
}
