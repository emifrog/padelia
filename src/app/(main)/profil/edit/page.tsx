'use client';
/* eslint-disable react-hooks/incompatible-library -- React Hook Form watch() is incompatible with React Compiler memoization */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { profileSchema, type ProfileFormData } from '@/lib/validations/profile';
import { LEVEL_LABELS, LEVEL_SCORE_RANGES, SIDE_LABELS, STYLE_LABELS, GOAL_LABELS } from '@/types';
import type { PlayerLevel } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, ChevronLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function EditProfilePage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const formValues = watch();
  const currentLevel = formValues.level;
  const currentDominantHand = formValues.dominant_hand;
  const currentPreferredSide = formValues.preferred_side;
  const currentPlayStyle = formValues.play_style;
  const currentPlayerGoal = formValues.player_goal;

  // Load profile
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        reset({
          full_name: profile.full_name,
          username: profile.username,
          bio: profile.bio ?? '',
          city: profile.city ?? '',
          level: profile.level,
          level_score: profile.level_score,
          preferred_side: profile.preferred_side,
          play_style: profile.play_style,
          player_goal: profile.player_goal,
          dominant_hand: profile.dominant_hand ?? 'droite',
          years_playing: profile.years_playing ?? 0,
          max_distance_km: profile.max_distance_km ?? 30,
        });
      }
      setFetching(false);
    }
    load();
  }, [supabase, router, reset]);

  async function onSubmit(data: ProfileFormData) {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id);

    if (error) {
      toast.error(error.message.includes('username')
        ? 'Ce pseudo est déjà pris'
        : 'Erreur lors de la sauvegarde');
      setLoading(false);
      return;
    }

    toast.success('Profil mis à jour !');
    router.push('/profil');
    router.refresh();
  }

  function selectLevel(level: PlayerLevel) {
    const [min, max] = LEVEL_SCORE_RANGES[level];
    setValue('level', level, { shouldDirty: true });
    setValue('level_score', Math.round(((min + max) / 2) * 10) / 10, { shouldDirty: true });
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/profil"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-xl font-bold">Modifier le profil</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Identity */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Identité</h2>

          <div className="space-y-2">
            <Label htmlFor="full_name">Nom complet</Label>
            <Input id="full_name" {...register('full_name')} />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Pseudo</Label>
            <Input id="username" {...register('username')} />
            {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" {...register('bio')} rows={3} placeholder="Parle de toi en quelques mots..." />
            {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Ville</Label>
            <Input id="city" {...register('city')} />
            {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
          </div>
        </section>

        {/* Level */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Niveau</h2>

          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(LEVEL_LABELS) as PlayerLevel[]).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => selectLevel(level)}
                className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                  currentLevel === level
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {LEVEL_LABELS[level]}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Années de pratique : {watch('years_playing')}</Label>
            <input
              type="range"
              min={0}
              max={20}
              {...register('years_playing', { valueAsNumber: true })}
              className="w-full accent-primary"
            />
          </div>
        </section>

        {/* Style */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Style de jeu</h2>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Main dominante</Label>
              <div className="flex gap-2">
                {(['droite', 'gauche'] as const).map((hand) => (
                  <button
                    key={hand}
                    type="button"
                    onClick={() => setValue('dominant_hand', hand, { shouldDirty: true })}
                    className={`flex-1 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                      currentDominantHand === hand
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {hand === 'droite' ? 'Droitier' : 'Gaucher'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Position préférée</Label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(SIDE_LABELS) as [string, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setValue('preferred_side', key as 'gauche' | 'droite' | 'les_deux', { shouldDirty: true })}
                    className={`rounded-xl border px-3 py-2.5 text-xs transition-colors ${
                      currentPreferredSide === key
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Style</Label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(STYLE_LABELS) as [string, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setValue('play_style', key as 'offensif' | 'defensif' | 'mixte' | 'polyvalent', { shouldDirty: true })}
                    className={`rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                      currentPlayStyle === key
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Objectif</Label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(GOAL_LABELS) as [string, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setValue('player_goal', key as 'loisir' | 'progression' | 'competition' | 'social', { shouldDirty: true })}
                    className={`rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                      currentPlayerGoal === key
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Préférences</h2>
          <div className="space-y-2">
            <Label>Distance de recherche : {watch('max_distance_km')} km</Label>
            <input
              type="range"
              min={1}
              max={200}
              step={1}
              {...register('max_distance_km', { valueAsNumber: true })}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 km</span>
              <span>200 km</span>
            </div>
          </div>
        </section>

        {/* Submit */}
        <Button
          type="submit"
          disabled={loading || !isDirty}
          className="w-full"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Enregistrer
        </Button>
      </form>
    </div>
  );
}
