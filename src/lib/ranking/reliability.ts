// ============================================================
// Reliability Score — Pénalisation des no-show
// Score de 0.00 à 1.00
// ============================================================

export interface ReliabilityInput {
  current_score: number;
  total_matches: number;
  event: 'confirmed' | 'no_show' | 'cancelled_late' | 'played';
}

/**
 * Met à jour le reliability_score en fonction du comportement du joueur
 *
 * - 'played': léger bonus → tend vers 1.0
 * - 'confirmed': neutre
 * - 'cancelled_late': pénalité modérée (annulation < 24h)
 * - 'no_show': forte pénalité
 */
export function calculateReliability(input: ReliabilityInput): number {
  const { current_score, total_matches, event } = input;

  // Weight: récence compte plus, donc on pondère par 1/sqrt(matchs)
  const weight = Math.max(0.05, 1 / Math.sqrt(Math.max(total_matches, 1)));

  let delta: number;

  switch (event) {
    case 'played':
      // Reward: tend vers 1.0
      delta = weight * 0.02;
      break;
    case 'confirmed':
      delta = 0;
      break;
    case 'cancelled_late':
      // Moderate penalty
      delta = -weight * 0.08;
      break;
    case 'no_show':
      // Severe penalty
      delta = -weight * 0.15;
      break;
    default:
      delta = 0;
  }

  const newScore = Math.max(0, Math.min(1, current_score + delta));
  return Math.round(newScore * 100) / 100;
}
