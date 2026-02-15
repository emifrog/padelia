'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { createMatchSchema, type CreateMatchData } from '@/lib/validations/match';
import { MATCH_TYPE_LABELS, DURATION_OPTIONS, VISIBILITY_LABELS } from '@/lib/constants/match';
import { LEVEL_LABELS } from '@/types';
import type { PlayerLevel, MatchType, MatchVisibility } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, ChevronLeft, MapPin, Calendar, Clock, Users, Euro } from 'lucide-react';

export default function CreerMatchPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateMatchData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- zodResolver type mismatch with react-hook-form
    resolver: zodResolver(createMatchSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      match_type: 'friendly',
      visibility: 'public',
      scheduled_at: '',
      duration_minutes: 90,
      location_name: '',
      max_players: 4,
      cost_per_player: 0,
    },
  });

  async function onSubmit(data: CreateMatchData) {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Non connecté'); return; }

    // Create the match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        organizer_id: user.id,
        title: data.title,
        description: data.description || null,
        match_type: data.match_type,
        visibility: data.visibility,
        scheduled_at: new Date(data.scheduled_at).toISOString(),
        duration_minutes: data.duration_minutes,
        location_name: data.location_name,
        max_players: data.max_players,
        min_level: data.min_level || null,
        max_level: data.max_level || null,
        cost_per_player: data.cost_per_player,
      })
      .select('id')
      .single();

    if (matchError || !match) {
      toast.error('Erreur lors de la création');
      setLoading(false);
      return;
    }

    // Add organizer as confirmed participant
    await supabase.from('match_participants').insert({
      match_id: match.id,
      player_id: user.id,
      role: 'organizer',
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
    });

    toast.success('Match créé !');
    router.push(`/matchs/${match.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/matchs"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-xl font-bold">Créer un match</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Titre du match</Label>
          <Input
            id="title"
            placeholder="Match amical du samedi"
            {...register('title')}
          />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description <span className="text-muted-foreground">(optionnel)</span></Label>
          <Textarea
            id="description"
            rows={2}
            placeholder="Niveau intermédiaire, ambiance cool..."
            {...register('description')}
          />
        </div>

        {/* Match type */}
        <div className="space-y-2">
          <Label>Type de match</Label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(MATCH_TYPE_LABELS) as [MatchType, string][]).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setValue('match_type', key, { shouldValidate: true })}
                className={`rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                  watch('match_type') === key
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Visibility */}
        <div className="space-y-2">
          <Label>Visibilité</Label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(VISIBILITY_LABELS) as [MatchVisibility, string][]).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setValue('visibility', key, { shouldValidate: true })}
                className={`rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                  watch('visibility') === key
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Date & Time */}
        <div className="space-y-2">
          <Label htmlFor="scheduled_at" className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Date et heure
          </Label>
          <Input
            id="scheduled_at"
            type="datetime-local"
            {...register('scheduled_at')}
          />
          {errors.scheduled_at && <p className="text-xs text-destructive">{errors.scheduled_at.message}</p>}
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Durée
          </Label>
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setValue('duration_minutes', value, { shouldValidate: true })}
                className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                  watch('duration_minutes') === value
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
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

        {/* Players */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> Nombre de joueurs
          </Label>
          <div className="flex gap-2">
            {[2, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setValue('max_players', n as 2 | 4, { shouldValidate: true })}
                className={`flex-1 rounded-xl border px-4 py-3 text-center transition-colors ${
                  watch('max_players') === n
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {n} joueurs
              </button>
            ))}
          </div>
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

        {/* Cost */}
        <div className="space-y-2">
          <Label htmlFor="cost" className="flex items-center gap-1.5">
            <Euro className="h-3.5 w-3.5" /> Coût par joueur (€)
          </Label>
          <Input
            id="cost"
            type="number"
            min={0}
            max={200}
            step={0.5}
            {...register('cost_per_player', { valueAsNumber: true })}
          />
        </div>

        {/* Submit */}
        <Button type="submit" disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Créer le match
        </Button>
      </form>
    </div>
  );
}
