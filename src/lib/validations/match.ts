import { z } from 'zod';

export const createMatchSchema = z.object({
  title: z
    .string()
    .min(3, 'Minimum 3 caractères')
    .max(60, 'Maximum 60 caractères'),
  description: z
    .string()
    .max(500, 'Maximum 500 caractères')
    .optional()
    .or(z.literal('')),
  match_type: z.enum(['friendly', 'ranked', 'tournament']),
  visibility: z.enum(['public', 'group', 'private']),
  scheduled_at: z.string().min(1, 'Date et heure requises'),
  duration_minutes: z.number().min(30).max(240),
  location_name: z.string().min(2, 'Lieu requis'),
  max_players: z.number().refine((v) => v === 2 || v === 4, 'Doit être 2 ou 4'),
  min_level: z.enum(['debutant', 'initie', 'intermediaire', 'avance', 'expert', 'competition']).optional(),
  max_level: z.enum(['debutant', 'initie', 'intermediaire', 'avance', 'expert', 'competition']).optional(),
  cost_per_player: z.number().min(0).max(200),
});

export type CreateMatchData = z.infer<typeof createMatchSchema>;

export const scoreSetSchema = z.object({
  score_a: z.number().min(0).max(7),
  score_b: z.number().min(0).max(7),
});

export const completeMatchSchema = z.object({
  sets: z.array(scoreSetSchema).min(2).max(3),
  winner_team: z.enum(['A', 'B']),
});

export type CompleteMatchData = z.infer<typeof completeMatchSchema>;

// Peer feedback after match completion
export const peerFeedbackSchema = z.object({
  rating: z.number().int().min(1, 'Note minimum 1').max(5, 'Note maximum 5'),
  level_feedback: z.number().min(1.0).max(10.0).optional(),
});

export type PeerFeedbackData = z.infer<typeof peerFeedbackSchema>;
