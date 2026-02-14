'use client';

import { useRouter } from 'next/navigation';
import { useMatchActions } from '@/hooks/use-match-actions';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, UserMinus, XCircle } from 'lucide-react';

interface Props {
  matchId: string;
  canJoin: boolean;
  canLeave: boolean;
  isOrganizer: boolean;
  matchStatus: string;
}

export default function MatchActions({ matchId, canJoin, canLeave, isOrganizer, matchStatus }: Props) {
  const { joinMatch, leaveMatch, cancelMatch, loading } = useMatchActions();
  const router = useRouter();

  async function handleJoin() {
    const ok = await joinMatch(matchId);
    if (ok) router.refresh();
  }

  async function handleLeave() {
    const ok = await leaveMatch(matchId);
    if (ok) router.refresh();
  }

  async function handleCancel() {
    if (!confirm('Annuler ce match ?')) return;
    const ok = await cancelMatch(matchId);
    if (ok) router.refresh();
  }

  const isCancelable = isOrganizer && ['open', 'full', 'confirmed'].includes(matchStatus);

  if (!canJoin && !canLeave && !isCancelable) return null;

  return (
    <div className="space-y-2">
      {canJoin && (
        <Button onClick={handleJoin} disabled={loading} className="w-full">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
          Rejoindre le match
        </Button>
      )}
      {canLeave && (
        <Button onClick={handleLeave} disabled={loading} variant="outline" className="w-full">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserMinus className="mr-2 h-4 w-4" />}
          Quitter le match
        </Button>
      )}
      {isCancelable && (
        <Button
          onClick={handleCancel}
          disabled={loading}
          variant="outline"
          className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
          Annuler le match
        </Button>
      )}
    </div>
  );
}
