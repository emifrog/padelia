import { Card } from '@/components/ui'
import { TrendingUp } from 'lucide-react'

interface LevelProgressBarProps {
  level: number
  computedLevel: number
}

const TIER_COLORS: Record<string, string> = {
  bronze: 'bg-amber-700',
  silver: 'bg-gray-400',
  gold: 'bg-yellow-400',
  platinum: 'bg-cyan-400',
  diamond: 'bg-violet-400',
}

const TIER_LABELS: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Argent',
  gold: 'Or',
  platinum: 'Platine',
  diamond: 'Diamant',
}

function getTier(level: number): string {
  if (level >= 8) return 'diamond'
  if (level >= 6.5) return 'platinum'
  if (level >= 5) return 'gold'
  if (level >= 3.5) return 'silver'
  return 'bronze'
}

export function LevelProgressBar({ level, computedLevel }: LevelProgressBarProps) {
  const tier = getTier(computedLevel)
  const progress = ((computedLevel - 1) / 9) * 100 // 1-10 range → 0-100%
  const diff = Math.round((computedLevel - level) * 10) / 10

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Progression</h3>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TIER_COLORS[tier]} text-white`}>
          {TIER_LABELS[tier]}
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-bold text-primary">{computedLevel}</span>
          <span className="text-sm text-muted-foreground">
            Déclaré : {level}
            {diff !== 0 && (
              <span className={diff > 0 ? 'text-primary ml-1' : 'text-destructive ml-1'}>
                ({diff > 0 ? '+' : ''}{diff})
              </span>
            )}
          </span>
        </div>

        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${TIER_COLORS[tier]}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>1.0</span>
          <span>10.0</span>
        </div>
      </div>
    </Card>
  )
}
