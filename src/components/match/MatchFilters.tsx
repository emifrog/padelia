'use client'

import { Select } from '@/components/ui'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmé' },
  { value: 'in_progress', label: 'En cours' },
]

const TYPE_OPTIONS = [
  { value: 'all', label: 'Tous les types' },
  { value: 'friendly', label: 'Amical' },
  { value: 'ranked', label: 'Classé' },
]

const LEVEL_OPTIONS = [
  { value: 'all', label: 'Tous niveaux' },
  { value: '1-3', label: 'Débutant (1-3)' },
  { value: '3-5', label: 'Intermédiaire (3-5)' },
  { value: '5-7', label: 'Avancé (5-7)' },
  { value: '7-10', label: 'Expert (7-10)' },
]

interface MatchFiltersProps {
  status: string
  matchType: string
  level: string
  onStatusChange: (value: string) => void
  onTypeChange: (value: string) => void
  onLevelChange: (value: string) => void
}

export function MatchFilters({
  status,
  matchType,
  level,
  onStatusChange,
  onTypeChange,
  onLevelChange,
}: MatchFiltersProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <Select
        options={STATUS_OPTIONS}
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="text-xs h-9 min-w-[130px]"
      />
      <Select
        options={TYPE_OPTIONS}
        value={matchType}
        onChange={(e) => onTypeChange(e.target.value)}
        className="text-xs h-9 min-w-[120px]"
      />
      <Select
        options={LEVEL_OPTIONS}
        value={level}
        onChange={(e) => onLevelChange(e.target.value)}
        className="text-xs h-9 min-w-[140px]"
      />
    </div>
  )
}
