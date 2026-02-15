'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { calculateMatchScore, type MatchScoreResult, type PlayerForMatching } from '@/lib/matching';
import type { Profile } from '@/types';

export interface SuggestedPlayer {
  profile: Profile;
  score: MatchScoreResult;
}

interface UsePlayerSuggestionsOptions {
  maxDistance?: number;
  limit?: number;
}

async function fetchSuggestions(
  maxDistance: number,
  limit: number,
): Promise<SuggestedPlayer[]> {
  const supabase = createClient();

  // 1. Get current user profile
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non connecté');

  const { data: currentProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !currentProfile) throw new Error('Profil introuvable');

  const currentPlayer: PlayerForMatching = {
    id: currentProfile.id,
    level_score: currentProfile.level_score,
    preferred_side: currentProfile.preferred_side,
    reliability_score: currentProfile.reliability_score,
    latitude: currentProfile.latitude,
    longitude: currentProfile.longitude,
    availability: currentProfile.availability ?? {},
  };

  // 2. Use SQL function if geo available, else fallback to simple query
  let candidates: Profile[];

  if (currentProfile.latitude && currentProfile.longitude) {
    const { data, error: nearbyError } = await supabase
      .rpc('find_nearby_players', {
        p_user_id: user.id,
        p_latitude: currentProfile.latitude,
        p_longitude: currentProfile.longitude,
        p_max_distance_km: maxDistance,
        p_limit: 50,
      });

    if (nearbyError) throw new Error(nearbyError.message);

    const ids = (data ?? []).map((p: { id: string }) => p.id);
    if (ids.length === 0) return [];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', ids);

    candidates = (profiles ?? []) as Profile[];
  } else {
    // No geo: fetch by level proximity
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user.id)
      .eq('is_onboarded', true)
      .gte('level_score', currentProfile.level_score - 2)
      .lte('level_score', currentProfile.level_score + 2)
      .limit(50);

    candidates = (profiles ?? []) as Profile[];
  }

  // 3. Calculate match scores client-side
  return candidates
    .map((profile) => {
      const candidatePlayer: PlayerForMatching = {
        id: profile.id,
        level_score: profile.level_score,
        preferred_side: profile.preferred_side,
        reliability_score: profile.reliability_score,
        latitude: profile.latitude,
        longitude: profile.longitude,
        availability: profile.availability ?? {},
      };
      const score = calculateMatchScore(currentPlayer, candidatePlayer, maxDistance);
      return { profile, score };
    })
    .sort((a, b) => b.score.total_score - a.score.total_score)
    .slice(0, limit);
}

export function usePlayerSuggestions(options: UsePlayerSuggestionsOptions = {}) {
  const { maxDistance = 30, limit = 10 } = options;

  const { data, isLoading, error } = useQuery({
    queryKey: ['playerSuggestions', maxDistance, limit],
    queryFn: () => fetchSuggestions(maxDistance, limit),
    staleTime: 5 * 60 * 1000, // 5 min — avoid refetch on navigation
    gcTime: 10 * 60 * 1000,   // 10 min cache
  });

  return {
    suggestions: data ?? [],
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : 'Erreur inconnue') : null,
  };
}
