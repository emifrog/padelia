import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z
    .string()
    .min(3, 'Minimum 3 caractères')
    .max(50, 'Maximum 50 caractères'),
  description: z
    .string()
    .max(500, 'Maximum 500 caractères')
    .optional()
    .or(z.literal('')),
  visibility: z.enum(['public', 'private', 'invite_only']),
  city: z.string().min(2, 'Ville requise'),
  max_members: z.number().min(2).max(500),
});

export type CreateGroupData = z.infer<typeof createGroupSchema>;

export const GROUP_VISIBILITY_LABELS: Record<string, string> = {
  public: 'Public',
  private: 'Privé',
  invite_only: 'Sur invitation',
};

export const GROUP_VISIBILITY_DESCRIPTIONS: Record<string, string> = {
  public: 'Tout le monde peut voir et rejoindre',
  private: 'Visible mais adhésion sur demande',
  invite_only: 'Accessible uniquement sur invitation',
};
