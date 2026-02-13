import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui'
import { BarChart3, Flame, Shield, Zap, Trophy } from 'lucide-react'
import Link from 'next/link'
import { LevelProgressBar } from '@/components/stats/LevelProgressBar'
import { WinRateRing } from '@/components/stats/WinRateRing'
import { StatCard } from '@/components/stats/StatCard'
import { MatchHistory } from '@/components/stats/MatchHistory'
import { PartnerStats } from '@/components/stats/PartnerStats'
import type { Profile } from '@/types'

export default async function StatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profileData) redirect('/onboarding')

  const profile = profileData as unknown as Profile

  // Load all_time stats
  const { data: statsData } = await supabase
    .from('player_stats')
    .select('*')
    .eq('player_id', user.id)
    .eq('period', 'all_time')
    .single()

  const stats = statsData as Record<string, unknown> | null

  const matchesPlayed = (stats?.matches_played as number) || profile.matches_played || 0
  const wins = (stats?.wins as number) || profile.wins || 0
  const losses = (stats?.losses as number) || 0
  const setsWon = (stats?.sets_won as number) || 0
  const setsLost = (stats?.sets_lost as number) || 0
  const gamesWon = (stats?.games_won as number) || 0
  const gamesLost = (stats?.games_lost as number) || 0
  const bestStreak = (stats?.best_streak as number) || 0
  const winStreak = (stats?.win_streak as number) || 0

  const hasStats = matchesPlayed > 0

  return (
    <>
      <Header title="Statistiques" />

      <div className="p-4 space-y-4">
        {/* Level progress */}
        <LevelProgressBar
          level={profile.level}
          computedLevel={profile.computed_level}
        />

        {hasStats ? (
          <>
            {/* Win rate ring */}
            <WinRateRing
              wins={wins}
              losses={losses}
              matchesPlayed={matchesPlayed}
            />

            {/* Quick stats grid */}
            <div className="grid grid-cols-3 gap-2">
              <StatCard
                icon={<Zap className="h-4 w-4" />}
                label="Sets gagnés"
                value={setsWon}
                subValue={`${setsLost} perdus`}
                variant="primary"
              />
              <StatCard
                icon={<Flame className="h-4 w-4" />}
                label="Meilleure série"
                value={bestStreak}
                subValue={winStreak > 0 ? `${winStreak} en cours` : undefined}
                variant="secondary"
              />
              <StatCard
                icon={<Shield className="h-4 w-4" />}
                label="Fiabilité"
                value={`${profile.reliability_score}%`}
                variant="default"
              />
            </div>

            {/* Detailed games stats */}
            {(gamesWon > 0 || gamesLost > 0) && (
              <Card className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Détails jeux
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <p className="text-lg font-bold text-primary">{gamesWon}</p>
                    <p className="text-xs text-muted-foreground">Jeux gagnés</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-destructive">{gamesLost}</p>
                    <p className="text-xs text-muted-foreground">Jeux perdus</p>
                  </div>
                </div>
                {(gamesWon + gamesLost) > 0 && (
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(gamesWon / (gamesWon + gamesLost)) * 100}%` }}
                    />
                  </div>
                )}
              </Card>
            )}

            {/* Rankings link */}
            <Link href="/stats/rankings">
              <Card className="flex items-center gap-4 hover:border-primary/50 transition-colors cursor-pointer">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/15">
                  <Trophy className="h-6 w-6 text-secondary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Classements</h3>
                  <p className="text-sm text-muted-foreground">Voir le leaderboard de ta ville</p>
                </div>
              </Card>
            </Link>

            {/* Partner stats */}
            <PartnerStats />

            {/* Match history */}
            <MatchHistory />
          </>
        ) : (
          <Card className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-1">Pas encore de stats</h3>
            <p className="text-sm text-muted-foreground">
              Joue tes premiers matchs pour voir tes statistiques ici.
            </p>
          </Card>
        )}
      </div>
    </>
  )
}
