import { z } from 'zod';

export const onboardingSchema = z.object({
  username: z
    .string()
    .min(3, 'Minimum 3 caractères')
    .max(20, 'Maximum 20 caractères')
    .regex(/^[a-z0-9_]+$/, 'Lettres minuscules, chiffres et _ uniquement'),
  city: z.string().min(2, 'Ville requise'),
  level: z.enum(['debutant', 'initie', 'intermediaire', 'avance', 'expert', 'competition']),
  level_score: z.number().min(1).max(10),
  preferred_side: z.enum(['gauche', 'droite', 'les_deux']),
  play_style: z.enum(['offensif', 'defensif', 'mixte', 'polyvalent']),
  player_goal: z.enum(['loisir', 'progression', 'competition', 'social']),
  dominant_hand: z.enum(['droite', 'gauche']),
  years_playing: z.number().min(0).max(50),
});

export type OnboardingData = z.infer<typeof onboardingSchema>;
