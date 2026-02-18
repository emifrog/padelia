'use client';

import { useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const PAGE_SIZE = 10;

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

export default function MatchHistory({ stats: initialStats }: Props) {
  const [stats, setStats] = useState<PlayerStat[]>(initialStats);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialStats.length >= PAGE_SIZE);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    try {
      const supabase = createClient();
      const lastStat = stats[stats.length - 1];
      if (!lastStat) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('player_stats')
        .select('*')
        .eq('player_id', user.id)
        .lt('created_at', lastStat.created_at)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (!data || data.length === 0) {
        setHasMore(false);
        return;
      }

      setStats((prev) => [...prev, ...data]);
      if (data.length < PAGE_SIZE) setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [stats, loadingMore, hasMore]);

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
                  {isPositive ? <TrendingUp className="h-3 w-3" aria-hidden="true" /> : <TrendingDown className="h-3 w-3" aria-hidden="true" />}
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

      {hasMore && (
        <Button
          variant="outline"
          className="w-full"
          onClick={loadMore}
          disabled={loadingMore}
        >
          {loadingMore ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Charger plus
        </Button>
      )}
    </div>
  );
}
