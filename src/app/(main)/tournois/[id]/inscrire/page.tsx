'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, ChevronLeft, Search, UserPlus } from 'lucide-react';

interface PlayerResult {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  level: string;
  city: string | null;
}

export default function InscrireTournoiPage() {
  const [step, setStep] = useState(1);
  const [teamName, setTeamName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [players, setPlayers] = useState<PlayerResult[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<PlayerResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const router = useRouter();
  const params = useParams();
  const tournamentId = params.id as string;
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, [supabase]);

  const searchPlayers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setPlayers([]);
      return;
    }

    setSearching(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, level, city')
        .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
        .neq('id', currentUserId ?? '')
        .limit(10);

      setPlayers(data ?? []);
    } finally {
      setSearching(false);
    }
  }, [supabase, currentUserId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchPlayers(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchPlayers]);

  async function handleSubmit() {
    if (!selectedPartner) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_name: teamName,
          partner_id: selectedPartner.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'Erreur lors de l\'inscription');
        setSubmitting(false);
        return;
      }

      // If URL returned, redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
        return;
      }

      // Free tournament — success
      toast.success('Inscription confirmee !');
      router.push(`/tournois/${tournamentId}`);
    } catch {
      toast.error('Erreur de connexion');
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/tournois/${tournamentId}`}><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-xl font-bold">Inscription</h1>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              s <= step ? 'bg-green-padel' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Team name */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-navy">Nom d&apos;equipe</h2>
          <p className="text-sm text-muted-foreground">
            Choisis un nom pour ton equipe de deux joueurs.
          </p>
          <div className="space-y-2">
            <Label htmlFor="team_name">Nom</Label>
            <Input
              id="team_name"
              placeholder="Les Smasheurs"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              maxLength={40}
            />
          </div>
          <Button
            className="w-full"
            disabled={teamName.trim().length < 2}
            onClick={() => setStep(2)}
          >
            Continuer
          </Button>
        </div>
      )}

      {/* Step 2: Choose partner */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-navy">Choisis ton partenaire</h2>
          <p className="text-sm text-muted-foreground">
            Recherche un joueur par nom ou pseudo.
          </p>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un joueur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {searching && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {players.length > 0 && (
            <div className="space-y-2">
              {players.map((player) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => {
                    setSelectedPartner(player);
                    setStep(3);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:border-green-padel ${
                    selectedPartner?.id === player.id
                      ? 'border-green-padel bg-green-50'
                      : 'border-border'
                  }`}
                >
                  {player.avatar_url ? (
                    <Image
                      src={player.avatar_url}
                      alt={player.full_name}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-400">
                      {player.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-navy">
                      {player.full_name}
                    </p>
                    <p className="text-[12px] text-gray-400">
                      @{player.username}
                      {player.city && ` · ${player.city}`}
                    </p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                    {player.level}
                  </span>
                </button>
              ))}
            </div>
          )}

          {searchQuery.length >= 2 && !searching && players.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Aucun joueur trouve
            </p>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setStep(1)}
          >
            Retour
          </Button>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && selectedPartner && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-navy">Confirmation</h2>

          <div className="rounded-xl bg-white p-4 shadow-padel">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium uppercase text-gray-400">Equipe</span>
                <span className="text-[14px] font-bold text-navy">{teamName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium uppercase text-gray-400">Partenaire</span>
                <div className="flex items-center gap-2">
                  {selectedPartner.avatar_url ? (
                    <Image
                      src={selectedPartner.avatar_url}
                      alt={selectedPartner.full_name}
                      width={24}
                      height={24}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-400">
                      {selectedPartner.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-[14px] font-semibold text-navy">
                    {selectedPartner.full_name}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Button
            className="w-full"
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            Confirmer l&apos;inscription
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setStep(2)}
            disabled={submitting}
          >
            Retour
          </Button>
        </div>
      )}
    </div>
  );
}
