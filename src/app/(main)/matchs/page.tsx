import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import MatchListClient from '@/components/match/MatchListClient';

export const metadata = { title: 'Matchs' };

export default async function MatchsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch matches with participants in a single query (avoids N+1)
  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id,
      title,
      match_type,
      status,
      scheduled_at,
      duration_minutes,
      location_name,
      max_players,
      cost_per_player,
      organizer_id,
      profiles!matches_organizer_id_fkey ( full_name ),
      match_participants ( id, status )
    `)
    .in('status', ['open', 'full', 'confirmed', 'in_progress'])
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(50);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matchesWithCounts = (matches ?? []).map((m: any) => {
    const organizer = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    const participants = (m.match_participants ?? []).filter(
      (p: { status: string }) => p.status === 'confirmed' || p.status === 'invited',
    );
    return {
      id: m.id,
      title: m.title,
      match_type: m.match_type,
      status: m.status,
      scheduled_at: m.scheduled_at,
      duration_minutes: m.duration_minutes,
      location_name: m.location_name,
      max_players: m.max_players,
      cost_per_player: m.cost_per_player,
      participant_count: participants.length,
      organizer_name: organizer?.full_name ?? null,
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Matchs</h1>
        <Button size="sm" asChild>
          <Link href="/matchs/creer">
            <Plus className="mr-1.5 h-4 w-4" />
            Créer
          </Link>
        </Button>
      </div>

      <MatchListClient matches={matchesWithCounts} />
    </div>
  );
}
