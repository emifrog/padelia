/**
 * Reliability Score System
 *
 * Starts at 100. Deducted for:
 * - No-show (didn't accept/was in match and it was cancelled): -15
 * - Late cancellation (< 24h before match): -10
 * - Normal cancellation (> 24h before match): -3
 *
 * Recovered for:
 * - Completed match: +2 (capped at 100)
 * - Showing up consistently over 10 matches: bonus +5
 */

const MAX_RELIABILITY = 100
const MIN_RELIABILITY = 0

const PENALTY_NO_SHOW = -15
const PENALTY_LATE_CANCEL = -10
const PENALTY_NORMAL_CANCEL = -3

const BONUS_COMPLETED = 2
const BONUS_CONSISTENCY_THRESHOLD = 10
const BONUS_CONSISTENCY = 5

/**
 * Calculate reliability change after a match event.
 */
export function calculateReliabilityChange(
  event: 'completed' | 'no_show' | 'late_cancel' | 'normal_cancel',
  currentReliability: number,
  consecutiveCompleted: number,
): number {
  let change = 0

  switch (event) {
    case 'completed':
      change = BONUS_COMPLETED
      // Consistency bonus
      if (consecutiveCompleted > 0 && consecutiveCompleted % BONUS_CONSISTENCY_THRESHOLD === 0) {
        change += BONUS_CONSISTENCY
      }
      break
    case 'no_show':
      change = PENALTY_NO_SHOW
      break
    case 'late_cancel':
      change = PENALTY_LATE_CANCEL
      break
    case 'normal_cancel':
      change = PENALTY_NORMAL_CANCEL
      break
  }

  const newScore = Math.max(MIN_RELIABILITY, Math.min(MAX_RELIABILITY, currentReliability + change))
  return Math.round((newScore - currentReliability) * 10) / 10
}

/**
 * Determine if a cancellation is "late" (< 24h before match).
 */
export function isLateCancellation(scheduledAt: string): boolean {
  const matchDate = new Date(scheduledAt)
  const now = new Date()
  const hoursUntilMatch = (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60)
  return hoursUntilMatch < 24
}
