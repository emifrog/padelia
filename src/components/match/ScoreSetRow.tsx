import { Input } from '@/components/ui'

interface SetScore {
  set_number: number
  team1_score: number
  team2_score: number
  is_tiebreak: boolean
}

interface ScoreSetRowProps {
  set: SetScore
  canEdit: boolean
  onScoreChange: (team: 'team1_score' | 'team2_score', value: number) => void
  onToggleTiebreak: () => void
}

export function ScoreSetRow({ set, canEdit, onScoreChange, onToggleTiebreak }: ScoreSetRowProps) {
  return (
    <div className="grid grid-cols-[1fr_80px_80px] gap-2 items-center">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {set.is_tiebreak ? 'Tiebreak' : `Set ${set.set_number}`}
        </span>
        {canEdit && (
          <button
            onClick={onToggleTiebreak}
            className={`text-[10px] px-1.5 py-0.5 rounded-full cursor-pointer transition-colors ${
              set.is_tiebreak
                ? 'bg-secondary/10 text-secondary'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            TB
          </button>
        )}
      </div>

      {canEdit ? (
        <>
          <Input
            type="number"
            min={0}
            max={7}
            value={set.team1_score}
            onChange={(e) => onScoreChange('team1_score', parseInt(e.target.value) || 0)}
            className="text-center h-9 !px-2"
          />
          <Input
            type="number"
            min={0}
            max={7}
            value={set.team2_score}
            onChange={(e) => onScoreChange('team2_score', parseInt(e.target.value) || 0)}
            className="text-center h-9 !px-2"
          />
        </>
      ) : (
        <>
          <span className={`text-center text-lg font-bold ${
            set.team1_score > set.team2_score ? 'text-primary' : 'text-muted-foreground'
          }`}>
            {set.team1_score}
          </span>
          <span className={`text-center text-lg font-bold ${
            set.team2_score > set.team1_score ? 'text-secondary' : 'text-muted-foreground'
          }`}>
            {set.team2_score}
          </span>
        </>
      )}
    </div>
  )
}
