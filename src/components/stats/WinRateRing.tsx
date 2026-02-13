'use client'

import { Card } from '@/components/ui'

interface WinRateRingProps {
  wins: number
  losses: number
  matchesPlayed: number
}

export function WinRateRing({ wins, losses, matchesPlayed }: WinRateRingProps) {
  const winRate = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0

  // SVG ring parameters
  const size = 100
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (winRate / 100) * circumference

  return (
    <Card className="flex items-center gap-5">
      {/* Ring */}
      <div className="relative shrink-0">
        <svg width={size} height={size} className="-rotate-90">
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-muted)"
            strokeWidth={strokeWidth}
          />
          {/* Progress ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-primary">{winRate}%</span>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-2 flex-1">
        <h3 className="font-semibold text-sm">Taux de victoire</h3>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Victoires</span>
            <span className="font-medium text-primary">{wins}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Défaites</span>
            <span className="font-medium text-destructive">{losses}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="font-medium">{matchesPlayed}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
