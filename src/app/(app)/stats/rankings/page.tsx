'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trophy, Medal, Crown, ChevronUp, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { Card, Badge } from '@/components/ui'

interface RankingEntry {
  id: string
  rank_position: number
  points: number
  tier: string
  player: {
    id: string
    username: string
    full_name: string | null
    computed_level: number
    matches_played: number
    wins: number
  }
}

const TIER_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  bronze: { label: 'Bronze', color: 'text-amber-600', icon: <Medal className="h-4 w-4" /> },
  silver: { label: 'Argent', color: 'text-gray-400', icon: <Medal className="h-4 w-4" /> },
  gold: { label: 'Or', color: 'text-yellow-400', icon: <Trophy className="h-4 w-4" /> },
  platinum: { label: 'Platine', color: 'text-cyan-400', icon: <Trophy className="h-4 w-4" /> },
  diamond: { label: 'Diamant', color: 'text-violet-400', icon: <Crown className="h-4 w-4" /> },
}

export default function RankingsPage() {
  const router = useRouter()
  const [rankings, setRankings] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [userCity, setUserCity] = useState<string | null>(null)
  const [cities, setCities] = useState<string[]>([])
  const [selectedCity, setSelectedCity] = useState<string | null>(null)

  const loadCities = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id ?? null)

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('city')
        .eq('id', user.id)
        .single()

      if (profile) {
        const city = (profile as Record<string, unknown>).city as string | null
        setUserCity(city)
        setSelectedCity(city)
      }
    }

    // Get all cities that have rankings
    const { data: rankingsRaw } = await supabase
      .from('rankings')
      .select('scope_value')
      .eq('scope', 'city')

    if (rankingsRaw) {
      const uniqueCities = [...new Set(
        (rankingsRaw as Record<string, unknown>[]).map((r) => r.scope_value as string)
      )].sort()
      setCities(uniqueCities)
    }
  }, [])

  const loadRankings = useCallback(async (city: string) => {
    setLoading(true)
    const supabase = createClient()

    const { data: rankingsRaw } = await supabase
      .from('rankings')
      .select(`
        id, rank_position, points, tier,
        player:profiles(id, username, full_name, computed_level, matches_played, wins)
      `)
      .eq('scope', 'city')
      .eq('scope_value', city)
      .order('rank_position')
      .limit(50)

    if (rankingsRaw) {
      setRankings(
        (rankingsRaw as Record<string, unknown>[]).map((r) => ({
          id: r.id as string,
          rank_position: r.rank_position as number,
          points: r.points as number,
          tier: r.tier as string,
          player: r.player as RankingEntry['player'],
        }))
      )
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    loadCities()
  }, [loadCities])

  useEffect(() => {
    if (selectedCity) {
      loadRankings(selectedCity)
    } else {
      setLoading(false)
    }
  }, [selectedCity, loadRankings])

  const myRank = rankings.find((r) => r.player?.id === currentUserId)

  return (
    <>
      <Header title="Classements">
        <button
          onClick={() => router.back()}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </Header>

      <div className="p-4 space-y-4">
        {/* City selector */}
        {cities.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  selectedCity === city
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {city}
                {city === userCity && ' (Ma ville)'}
              </button>
            ))}
          </div>
        )}

        {/* My rank banner */}
        {myRank && (
          <Card className="bg-primary/5 border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 font-bold text-primary text-lg">
                  #{myRank.rank_position}
                </div>
                <div>
                  <p className="font-semibold">Ton classement</p>
                  <p className="text-xs text-muted-foreground">
                    {myRank.points} pts · {TIER_CONFIG[myRank.tier]?.label || myRank.tier}
                  </p>
                </div>
              </div>
              <div className={TIER_CONFIG[myRank.tier]?.color || 'text-muted-foreground'}>
                {TIER_CONFIG[myRank.tier]?.icon}
              </div>
            </div>
          </Card>
        )}

        {/* Rankings list */}
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Chargement...</p>
        ) : !selectedCity ? (
          <Card className="text-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-1">Aucun classement disponible</h3>
            <p className="text-sm text-muted-foreground">
              Joue des matchs pour apparaître dans le classement de ta ville.
            </p>
          </Card>
        ) : rankings.length === 0 ? (
          <Card className="text-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-1">Aucun classement pour {selectedCity}</h3>
            <p className="text-sm text-muted-foreground">
              Sois le premier à jouer un match dans cette ville !
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {rankings.map((entry, idx) => {
              const isMe = entry.player?.id === currentUserId
              const tierConfig = TIER_CONFIG[entry.tier]
              const winRate = entry.player?.matches_played > 0
                ? Math.round((entry.player.wins / entry.player.matches_played) * 100)
                : 0

              return (
                <Card
                  key={entry.id}
                  className={`flex items-center gap-3 ${isMe ? 'border-primary/30 bg-primary/5' : ''}`}
                >
                  {/* Rank */}
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    idx === 0 ? 'bg-yellow-400/15 text-yellow-400' :
                    idx === 1 ? 'bg-gray-400/15 text-gray-400' :
                    idx === 2 ? 'bg-amber-600/15 text-amber-600' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {entry.rank_position}
                  </div>

                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                    {entry.player?.full_name?.[0] || entry.player?.username?.[0] || '?'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold truncate">
                        {entry.player?.full_name || entry.player?.username}
                      </p>
                      {isMe && <Badge variant="default" className="text-[9px] px-1.5 py-0">Toi</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Niv. {entry.player?.computed_level?.toFixed(1)} · {winRate}% victoires · {entry.player?.matches_played} matchs
                    </p>
                  </div>

                  {/* Tier + points */}
                  <div className="text-right shrink-0">
                    <div className={`flex items-center gap-1 text-xs font-semibold ${tierConfig?.color || ''}`}>
                      {tierConfig?.icon}
                      <span>{tierConfig?.label}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{entry.points} pts</p>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
