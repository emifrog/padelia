'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { Button, Card } from '@/components/ui'
import { MatchCard } from '@/components/match/MatchCard'
import { MatchFilters } from '@/components/match/MatchFilters'

interface MatchWithMeta {
  id: string
  status: string
  match_type: string
  scheduled_at: string
  location_name: string | null
  min_level: number
  max_level: number
  is_public: boolean
  notes: string | null
  created_by: string
  player_count: number
  creator_name: string | null
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')

  const loadMatches = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    let query = supabase
      .from('matches')
      .select(`
        *,
        match_players(id),
        creator:profiles!matches_created_by_fkey(full_name, username)
      `)
      .eq('is_public', true)
      .order('scheduled_at', { ascending: true })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    } else {
      query = query.in('status', ['pending', 'confirmed', 'in_progress'])
    }

    if (typeFilter !== 'all') {
      query = query.eq('match_type', typeFilter)
    }

    if (levelFilter !== 'all') {
      const [min, max] = levelFilter.split('-').map(Number)
      query = query.gte('max_level', min).lte('min_level', max)
    }

    const { data } = await query.limit(50)

    if (data) {
      const formatted: MatchWithMeta[] = data.map((m: Record<string, unknown>) => {
        const players = m.match_players as Array<{ id: string }> | null
        const creator = m.creator as { full_name: string | null; username: string } | null
        return {
          id: m.id as string,
          status: m.status as string,
          match_type: m.match_type as string,
          scheduled_at: m.scheduled_at as string,
          location_name: m.location_name as string | null,
          min_level: m.min_level as number,
          max_level: m.max_level as number,
          is_public: m.is_public as boolean,
          notes: m.notes as string | null,
          created_by: m.created_by as string,
          player_count: players?.length ?? 0,
          creator_name: creator?.full_name || creator?.username || null,
        }
      })
      setMatches(formatted)
    }

    setLoading(false)
  }, [statusFilter, typeFilter, levelFilter])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadMatches() }, [loadMatches])

  return (
    <>
      <Header title="Matchs">
        <Link href="/matches/create">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Créer
          </Button>
        </Link>
      </Header>

      <div className="p-4 space-y-4">
        <MatchFilters
          status={statusFilter}
          matchType={typeFilter}
          level={levelFilter}
          onStatusChange={setStatusFilter}
          onTypeChange={setTypeFilter}
          onLevelChange={setLevelFilter}
        />

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Chargement...</p>
        ) : matches.length === 0 ? (
          <Card className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-1">Aucun match trouvé</h3>
            <p className="text-sm text-muted-foreground">
              Aucun match ne correspond à tes filtres.
            </p>
            <Link href="/matches/create">
              <Button className="mt-4">Créer un match</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                playerCount={match.player_count}
                creatorName={match.creator_name}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
