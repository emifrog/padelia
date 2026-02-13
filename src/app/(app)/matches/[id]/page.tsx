'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Calendar, Users, UserPlus, UserMinus, Clock, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { Button, Card, Badge } from '@/components/ui'
import { useMatchRealtime } from '@/hooks/useMatchRealtime'
import { ScoreForm } from '@/components/match/ScoreForm'
import { updateAfterMatch } from '@/lib/ranking/updateAfterMatch'

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' | 'muted' }> = {
  pending: { label: 'En attente de joueurs', variant: 'secondary' },
  confirmed: { label: 'Confirmé', variant: 'success' },
  in_progress: { label: 'En cours', variant: 'default' },
  completed: { label: 'Terminé', variant: 'muted' },
  cancelled: { label: 'Annulé', variant: 'destructive' },
}

const TYPE_MAP: Record<string, string> = {
  friendly: 'Amical',
  ranked: 'Classé',
  tournament: 'Tournoi',
}

interface MatchPlayer {
  id: string
  player_id: string
  team: number
  side: string | null
  status: string
  rating_change: number | null
  profile: {
    username: string
    full_name: string | null
    level: number
    preferred_side: string
  } | null
}

interface MatchDetail {
  id: string
  created_by: string
  status: string
  match_type: string
  scheduled_at: string
  location_name: string | null
  min_level: number
  max_level: number
  is_public: boolean
  notes: string | null
  winner_team: number | null
}

interface MatchSetRow {
  set_number: number
  team1_score: number
  team2_score: number
  is_tiebreak: boolean
}

export default function MatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const matchId = params.id as string

  const [match, setMatch] = useState<MatchDetail | null>(null)
  const [players, setPlayers] = useState<MatchPlayer[]>([])
  const [sets, setSets] = useState<MatchSetRow[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [updatingStats, setUpdatingStats] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Realtime: auto-refresh when match or players change
  useMatchRealtime(matchId, () => loadMatch())

  const loadMatch = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id ?? null)

    const { data: matchData } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (matchData) setMatch(matchData as unknown as MatchDetail)

    const { data: playersData } = await supabase
      .from('match_players')
      .select(`
        id, player_id, team, side, status, rating_change,
        profile:profiles(username, full_name, level, preferred_side)
      `)
      .eq('match_id', matchId)
      .order('team')

    if (playersData) {
      setPlayers(playersData.map((p: Record<string, unknown>) => ({
        id: p.id as string,
        player_id: p.player_id as string,
        team: p.team as number,
        side: p.side as string | null,
        status: p.status as string,
        rating_change: p.rating_change as number | null,
        profile: p.profile as MatchPlayer['profile'],
      })))
    }

    // Load existing sets
    const { data: setsData } = await supabase
      .from('match_sets')
      .select('set_number, team1_score, team2_score, is_tiebreak')
      .eq('match_id', matchId)
      .order('set_number')

    if (setsData) {
      setSets(setsData as unknown as MatchSetRow[])
    }

    setLoading(false)
  }, [matchId])

  useEffect(() => {
    loadMatch()
  }, [loadMatch])

  const isInMatch = players.some(
    (p) => p.player_id === currentUserId && p.status !== 'declined'
  )
  const isCreator = match?.created_by === currentUserId
  const acceptedCount = players.filter((p) => p.status === 'accepted').length
  const isFull = acceptedCount >= 4

  async function handleJoin() {
    if (!currentUserId || !match) return
    setJoining(true)
    setError(null)

    try {
      const supabase = createClient()

      // Assign to team with fewer players
      const team1Count = players.filter((p) => p.team === 1 && p.status === 'accepted').length
      const team2Count = players.filter((p) => p.team === 2 && p.status === 'accepted').length
      const assignedTeam = team1Count <= team2Count ? 1 : 2

      const { error: insertError } = await supabase.from('match_players').insert({
        match_id: match.id,
        player_id: currentUserId,
        team: assignedTeam,
        status: 'accepted',
      })

      if (insertError) throw new Error('Impossible de rejoindre ce match.')

      // If 4 players, auto-confirm and calculate balance score
      if (acceptedCount + 1 >= 4) {
        // Calculate balance score based on team level difference
        const allPlayers = [...players.filter((p) => p.status === 'accepted'), {
          player_id: currentUserId, team: assignedTeam, status: 'accepted',
          profile: null, id: '', side: null, rating_change: null,
        }]
        const t1 = allPlayers.filter((p) => p.team === 1)
        const t2 = allPlayers.filter((p) => p.team === 2)
        const avgT1 = t1.reduce((sum, p) => sum + (p.profile?.level ?? match.min_level), 0) / Math.max(t1.length, 1)
        const avgT2 = t2.reduce((sum, p) => sum + (p.profile?.level ?? match.min_level), 0) / Math.max(t2.length, 1)
        const balanceScore = Math.round(Math.max(0, 100 - Math.abs(avgT1 - avgT2) * 20))

        await supabase
          .from('matches')
          .update({ status: 'confirmed', balance_score: balanceScore })
          .eq('id', match.id)
      }

      loadMatch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la connexion au match.')
    } finally {
      setJoining(false)
    }
  }

  async function handleLeave() {
    if (!currentUserId || !match) return
    setLeaving(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: deleteError } = await supabase
        .from('match_players')
        .delete()
        .eq('match_id', match.id)
        .eq('player_id', currentUserId)

      if (deleteError) throw new Error('Impossible de quitter ce match.')

      // If was confirmed, go back to pending
      if (match.status === 'confirmed') {
        await supabase
          .from('matches')
          .update({ status: 'pending' })
          .eq('id', match.id)
      }

      loadMatch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du retrait du match.')
    } finally {
      setLeaving(false)
    }
  }

  async function handleScoreComplete() {
    if (!match) return

    // After scores are saved, update stats/ELO/partner history
    setUpdatingStats(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.access_token) {
        await updateAfterMatch(
          matchId,
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          session.access_token,
        )
      }
    } catch (err) {
      console.error('Erreur mise à jour stats:', err)
    } finally {
      setUpdatingStats(false)
    }

    loadMatch()
  }

  if (loading) {
    return (
      <>
        <Header title="Match" />
        <div className="flex items-center justify-center p-12">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </>
    )
  }

  if (!match) {
    return (
      <>
        <Header title="Match" />
        <div className="p-4">
          <Card className="text-center py-8">
            <p className="text-muted-foreground">Match introuvable.</p>
            <Button className="mt-4" onClick={() => router.push('/matches')}>
              Retour aux matchs
            </Button>
          </Card>
        </div>
      </>
    )
  }

  const statusInfo = STATUS_MAP[match.status] || STATUS_MAP.pending
  const date = new Date(match.scheduled_at)

  const team1 = players.filter((p) => p.team === 1 && p.status === 'accepted')
  const team2 = players.filter((p) => p.team === 2 && p.status === 'accepted')

  const teamsComplete = team1.length >= 2 && team2.length >= 2
  const showScoreForm = isInMatch && teamsComplete && (match.status === 'confirmed' || match.status === 'in_progress' || match.status === 'completed')

  return (
    <>
      <Header title="Détail match">
        <button
          onClick={() => router.back()}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </Header>

      <div className="p-4 space-y-4">
        {/* Status + type */}
        <div className="flex items-center gap-2">
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          <Badge variant="muted">{TYPE_MAP[match.match_type] || match.match_type}</Badge>
          {isCreator && <Badge variant="default">Organisateur</Badge>}
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Info card */}
        <Card className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-primary shrink-0" />
            <span>{format(date, "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}</span>
          </div>

          {match.location_name && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span>{match.location_name}</span>
            </div>
          )}

          <div className="flex items-center gap-3 text-sm">
            <Users className="h-4 w-4 text-primary shrink-0" />
            <span>{acceptedCount}/4 joueurs · Niveau {match.min_level} - {match.max_level}</span>
          </div>

          {match.notes && (
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{match.notes}</span>
            </div>
          )}
        </Card>

        {/* Teams */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <h4 className="text-sm font-semibold text-primary mb-3">
              Équipe 1
              {match.winner_team === 1 && <span className="ml-1">🏆</span>}
            </h4>
            {team1.length === 0 ? (
              <p className="text-xs text-muted-foreground">Aucun joueur</p>
            ) : (
              <div className="space-y-2">
                {team1.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {p.profile?.full_name?.[0] || p.profile?.username[0] || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {p.profile?.full_name || p.profile?.username}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Niv. {p.profile?.level}
                      </p>
                    </div>
                    {p.rating_change !== null && p.rating_change !== 0 && (
                      <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${
                        p.rating_change > 0 ? 'text-primary' : 'text-destructive'
                      }`}>
                        {p.rating_change > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {p.rating_change > 0 ? '+' : ''}{p.rating_change}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h4 className="text-sm font-semibold text-secondary mb-3">
              Équipe 2
              {match.winner_team === 2 && <span className="ml-1">🏆</span>}
            </h4>
            {team2.length === 0 ? (
              <p className="text-xs text-muted-foreground">Aucun joueur</p>
            ) : (
              <div className="space-y-2">
                {team2.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center text-xs font-bold text-secondary">
                      {p.profile?.full_name?.[0] || p.profile?.username[0] || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {p.profile?.full_name || p.profile?.username}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Niv. {p.profile?.level}
                      </p>
                    </div>
                    {p.rating_change !== null && p.rating_change !== 0 && (
                      <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${
                        p.rating_change > 0 ? 'text-primary' : 'text-destructive'
                      }`}>
                        {p.rating_change > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {p.rating_change > 0 ? '+' : ''}{p.rating_change}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Score form / display */}
        {showScoreForm && (
          <>
            {updatingStats && (
              <Card className="text-center py-4">
                <p className="text-sm text-muted-foreground animate-pulse">
                  Mise à jour des statistiques et classements...
                </p>
              </Card>
            )}
            <ScoreForm
              matchId={matchId}
              isCreator={isCreator}
              matchStatus={match.status}
              existingSets={sets}
              onComplete={handleScoreComplete}
            />
          </>
        )}

        {/* Actions */}
        {match.status !== 'completed' && match.status !== 'cancelled' && (
          <div>
            {!isInMatch && !isFull && (
              <Button className="w-full" onClick={handleJoin} loading={joining}>
                <UserPlus className="h-4 w-4" />
                Rejoindre ce match
              </Button>
            )}

            {!isInMatch && isFull && (
              <Button className="w-full" variant="outline" disabled>
                Match complet
              </Button>
            )}

            {isInMatch && !isCreator && (
              <Button className="w-full" variant="destructive" onClick={handleLeave} loading={leaving}>
                <UserMinus className="h-4 w-4" />
                Quitter le match
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  )
}
