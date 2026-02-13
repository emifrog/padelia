'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button, Card } from '@/components/ui'
import { Trophy, Plus, Minus } from 'lucide-react'
import { ScoreSetRow } from './ScoreSetRow'
import { ScoreWinner } from './ScoreWinner'

interface SetScore {
  set_number: number
  team1_score: number
  team2_score: number
  is_tiebreak: boolean
}

interface ScoreFormProps {
  matchId: string
  isCreator: boolean
  matchStatus: string
  existingSets: SetScore[]
  onComplete: () => void
}

function determineWinner(sets: SetScore[]): 1 | 2 | null {
  let team1Sets = 0
  let team2Sets = 0
  for (const s of sets) {
    if (s.team1_score > s.team2_score) team1Sets++
    else if (s.team2_score > s.team1_score) team2Sets++
  }
  if (team1Sets > team2Sets) return 1
  if (team2Sets > team1Sets) return 2
  return null
}

export function ScoreForm({
  matchId,
  isCreator,
  matchStatus,
  existingSets,
  onComplete,
}: ScoreFormProps) {
  const [sets, setSets] = useState<SetScore[]>(
    existingSets.length > 0
      ? existingSets
      : [
          { set_number: 1, team1_score: 0, team2_score: 0, is_tiebreak: false },
          { set_number: 2, team1_score: 0, team2_score: 0, is_tiebreak: false },
        ],
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const canEdit = isCreator && (matchStatus === 'confirmed' || matchStatus === 'in_progress' || matchStatus === 'completed')

  function addSet() {
    if (sets.length >= 3) return
    setSets([
      ...sets,
      { set_number: sets.length + 1, team1_score: 0, team2_score: 0, is_tiebreak: false },
    ])
  }

  function removeSet() {
    if (sets.length <= 2) return
    setSets(sets.slice(0, -1))
  }

  function updateScore(setIndex: number, team: 'team1_score' | 'team2_score', value: number) {
    const updated = [...sets]
    updated[setIndex] = { ...updated[setIndex], [team]: Math.max(0, value) }
    setSets(updated)
  }

  function toggleTiebreak(setIndex: number) {
    const updated = [...sets]
    updated[setIndex] = { ...updated[setIndex], is_tiebreak: !updated[setIndex].is_tiebreak }
    setSets(updated)
  }

  async function handleSave() {
    setError('')
    setSaving(true)

    try {
      const supabase = createClient()

      for (const s of sets) {
        if (s.team1_score === 0 && s.team2_score === 0) {
          throw new Error(`Le set ${s.set_number} n'a pas de score.`)
        }
      }

      await supabase
        .from('match_sets')
        .delete()
        .eq('match_id', matchId)

      const { error: insertError } = await supabase
        .from('match_sets')
        .insert(
          sets.map((s) => ({
            match_id: matchId,
            set_number: s.set_number,
            team1_score: s.team1_score,
            team2_score: s.team2_score,
            is_tiebreak: s.is_tiebreak,
          })),
        )

      if (insertError) throw new Error('Erreur lors de l\'enregistrement des scores.')

      const winnerTeam = determineWinner(sets)

      const { error: matchError } = await supabase
        .from('matches')
        .update({
          status: 'completed' as const,
          winner_team: winnerTeam,
          completed_at: new Date().toISOString(),
        })
        .eq('id', matchId)

      if (matchError) throw new Error('Erreur lors de la finalisation du match.')

      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setSaving(false)
    }
  }

  const winnerTeam = determineWinner(sets)

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-secondary" />
          <h3 className="font-semibold">Score du match</h3>
        </div>
        {canEdit && sets.length < 3 && (
          <div className="flex gap-1">
            <button
              onClick={removeSet}
              disabled={sets.length <= 2}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30 cursor-pointer"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              onClick={addSet}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Score table header */}
      <div className="grid grid-cols-[1fr_80px_80px] gap-2 text-xs font-semibold text-muted-foreground">
        <span />
        <span className="text-center text-primary">Éq. 1</span>
        <span className="text-center text-secondary">Éq. 2</span>
      </div>

      {/* Sets */}
      {sets.map((s, i) => (
        <ScoreSetRow
          key={s.set_number}
          set={s}
          canEdit={canEdit}
          onScoreChange={(team, value) => updateScore(i, team, value)}
          onToggleTiebreak={() => toggleTiebreak(i)}
        />
      ))}

      {/* Winner display */}
      {(existingSets.length > 0 || winnerTeam) && (
        <ScoreWinner winnerTeam={winnerTeam} />
      )}

      {/* Actions */}
      {canEdit && (
        <>
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
          <Button className="w-full" onClick={handleSave} loading={saving}>
            <Trophy className="h-4 w-4" />
            Enregistrer et terminer le match
          </Button>
        </>
      )}
    </Card>
  )
}
