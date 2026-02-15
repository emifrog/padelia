import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LEVEL_LABELS } from '@/types';
import type { PlayerLevel } from '@/types';
import { TrendingUp, Trophy, Target, Users, BarChart3 } from 'lucide-react';
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
        <h1 className="text-2xl font-bold text-navy">Statistiques</h1>
        <Link
          href="/stats/classements"
          className="flex items-center gap-1 text-sm font-semibold text-green-padel"
        >
          <BarChart3 className="h-4 w-4" />
          Classements
        </Link>
      </div>

      {/* Level progress */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-gray-400">
          <TrendingUp className="h-4 w-4" /> Niveau
        </h2>
        <div className="rounded-xl bg-white p-4 shadow-padel">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-green-padel">{profile.level_score}</p>
              <span className="mt-1 inline-block rounded-full bg-green-padel/10 px-2.5 py-0.5 text-[11px] font-bold text-green-padel">
                {LEVEL_LABELS[profile.level as PlayerLevel]}
              </span>
            </div>
            <LevelProgressBar level={profile.level as PlayerLevel} score={profile.level_score} />
          </div>

          {/* Level history mini chart */}
          {(statsHistory ?? []).length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs text-gray-400">Évolution récente</p>
              <div className="flex h-12 items-end gap-1">
                {[...(statsHistory ?? [])].reverse().map((stat, i) => {
                  const normalized = ((stat.level_after ?? 5) - 1) / 9;
                  return (
                    <div
                      key={stat.id ?? i}
                      className={`flex-1 rounded-t ${stat.was_winner ? 'bg-green-padel' : 'bg-gray-200'}`}
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
        <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-gray-400">
          <Trophy className="h-4 w-4" /> Performance
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white p-4 text-center shadow-padel">
            <WinRateRing winRate={profile.win_rate} />
            <p className="mt-2 text-xs text-gray-400">Taux de victoire</p>
          </div>
          <div className="space-y-3">
            <div className="rounded-xl bg-white p-3 text-center shadow-padel">
              <p className="text-xl font-bold text-navy">{profile.total_matches}</p>
              <p className="text-xs text-gray-400">Matchs joués</p>
            </div>
            <div className="rounded-xl bg-white p-3 text-center shadow-padel">
              <p className={`text-xl font-bold ${streakType === 'win' ? 'text-green-padel' : 'text-red-500'}`}>
                {currentStreak > 0 ? `${currentStreak}${streakType === 'win' ? 'V' : 'D'}` : '—'}
              </p>
              <p className="text-xs text-gray-400">Série en cours</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white p-3 text-center shadow-padel">
            <p className="text-xl font-bold text-green-padel">{profile.wins}</p>
            <p className="text-xs text-gray-400">Victoires</p>
          </div>
          <div className="rounded-xl bg-white p-3 text-center shadow-padel">
            <p className="text-xl font-bold text-navy">{profile.losses}</p>
            <p className="text-xs text-gray-400">Défaites</p>
          </div>
        </div>
      </section>

      {/* Top partners */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-gray-400">
          <Users className="h-4 w-4" /> Meilleurs partenaires
        </h2>
        {topPartners.length > 0 ? (
          <div className="space-y-2">
            {topPartners.map((partner, i) => {
              const winRate = Math.round((partner.wins / partner.matches) * 100);
              return (
                <div key={i} className="flex items-center justify-between rounded-xl bg-white p-3 shadow-padel">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-padel/10 text-sm font-bold text-green-padel">
                      {partner.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-navy">{partner.name}</p>
                      <p className="text-[12px] text-gray-400">{partner.matches} matchs ensemble</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[13px] font-bold ${
                    winRate >= 70 ? 'bg-green-padel/10 text-green-padel' : 'bg-amber-500/10 text-amber-600'
                  }`}>
                    {winRate}%
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Joue des matchs pour voir tes partenaires</p>
        )}
      </section>

      {/* Match History */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-gray-400">
          <Target className="h-4 w-4" /> Derniers matchs
        </h2>
        <MatchHistory stats={statsHistory ?? []} />
      </section>
    </div>
  );
}
