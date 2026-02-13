/**
 * ELO Rating System for Padelia
 *
 * Based on standard ELO with padel-specific adjustments:
 * - K-factor varies by matches played (new players adjust faster)
 * - Score margin bonus for dominant wins
 * - Level updates clamped to [1.0, 10.0] range
 */

const BASE_K = 32
const MIN_LEVEL = 1.0
const MAX_LEVEL = 10.0

/**
 * Get K-factor based on player experience.
 * New players (< 10 matches) have higher K for faster calibration.
 */
function getKFactor(matchesPlayed: number): number {
  if (matchesPlayed < 10) return BASE_K * 1.5 // 48
  if (matchesPlayed < 30) return BASE_K        // 32
  return BASE_K * 0.75                          // 24
}

/**
 * Calculate score margin multiplier.
 * Blowout wins give slightly more rating change.
 * Returns 1.0 - 1.3 depending on score difference.
 */
function getMarginMultiplier(
  winnerSetsWon: number,
  loserSetsWon: number,
  winnerGames: number,
  loserGames: number,
): number {
  // Clean sweep (2-0): small bonus
  const setSweep = loserSetsWon === 0 ? 0.1 : 0
  // Game domination bonus
  const totalGames = winnerGames + loserGames
  const gameDominance = totalGames > 0
    ? Math.max(0, (winnerGames - loserGames) / totalGames) * 0.2
    : 0

  return 1.0 + setSweep + gameDominance
}

/**
 * Convert level (1-10) to ELO points for calculation.
 * Level 1 = ~800, Level 5 = ~1400, Level 10 = ~2200
 */
function levelToElo(level: number): number {
  return 400 + (level - 1) * 200
}

export interface EloMatchResult {
  /** Set scores as [team1, team2] per set */
  sets: Array<{ team1: number; team2: number }>
  /** 1 or 2 */
  winnerTeam: 1 | 2
}

export interface EloPlayerInput {
  playerId: string
  team: 1 | 2
  currentLevel: number
  matchesPlayed: number
}

export interface EloPlayerResult {
  playerId: string
  oldLevel: number
  newLevel: number
  ratingChange: number
}

/**
 * Calculate new ELO ratings for all players after a match.
 */
export function calculateEloChanges(
  players: EloPlayerInput[],
  result: EloMatchResult,
): EloPlayerResult[] {
  const { sets, winnerTeam } = result
  const loserTeam = winnerTeam === 1 ? 2 : 1

  // Calculate aggregate scores
  let winnerSetsWon = 0
  let loserSetsWon = 0
  let winnerGames = 0
  let loserGames = 0

  for (const s of sets) {
    const w = winnerTeam === 1 ? s.team1 : s.team2
    const l = winnerTeam === 1 ? s.team2 : s.team1

    if (w > l) winnerSetsWon++
    else if (l > w) loserSetsWon++

    winnerGames += w
    loserGames += l
  }

  const marginMultiplier = getMarginMultiplier(winnerSetsWon, loserSetsWon, winnerGames, loserGames)

  // Calculate average team levels
  const winnersTeam = players.filter((p) => p.team === winnerTeam)
  const losersTeam = players.filter((p) => p.team === loserTeam)

  const avgWinnerLevel = winnersTeam.reduce((s, p) => s + p.currentLevel, 0) / (winnersTeam.length || 1)
  const avgLoserLevel = losersTeam.reduce((s, p) => s + p.currentLevel, 0) / (losersTeam.length || 1)

  const avgWinnerElo = levelToElo(avgWinnerLevel)
  const avgLoserElo = levelToElo(avgLoserLevel)

  // Expected outcomes (ELO formula)
  const expectedWinner = 1 / (1 + Math.pow(10, (avgLoserElo - avgWinnerElo) / 400))
  const expectedLoser = 1 - expectedWinner

  return players.map((player) => {
    const k = getKFactor(player.matchesPlayed)
    const isWinner = player.team === winnerTeam
    const actual = isWinner ? 1 : 0
    const expected = isWinner ? expectedWinner : expectedLoser

    // Base rating change
    let change = k * (actual - expected)

    // Apply margin multiplier only to winners (amplifies gains, not losses)
    if (isWinner) {
      change *= marginMultiplier
    }

    // Convert to level change (ELO points / 200 = level)
    const levelChange = Math.round((change / 200) * 10) / 10

    const oldLevel = player.currentLevel
    const newLevel = Math.round(
      Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, oldLevel + levelChange)) * 10,
    ) / 10

    return {
      playerId: player.playerId,
      oldLevel,
      newLevel,
      ratingChange: Math.round((newLevel - oldLevel) * 10) / 10,
    }
  })
}

/**
 * Determine tier based on level.
 */
export function getTierFromLevel(level: number): 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' {
  if (level >= 8) return 'diamond'
  if (level >= 6.5) return 'platinum'
  if (level >= 5) return 'gold'
  if (level >= 3.5) return 'silver'
  return 'bronze'
}
