'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, Badge } from '@/components/ui'
import { Users, Swords } from 'lucide-react'

interface PartnerRow {
  partner_id: string
  matches_together: number
  wins_together: number
  matches_against: number
  wins_against: number
  last_played_at: string | null
  partner: {
    username: string
    full_name: string | null
    computed_level: number
  } | null
}

export function PartnerStats() {
  const [partners, setPartners] = useState<PartnerRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPartners() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('partner_history')
        .select(`
          partner_id, matches_together, wins_together, matches_against, wins_against, last_played_at,
          partner:profiles!partner_history_partner_id_fkey(username, full_name, computed_level)
        `)
        .eq('player_id', user.id)
        .order('matches_together', { ascending: false })
        .limit(10)

      if (data) {
        setPartners(data as unknown as PartnerRow[])
      }
      setLoading(false)
    }

    loadPartners()
  }, [])

  if (loading) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Partenaires
        </h3>
        <p className="text-xs text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  if (partners.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Partenaires & Adversaires
        </h3>
      </div>

      <div className="space-y-2">
        {partners.map((p) => {
          const togetherWinRate = p.matches_together > 0
            ? Math.round((p.wins_together / p.matches_together) * 100)
            : 0
          const againstWinRate = p.matches_against > 0
            ? Math.round((p.wins_against / p.matches_against) * 100)
            : 0
          const totalMatches = p.matches_together + p.matches_against

          return (
            <Card key={p.partner_id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {p.partner?.full_name?.[0]?.toUpperCase() || p.partner?.username[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{p.partner?.full_name || p.partner?.username}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Niv. {p.partner?.computed_level} · {totalMatches} matchs
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {p.matches_together > 0 && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <Users className="h-3 w-3 text-primary" />
                    <span className="text-muted-foreground">Ensemble :</span>
                    <span className="font-medium">{p.wins_together}/{p.matches_together}</span>
                    <Badge variant={togetherWinRate >= 50 ? 'success' : 'muted'} className="ml-auto">
                      {togetherWinRate}%
                    </Badge>
                  </div>
                )}
                {p.matches_against > 0 && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <Swords className="h-3 w-3 text-secondary" />
                    <span className="text-muted-foreground">Contre :</span>
                    <span className="font-medium">{p.wins_against}/{p.matches_against}</span>
                    <Badge variant={againstWinRate >= 50 ? 'success' : 'muted'} className="ml-auto">
                      {againstWinRate}%
                    </Badge>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
