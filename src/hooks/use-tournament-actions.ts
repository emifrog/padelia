'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function useTournamentActions() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function updateStatus(tournamentId: string, status: string): Promise<boolean> {
    setLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'Erreur lors de la mise a jour');
        return false;
      }

      toast.success(data.message ?? 'Statut mis a jour');
      router.refresh();
      return true;
    } catch {
      toast.error('Erreur de connexion');
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function openRegistrations(tournamentId: string): Promise<boolean> {
    return updateStatus(tournamentId, 'registration_open');
  }

  async function closeRegistrations(tournamentId: string): Promise<boolean> {
    return updateStatus(tournamentId, 'registration_closed');
  }

  async function cancelTournament(tournamentId: string): Promise<boolean> {
    return updateStatus(tournamentId, 'cancelled');
  }

  async function generateBracket(tournamentId: string): Promise<boolean> {
    setLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/generate-bracket`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'Erreur lors de la generation du bracket');
        return false;
      }

      toast.success('Bracket genere avec succes !');
      router.refresh();
      return true;
    } catch {
      toast.error('Erreur de connexion');
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function withdrawTeam(tournamentId: string): Promise<boolean> {
    setLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/withdraw`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'Erreur lors du retrait');
        return false;
      }

      toast.success('Equipe retiree du tournoi');
      router.refresh();
      return true;
    } catch {
      toast.error('Erreur de connexion');
      return false;
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    openRegistrations,
    closeRegistrations,
    cancelTournament,
    generateBracket,
    withdrawTeam,
  };
}
