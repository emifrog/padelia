// ============================================================
// Bracket Generator — Pure functions for single elimination
// ============================================================

export interface TeamSeed {
  team_id: string;
  seed: number | null;
}

export interface BracketEntry {
  round: number;
  position: number;
  team_a_id: string | null;
  team_b_id: string | null;
  status: 'pending' | 'bye';
  next_bracket_position: { round: number; position: number } | null;
}

/**
 * Round up to the next power of 2.
 * 4 → 4, 5 → 8, 7 → 8, 9 → 16
 */
export function nextPowerOf2(n: number): number {
  if (n <= 1) return 2;
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/**
 * Number of rounds for a given number of total slots.
 * 4 → 2, 8 → 3, 16 → 4
 */
export function calculateTotalRounds(totalSlots: number): number {
  return Math.log2(totalSlots);
}

/**
 * Given the current round/position, return the next bracket match position.
 * Returns null if this is the final.
 */
export function advanceWinner(
  round: number,
  position: number,
  totalRounds: number,
): { round: number; position: number } | null {
  if (round >= totalRounds) return null;
  return {
    round: round + 1,
    position: Math.ceil(position / 2),
  };
}

/**
 * Generate standard seeding order for a bracket.
 * For 8 slots: [1, 8, 5, 4, 3, 6, 7, 2]
 * This ensures top seeds are spread apart and meet late.
 */
function generateSeedOrder(size: number): number[] {
  if (size === 1) return [1];
  const half = generateSeedOrder(size / 2);
  const result: number[] = [];
  for (const seed of half) {
    result.push(seed);
    result.push(size + 1 - seed);
  }
  return result;
}

/**
 * Generate a full single elimination bracket.
 *
 * Algorithm:
 * 1. Calculate total slots (next power of 2)
 * 2. Sort teams: seeded first (by seed ASC), then unseeded
 * 3. Place teams using standard seeding positions (top seeds spread apart)
 * 4. Byes: positions without a team (one side null)
 * 5. Generate all rounds
 */
export function generateSingleEliminationBracket(
  teams: TeamSeed[],
): BracketEntry[] {
  if (teams.length < 2) {
    throw new Error('Minimum 2 equipes pour generer un bracket');
  }

  const totalSlots = nextPowerOf2(teams.length);
  const totalRounds = calculateTotalRounds(totalSlots);
  const round1Matches = totalSlots / 2;

  // Sort: seeded teams first (by seed ASC), then unseeded
  const seeded = teams
    .filter((t) => t.seed !== null)
    .sort((a, b) => (a.seed ?? 0) - (b.seed ?? 0));

  const unseeded = teams.filter((t) => t.seed === null);

  // Shuffle unseeded teams (Fisher-Yates)
  for (let i = unseeded.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unseeded[i], unseeded[j]] = [unseeded[j], unseeded[i]];
  }

  // Assign seeds to all teams (seeded keep theirs, unseeded get sequential after)
  const allTeams: TeamSeed[] = [
    ...seeded,
    ...unseeded.map((t, i) => ({ ...t, seed: seeded.length + i + 1 })),
  ];

  // Generate standard seeding order
  const seedOrder = generateSeedOrder(totalSlots);

  // Map seed positions to teams (null if no team for that seed)
  const slots: (string | null)[] = seedOrder.map((seedNum) => {
    const team = allTeams.find((t) => t.seed === seedNum);
    return team?.team_id ?? null;
  });

  const entries: BracketEntry[] = [];

  // Generate round 1
  for (let pos = 1; pos <= round1Matches; pos++) {
    const slotA = slots[(pos - 1) * 2];
    const slotB = slots[(pos - 1) * 2 + 1];
    const hasOnlyOne = (slotA === null) !== (slotB === null);

    entries.push({
      round: 1,
      position: pos,
      team_a_id: slotA,
      team_b_id: slotB,
      status: hasOnlyOne ? 'bye' : 'pending',
      next_bracket_position: advanceWinner(1, pos, totalRounds),
    });

    // Skip matches where both are null (shouldn't happen with proper seeding)
    // They stay as 'pending' and will be resolved when teams advance
  }

  // Generate later rounds (empty, to be filled as winners advance)
  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = totalSlots / Math.pow(2, round);
    for (let pos = 1; pos <= matchesInRound; pos++) {
      entries.push({
        round,
        position: pos,
        team_a_id: null,
        team_b_id: null,
        status: 'pending',
        next_bracket_position: advanceWinner(round, pos, totalRounds),
      });
    }
  }

  // For byes, auto-fill the next round with the non-null team
  for (const entry of entries) {
    if (entry.status === 'bye' && entry.next_bracket_position) {
      const advancingTeam = entry.team_a_id ?? entry.team_b_id;
      if (!advancingTeam) continue;

      const nextEntry = entries.find(
        (e) =>
          e.round === entry.next_bracket_position!.round &&
          e.position === entry.next_bracket_position!.position,
      );

      if (nextEntry) {
        // Odd position → fills team_a, even position → fills team_b
        if (entry.position % 2 === 1) {
          nextEntry.team_a_id = advancingTeam;
        } else {
          nextEntry.team_b_id = advancingTeam;
        }
      }
    }
  }

  return entries;
}

/**
 * Get the round label in French.
 */
export function getRoundLabel(round: number, totalRounds: number): string {
  const roundsFromEnd = totalRounds - round;
  switch (roundsFromEnd) {
    case 0:
      return 'Finale';
    case 1:
      return 'Demi-finales';
    case 2:
      return 'Quarts de finale';
    case 3:
      return 'Huitiemes de finale';
    default:
      return `Tour ${round}`;
  }
}
