import type { PreferredSide } from '@/types'

export interface PlayerForMatching {
  id: string
  computed_level: number
  preferred_side: PreferredSide
  latitude: number | null
  longitude: number | null
  reliability_score: number
  availabilitySlots: number // number of overlapping slots with target player
}

export interface MatchScoreResult {
  playerId: string
  totalScore: number
  levelScore: number
  sideScore: number
  geoScore: number
  availabilityScore: number
  reliabilityScore: number
}

// Weights from CLAUDE.md
const WEIGHTS = {
  level: 0.40,
  side: 0.20,
  geo: 0.15,
  availability: 0.15,
  reliability: 0.10,
} as const

/**
 * Calculate side compatibility between two players.
 * left + right = 100 (perfect complement)
 * both + anything = 80 (flexible)
 * same side = 50 (not ideal)
 */
function getSideCompatibility(sideA: PreferredSide, sideB: PreferredSide): number {
  if (sideA === 'both' || sideB === 'both') return 80
  if (sideA !== sideB) return 100
  return 50
}

/**
 * Haversine distance between two points in km.
 */
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/**
 * Calculate match compatibility score between two players.
 * Returns a score between 0 and 100.
 */
export function calculateMatchScore(
  playerA: PlayerForMatching,
  playerB: PlayerForMatching,
): MatchScoreResult {
  // 1. Level gap (40%) — 100 - |gap| × 20
  const levelGap = Math.abs(playerA.computed_level - playerB.computed_level)
  const levelScore = Math.max(0, 100 - levelGap * 20)

  // 2. Side compatibility (20%)
  const sideScore = getSideCompatibility(playerA.preferred_side, playerB.preferred_side)

  // 3. Geo proximity (15%) — 100 - distance × 2
  let geoScore = 50 // default if no location
  if (
    playerA.latitude != null && playerA.longitude != null &&
    playerB.latitude != null && playerB.longitude != null
  ) {
    const distKm = haversineDistance(
      playerA.latitude, playerA.longitude,
      playerB.latitude, playerB.longitude,
    )
    geoScore = Math.max(0, 100 - distKm * 2)
  }

  // 4. Common availability slots (15%)
  const availabilityScore = Math.min(100, playerB.availabilitySlots * 20)

  // 5. Reliability (10%)
  const reliabilityScore = playerB.reliability_score

  // Weighted total
  const totalScore = Math.round(
    levelScore * WEIGHTS.level +
    sideScore * WEIGHTS.side +
    geoScore * WEIGHTS.geo +
    availabilityScore * WEIGHTS.availability +
    reliabilityScore * WEIGHTS.reliability,
  )

  return {
    playerId: playerB.id,
    totalScore,
    levelScore: Math.round(levelScore),
    sideScore: Math.round(sideScore),
    geoScore: Math.round(geoScore),
    availabilityScore: Math.round(availabilityScore),
    reliabilityScore: Math.round(reliabilityScore),
  }
}

/**
 * Given 4 players, find the best team split that minimizes level difference.
 * Returns [team1, team2] where each team has 2 players.
 * Also applies side compatibility bonus within each team.
 */
export function suggestTeams(
  players: PlayerForMatching[],
): [PlayerForMatching[], PlayerForMatching[]] {
  if (players.length !== 4) {
    return [players.slice(0, 2), players.slice(2, 4)]
  }

  // 3 possible team combinations for 4 players (AB vs CD, AC vs BD, AD vs BC)
  const combinations: [number[], number[]][] = [
    [[0, 1], [2, 3]],
    [[0, 2], [1, 3]],
    [[0, 3], [1, 2]],
  ]

  let bestSplit = combinations[0]
  let bestScore = -Infinity

  for (const [t1Indices, t2Indices] of combinations) {
    const t1 = t1Indices.map((i) => players[i])
    const t2 = t2Indices.map((i) => players[i])

    const avgT1 = (t1[0].computed_level + t1[1].computed_level) / 2
    const avgT2 = (t2[0].computed_level + t2[1].computed_level) / 2
    const levelBalance = 100 - Math.abs(avgT1 - avgT2) * 20

    // Bonus for complementary sides within each team
    const sideBonus1 = getSideCompatibility(t1[0].preferred_side, t1[1].preferred_side)
    const sideBonus2 = getSideCompatibility(t2[0].preferred_side, t2[1].preferred_side)
    const sideAvg = (sideBonus1 + sideBonus2) / 2

    const score = levelBalance * 0.7 + sideAvg * 0.3

    if (score > bestScore) {
      bestScore = score
      bestSplit = [t1Indices, t2Indices]
    }
  }

  return [
    bestSplit[0].map((i) => players[i]),
    bestSplit[1].map((i) => players[i]),
  ]
}
