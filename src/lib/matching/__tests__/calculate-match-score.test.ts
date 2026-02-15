import { describe, it, expect } from 'vitest';
import {
  haversineDistance,
  calculateMatchScore,
  type PlayerForMatching,
} from '../calculate-match-score';

// ── Helpers ──

function makePlayer(overrides: Partial<PlayerForMatching> = {}): PlayerForMatching {
  return {
    id: 'player-1',
    level_score: 5.0,
    preferred_side: 'droite',
    reliability_score: 0.9,
    latitude: 48.8566, // Paris
    longitude: 2.3522,
    availability: {
      lundi: ['18:00-20:00'],
      mercredi: ['18:00-20:00'],
    },
    ...overrides,
  };
}

// ── haversineDistance ──

describe('haversineDistance', () => {
  it('returns 0 for the same point', () => {
    const d = haversineDistance(48.8566, 2.3522, 48.8566, 2.3522);
    expect(d).toBe(0);
  });

  it('computes Paris → Lyon ≈ 392 km', () => {
    // Paris: 48.8566, 2.3522 — Lyon: 45.7640, 4.8357
    const d = haversineDistance(48.8566, 2.3522, 45.764, 4.8357);
    expect(d).toBeGreaterThan(380);
    expect(d).toBeLessThan(410);
  });

  it('computes Paris → Marseille ≈ 660 km', () => {
    const d = haversineDistance(48.8566, 2.3522, 43.2965, 5.3698);
    expect(d).toBeGreaterThan(640);
    expect(d).toBeLessThan(680);
  });

  it('is commutative (A→B = B→A)', () => {
    const ab = haversineDistance(48.8566, 2.3522, 45.764, 4.8357);
    const ba = haversineDistance(45.764, 4.8357, 48.8566, 2.3522);
    expect(ab).toBeCloseTo(ba, 6);
  });

  it('handles equator distance correctly', () => {
    // 1 degree of longitude at equator ≈ 111.32 km
    const d = haversineDistance(0, 0, 0, 1);
    expect(d).toBeGreaterThan(110);
    expect(d).toBeLessThan(113);
  });
});

// ── calculateMatchScore ──

describe('calculateMatchScore', () => {
  it('returns total_score between 0 and 100', () => {
    const current = makePlayer();
    const candidate = makePlayer({ id: 'candidate-1' });
    const result = calculateMatchScore(current, candidate);
    expect(result.total_score).toBeGreaterThanOrEqual(0);
    expect(result.total_score).toBeLessThanOrEqual(100);
  });

  it('returns perfect position score for complementary sides (gauche + droite)', () => {
    const current = makePlayer({ preferred_side: 'gauche' });
    const candidate = makePlayer({ id: 'candidate-1', preferred_side: 'droite' });
    const result = calculateMatchScore(current, candidate);
    expect(result.breakdown.position).toBe(100);
  });

  it('returns 50 for same side (both droite)', () => {
    const current = makePlayer({ preferred_side: 'droite' });
    const candidate = makePlayer({ id: 'candidate-1', preferred_side: 'droite' });
    const result = calculateMatchScore(current, candidate);
    expect(result.breakdown.position).toBe(50);
  });

  it('returns 70 for les_deux + les_deux', () => {
    const current = makePlayer({ preferred_side: 'les_deux' });
    const candidate = makePlayer({ id: 'candidate-1', preferred_side: 'les_deux' });
    const result = calculateMatchScore(current, candidate);
    expect(result.breakdown.position).toBe(70);
  });

  it('returns 80 when one side is les_deux', () => {
    const current = makePlayer({ preferred_side: 'gauche' });
    const candidate = makePlayer({ id: 'candidate-1', preferred_side: 'les_deux' });
    const result = calculateMatchScore(current, candidate);
    expect(result.breakdown.position).toBe(80);
  });

  it('gives proximity 0 when candidate is far away', () => {
    const current = makePlayer({ latitude: 48.8566, longitude: 2.3522 }); // Paris
    const candidate = makePlayer({
      id: 'candidate-1',
      latitude: 43.2965,
      longitude: 5.3698, // Marseille (~660km)
    });
    const result = calculateMatchScore(current, candidate, 30);
    expect(result.breakdown.proximity).toBe(0);
  });

  it('gives proximity > 0 when candidate is nearby', () => {
    const current = makePlayer({ latitude: 48.8566, longitude: 2.3522 }); // Paris
    const candidate = makePlayer({
      id: 'candidate-1',
      latitude: 48.86,
      longitude: 2.36, // ~1km away
    });
    const result = calculateMatchScore(current, candidate, 30);
    expect(result.breakdown.proximity).toBeGreaterThan(90);
  });

  it('gives proximity 0 when coordinates are null', () => {
    const current = makePlayer({ latitude: null, longitude: null });
    const candidate = makePlayer({ id: 'candidate-1', latitude: 48.86, longitude: 2.36 });
    const result = calculateMatchScore(current, candidate);
    expect(result.breakdown.proximity).toBe(0);
  });

  it('gives proximity 0 when candidate coordinates are null', () => {
    const current = makePlayer({ latitude: 48.8566, longitude: 2.3522 });
    const candidate = makePlayer({ id: 'candidate-1', latitude: null, longitude: null });
    const result = calculateMatchScore(current, candidate);
    expect(result.breakdown.proximity).toBe(0);
  });

  it('gives perfect level score when same level', () => {
    const current = makePlayer({ level_score: 5.0 });
    const candidate = makePlayer({ id: 'candidate-1', level_score: 5.0 });
    const result = calculateMatchScore(current, candidate);
    expect(result.breakdown.level).toBe(100);
  });

  it('gives lower level score for big level difference', () => {
    const current = makePlayer({ level_score: 2.0 });
    const candidate = makePlayer({ id: 'candidate-1', level_score: 8.0 });
    const result = calculateMatchScore(current, candidate);
    // diff = 6, (1 - 6/5) = -0.2 => clamped to 0
    expect(result.breakdown.level).toBe(0);
  });

  it('gives availability score for common slots', () => {
    const current = makePlayer({
      availability: { lundi: ['18:00-20:00'], mercredi: ['18:00-20:00'] },
    });
    const candidate = makePlayer({
      id: 'candidate-1',
      availability: { lundi: ['18:00-20:00'], jeudi: ['20:00-22:00'] },
    });
    const result = calculateMatchScore(current, candidate);
    // 1 common slot × 20 = 20
    expect(result.breakdown.availability).toBe(20);
  });

  it('gives 0 availability for no common slots', () => {
    const current = makePlayer({
      availability: { lundi: ['08:00-10:00'] },
    });
    const candidate = makePlayer({
      id: 'candidate-1',
      availability: { mardi: ['18:00-20:00'] },
    });
    const result = calculateMatchScore(current, candidate);
    expect(result.breakdown.availability).toBe(0);
  });

  it('caps availability score at 100', () => {
    const current = makePlayer({
      availability: {
        lundi: ['08:00-10:00', '10:00-12:00', '14:00-16:00'],
        mardi: ['08:00-10:00', '10:00-12:00', '14:00-16:00'],
      },
    });
    const candidate = makePlayer({
      id: 'candidate-1',
      availability: {
        lundi: ['08:00-10:00', '10:00-12:00', '14:00-16:00'],
        mardi: ['08:00-10:00', '10:00-12:00', '14:00-16:00'],
      },
    });
    const result = calculateMatchScore(current, candidate);
    expect(result.breakdown.availability).toBe(100);
  });

  it('respects weight distribution (level=40%, position=20%, reliability=20%, proximity=15%, availability=5%)', () => {
    // Perfect match: same level, complementary sides, max reliability, close, common slots
    const current = makePlayer({
      level_score: 5.0,
      preferred_side: 'gauche',
      reliability_score: 1.0,
      latitude: 48.8566,
      longitude: 2.3522,
      availability: { lundi: ['18:00-20:00', '20:00-22:00', '08:00-10:00', '10:00-12:00', '14:00-16:00'] },
    });
    const candidate = makePlayer({
      id: 'candidate-1',
      level_score: 5.0,
      preferred_side: 'droite',
      reliability_score: 1.0,
      latitude: 48.8566,
      longitude: 2.3522, // Same location
      availability: { lundi: ['18:00-20:00', '20:00-22:00', '08:00-10:00', '10:00-12:00', '14:00-16:00'] },
    });
    const result = calculateMatchScore(current, candidate);
    // 100*0.4 + 100*0.2 + 100*0.2 + 100*0.15 + 100*0.05 = 100
    expect(result.total_score).toBe(100);
  });

  it('returns the candidate player_id in result', () => {
    const current = makePlayer();
    const candidate = makePlayer({ id: 'my-candidate' });
    const result = calculateMatchScore(current, candidate);
    expect(result.player_id).toBe('my-candidate');
  });

  it('handles reliability_score of 0', () => {
    const current = makePlayer();
    const candidate = makePlayer({ id: 'candidate-1', reliability_score: 0 });
    const result = calculateMatchScore(current, candidate);
    expect(result.breakdown.reliability).toBe(0);
  });
});
