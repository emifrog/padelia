import { z } from 'zod';

export const profileSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Minimum 2 caractères')
    .max(50, 'Maximum 50 caractères'),
  username: z
    .string()
    .min(3, 'Minimum 3 caractères')
    .max(20, 'Maximum 20 caractères')
    .regex(/^[a-z0-9_]+$/, 'Lettres minuscules, chiffres et _ uniquement'),
  bio: z
    .string()
    .max(500, 'Maximum 500 caractères')
    .optional()
    .or(z.literal('')),
  city: z.string().min(2, 'Ville requise'),
  level: z.enum(['debutant', 'initie', 'intermediaire', 'avance', 'expert', 'competition']),
  level_score: z.number().min(1).max(10),
  preferred_side: z.enum(['gauche', 'droite', 'les_deux']),
  play_style: z.enum(['offensif', 'defensif', 'mixte', 'polyvalent']),
  player_goal: z.enum(['loisir', 'progression', 'competition', 'social']),
  dominant_hand: z.enum(['droite', 'gauche']),
  years_playing: z.number().min(0).max(50),
  max_distance_km: z.number().min(1).max(200),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
