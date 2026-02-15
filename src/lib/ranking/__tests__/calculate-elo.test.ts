import { describe, it, expect } from 'vitest';
import {
  calculateEloChanges,
  type EloPlayer,
  type MatchResult,
} from '../calculate-elo';

// ── Helpers ──

function makePlayer(overrides: Partial<EloPlayer> = {}): EloPlayer {
  return {
    id: 'player-1',
    level_score: 5.0,
    total_matches: 20,
    team: 'A',
    ...overrides,
  };
}

function makeResult(overrides: Partial<MatchResult> = {}): MatchResult {
  return {
    winner_team: 'A',
    sets: [
      { score_a: 6, score_b: 3 },
      { score_a: 6, score_b: 4 },
    ],
    ...overrides,
  };
}

// ── K-factor ──

describe('K-factor dynamics', () => {
  it('new player (< 10 matches) gains more than experienced player', () => {
    const newPlayer = makePlayer({ id: 'new', total_matches: 3, team: 'A' });
    const expPlayer = makePlayer({ id: 'exp', total_matches: 50, team: 'A' });
    const opponent1 = makePlayer({ id: 'opp1', team: 'B' });
    const opponent2 = makePlayer({ id: 'opp2', team: 'B' });

    const result = makeResult({ winner_team: 'A' });

    const newResults = calculateEloChanges([newPlayer, opponent1], result);
    const expResults = calculateEloChanges([expPlayer, opponent2], result);

    const newGain = newResults.find((r) => r.player_id === 'new')!.change;
    const expGain = expResults.find((r) => r.player_id === 'exp')!.change;

    expect(newGain).toBeGreaterThan(expGain);
  });

  it('mid-range player (10-29 matches) has medium K-factor', () => {
    const midPlayer = makePlayer({ id: 'mid', total_matches: 15, team: 'A' });
    const newPlayer = makePlayer({ id: 'new', total_matches: 5, team: 'A' });
    const opponent1 = makePlayer({ id: 'opp1', team: 'B' });
    const opponent2 = makePlayer({ id: 'opp2', team: 'B' });

    const result = makeResult({ winner_team: 'A' });

    const midResults = calculateEloChanges([midPlayer, opponent1], result);
    const newResults = calculateEloChanges([newPlayer, opponent2], result);

    const midGain = midResults.find((r) => r.player_id === 'mid')!.change;
    const newGain = newResults.find((r) => r.player_id === 'new')!.change;

    expect(newGain).toBeGreaterThan(midGain);
    expect(midGain).toBeGreaterThan(0);
  });
});

// ── Margin multiplier ──

describe('Margin multiplier', () => {
  it('sweep (2-0) gives bigger change than close match', () => {
    const players = [
      makePlayer({ id: 'a1', team: 'A' }),
      makePlayer({ id: 'b1', team: 'B' }),
    ];

    const sweep = makeResult({
      winner_team: 'A',
      sets: [
        { score_a: 6, score_b: 1 },
        { score_a: 6, score_b: 0 },
      ],
    });

    const close = makeResult({
      winner_team: 'A',
      sets: [
        { score_a: 7, score_b: 6 },
        { score_a: 7, score_b: 5 },
      ],
    });

    const sweepResults = calculateEloChanges([...players], sweep);
    const closeResults = calculateEloChanges([...players], close);

    const sweepGain = sweepResults.find((r) => r.player_id === 'a1')!.change;
    const closeGain = closeResults.find((r) => r.player_id === 'a1')!.change;

    expect(sweepGain).toBeGreaterThan(closeGain);
  });

  it('domination bonus for large game difference (>=6)', () => {
    const players = [
      makePlayer({ id: 'a1', team: 'A' }),
      makePlayer({ id: 'b1', team: 'B' }),
    ];

    const domination = makeResult({
      winner_team: 'A',
      sets: [
        { score_a: 6, score_b: 0 },
        { score_a: 6, score_b: 0 },
      ],
    });

    const normal = makeResult({
      winner_team: 'A',
      sets: [
        { score_a: 6, score_b: 4 },
        { score_a: 6, score_b: 4 },
      ],
    });

    const domResults = calculateEloChanges([...players], domination);
    const normResults = calculateEloChanges([...players], normal);

    const domGain = domResults.find((r) => r.player_id === 'a1')!.change;
    const normGain = normResults.find((r) => r.player_id === 'a1')!.change;

    expect(domGain).toBeGreaterThan(normGain);
  });
});

// ── Level <-> ELO conversions (roundtrip) ──

describe('Level/ELO conversion roundtrip', () => {
  it('scores remain within [1.0, 10.0]', () => {
    const players = [
      makePlayer({ id: 'a1', level_score: 1.0, team: 'A' }),
      makePlayer({ id: 'b1', level_score: 10.0, team: 'B' }),
    ];

    const result = makeResult({ winner_team: 'B' });
    const results = calculateEloChanges(players, result);

    for (const r of results) {
      expect(r.new_score).toBeGreaterThanOrEqual(1.0);
      expect(r.new_score).toBeLessThanOrEqual(10.0);
    }
  });

  it('winner gains and loser loses (same level)', () => {
    const players = [
      makePlayer({ id: 'a1', level_score: 5.0, team: 'A' }),
      makePlayer({ id: 'b1', level_score: 5.0, team: 'B' }),
    ];

    const result = makeResult({ winner_team: 'A' });
    const results = calculateEloChanges(players, result);

    const winner = results.find((r) => r.player_id === 'a1')!;
    const loser = results.find((r) => r.player_id === 'b1')!;

    expect(winner.change).toBeGreaterThan(0);
    expect(loser.change).toBeLessThan(0);
  });
});

// ── Points conservation ──

describe('Points conservation', () => {
  it('total change roughly sums to zero (no ELO inflation)', () => {
    const players = [
      makePlayer({ id: 'a1', level_score: 5.0, total_matches: 20, team: 'A' }),
      makePlayer({ id: 'b1', level_score: 5.0, total_matches: 20, team: 'B' }),
    ];

    const result = makeResult({ winner_team: 'A' });
    const results = calculateEloChanges(players, result);

    const totalChange = results.reduce((sum, r) => sum + r.change, 0);
    // Due to rounding, allow small deviation
    expect(Math.abs(totalChange)).toBeLessThanOrEqual(0.2);
  });
});

// ── 2v2 matches ──

describe('2v2 matches', () => {
  it('handles 4 players (2v2) correctly', () => {
    const players = [
      makePlayer({ id: 'a1', level_score: 5.0, team: 'A' }),
      makePlayer({ id: 'a2', level_score: 6.0, team: 'A' }),
      makePlayer({ id: 'b1', level_score: 5.0, team: 'B' }),
      makePlayer({ id: 'b2', level_score: 4.0, team: 'B' }),
    ];

    const result = makeResult({ winner_team: 'A' });
    const results = calculateEloChanges(players, result);

    expect(results).toHaveLength(4);

    // All team A members should gain
    const teamAResults = results.filter((r) => r.player_id.startsWith('a'));
    for (const r of teamAResults) {
      expect(r.change).toBeGreaterThan(0);
    }

    // All team B members should lose
    const teamBResults = results.filter((r) => r.player_id.startsWith('b'));
    for (const r of teamBResults) {
      expect(r.change).toBeLessThan(0);
    }
  });

  it('underdog team winning gains more ELO', () => {
    const weakTeam = [
      makePlayer({ id: 'w1', level_score: 3.0, total_matches: 20, team: 'A' }),
      makePlayer({ id: 'w2', level_score: 3.0, total_matches: 20, team: 'A' }),
    ];
    const strongTeam = [
      makePlayer({ id: 's1', level_score: 7.0, total_matches: 20, team: 'B' }),
      makePlayer({ id: 's2', level_score: 7.0, total_matches: 20, team: 'B' }),
    ];

    // Underdog wins
    const underdogWin = calculateEloChanges(
      [...weakTeam, ...strongTeam],
      makeResult({ winner_team: 'A' }),
    );

    // Favorite wins
    const favoriteWin = calculateEloChanges(
      [...weakTeam, ...strongTeam],
      makeResult({ winner_team: 'B' }),
    );

    const underdogGain = underdogWin.find((r) => r.player_id === 'w1')!.change;
    const favoriteGain = favoriteWin.find((r) => r.player_id === 's1')!.change;

    // Underdog winning should gain more than favorite winning
    expect(underdogGain).toBeGreaterThan(favoriteGain);
  });
});

// ── Edge cases ──

describe('Edge cases', () => {
  it('handles level_score at boundaries (1.0 and 10.0)', () => {
    const players = [
      makePlayer({ id: 'a1', level_score: 1.0, team: 'A' }),
      makePlayer({ id: 'b1', level_score: 1.0, team: 'B' }),
    ];

    const result = makeResult({ winner_team: 'A' });
    const results = calculateEloChanges(players, result);

    for (const r of results) {
      expect(r.new_score).toBeGreaterThanOrEqual(1.0);
      expect(r.new_score).toBeLessThanOrEqual(10.0);
    }
  });

  it('handles 3-set match', () => {
    const players = [
      makePlayer({ id: 'a1', team: 'A' }),
      makePlayer({ id: 'b1', team: 'B' }),
    ];

    const result = makeResult({
      winner_team: 'A',
      sets: [
        { score_a: 6, score_b: 4 },
        { score_a: 3, score_b: 6 },
        { score_a: 7, score_b: 5 },
      ],
    });

    const results = calculateEloChanges(players, result);
    expect(results).toHaveLength(2);
    expect(results.find((r) => r.player_id === 'a1')!.change).toBeGreaterThan(0);
  });

  it('old_score is preserved in results', () => {
    const players = [
      makePlayer({ id: 'a1', level_score: 6.5, team: 'A' }),
      makePlayer({ id: 'b1', level_score: 4.2, team: 'B' }),
    ];

    const result = makeResult({ winner_team: 'A' });
    const results = calculateEloChanges(players, result);

    expect(results.find((r) => r.player_id === 'a1')!.old_score).toBe(6.5);
    expect(results.find((r) => r.player_id === 'b1')!.old_score).toBe(4.2);
  });
});
