import { describe, it, expect } from 'vitest';
import { onboardingSchema } from '../onboarding';
import { profileSchema } from '../profile';
import { createMatchSchema, scoreSetSchema, completeMatchSchema } from '../match';
import { createGroupSchema } from '../group';
import { availabilitySchema } from '../availability';

// ── Onboarding Schema ──

describe('onboardingSchema', () => {
  const validData = {
    username: 'player_one',
    city: 'Paris',
    level: 'intermediaire' as const,
    level_score: 5.0,
    preferred_side: 'droite' as const,
    play_style: 'mixte' as const,
    player_goal: 'progression' as const,
    dominant_hand: 'droite' as const,
    years_playing: 3,
  };

  it('accepts valid onboarding data', () => {
    const result = onboardingSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects username shorter than 3 characters', () => {
    const result = onboardingSchema.safeParse({ ...validData, username: 'ab' });
    expect(result.success).toBe(false);
  });

  it('rejects username longer than 20 characters', () => {
    const result = onboardingSchema.safeParse({ ...validData, username: 'a'.repeat(21) });
    expect(result.success).toBe(false);
  });

  it('rejects username with uppercase letters', () => {
    const result = onboardingSchema.safeParse({ ...validData, username: 'Player' });
    expect(result.success).toBe(false);
  });

  it('rejects username with special characters (except _)', () => {
    const result = onboardingSchema.safeParse({ ...validData, username: 'player-one' });
    expect(result.success).toBe(false);
  });

  it('accepts username with underscores', () => {
    const result = onboardingSchema.safeParse({ ...validData, username: 'player_1' });
    expect(result.success).toBe(true);
  });

  it('rejects level_score below 1', () => {
    const result = onboardingSchema.safeParse({ ...validData, level_score: 0.5 });
    expect(result.success).toBe(false);
  });

  it('rejects level_score above 10', () => {
    const result = onboardingSchema.safeParse({ ...validData, level_score: 11 });
    expect(result.success).toBe(false);
  });

  it('accepts boundary level_score values (1 and 10)', () => {
    expect(onboardingSchema.safeParse({ ...validData, level_score: 1 }).success).toBe(true);
    expect(onboardingSchema.safeParse({ ...validData, level_score: 10 }).success).toBe(true);
  });

  it('rejects invalid level enum', () => {
    const result = onboardingSchema.safeParse({ ...validData, level: 'pro' });
    expect(result.success).toBe(false);
  });

  it('accepts all valid level enums', () => {
    const levels = ['debutant', 'initie', 'intermediaire', 'avance', 'expert', 'competition'];
    for (const level of levels) {
      const result = onboardingSchema.safeParse({ ...validData, level });
      expect(result.success).toBe(true);
    }
  });

  it('rejects negative years_playing', () => {
    const result = onboardingSchema.safeParse({ ...validData, years_playing: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects years_playing above 50', () => {
    const result = onboardingSchema.safeParse({ ...validData, years_playing: 51 });
    expect(result.success).toBe(false);
  });
});

// ── Profile Schema ──

describe('profileSchema', () => {
  const validProfile = {
    full_name: 'Jean Dupont',
    username: 'jean_dupont',
    bio: 'Joueur passionné',
    city: 'Lyon',
    level: 'avance' as const,
    level_score: 7.0,
    preferred_side: 'gauche' as const,
    play_style: 'offensif' as const,
    player_goal: 'competition' as const,
    dominant_hand: 'droite' as const,
    years_playing: 10,
    max_distance_km: 30,
  };

  it('accepts valid profile data', () => {
    const result = profileSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
  });

  it('rejects full_name shorter than 2 characters', () => {
    const result = profileSchema.safeParse({ ...validProfile, full_name: 'J' });
    expect(result.success).toBe(false);
  });

  it('rejects full_name longer than 50 characters', () => {
    const result = profileSchema.safeParse({ ...validProfile, full_name: 'A'.repeat(51) });
    expect(result.success).toBe(false);
  });

  it('accepts empty bio', () => {
    const result = profileSchema.safeParse({ ...validProfile, bio: '' });
    expect(result.success).toBe(true);
  });

  it('accepts missing bio (optional)', () => {
    const { bio: _, ...noBio } = validProfile;
    const result = profileSchema.safeParse(noBio);
    expect(result.success).toBe(true);
  });

  it('rejects bio longer than 500 characters', () => {
    const result = profileSchema.safeParse({ ...validProfile, bio: 'X'.repeat(501) });
    expect(result.success).toBe(false);
  });

  it('rejects max_distance_km below 1', () => {
    const result = profileSchema.safeParse({ ...validProfile, max_distance_km: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects max_distance_km above 200', () => {
    const result = profileSchema.safeParse({ ...validProfile, max_distance_km: 201 });
    expect(result.success).toBe(false);
  });

  it('accepts boundary max_distance_km (1 and 200)', () => {
    expect(profileSchema.safeParse({ ...validProfile, max_distance_km: 1 }).success).toBe(true);
    expect(profileSchema.safeParse({ ...validProfile, max_distance_km: 200 }).success).toBe(true);
  });
});

// ── Match Schema ──

describe('createMatchSchema', () => {
  const validMatch = {
    title: 'Match amical samedi',
    description: 'Venez jouer !',
    match_type: 'friendly' as const,
    visibility: 'public' as const,
    scheduled_at: '2025-03-15T18:00:00',
    duration_minutes: 90,
    location_name: 'Padel Club Paris',
    max_players: 4,
    cost_per_player: 15,
  };

  it('accepts valid match data', () => {
    const result = createMatchSchema.safeParse(validMatch);
    expect(result.success).toBe(true);
  });

  it('rejects title shorter than 3 characters', () => {
    const result = createMatchSchema.safeParse({ ...validMatch, title: 'AB' });
    expect(result.success).toBe(false);
  });

  it('rejects title longer than 60 characters', () => {
    const result = createMatchSchema.safeParse({ ...validMatch, title: 'A'.repeat(61) });
    expect(result.success).toBe(false);
  });

  it('only accepts max_players of 2 or 4', () => {
    expect(createMatchSchema.safeParse({ ...validMatch, max_players: 2 }).success).toBe(true);
    expect(createMatchSchema.safeParse({ ...validMatch, max_players: 4 }).success).toBe(true);
    expect(createMatchSchema.safeParse({ ...validMatch, max_players: 3 }).success).toBe(false);
    expect(createMatchSchema.safeParse({ ...validMatch, max_players: 6 }).success).toBe(false);
    expect(createMatchSchema.safeParse({ ...validMatch, max_players: 1 }).success).toBe(false);
  });

  it('rejects duration_minutes below 30', () => {
    const result = createMatchSchema.safeParse({ ...validMatch, duration_minutes: 15 });
    expect(result.success).toBe(false);
  });

  it('rejects duration_minutes above 240', () => {
    const result = createMatchSchema.safeParse({ ...validMatch, duration_minutes: 300 });
    expect(result.success).toBe(false);
  });

  it('rejects negative cost_per_player', () => {
    const result = createMatchSchema.safeParse({ ...validMatch, cost_per_player: -5 });
    expect(result.success).toBe(false);
  });

  it('rejects cost_per_player above 200', () => {
    const result = createMatchSchema.safeParse({ ...validMatch, cost_per_player: 250 });
    expect(result.success).toBe(false);
  });

  it('accepts all match types', () => {
    for (const type of ['friendly', 'ranked', 'tournament']) {
      const result = createMatchSchema.safeParse({ ...validMatch, match_type: type });
      expect(result.success).toBe(true);
    }
  });

  it('accepts all visibility types', () => {
    for (const vis of ['public', 'group', 'private']) {
      const result = createMatchSchema.safeParse({ ...validMatch, visibility: vis });
      expect(result.success).toBe(true);
    }
  });

  it('accepts empty description', () => {
    const result = createMatchSchema.safeParse({ ...validMatch, description: '' });
    expect(result.success).toBe(true);
  });

  it('accepts optional min_level and max_level', () => {
    const result = createMatchSchema.safeParse({
      ...validMatch,
      min_level: 'intermediaire',
      max_level: 'expert',
    });
    expect(result.success).toBe(true);
  });
});

describe('scoreSetSchema', () => {
  it('accepts valid set scores', () => {
    expect(scoreSetSchema.safeParse({ score_a: 6, score_b: 3 }).success).toBe(true);
    expect(scoreSetSchema.safeParse({ score_a: 7, score_b: 6 }).success).toBe(true);
    expect(scoreSetSchema.safeParse({ score_a: 0, score_b: 0 }).success).toBe(true);
  });

  it('rejects negative scores', () => {
    expect(scoreSetSchema.safeParse({ score_a: -1, score_b: 3 }).success).toBe(false);
    expect(scoreSetSchema.safeParse({ score_a: 6, score_b: -1 }).success).toBe(false);
  });

  it('rejects scores above 7', () => {
    expect(scoreSetSchema.safeParse({ score_a: 8, score_b: 3 }).success).toBe(false);
    expect(scoreSetSchema.safeParse({ score_a: 6, score_b: 8 }).success).toBe(false);
  });
});

describe('completeMatchSchema', () => {
  it('accepts valid completion data (2 sets)', () => {
    const result = completeMatchSchema.safeParse({
      sets: [{ score_a: 6, score_b: 3 }, { score_a: 6, score_b: 4 }],
      winner_team: 'A',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid completion data (3 sets)', () => {
    const result = completeMatchSchema.safeParse({
      sets: [
        { score_a: 6, score_b: 3 },
        { score_a: 3, score_b: 6 },
        { score_a: 7, score_b: 5 },
      ],
      winner_team: 'A',
    });
    expect(result.success).toBe(true);
  });

  it('rejects less than 2 sets', () => {
    const result = completeMatchSchema.safeParse({
      sets: [{ score_a: 6, score_b: 3 }],
      winner_team: 'A',
    });
    expect(result.success).toBe(false);
  });

  it('rejects more than 3 sets', () => {
    const result = completeMatchSchema.safeParse({
      sets: [
        { score_a: 6, score_b: 3 },
        { score_a: 6, score_b: 4 },
        { score_a: 7, score_b: 5 },
        { score_a: 6, score_b: 2 },
      ],
      winner_team: 'A',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid winner_team', () => {
    const result = completeMatchSchema.safeParse({
      sets: [{ score_a: 6, score_b: 3 }, { score_a: 6, score_b: 4 }],
      winner_team: 'C',
    });
    expect(result.success).toBe(false);
  });
});

// ── Group Schema ──

describe('createGroupSchema', () => {
  const validGroup = {
    name: 'Padel Club Paris',
    description: 'Groupe pour les joueurs parisiens',
    visibility: 'public' as const,
    city: 'Paris',
    max_members: 50,
  };

  it('accepts valid group data', () => {
    const result = createGroupSchema.safeParse(validGroup);
    expect(result.success).toBe(true);
  });

  it('rejects group name shorter than 3 characters', () => {
    const result = createGroupSchema.safeParse({ ...validGroup, name: 'AB' });
    expect(result.success).toBe(false);
  });

  it('rejects group name longer than 50 characters', () => {
    const result = createGroupSchema.safeParse({ ...validGroup, name: 'X'.repeat(51) });
    expect(result.success).toBe(false);
  });

  it('rejects max_members below 2', () => {
    const result = createGroupSchema.safeParse({ ...validGroup, max_members: 1 });
    expect(result.success).toBe(false);
  });

  it('rejects max_members above 500', () => {
    const result = createGroupSchema.safeParse({ ...validGroup, max_members: 501 });
    expect(result.success).toBe(false);
  });

  it('accepts all visibility types', () => {
    for (const vis of ['public', 'private', 'invite_only']) {
      const result = createGroupSchema.safeParse({ ...validGroup, visibility: vis });
      expect(result.success).toBe(true);
    }
  });

  it('accepts empty description', () => {
    const result = createGroupSchema.safeParse({ ...validGroup, description: '' });
    expect(result.success).toBe(true);
  });

  it('rejects description longer than 500 characters', () => {
    const result = createGroupSchema.safeParse({ ...validGroup, description: 'A'.repeat(501) });
    expect(result.success).toBe(false);
  });
});

// ── Availability Schema ──

describe('availabilitySchema', () => {
  it('accepts valid availability data', () => {
    const result = availabilitySchema.safeParse({
      lundi: ['08:00-10:00', '18:00-20:00'],
      mardi: [],
      mercredi: ['20:00-22:00'],
      jeudi: [],
      vendredi: ['18:00-20:00'],
      samedi: ['10:00-12:00', '14:00-16:00'],
      dimanche: [],
    });
    expect(result.success).toBe(true);
  });

  it('accepts all empty days', () => {
    const result = availabilitySchema.safeParse({
      lundi: [],
      mardi: [],
      mercredi: [],
      jeudi: [],
      vendredi: [],
      samedi: [],
      dimanche: [],
    });
    expect(result.success).toBe(true);
  });

  it('defaults missing days to empty arrays', () => {
    const result = availabilitySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lundi).toEqual([]);
      expect(result.data.dimanche).toEqual([]);
    }
  });

  it('rejects invalid time slot format', () => {
    const result = availabilitySchema.safeParse({
      lundi: ['8:00-10:00'], // Missing leading zero
    });
    expect(result.success).toBe(false);
  });

  it('rejects malformed time slot', () => {
    const result = availabilitySchema.safeParse({
      lundi: ['morning'],
    });
    expect(result.success).toBe(false);
  });

  it('accepts properly formatted time slots', () => {
    const result = availabilitySchema.safeParse({
      samedi: ['06:00-08:00', '08:00-10:00', '10:00-12:00'],
    });
    expect(result.success).toBe(true);
  });
});
