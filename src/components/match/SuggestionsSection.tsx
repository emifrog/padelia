'use client'

import { usePlayerSuggestions } from '@/hooks/usePlayerSuggestions'
import { PlayerSuggestionCard } from './PlayerSuggestionCard'
import { Users } from 'lucide-react'

export function SuggestionsSection() {
  const { suggestions, loading } = usePlayerSuggestions(5)

  if (loading) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Joueurs compatibles
        </h3>
        <p className="text-xs text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  if (suggestions.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Joueurs compatibles
        </h3>
      </div>
      <div className="space-y-2">
        {suggestions.map((s) => (
          <PlayerSuggestionCard
            key={s.playerId}
            profile={s.profile}
            totalScore={s.totalScore}
          />
        ))}
      </div>
    </div>
  )
}
