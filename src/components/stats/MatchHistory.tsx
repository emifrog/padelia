'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, Badge } from '@/components/ui'
import { Calendar, ChevronRight, Trophy, TrendingUp, TrendingDown } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface HistoryMatch {
  id: string
  match_id: string
  team: number
  rating_change: number | null
  match: {
    id: string
    scheduled_at: string
    location_name: string | null
    match_type: string
    winner_team: number | null
    status: string
  }
}

export function MatchHistory() {
  const [matches, setMatches] = useState<HistoryMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadHistory() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('match_players')
        .select(`
          id, match_id, team, rating_change,
          match:matches(id, scheduled_at, location_name, match_type, winner_team, status)
        `)
        .eq('player_id', user.id)
        .eq('status', 'accepted')
        .order('invited_at', { ascending: false })
        .limit(20)

      if (data) {
        const typedMatches = (data as unknown as HistoryMatch[])
          .filter((m) => m.match && m.match.status === 'completed')
        setMatches(typedMatches)
      }
      setLoading(false)
    }

    loadHistory()
  }, [])

  if (loading) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Historique
        </h3>
        <p className="text-xs text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <Card className="text-center py-6">
        <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Aucun match terminé pour le moment.</p>
      </Card>
    )
  }

  const TYPE_MAP: Record<string, string> = {
    friendly: 'Amical',
    ranked: 'Classé',
    tournament: 'Tournoi',
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Historique des matchs
        </h3>
      </div>

      <div className="space-y-2">
        {matches.map((m) => {
          const isWin = m.match.winner_team === m.team
          const date = new Date(m.match.scheduled_at)

          return (
            <Link key={m.id} href={`/matches/${m.match.id}`}>
              <Card className="flex items-center gap-3 hover:border-primary/40 transition-colors cursor-pointer">
                {/* Result indicator */}
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
                  isWin ? 'bg-primary/10' : 'bg-destructive/10'
                }`}>
                  {isWin ? (
                    <Trophy className="h-5 w-5 text-primary" />
                  ) : (
                    <Trophy className="h-5 w-5 text-destructive" />
                  )}
                </div>

                {/* Match info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={isWin ? 'success' : 'destructive'}>
                      {isWin ? 'Victoire' : 'Défaite'}
                    </Badge>
                    <Badge variant="muted">{TYPE_MAP[m.match.match_type] || m.match.match_type}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{format(date, 'd MMM yyyy', { locale: fr })}</span>
                    {m.match.location_name && (
                      <span className="truncate">· {m.match.location_name}</span>
                    )}
                  </div>
                </div>

                {/* Rating change */}
                {m.rating_change !== null && m.rating_change !== 0 && (
                  <div className={`flex items-center gap-0.5 text-sm font-semibold shrink-0 ${
                    m.rating_change > 0 ? 'text-primary' : 'text-destructive'
                  }`}>
                    {m.rating_change > 0 ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5" />
                    )}
                    {m.rating_change > 0 ? '+' : ''}{m.rating_change}
                  </div>
                )}

                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
