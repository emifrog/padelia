import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PlayerStat {
  id: string;
  match_id: string;
  was_winner: boolean | null;
  sets_won: number;
  sets_lost: number;
  level_before: number | null;
  level_after: number | null;
  level_change: number | null;
  created_at: string;
}

interface Props {
  stats: PlayerStat[];
}

export default function MatchHistory({ stats }: Props) {
  if (stats.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun match terminé pour le moment
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {stats.map((stat) => {
        const date = new Date(stat.created_at);
        const change = stat.level_change ?? 0;
        const isPositive = change >= 0;

        return (
          <div key={stat.id} className="flex items-center justify-between rounded-xl border bg-card p-3">
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                stat.was_winner
                  ? 'bg-primary/10 text-primary'
                  : 'bg-destructive/10 text-destructive'
              }`}>
                {stat.was_winner ? 'V' : 'D'}
              </div>
              <div>
                <p className="text-sm font-medium">
                  Sets : {stat.sets_won}-{stat.sets_lost}
                </p>
                <p className="text-xs text-muted-foreground">
                  {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {change !== 0 && (
                <div className={`flex items-center gap-0.5 text-xs font-medium ${
                  isPositive ? 'text-primary' : 'text-destructive'
                }`}>
                  {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {isPositive ? '+' : ''}{change}
                </div>
              )}
              <Badge variant="secondary" className="text-xs">
                {stat.level_after ?? '—'}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}
