'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Loader2, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StepIdentity from '@/components/onboarding/StepIdentity';
import StepLevel from '@/components/onboarding/StepLevel';
import StepStyle from '@/components/onboarding/StepStyle';
import type { OnboardingData } from '@/lib/validations/onboarding';

const STEPS = ['Identité', 'Niveau', 'Style de jeu'];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Partial<OnboardingData>>({
    username: '',
    city: '',
    level: 'initie',
    level_score: 3.0,
    preferred_side: 'les_deux',
    play_style: 'mixte',
    player_goal: 'loisir',
    dominant_hand: 'droite',
    years_playing: 0,
  });
  const router = useRouter();
  const supabase = createClient();

  function updateData(partial: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...partial }));
  }

  function canGoNext(): boolean {
    if (step === 0) return !!data.username && data.username.length >= 3 && !!data.city;
    if (step === 1) return !!data.level;
    return true;
  }

  async function handleFinish() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Session expirée');
      router.push('/login');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        username: data.username,
        city: data.city,
        level: data.level,
        level_score: data.level_score,
        preferred_side: data.preferred_side,
        play_style: data.play_style,
        player_goal: data.player_goal,
        dominant_hand: data.dominant_hand,
        years_playing: data.years_playing,
        is_onboarded: true,
      })
      .eq('id', user.id);

    if (error) {
      toast.error('Erreur lors de la sauvegarde');
      setLoading(false);
      return;
    }

    toast.success('Profil complété !');
    router.push('/accueil');
    router.refresh();
  }

  const isLast = step === STEPS.length - 1;

  return (
    <div className="flex min-h-dvh flex-col bg-navy px-4 pb-8 pt-12">
      {/* Progress bar */}
      <div className="mx-auto mb-8 w-full max-w-sm">
        <div className="mb-2 flex justify-between text-xs text-gray-400">
          {STEPS.map((s, i) => (
            <span key={s} className={i <= step ? 'text-green-padel font-medium' : ''}>
              {s}
            </span>
          ))}
        </div>
        <div className="h-1.5 w-full rounded-full bg-navy-mid">
          <div
            className="h-1.5 rounded-full bg-green-padel transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="mx-auto w-full max-w-sm flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && <StepIdentity data={data} onChange={updateData} />}
            {step === 1 && <StepLevel data={data} onChange={updateData} />}
            {step === 2 && <StepStyle data={data} onChange={updateData} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="mx-auto flex w-full max-w-sm gap-3 pt-6">
        {step > 0 && (
          <Button
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
            className="border-navy-mid bg-navy text-white hover:bg-navy-mid"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Retour
          </Button>
        )}
        <Button
          onClick={isLast ? handleFinish : () => setStep((s) => s + 1)}
          disabled={!canGoNext() || loading}
          className="flex-1 bg-green-padel font-semibold hover:bg-green-padel-light"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : isLast ? (
            <Check className="mr-2 h-4 w-4" />
          ) : null}
          {isLast ? 'Terminer' : 'Suivant'}
          {!isLast && <ChevronRight className="ml-1 h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
