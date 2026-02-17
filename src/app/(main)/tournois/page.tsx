import { createClient } from '@/lib/supabase/server';
import TournamentListClient from '@/components/tournament/TournamentListClient';
import type { TournamentCardData } from '@/components/tournament/TournamentCard';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const metadata = { title: 'Tournois' };

export default async function TournoisPage() {
  const supabase = await createClient();

  const { data: rawTournaments } = await supabase
    .from('tournaments')
    .select('id, name, status, format, location_name, starts_at, max_teams, team_count, entry_fee')
    .neq('status', 'cancelled')
    .order('starts_at', { ascending: false })
    .limit(12);

  const tournaments: TournamentCardData[] = (rawTournaments ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    status: t.status as TournamentCardData['status'],
    format: t.format as TournamentCardData['format'],
    location_name: t.location_name,
    starts_at: t.starts_at,
    max_teams: t.max_teams,
    team_count: t.team_count,
    entry_fee: Number(t.entry_fee),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-extrabold text-navy">Tournois</h1>
        <Link
          href="/tournois/creer"
          className="flex items-center gap-1.5 rounded-full bg-green-padel px-4 py-2 text-[13px] font-bold text-white shadow-padel-md transition-transform active:scale-[0.97]"
        >
          <Plus className="h-4 w-4" />
          Creer
        </Link>
      </div>
      <TournamentListClient tournaments={tournaments} />
    </div>
  );
}
