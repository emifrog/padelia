import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LEVEL_LABELS } from '@/types';
import type { PlayerLevel } from '@/types';
import { ChevronLeft, Trophy, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Classements' };

export default async function ClassementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get current user profile
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('id, city')
    .eq('id', user.id)
    .single();

  // Top players globally
  const { data: globalRanking } = await supabase
    .from('profiles')
    .select('id, full_name, username, level, level_score, total_matches, win_rate, city')
    .eq('is_onboarded', true)
    .gt('total_matches', 0)
    .order('level_score', { ascending: false })
    .limit(20);

  // Top players in same city
  let cityRanking: typeof globalRanking = null;
  if (myProfile?.city) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, username, level, level_score, total_matches, win_rate, city')
      .eq('is_onboarded', true)
      .eq('city', myProfile.city)
      .gt('total_matches', 0)
      .order('level_score', { ascending: false })
      .limit(20);
    cityRanking = data;
  }

  function getRankIcon(index: number) {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="flex h-5 w-5 items-center justify-center text-xs text-muted-foreground">{index + 1}</span>;
  }

  function RankingList({ players, title }: { players: typeof globalRanking; title: string }) {
    if (!players || players.length === 0) {
      return (
        <div className="rounded-xl border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">Aucun joueur classé</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <h2 className="font-semibold">{title}</h2>
        {players.map((p, i) => (
          <div
            key={p.id}
            className={cn(
              'flex items-center justify-between rounded-xl border bg-card p-3',
              p.id === user?.id && 'border-primary bg-primary/5',
            )}
          >
            <div className="flex items-center gap-3">
              {getRankIcon(i)}
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {p.full_name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {p.full_name}
                  {p.id === user?.id && <span className="ml-1 text-xs text-primary">(toi)</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  @{p.username} · {p.city ?? ''}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">{p.level_score}</p>
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="text-[10px]">
                  {LEVEL_LABELS[p.level as PlayerLevel]}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {p.win_rate}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/stats"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-xl font-bold">Classements</h1>
      </div>

      {/* City ranking */}
      {myProfile?.city && (
        <RankingList
          players={cityRanking}
          title={`Classement ${myProfile.city}`}
        />
      )}

      {/* Global ranking */}
      <RankingList
        players={globalRanking}
        title="Classement général"
      />
    </div>
  );
}
