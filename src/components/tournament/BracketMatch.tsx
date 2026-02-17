'use client';

import { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { BRACKET_MATCH_STATUS_LABELS } from '@/lib/constants/tournament';
import type { BracketMatchStatus } from '@/types';

interface TeamInfo {
  id: string;
  name: string;
}

interface Props {
  matchId: string;
  tournamentId: string;
  teamA: TeamInfo | null;
  teamB: TeamInfo | null;
  scoreA: string | null;
  scoreB: string | null;
  winnerId: string | null;
  status: BracketMatchStatus;
  isOrganizer: boolean;
  onScoreSubmitted?: () => void;
}

export default memo(function BracketMatch({
  matchId,
  tournamentId,
  teamA,
  teamB,
  scoreA,
  scoreB,
  winnerId,
  status,
  isOrganizer,
  onScoreSubmitted,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [formScoreA, setFormScoreA] = useState('');
  const [formScoreB, setFormScoreB] = useState('');
  const [formWinner, setFormWinner] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canEnterScore = isOrganizer && status === 'pending' && teamA && teamB;

  async function handleSubmitScore() {
    if (!formWinner) {
      toast.error('Selectionne le vainqueur');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/bracket/${matchId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score_a: formScoreA,
          score_b: formScoreB,
          winner_team_id: formWinner,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'Erreur');
        return;
      }

      toast.success('Score enregistre');
      setShowForm(false);
      onScoreSubmitted?.();
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-[200px] shrink-0 rounded-lg border bg-white shadow-sm">
      {/* Team A */}
      <div
        className={`flex items-center justify-between border-b px-3 py-2 ${
          winnerId && winnerId === teamA?.id ? 'bg-green-50 font-bold' : ''
        }`}
      >
        <span className={`truncate text-[12px] ${teamA ? 'text-navy' : 'text-gray-300 italic'}`}>
          {teamA?.name ?? (status === 'bye' ? 'Exempt' : 'TBD')}
        </span>
        {scoreA !== null && (
          <span className="ml-2 text-[12px] font-bold text-navy">{scoreA}</span>
        )}
      </div>

      {/* Team B */}
      <div
        className={`flex items-center justify-between px-3 py-2 ${
          winnerId && winnerId === teamB?.id ? 'bg-green-50 font-bold' : ''
        }`}
      >
        <span className={`truncate text-[12px] ${teamB ? 'text-navy' : 'text-gray-300 italic'}`}>
          {teamB?.name ?? (status === 'bye' ? 'Exempt' : 'TBD')}
        </span>
        {scoreB !== null && (
          <span className="ml-2 text-[12px] font-bold text-navy">{scoreB}</span>
        )}
      </div>

      {/* Status badge */}
      <div className="border-t px-3 py-1.5">
        <span className="text-[10px] font-medium text-gray-400">
          {BRACKET_MATCH_STATUS_LABELS[status]}
        </span>
      </div>

      {/* Score entry button */}
      {canEnterScore && !showForm && (
        <div className="border-t px-2 py-1.5">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="w-full rounded-md bg-green-padel py-1 text-[11px] font-semibold text-white transition-colors hover:bg-green-700"
          >
            Saisir score
          </button>
        </div>
      )}

      {/* Score form */}
      {showForm && (
        <div className="space-y-2 border-t p-2">
          <div className="flex gap-1">
            <Input
              placeholder="A"
              value={formScoreA}
              onChange={(e) => setFormScoreA(e.target.value)}
              className="h-7 text-[12px]"
            />
            <Input
              placeholder="B"
              value={formScoreB}
              onChange={(e) => setFormScoreB(e.target.value)}
              className="h-7 text-[12px]"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-medium text-gray-400">Vainqueur:</span>
            <div className="flex gap-1">
              {teamA && (
                <button
                  type="button"
                  onClick={() => setFormWinner(teamA.id)}
                  className={`flex-1 truncate rounded-md border px-1 py-0.5 text-[10px] transition-colors ${
                    formWinner === teamA.id
                      ? 'border-green-padel bg-green-50 font-semibold text-green-700'
                      : 'border-border text-gray-500'
                  }`}
                >
                  {teamA.name}
                </button>
              )}
              {teamB && (
                <button
                  type="button"
                  onClick={() => setFormWinner(teamB.id)}
                  className={`flex-1 truncate rounded-md border px-1 py-0.5 text-[10px] transition-colors ${
                    formWinner === teamB.id
                      ? 'border-green-padel bg-green-50 font-semibold text-green-700'
                      : 'border-border text-gray-500'
                  }`}
                >
                  {teamB.name}
                </button>
              )}
            </div>
          </div>
          <Button
            size="sm"
            className="h-7 w-full text-[11px]"
            disabled={submitting || !formScoreA || !formScoreB || !formWinner}
            onClick={handleSubmitScore}
          >
            {submitting && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
            Valider
          </Button>
        </div>
      )}
    </div>
  );
});
