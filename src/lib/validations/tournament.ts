import { z } from 'zod';

export const createTournamentSchema = z.object({
  name: z.string().min(3, 'Minimum 3 caracteres').max(80, 'Maximum 80 caracteres'),
  description: z.string().max(1000).optional().or(z.literal('')),
  format: z.enum(['single_elimination', 'round_robin']),
  max_teams: z.number().min(4, 'Minimum 4 equipes').max(64, 'Maximum 64 equipes'),
  entry_fee: z.number().min(0, 'Minimum 0').max(500, 'Maximum 500'),
  prize_description: z.string().max(500).optional().or(z.literal('')),
  min_level: z.enum(['debutant', 'initie', 'intermediaire', 'avance', 'expert', 'competition']).optional(),
  max_level: z.enum(['debutant', 'initie', 'intermediaire', 'avance', 'expert', 'competition']).optional(),
  registration_deadline: z.string().optional().or(z.literal('')),
  starts_at: z.string().min(1, 'Date de debut requise'),
  ends_at: z.string().optional().or(z.literal('')),
  location_name: z.string().min(2, 'Lieu requis'),
  club_id: z.string().uuid().optional().or(z.literal('')),
  rules: z.string().max(2000).optional().or(z.literal('')),
});

export type CreateTournamentData = z.infer<typeof createTournamentSchema>;

export const registerTeamSchema = z.object({
  team_name: z.string().min(2, 'Minimum 2 caracteres').max(40, 'Maximum 40 caracteres'),
  partner_id: z.string().uuid('Partenaire requis'),
});

export type RegisterTeamData = z.infer<typeof registerTeamSchema>;

export const completeBracketMatchSchema = z.object({
  score_a: z.string().min(1, 'Score requis'),
  score_b: z.string().min(1, 'Score requis'),
  winner_team_id: z.string().uuid('Vainqueur requis'),
});

export type CompleteBracketMatchData = z.infer<typeof completeBracketMatchSchema>;
