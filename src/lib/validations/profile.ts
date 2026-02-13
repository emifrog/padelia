import { z } from 'zod/v4'

export const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'Le pseudo doit faire au moins 3 caractères')
    .max(20, 'Le pseudo ne peut pas dépasser 20 caractères')
    .regex(/^[a-zA-Z0-9_]+$/, 'Lettres, chiffres et underscores uniquement'),
  full_name: z
    .string()
    .min(2, 'Le nom doit faire au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères'),
  city: z
    .string()
    .min(2, 'La ville doit faire au moins 2 caractères'),
  level: z
    .number()
    .min(1, 'Le niveau minimum est 1')
    .max(10, 'Le niveau maximum est 10'),
  dominant_hand: z.enum(['left', 'right']),
  preferred_side: z.enum(['left', 'right', 'both']),
  play_style: z.enum(['offensive', 'defensive', 'mixed']),
  goal: z.enum(['casual', 'improvement', 'competition']),
  bio: z
    .string()
    .max(500, 'La bio ne peut pas dépasser 500 caractères')
    .optional()
    .or(z.literal('')),
})

export type ProfileFormValues = z.infer<typeof profileSchema>
