import { describe, it, expect } from 'vitest';
import {
  nextPowerOf2,
  calculateTotalRounds,
  advanceWinner,
  generateSingleEliminationBracket,
  getRoundLabel,
  type TeamSeed,
} from '../bracket-generator';

describe('nextPowerOf2', () => {
  it('returns 2 for input 1', () => {
    expect(nextPowerOf2(1)).toBe(2);
  });

  it('returns 4 for input 4', () => {
    expect(nextPowerOf2(4)).toBe(4);
  });

  it('returns 8 for input 5', () => {
    expect(nextPowerOf2(5)).toBe(8);
  });

  it('returns 8 for input 7', () => {
    expect(nextPowerOf2(7)).toBe(8);
  });

  it('returns 8 for input 8', () => {
    expect(nextPowerOf2(8)).toBe(8);
  });

  it('returns 16 for input 9', () => {
    expect(nextPowerOf2(9)).toBe(16);
  });

  it('returns 2 for input 2', () => {
    expect(nextPowerOf2(2)).toBe(2);
  });

  it('returns 4 for input 3', () => {
    expect(nextPowerOf2(3)).toBe(4);
  });
});

describe('calculateTotalRounds', () => {
  it('returns 1 for 2 slots', () => {
    expect(calculateTotalRounds(2)).toBe(1);
  });

  it('returns 2 for 4 slots', () => {
    expect(calculateTotalRounds(4)).toBe(2);
  });

  it('returns 3 for 8 slots', () => {
    expect(calculateTotalRounds(8)).toBe(3);
  });

  it('returns 4 for 16 slots', () => {
    expect(calculateTotalRounds(16)).toBe(4);
  });

  it('returns 5 for 32 slots', () => {
    expect(calculateTotalRounds(32)).toBe(5);
  });
});

describe('advanceWinner', () => {
  it('round 1 position 1 → round 2 position 1', () => {
    expect(advanceWinner(1, 1, 3)).toEqual({ round: 2, position: 1 });
  });

  it('round 1 position 2 → round 2 position 1', () => {
    expect(advanceWinner(1, 2, 3)).toEqual({ round: 2, position: 1 });
  });

  it('round 1 position 3 → round 2 position 2', () => {
    expect(advanceWinner(1, 3, 3)).toEqual({ round: 2, position: 2 });
  });

  it('round 1 position 4 → round 2 position 2', () => {
    expect(advanceWinner(1, 4, 3)).toEqual({ round: 2, position: 2 });
  });

  it('round 2 position 1 → round 3 position 1', () => {
    expect(advanceWinner(2, 1, 3)).toEqual({ round: 3, position: 1 });
  });

  it('final round returns null', () => {
    expect(advanceWinner(3, 1, 3)).toBeNull();
  });

  it('round 2 position 2 → round 3 position 1', () => {
    expect(advanceWinner(2, 2, 3)).toEqual({ round: 3, position: 1 });
  });
});

describe('generateSingleEliminationBracket', () => {
  const makeTeams = (count: number, seeded = 0): TeamSeed[] =>
    Array.from({ length: count }, (_, i) => ({
      team_id: `team-${i + 1}`,
      seed: i < seeded ? i + 1 : null,
    }));

  it('throws for less than 2 teams', () => {
    expect(() => generateSingleEliminationBracket([{ team_id: 't1', seed: null }])).toThrow(
      'Minimum 2 equipes',
    );
  });

  it('throws for empty array', () => {
    expect(() => generateSingleEliminationBracket([])).toThrow('Minimum 2 equipes');
  });

  it('generates 1 match for 2 teams', () => {
    const teams: TeamSeed[] = [
      { team_id: 'team-1', seed: 1 },
      { team_id: 'team-2', seed: 2 },
    ];
    const bracket = generateSingleEliminationBracket(teams);
    // 2 slots, 1 round, 1 match
    expect(bracket).toHaveLength(1);
    expect(bracket[0].round).toBe(1);
    expect(bracket[0].position).toBe(1);
    expect(bracket[0].team_a_id).toBe('team-1');
    expect(bracket[0].team_b_id).toBe('team-2');
    expect(bracket[0].status).toBe('pending');
    expect(bracket[0].next_bracket_position).toBeNull();
  });

  it('generates 3 matches for 4 teams (2 round 1 + 1 final)', () => {
    const teams = makeTeams(4);
    const bracket = generateSingleEliminationBracket(teams);
    expect(bracket).toHaveLength(3);

    const round1 = bracket.filter((b) => b.round === 1);
    const round2 = bracket.filter((b) => b.round === 2);
    expect(round1).toHaveLength(2);
    expect(round2).toHaveLength(1);

    // All round 1 matches have both teams
    expect(round1.every((m) => m.team_a_id !== null && m.team_b_id !== null)).toBe(true);
    // Final has no teams yet
    expect(round2[0].team_a_id).toBeNull();
    expect(round2[0].team_b_id).toBeNull();
  });

  it('generates 7 matches for 8 teams (4 + 2 + 1)', () => {
    const teams = makeTeams(8);
    const bracket = generateSingleEliminationBracket(teams);
    expect(bracket).toHaveLength(7);

    expect(bracket.filter((b) => b.round === 1)).toHaveLength(4);
    expect(bracket.filter((b) => b.round === 2)).toHaveLength(2);
    expect(bracket.filter((b) => b.round === 3)).toHaveLength(1);
  });

  it('handles 5 teams with 3 byes (8 slots)', () => {
    const teams = makeTeams(5, 5); // all seeded for determinism
    const bracket = generateSingleEliminationBracket(teams);
    // 8 slots → 4 round 1 + 2 round 2 + 1 final = 7
    expect(bracket).toHaveLength(7);

    const byes = bracket.filter((b) => b.status === 'bye');
    expect(byes).toHaveLength(3); // 8 - 5 = 3 byes

    // Each bye has exactly one team (the other is null)
    for (const bye of byes) {
      const hasA = bye.team_a_id !== null;
      const hasB = bye.team_b_id !== null;
      expect(hasA !== hasB).toBe(true);
    }

    // Check that bye teams advance to round 2
    const round2 = bracket.filter((b) => b.round === 2);
    const filledSlots = round2.reduce((sum, m) => {
      return sum + (m.team_a_id ? 1 : 0) + (m.team_b_id ? 1 : 0);
    }, 0);
    expect(filledSlots).toBe(3); // 3 byes = 3 auto-advanced teams
  });

  it('handles 6 teams with 2 byes (8 slots)', () => {
    const teams = makeTeams(6, 6); // all seeded for determinism
    const bracket = generateSingleEliminationBracket(teams);
    // 8 slots → 7 matches
    expect(bracket).toHaveLength(7);

    const byes = bracket.filter((b) => b.status === 'bye');
    expect(byes).toHaveLength(2); // 8 - 6 = 2 byes
  });

  it('seed 1 and seed 2 are on opposite sides of the bracket', () => {
    const teams: TeamSeed[] = [
      { team_id: 'seed-1', seed: 1 },
      { team_id: 'seed-2', seed: 2 },
      { team_id: 'seed-3', seed: 3 },
      { team_id: 'seed-4', seed: 4 },
    ];
    const bracket = generateSingleEliminationBracket(teams);
    const round1 = bracket.filter((b) => b.round === 1);

    // With standard seeding: seed 1 vs seed 4, seed 3 vs seed 2
    // Seed 1 is in match 1
    const match1Teams = [round1[0].team_a_id, round1[0].team_b_id];
    expect(match1Teams).toContain('seed-1');
    // Seed 2 is in match 2 (not in match 1)
    const match2Teams = [round1[1].team_a_id, round1[1].team_b_id];
    expect(match2Teams).toContain('seed-2');
  });

  it('all round 1 matches point to correct next positions', () => {
    const teams = makeTeams(8);
    const bracket = generateSingleEliminationBracket(teams);
    const round1 = bracket.filter((b) => b.round === 1);

    expect(round1[0].next_bracket_position).toEqual({ round: 2, position: 1 });
    expect(round1[1].next_bracket_position).toEqual({ round: 2, position: 1 });
    expect(round1[2].next_bracket_position).toEqual({ round: 2, position: 2 });
    expect(round1[3].next_bracket_position).toEqual({ round: 2, position: 2 });
  });

  it('final match has null next_bracket_position', () => {
    const teams = makeTeams(4);
    const bracket = generateSingleEliminationBracket(teams);
    const final = bracket.find((b) => b.round === 2);
    expect(final?.next_bracket_position).toBeNull();
  });

  it('handles 16 teams correctly', () => {
    const teams = makeTeams(16);
    const bracket = generateSingleEliminationBracket(teams);
    // 16 slots → 8 + 4 + 2 + 1 = 15
    expect(bracket).toHaveLength(15);
    expect(bracket.filter((b) => b.round === 1)).toHaveLength(8);
    expect(bracket.filter((b) => b.round === 2)).toHaveLength(4);
    expect(bracket.filter((b) => b.round === 3)).toHaveLength(2);
    expect(bracket.filter((b) => b.round === 4)).toHaveLength(1);
  });

  it('no byes when team count is a power of 2', () => {
    const teams = makeTeams(8);
    const bracket = generateSingleEliminationBracket(teams);
    const byes = bracket.filter((b) => b.status === 'bye');
    expect(byes).toHaveLength(0);
  });
});

describe('getRoundLabel', () => {
  it('returns Finale for last round', () => {
    expect(getRoundLabel(3, 3)).toBe('Finale');
    expect(getRoundLabel(4, 4)).toBe('Finale');
  });

  it('returns Demi-finales for second to last', () => {
    expect(getRoundLabel(2, 3)).toBe('Demi-finales');
    expect(getRoundLabel(3, 4)).toBe('Demi-finales');
  });

  it('returns Quarts de finale for third to last', () => {
    expect(getRoundLabel(2, 4)).toBe('Quarts de finale');
  });

  it('returns Huitiemes de finale for fourth to last', () => {
    expect(getRoundLabel(1, 4)).toBe('Huitiemes de finale');
  });

  it('returns Tour N for earlier rounds', () => {
    expect(getRoundLabel(1, 6)).toBe('Tour 1');
  });
});
