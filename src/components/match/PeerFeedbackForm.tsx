'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Participant {
  player_id: string;
  full_name: string;
  rating_given: number | null;
}

interface Props {
  matchId: string;
  participants: Participant[];
  currentUserId: string;
}

export default function PeerFeedbackForm({ matchId, participants, currentUserId }: Props) {
  const otherPlayers = participants.filter((p) => p.player_id !== currentUserId);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [levelFeedbacks, setLevelFeedbacks] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Check if current user already gave feedback
  const currentParticipant = participants.find((p) => p.player_id === currentUserId);
  const alreadyRated = currentParticipant?.rating_given != null;

  if (alreadyRated) {
    return (
      <div className="rounded-xl bg-green-subtle p-4 text-center">
        <Check className="mx-auto mb-2 h-6 w-6 text-green-padel" />
        <p className="text-sm font-semibold text-green-padel">
          Tu as déjà noté tes partenaires ({currentParticipant.rating_given}/5)
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="rounded-xl bg-green-subtle p-4 text-center">
        <Check className="mx-auto mb-2 h-6 w-6 text-green-padel" />
        <p className="text-sm font-semibold text-green-padel">Merci pour ton feedback !</p>
      </div>
    );
  }

  async function handleSubmit() {
    // Validate: all players need a rating
    for (const player of otherPlayers) {
      if (!ratings[player.player_id]) {
        toast.error(`Note tous les joueurs avant de soumettre`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const feedbacks = otherPlayers.map((p) => ({
        target_player_id: p.player_id,
        rating: ratings[p.player_id],
        level_feedback: levelFeedbacks[p.player_id] ?? undefined,
      }));

      const response = await fetch(`/api/matches/${matchId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbacks }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error ?? 'Erreur lors de l\'envoi');
        return;
      }

      setSubmitted(true);
      toast.success('Feedback envoyé !');
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl bg-white p-4 shadow-padel">
      <div>
        <h3 className="text-[15px] font-bold text-navy">Note tes partenaires</h3>
        <p className="text-xs text-gray-400">Ton feedback améliore le matching pour tout le monde</p>
      </div>

      {otherPlayers.map((player) => (
        <div key={player.player_id} className="space-y-2">
          <p className="text-sm font-semibold text-navy">{player.full_name}</p>

          {/* Star rating */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRatings((prev) => ({ ...prev, [player.player_id]: star }))}
                className="transition-transform active:scale-90"
              >
                <Star
                  className={`h-7 w-7 ${
                    (ratings[player.player_id] ?? 0) >= star
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-200'
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-xs text-gray-400">
              {ratings[player.player_id] ? `${ratings[player.player_id]}/5` : '—'}
            </span>
          </div>

          {/* Optional level feedback slider */}
          <div className="space-y-1">
            <label className="text-xs text-gray-400">
              Niveau estimé (optionnel) :{' '}
              <span className="font-semibold text-navy">
                {levelFeedbacks[player.player_id]?.toFixed(1) ?? '—'}
              </span>
            </label>
            <input
              type="range"
              min={1}
              max={10}
              step={0.5}
              value={levelFeedbacks[player.player_id] ?? 5}
              onChange={(e) =>
                setLevelFeedbacks((prev) => ({
                  ...prev,
                  [player.player_id]: parseFloat(e.target.value),
                }))
              }
              className="w-full accent-green-500"
            />
            <div className="flex justify-between text-[10px] text-gray-300">
              <span>1.0</span>
              <span>10.0</span>
            </div>
          </div>
        </div>
      ))}

      <Button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full bg-green-padel hover:bg-green-padel/90"
      >
        {submitting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        Envoyer le feedback
      </Button>
    </div>
  );
}
