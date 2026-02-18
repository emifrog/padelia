import { Badge } from '@/components/ui/badge';
import { LEVEL_LABELS } from '@/types';
import type { PlayerLevel } from '@/types';
import { Trophy, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RankedPlayer {
  id: string;
  full_name: string;
  username: string;
  level: string;
  level_score: number;
  total_matches: number;
  win_rate: number;
  city: string | null;
}

interface Props {
  players: RankedPlayer[] | null;
  title: string;
  currentUserId?: string;
}

function getRankIcon(index: number) {
  if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" aria-hidden="true" />;
  if (index === 1) return <Medal className="h-5 w-5 text-gray-400" aria-hidden="true" />;
  if (index === 2) return <Medal className="h-5 w-5 text-amber-700" aria-hidden="true" />;
  return (
    <span className="flex h-5 w-5 items-center justify-center text-xs text-muted-foreground">
      {index + 1}
    </span>
  );
}

export function RankingList({ players, title, currentUserId }: Props) {
  if (!players || players.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">Aucun joueur classé</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-[15px] font-bold text-navy">{title}</h2>
      {players.map((p, i) => (
        <div
          key={p.id}
          className={cn(
            'flex items-center justify-between rounded-xl bg-white p-3 shadow-padel',
            p.id === currentUserId && 'ring-2 ring-green-padel/30 bg-green-subtle',
          )}
        >
          <div className="flex items-center gap-3">
            {getRankIcon(i)}
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-padel/10 text-sm font-bold text-green-padel">
              {p.full_name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-navy">
                {p.full_name}
                {p.id === currentUserId && (
                  <span className="ml-1 text-xs font-medium text-green-padel">(toi)</span>
                )}
              </p>
              <p className="text-xs text-gray-400">
                @{p.username} {p.city ? `· ${p.city}` : ''}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-green-padel">{p.level_score}</p>
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className="text-[10px]">
                {LEVEL_LABELS[p.level as PlayerLevel]}
              </Badge>
              <span className="text-[10px] text-gray-400">
                {p.win_rate}%
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
