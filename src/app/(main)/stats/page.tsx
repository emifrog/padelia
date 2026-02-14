import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LEVEL_LABELS } from '@/types';
import type { PlayerLevel } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, Trophy, Target, Users, ChevronRight, BarChart3 } from 'lucide-react';
import LevelProgressBar from '@/components/stats/LevelProgressBar';
import WinRateRing from '@/components/stats/WinRateRing';
import MatchHistory from '@/components/stats/MatchHistory';

export const metadata = { title: 'Statistiques' };

export default async function StatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/onboarding');

  // Fetch player stats history (last 20)
  const { data: statsHistory } = await supabase
    .from('player_stats')
    .select('*')
    .eq('player_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  // Fetch top partners
  const { data: partnerStats } = await supabase
    .from('player_stats')
    .select(`
      partner_id,
      was_winner,
      profiles!player_stats_partner_id_fkey (
        full_name,
        username
      )
    `)
    .eq('player_id', user.id)
    .not('partner_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50);

  // Aggregate partner data
  const partnerMap = new Map<string, { name: string; matches: number; wins: number }>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const ps of (partnerStats ?? []) as any[]) {
    const partnerId = ps.partner_id;
    if (!partnerId) continue;
    const existing = partnerMap.get(partnerId);
    const partnerProfile = Array.isArray(ps.profiles) ? ps.profiles[0] : ps.profiles;
    if (existing) {
      existing.matches++;
      if (ps.was_winner) existing.wins++;
    } else {
      partnerMap.set(partnerId, {
        name: partnerProfile?.full_name ?? 'Inconnu',
        matches: 1,
        wins: ps.was_winner ? 1 : 0,
      });
    }
  }

  const topPartners = Array.from(partnerMap.values())
    .sort((a, b) => b.matches - a.matches)
    .slice(0, 5);

  // Streak calculation
  let currentStreak = 0;
  let streakType: 'win' | 'loss' | null = null;
  for (const stat of (statsHistory ?? [])) {
    if (streakType === null) {
      streakType = stat.was_winner ? 'win' : 'loss';
      currentStreak = 1;
    } else if ((stat.was_winner && streakType === 'win') || (!stat.was_winner && streakType === 'loss')) {
      currentStreak++;
    } else {
      break;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Statistiques</h1>
        <Link
          href="/stats/classements"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <BarChart3 className="h-4 w-4" />
          Classements
        </Link>
      </div>

      {/* Level progress */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          <TrendingUp className="h-4 w-4" /> Niveau
        </h2>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-primary">{profile.level_score}</p>
              <Badge variant="secondary" className="mt-1">
                {LEVEL_LABELS[profile.level as PlayerLevel]}
              </Badge>
            </div>
            <LevelProgressBar level={profile.level as PlayerLevel} score={profile.level_score} />
          </div>

          {/* Level history mini chart */}
          {(statsHistory ?? []).length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs text-muted-foreground">Évolution récente</p>
              <div className="flex items-end gap-1 h-12">
                {[...(statsHistory ?? [])].reverse().map((stat, i) => {
                  const normalized = ((stat.level_after ?? 5) - 1) / 9;
                  return (
                    <div
                      key={stat.id ?? i}
                      className={`flex-1 rounded-t ${stat.was_winner ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                      style={{ height: `${Math.max(10, normalized * 100)}%` }}
                      title={`${stat.level_after} (${stat.was_winner ? 'V' : 'D'})`}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Win stats */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          <Trophy className="h-4 w-4" /> Performance
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-card p-4 text-center">
            <WinRateRing winRate={profile.win_rate} />
            <p className="mt-2 text-xs text-muted-foreground">Taux de victoire</p>
          </div>
          <div className="space-y-3">
            <div className="rounded-xl border bg-card p-3 text-center">
              <p className="text-xl font-bold">{profile.total_matches}</p>
              <p className="text-xs text-muted-foreground">Matchs joués</p>
            </div>
            <div className="rounded-xl border bg-card p-3 text-center">
              <p className={`text-xl font-bold ${streakType === 'win' ? 'text-primary' : 'text-destructive'}`}>
                {currentStreak > 0 ? `${currentStreak}${streakType === 'win' ? 'V' : 'D'}` : '—'}
              </p>
              <p className="text-xs text-muted-foreground">Série en cours</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-card p-3 text-center">
            <p className="text-xl font-bold text-primary">{profile.wins}</p>
            <p className="text-xs text-muted-foreground">Victoires</p>
          </div>
          <div className="rounded-xl border bg-card p-3 text-center">
            <p className="text-xl font-bold">{profile.losses}</p>
            <p className="text-xs text-muted-foreground">Défaites</p>
          </div>
        </div>
      </section>

      <Separator />

      {/* Top partners */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          <Users className="h-4 w-4" /> Meilleurs partenaires
        </h2>
        {topPartners.length > 0 ? (
          <div className="space-y-2">
            {topPartners.map((partner, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border bg-card p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {partner.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{partner.name}</p>
                    <p className="text-xs text-muted-foreground">{partner.matches} matchs ensemble</p>
                  </div>
                </div>
                <Badge variant={partner.wins / partner.matches >= 0.5 ? 'default' : 'secondary'}>
                  {Math.round((partner.wins / partner.matches) * 100)}%
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Joue des matchs pour voir tes partenaires</p>
        )}
      </section>

      <Separator />

      {/* Match History */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          <Target className="h-4 w-4" /> Derniers matchs
        </h2>
        <MatchHistory stats={statsHistory ?? []} />
      </section>
    </div>
  );
}
