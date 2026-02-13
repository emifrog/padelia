import { Card, Badge } from '@/components/ui'
import { MapPin, Target } from 'lucide-react'
import type { Profile } from '@/types'
import { SIDE_LABELS } from '@/lib/constants/profile'

interface PlayerSuggestionCardProps {
  profile: Profile
  totalScore: number
}

export function PlayerSuggestionCard({
  profile,
  totalScore,
}: PlayerSuggestionCardProps) {
  return (
    <Card className="flex items-center gap-3 min-w-[200px]">
      {/* Avatar */}
      <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-base font-bold text-primary shrink-0">
        {profile.full_name?.[0]?.toUpperCase() || profile.username[0].toUpperCase()}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold truncate">
            {profile.full_name || profile.username}
          </p>
          <Badge variant={totalScore >= 70 ? 'success' : totalScore >= 50 ? 'secondary' : 'muted'}>
            {totalScore}%
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <Target className="h-3 w-3" />
            Niv. {profile.computed_level}
          </span>
          <span>{SIDE_LABELS[profile.preferred_side] || profile.preferred_side}</span>
          {profile.city && (
            <span className="flex items-center gap-0.5 truncate">
              <MapPin className="h-3 w-3" />
              {profile.city}
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}
