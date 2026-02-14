// ============================================================
// Système ELO adapté au Padel
// K-factor dynamique, bonus marge de victoire
// Score 1.0–10.0, facteur K base = 0.5 (CLAUDE.md)
// ============================================================

export interface EloPlayer {
  id: string;
  level_score: number;
  total_matches: number;
  team: 'A' | 'B';
}

export interface MatchResult {
  winner_team: 'A' | 'B';
  sets: Array<{ score_a: number; score_b: number }>;
}

export interface EloPlayerResult {
  player_id: string;
  old_score: number;
  new_score: number;
  change: number;
}

/**
 * K-factor dynamique:
 * - Peu de matchs (< 10) → K élevé (apprentissage rapide)
 * - Joueur confirmé (30+) → K faible (stabilité)
 */
function getKFactor(matchesPlayed: number): number {
  if (matchesPlayed < 10) return 0.8;
  if (matchesPlayed < 30) return 0.5;
  return 0.3;
}

/**
 * Multiplicateur de marge de victoire
 * Sweep (2-0 avec gros écart) → bonus important
 */
function getMarginMultiplier(sets: Array<{ score_a: number; score_b: number }>, winnerTeam: 'A' | 'B'): number {
  let setsWon = 0;
  let totalGameDiff = 0;

  for (const set of sets) {
    const diff = winnerTeam === 'A' ? set.score_a - set.score_b : set.score_b - set.score_a;
    if (diff > 0) setsWon++;
    totalGameDiff += diff;
  }

  // Sweep bonus (2-0 ou 3-0)
  const totalSetsPlayed = sets.filter((s) => s.score_a > 0 || s.score_b > 0).length;
  const isSweep = setsWon === totalSetsPlayed;

  let multiplier = 1.0;
  if (isSweep) multiplier += 0.2;
  if (totalGameDiff >= 6) multiplier += 0.15; // Domination
  if (totalGameDiff >= 10) multiplier += 0.1; // Écrasement

  return Math.min(multiplier, 1.5); // Cap à 1.5x
}

/**
 * Conversion level ↔ ELO interne
 * Level 1.0 = ELO 400, Level 10.0 = ELO 2200
 */
function levelToElo(level: number): number {
  return 400 + (level - 1) * 200;
}

function eloToLevel(elo: number): number {
  const level = 1 + (elo - 400) / 200;
  return Math.round(Math.max(1.0, Math.min(10.0, level)) * 10) / 10;
}

/**
 * Calcule les changements ELO pour tous les joueurs d'un match
 */
export function calculateEloChanges(
  players: EloPlayer[],
  result: MatchResult,
): EloPlayerResult[] {
  const teamA = players.filter((p) => p.team === 'A');
  const teamB = players.filter((p) => p.team === 'B');

  // Average ELO par équipe
  const avgEloA = teamA.reduce((s, p) => s + levelToElo(p.level_score), 0) / (teamA.length || 1);
  const avgEloB = teamB.reduce((s, p) => s + levelToElo(p.level_score), 0) / (teamB.length || 1);

  // Expected score (probabilité de victoire)
  const expectedA = 1 / (1 + Math.pow(10, (avgEloB - avgEloA) / 400));
  const expectedB = 1 - expectedA;

  // Actual scores
  const actualA = result.winner_team === 'A' ? 1 : 0;
  const actualB = result.winner_team === 'B' ? 1 : 0;

  // Margin multiplier
  const marginMult = getMarginMultiplier(result.sets, result.winner_team);

  const results: EloPlayerResult[] = [];

  for (const player of players) {
    const k = getKFactor(player.total_matches);
    const expected = player.team === 'A' ? expectedA : expectedB;
    const actual = player.team === 'A' ? actualA : actualB;

    const eloChange = k * marginMult * (actual - expected);
    const oldScore = player.level_score;
    const newScore = eloToLevel(levelToElo(oldScore) + eloChange * 200);

    results.push({
      player_id: player.id,
      old_score: oldScore,
      new_score: newScore,
      change: Math.round((newScore - oldScore) * 10) / 10,
    });
  }

  return results;
}
