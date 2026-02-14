import type { PlayingSide } from '@/types';

// ============================================================
// Algorithme de Matching — Score composite sur 100 points
// Niveau (40%) | Position (20%) | Fiabilité (20%) | Proximité (15%) | Disponibilités (5%)
// ============================================================

export interface PlayerForMatching {
  id: string;
  level_score: number;
  preferred_side: PlayingSide;
  reliability_score: number;
  latitude: number | null;
  longitude: number | null;
  availability: Record<string, string[]>;
}

export interface MatchScoreResult {
  player_id: string;
  total_score: number;
  breakdown: {
    level: number;
    position: number;
    reliability: number;
    proximity: number;
    availability: number;
  };
}

// --- Helpers ---

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Haversine distance en km */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Score de compatibilité de position (0-100)
 * gauche + droite = 100 (complémentaire parfait)
 * un des deux "les_deux" = 80
 * même côté = 50
 * les_deux + les_deux = 70
 */
function getSideCompatibility(sideA: PlayingSide, sideB: PlayingSide): number {
  if (sideA === sideB) {
    return sideA === 'les_deux' ? 70 : 50;
  }
  if (sideA === 'les_deux' || sideB === 'les_deux') {
    return 80;
  }
  // gauche + droite ou droite + gauche
  return 100;
}

/**
 * Compte les créneaux de disponibilité communs entre deux joueurs
 */
function countCommonSlots(
  availA: Record<string, string[]>,
  availB: Record<string, string[]>,
): number {
  let common = 0;
  for (const day of Object.keys(availA)) {
    const slotsA = availA[day] ?? [];
    const slotsB = availB[day] ?? [];
    for (const slot of slotsA) {
      if (slotsB.includes(slot)) {
        common++;
      }
    }
  }
  return common;
}

// --- Score principal ---

export function calculateMatchScore(
  currentPlayer: PlayerForMatching,
  candidate: PlayerForMatching,
  maxDistanceKm: number = 30,
): MatchScoreResult {
  // 1. Niveau (40%) — diff de level_score, 0 = parfait
  const levelDiff = Math.abs(currentPlayer.level_score - candidate.level_score);
  const levelScore = Math.max(0, (1 - levelDiff / 5) * 100);

  // 2. Position complémentaire (20%)
  const positionScore = getSideCompatibility(
    currentPlayer.preferred_side,
    candidate.preferred_side,
  );

  // 3. Fiabilité (20%)
  const reliabilityScore = candidate.reliability_score * 100;

  // 4. Proximité (15%)
  let proximityScore = 0;
  if (
    currentPlayer.latitude != null &&
    currentPlayer.longitude != null &&
    candidate.latitude != null &&
    candidate.longitude != null
  ) {
    const dist = haversineDistance(
      currentPlayer.latitude,
      currentPlayer.longitude,
      candidate.latitude,
      candidate.longitude,
    );
    proximityScore = Math.max(0, (1 - dist / maxDistanceKm) * 100);
  }

  // 5. Disponibilités communes (5%)
  const commonSlots = countCommonSlots(
    currentPlayer.availability,
    candidate.availability,
  );
  const availabilityScore = Math.min(commonSlots * 20, 100);

  // Score total pondéré
  const total =
    levelScore * 0.4 +
    positionScore * 0.2 +
    reliabilityScore * 0.2 +
    proximityScore * 0.15 +
    availabilityScore * 0.05;

  return {
    player_id: candidate.id,
    total_score: Math.round(total * 10) / 10,
    breakdown: {
      level: Math.round(levelScore * 10) / 10,
      position: positionScore,
      reliability: Math.round(reliabilityScore * 10) / 10,
      proximity: Math.round(proximityScore * 10) / 10,
      availability: Math.round(availabilityScore * 10) / 10,
    },
  };
}
