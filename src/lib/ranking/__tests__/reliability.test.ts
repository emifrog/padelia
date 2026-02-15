import { describe, it, expect } from 'vitest';
import { calculateReliability, type ReliabilityInput } from '../reliability';

// ── Helpers ──

function makeInput(overrides: Partial<ReliabilityInput> = {}): ReliabilityInput {
  return {
    current_score: 0.85,
    total_matches: 20,
    event: 'played',
    ...overrides,
  };
}

// ── played events ──

describe('played event', () => {
  it('increases reliability score', () => {
    // Use fewer matches so weight is higher and delta survives rounding to 2 decimals
    const input = makeInput({ current_score: 0.85, total_matches: 1, event: 'played' });
    const result = calculateReliability(input);
    expect(result).toBeGreaterThan(0.85);
  });

  it('does not exceed 1.0', () => {
    const input = makeInput({ current_score: 0.99, event: 'played' });
    const result = calculateReliability(input);
    expect(result).toBeLessThanOrEqual(1.0);
  });

  it('new player gains more per played event', () => {
    const newPlayer = calculateReliability(makeInput({ total_matches: 1, event: 'played', current_score: 0.8 }));
    const expPlayer = calculateReliability(makeInput({ total_matches: 100, event: 'played', current_score: 0.8 }));
    expect(newPlayer).toBeGreaterThan(expPlayer);
  });
});

// ── no_show events ──

describe('no_show event', () => {
  it('decreases reliability score', () => {
    const input = makeInput({ current_score: 0.85, event: 'no_show' });
    const result = calculateReliability(input);
    expect(result).toBeLessThan(0.85);
  });

  it('does not go below 0', () => {
    const input = makeInput({ current_score: 0.01, event: 'no_show' });
    const result = calculateReliability(input);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('no_show penalty is stronger than cancelled_late', () => {
    const noShowResult = calculateReliability(makeInput({ current_score: 0.85, event: 'no_show' }));
    const cancelResult = calculateReliability(makeInput({ current_score: 0.85, event: 'cancelled_late' }));
    // no_show should result in lower score
    expect(noShowResult).toBeLessThan(cancelResult);
  });
});

// ── cancelled_late events ──

describe('cancelled_late event', () => {
  it('decreases reliability score moderately', () => {
    const input = makeInput({ current_score: 0.85, event: 'cancelled_late' });
    const result = calculateReliability(input);
    expect(result).toBeLessThan(0.85);
    // But less than no_show
    const noShowResult = calculateReliability(makeInput({ current_score: 0.85, event: 'no_show' }));
    expect(result).toBeGreaterThan(noShowResult);
  });
});

// ── confirmed events ──

describe('confirmed event', () => {
  it('does not change score', () => {
    const input = makeInput({ current_score: 0.85, event: 'confirmed' });
    const result = calculateReliability(input);
    expect(result).toBe(0.85);
  });
});

// ── Score bounds ──

describe('score bounds', () => {
  it('always returns score in [0, 1] range', () => {
    const events: ReliabilityInput['event'][] = ['played', 'no_show', 'cancelled_late', 'confirmed'];
    const scores = [0, 0.01, 0.5, 0.99, 1.0];

    for (const event of events) {
      for (const score of scores) {
        const result = calculateReliability(makeInput({ current_score: score, event }));
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(1);
      }
    }
  });

  it('handles edge case: score starts at 0', () => {
    // Use few matches so the played delta (weight*0.02) is large enough to survive rounding
    const playedResult = calculateReliability(makeInput({ current_score: 0, total_matches: 1, event: 'played' }));
    expect(playedResult).toBeGreaterThan(0);

    const noShowResult = calculateReliability(makeInput({ current_score: 0, event: 'no_show' }));
    expect(noShowResult).toBe(0);
  });

  it('handles edge case: score starts at 1', () => {
    const playedResult = calculateReliability(makeInput({ current_score: 1, event: 'played' }));
    expect(playedResult).toBeLessThanOrEqual(1);

    const noShowResult = calculateReliability(makeInput({ current_score: 1, event: 'no_show' }));
    expect(noShowResult).toBeLessThan(1);
  });
});

// ── Weight dynamics ──

describe('weight dynamics', () => {
  it('weight decreases as total_matches increases', () => {
    const fewMatches = calculateReliability(makeInput({ total_matches: 5, event: 'no_show', current_score: 0.85 }));
    const manyMatches = calculateReliability(makeInput({ total_matches: 100, event: 'no_show', current_score: 0.85 }));
    // More matches = less penalty per event
    expect(fewMatches).toBeLessThan(manyMatches);
  });

  it('weight has a minimum floor (0.05)', () => {
    // Even with many matches, weight should still have effect
    const result = calculateReliability(makeInput({ total_matches: 10000, event: 'no_show', current_score: 0.85 }));
    expect(result).toBeLessThan(0.85);
  });

  it('handles total_matches = 0', () => {
    const result = calculateReliability(makeInput({ total_matches: 0, event: 'played', current_score: 0.5 }));
    expect(result).toBeGreaterThan(0.5);
    expect(result).toBeLessThanOrEqual(1);
  });
});

// ── Result precision ──

describe('result precision', () => {
  it('returns result rounded to 2 decimal places', () => {
    const result = calculateReliability(makeInput({ current_score: 0.853, event: 'played' }));
    const decimals = result.toString().split('.')[1]?.length ?? 0;
    expect(decimals).toBeLessThanOrEqual(2);
  });
});
