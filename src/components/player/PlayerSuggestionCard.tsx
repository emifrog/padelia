'use client';

import { LEVEL_LABELS, SIDE_LABELS, STYLE_LABELS } from '@/types';
import type { PlayerLevel, PlayingSide, PlayStyle } from '@/types';
import type { SuggestedPlayer } from '@/hooks/use-player-suggestions';
import { Badge } from '@/components/ui/badge';
import { MapPin, TrendingUp, Shield, Target } from 'lucide-react';

interface Props {
  suggestion: SuggestedPlayer;
  onPress?: (playerId: string) => void;
}

function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="h-1.5 w-full rounded-full bg-muted">
      <div
        className="h-1.5 rounded-full bg-primary transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function PlayerSuggestionCard({ suggestion, onPress }: Props) {
  const { profile, score } = suggestion;
  const { breakdown } = score;

  return (
    <button
      type="button"
      onClick={() => onPress?.(profile.id)}
      className="w-full rounded-xl border bg-card p-4 text-left transition-shadow hover:shadow-md active:scale-[0.98]"
    >
      {/* Header: Avatar + info */}
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            profile.full_name?.charAt(0)?.toUpperCase()
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="truncate font-semibold">{profile.full_name}</h3>
            <span className="ml-2 shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-bold text-primary">
              {score.total_score}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground">@{profile.username}</p>

          {/* Badges */}
          <div className="mt-1.5 flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-xs">
              {LEVEL_LABELS[profile.level as PlayerLevel]} ({profile.level_score})
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {SIDE_LABELS[profile.preferred_side as PlayingSide]}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {STYLE_LABELS[profile.play_style as PlayStyle]}
            </Badge>
          </div>
        </div>
      </div>

      {/* City */}
      {profile.city && (
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {profile.city}
          {breakdown.proximity > 0 && (
            <span className="ml-1">
              · {Math.round((1 - breakdown.proximity / 100) * 30)} km
            </span>
          )}
        </div>
      )}

      {/* Score breakdown */}
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-2 text-xs">
          <TrendingUp className="h-3 w-3 text-muted-foreground" />
          <span className="w-16 text-muted-foreground">Niveau</span>
          <ScoreBar value={breakdown.level} />
          <span className="w-8 text-right text-muted-foreground">{breakdown.level}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Target className="h-3 w-3 text-muted-foreground" />
          <span className="w-16 text-muted-foreground">Position</span>
          <ScoreBar value={breakdown.position} />
          <span className="w-8 text-right text-muted-foreground">{breakdown.position}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Shield className="h-3 w-3 text-muted-foreground" />
          <span className="w-16 text-muted-foreground">Fiabilité</span>
          <ScoreBar value={breakdown.reliability} />
          <span className="w-8 text-right text-muted-foreground">{breakdown.reliability}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-3 flex gap-4 border-t pt-2 text-xs text-muted-foreground">
        <span>{profile.total_matches} matchs</span>
        <span>{profile.win_rate}% victoires</span>
        <span>{profile.years_playing} an{profile.years_playing > 1 ? 's' : ''}</span>
      </div>
    </button>
  );
}
