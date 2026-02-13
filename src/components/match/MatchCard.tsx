import Link from 'next/link'
import { MapPin, Users, ChevronRight } from 'lucide-react'
import { Card, Badge } from '@/components/ui'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { MATCH_STATUS, MATCH_TYPE } from '@/lib/constants/match'

interface MatchCardProps {
  match: {
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
  }
  playerCount?: number
  creatorName?: string | null
}

export function MatchCard({ match, playerCount = 0, creatorName }: MatchCardProps) {
  const statusInfo = MATCH_STATUS[match.status] || MATCH_STATUS.pending
  const date = new Date(match.scheduled_at)
  return (
    <Link href={`/matches/${match.id}`}>
      <Card className="flex items-center gap-3 hover:border-primary/40 transition-colors cursor-pointer">
        {/* Date box */}
        <div className="flex flex-col items-center justify-center rounded-xl bg-primary/10 px-3 py-2 min-w-[56px]">
          <span className="text-xs font-semibold text-primary uppercase">
            {format(date, 'EEE', { locale: fr })}
          </span>
          <span className="text-lg font-black text-primary leading-tight">
            {format(date, 'd')}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {format(date, 'HH:mm')}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            <Badge variant="muted">{MATCH_TYPE[match.match_type] || match.match_type}</Badge>
          </div>

          {match.location_name && (
            <p className="flex items-center gap-1 text-sm text-card-foreground truncate">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              {match.location_name}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {playerCount}/4
            </span>
            <span>Niv. {match.min_level}-{match.max_level}</span>
            {creatorName && <span>par {creatorName}</span>}
          </div>
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </Card>
    </Link>
  )
}
