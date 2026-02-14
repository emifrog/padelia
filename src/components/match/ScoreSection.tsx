'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Trophy } from 'lucide-react';

interface SetScore {
  score_a: number;
  score_b: number;
}

interface Props {
  matchId: string;
  maxPlayers: number;
}

export default function ScoreSection({ matchId }: Props) {
  const [sets, setSets] = useState<SetScore[]>([
    { score_a: 0, score_b: 0 },
    { score_a: 0, score_b: 0 },
    { score_a: 0, score_b: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  function updateSet(index: number, field: 'score_a' | 'score_b', value: number) {
    setSets((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: Math.max(0, Math.min(7, value)) } : s)),
    );
  }

  function computeWinner(): 'A' | 'B' | null {
    let winsA = 0;
    let winsB = 0;
    for (const set of sets) {
      if (set.score_a > set.score_b) winsA++;
      else if (set.score_b > set.score_a) winsB++;
    }
    if (winsA > winsB) return 'A';
    if (winsB > winsA) return 'B';
    return null;
  }

  async function handleSubmit() {
    const winner = computeWinner();
    if (!winner) {
      toast.error('Le résultat doit désigner un gagnant');
      return;
    }

    setLoading(true);

    // Build score strings: "6/4 3/6 7/5"
    const scoreA = sets.map((s) => s.score_a).join('/');
    const scoreB = sets.map((s) => s.score_b).join('/');

    const { error } = await supabase
      .from('matches')
      .update({
        status: 'completed',
        score_team_a: scoreA,
        score_team_b: scoreB,
        winner_team: winner,
      })
      .eq('id', matchId);

    if (error) {
      toast.error('Erreur lors de la sauvegarde');
      setLoading(false);
      return;
    }

    // Trigger ELO update via API
    try {
      await fetch(`/api/matches/${matchId}/complete`, { method: 'POST' });
    } catch {
      // ELO update will be retried
    }

    toast.success('Résultat enregistré !');
    router.refresh();
  }

  const winner = computeWinner();

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 font-semibold">
        <Trophy className="h-4 w-4 text-primary" />
        Saisir le résultat
      </h2>

      <div className="space-y-3">
        {sets.map((set, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-12 text-xs text-muted-foreground">Set {i + 1}</span>
            <div className="flex flex-1 items-center gap-2">
              <div className="text-center">
                <span className="mb-1 block text-xs text-muted-foreground">Éq. A</span>
                <Input
                  type="number"
                  min={0}
                  max={7}
                  value={set.score_a}
                  onChange={(e) => updateSet(i, 'score_a', Number(e.target.value))}
                  className="h-10 w-14 text-center text-lg font-bold"
                />
              </div>
              <span className="mt-5 text-muted-foreground">—</span>
              <div className="text-center">
                <span className="mb-1 block text-xs text-muted-foreground">Éq. B</span>
                <Input
                  type="number"
                  min={0}
                  max={7}
                  value={set.score_b}
                  onChange={(e) => updateSet(i, 'score_b', Number(e.target.value))}
                  className="h-10 w-14 text-center text-lg font-bold"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {winner && (
        <p className="text-center text-sm font-medium text-primary">
          Vainqueur : Équipe {winner}
        </p>
      )}

      <Button onClick={handleSubmit} disabled={loading || !winner} className="w-full">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Valider le résultat
      </Button>
    </div>
  );
}
