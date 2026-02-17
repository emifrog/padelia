'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { createTournamentSchema, type CreateTournamentData } from '@/lib/validations/tournament';
import { TOURNAMENT_FORMAT_LABELS, MAX_TEAMS_OPTIONS } from '@/lib/constants/tournament';
import { LEVEL_LABELS } from '@/types';
import type { PlayerLevel, TournamentFormat } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, ChevronLeft, MapPin, Calendar, Euro, Trophy, Users } from 'lucide-react';

export default function CreerTournoiPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateTournamentData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- zodResolver type mismatch with react-hook-form
    resolver: zodResolver(createTournamentSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      format: 'single_elimination',
      max_teams: 8,
      entry_fee: 0,
      prize_description: '',
      min_level: undefined,
      max_level: undefined,
      registration_deadline: '',
      starts_at: '',
      ends_at: '',
      location_name: '',
      club_id: '',
      rules: '',
    },
  });

  async function onSubmit(data: CreateTournamentData) {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Non connecte');
        return;
      }

      const { data: tournament, error } = await supabase
        .from('tournaments')
        .insert({
          organizer_id: user.id,
          name: data.name,
          description: data.description || null,
          format: data.format,
          status: 'draft',
          max_teams: data.max_teams,
          entry_fee: data.entry_fee,
          prize_description: data.prize_description || null,
          min_level: data.min_level || null,
          max_level: data.max_level || null,
          registration_deadline: data.registration_deadline ? new Date(data.registration_deadline).toISOString() : null,
          starts_at: new Date(data.starts_at).toISOString(),
          ends_at: data.ends_at ? new Date(data.ends_at).toISOString() : null,
          location_name: data.location_name,
          club_id: data.club_id || null,
          rules: data.rules || null,
        })
        .select('id')
        .single();

      if (error || !tournament) {
        toast.error('Erreur lors de la creation');
        return;
      }

      toast.success('Tournoi cree !');
      router.push(`/tournois/${tournament.id}`);
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/tournois"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-xl font-bold">Creer un tournoi</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5" /> Nom du tournoi
          </Label>
          <Input
            id="name"
            placeholder="Tournoi Open Padel Riviera"
            {...register('name')}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description <span className="text-muted-foreground">(optionnel)</span></Label>
          <Textarea
            id="description"
            rows={3}
            placeholder="Tournoi amical ouvert a tous les niveaux..."
            {...register('description')}
          />
        </div>

        {/* Format */}
        <div className="space-y-2">
          <Label>Format</Label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(TOURNAMENT_FORMAT_LABELS) as [TournamentFormat, string][]).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setValue('format', key, { shouldValidate: true })}
                className={`rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                  watch('format') === key
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Max teams */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> Nombre d&apos;equipes max
          </Label>
          <div className="grid grid-cols-4 gap-2">
            {MAX_TEAMS_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setValue('max_teams', n, { shouldValidate: true })}
                className={`rounded-xl border px-3 py-2.5 text-center text-sm transition-colors ${
                  watch('max_teams') === n
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          {errors.max_teams && <p className="text-xs text-destructive">{errors.max_teams.message}</p>}
        </div>

        {/* Entry fee */}
        <div className="space-y-2">
          <Label htmlFor="entry_fee" className="flex items-center gap-1.5">
            <Euro className="h-3.5 w-3.5" /> Frais d&apos;inscription (EUR par equipe)
          </Label>
          <Input
            id="entry_fee"
            type="number"
            min={0}
            max={500}
            step={1}
            {...register('entry_fee', { valueAsNumber: true })}
          />
          {errors.entry_fee && <p className="text-xs text-destructive">{errors.entry_fee.message}</p>}
        </div>

        {/* Prize */}
        <div className="space-y-2">
          <Label htmlFor="prize_description">Recompense <span className="text-muted-foreground">(optionnel)</span></Label>
          <Input
            id="prize_description"
            placeholder="1er prix : raquettes Bullpadel, 2e : balles..."
            {...register('prize_description')}
          />
        </div>

        {/* Level range */}
        <div className="space-y-2">
          <Label>Niveau requis <span className="text-muted-foreground">(optionnel)</span></Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Min</span>
              <select
                {...register('min_level')}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Aucun</option>
                {(Object.entries(LEVEL_LABELS) as [PlayerLevel, string][]).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Max</span>
              <select
                {...register('max_level')}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Aucun</option>
                {(Object.entries(LEVEL_LABELS) as [PlayerLevel, string][]).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="space-y-2">
          <Label htmlFor="starts_at" className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Date de debut
          </Label>
          <Input
            id="starts_at"
            type="datetime-local"
            {...register('starts_at')}
          />
          {errors.starts_at && <p className="text-xs text-destructive">{errors.starts_at.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ends_at">Date de fin <span className="text-muted-foreground">(optionnel)</span></Label>
          <Input
            id="ends_at"
            type="datetime-local"
            {...register('ends_at')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="registration_deadline">Date limite d&apos;inscription <span className="text-muted-foreground">(optionnel)</span></Label>
          <Input
            id="registration_deadline"
            type="datetime-local"
            {...register('registration_deadline')}
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location_name" className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> Lieu
          </Label>
          <Input
            id="location_name"
            placeholder="Padel Club Nice"
            {...register('location_name')}
          />
          {errors.location_name && <p className="text-xs text-destructive">{errors.location_name.message}</p>}
        </div>

        {/* Rules */}
        <div className="space-y-2">
          <Label htmlFor="rules">Reglement <span className="text-muted-foreground">(optionnel)</span></Label>
          <Textarea
            id="rules"
            rows={4}
            placeholder="Format des matchs, regles specifiques..."
            {...register('rules')}
          />
        </div>

        {/* Submit */}
        <Button type="submit" disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Creer le tournoi
        </Button>
      </form>
    </div>
  );
}
