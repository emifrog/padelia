import type { BadgeVariant } from '@/components/ui'

export const MATCH_STATUS: Record<
  string,
  { label: string; variant: BadgeVariant }
> = {
  pending: { label: 'En attente', variant: 'secondary' },
  confirmed: { label: 'Confirmé', variant: 'success' },
  in_progress: { label: 'En cours', variant: 'default' },
  completed: { label: 'Terminé', variant: 'muted' },
  cancelled: { label: 'Annulé', variant: 'destructive' },
}

export const MATCH_TYPE: Record<string, string> = {
  friendly: 'Amical',
  ranked: 'Classé',
  tournament: 'Tournoi',
}
