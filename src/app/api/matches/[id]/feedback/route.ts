import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { peerFeedbackSchema } from '@/lib/validations/match';

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface FeedbackInput {
  target_player_id: string;
  rating: number;
  level_feedback?: number;
}

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * POST /api/matches/[id]/feedback
 * Submit peer feedback ratings for other players in the match.
 * If all participants have rated, compute peer level estimate and blend into level_score.
 */
export async function POST(request: Request, context: RouteContext) {
  const { id: matchId } = await context.params;
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  // Verify match is completed and user is a participant
  const { data: participant } = await supabase
    .from('match_participants')
    .select('id, player_id, rating_given')
    .eq('match_id', matchId)
    .eq('player_id', user.id)
    .eq('status', 'confirmed')
    .single();

  if (!participant) {
    return NextResponse.json({ error: 'Tu ne participes pas à ce match' }, { status: 403 });
  }

  if (participant.rating_given != null) {
    return NextResponse.json({ error: 'Tu as déjà noté ce match' }, { status: 400 });
  }

  const { data: match } = await supabase
    .from('matches')
    .select('status')
    .eq('id', matchId)
    .single();

  if (!match || match.status !== 'completed') {
    return NextResponse.json({ error: 'Le match n\'est pas terminé' }, { status: 400 });
  }

  // Parse body
  const body = await request.json();
  const feedbacks: FeedbackInput[] = body.feedbacks;

  if (!Array.isArray(feedbacks) || feedbacks.length === 0) {
    return NextResponse.json({ error: 'Feedbacks requis' }, { status: 400 });
  }

  // Validate each feedback
  for (const fb of feedbacks) {
    const parsed = peerFeedbackSchema.safeParse({
      rating: fb.rating,
      level_feedback: fb.level_feedback,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides', details: parsed.error.issues }, { status: 400 });
    }
  }

  const admin = getAdminClient();

  // Save feedback: store average rating in current user's participant row
  const avgRating = Math.round(
    feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / feedbacks.length * 10,
  ) / 10;

  await admin
    .from('match_participants')
    .update({ rating_given: avgRating })
    .eq('id', participant.id);

  // Store individual level feedbacks for target players
  for (const fb of feedbacks) {
    if (fb.level_feedback != null) {
      await admin
        .from('match_participants')
        .update({
          level_feedback: fb.level_feedback,
        })
        .eq('match_id', matchId)
        .eq('player_id', fb.target_player_id);
    }
  }

  // Check if ALL participants have rated
  const { data: allParticipants } = await admin
    .from('match_participants')
    .select('player_id, rating_given, level_feedback')
    .eq('match_id', matchId)
    .eq('status', 'confirmed');

  const allRated = allParticipants?.every((p) => p.rating_given != null);

  if (allRated && allParticipants) {
    // Compute peer level estimate for each player and blend into level_score
    for (const p of allParticipants) {
      // Get all level_feedback values given TO this player
      const feedbacksForPlayer = allParticipants.filter(
        (other) => other.player_id !== p.player_id && other.level_feedback != null,
      );

      if (feedbacksForPlayer.length === 0) continue;

      const avgLevelFeedback =
        feedbacksForPlayer.reduce((sum, f) => sum + (f.level_feedback ?? 0), 0) /
        feedbacksForPlayer.length;

      // Get current level_score
      const { data: profile } = await admin
        .from('profiles')
        .select('level_score')
        .eq('id', p.player_id)
        .single();

      if (!profile) continue;

      // Blend: 70% current score + 30% peer feedback
      const blended = profile.level_score * 0.7 + avgLevelFeedback * 0.3;
      const newScore = Math.round(Math.max(1.0, Math.min(10.0, blended)) * 10) / 10;

      // Determine level enum from score
      const levelEnum = scoreToLevel(newScore);

      await admin
        .from('profiles')
        .update({ level_score: newScore, level: levelEnum })
        .eq('id', p.player_id);
    }
  }

  return NextResponse.json({ success: true, allRated: !!allRated });
}

function scoreToLevel(score: number): string {
  if (score < 2.5) return 'debutant';
  if (score < 4.0) return 'initie';
  if (score < 5.5) return 'intermediaire';
  if (score < 7.0) return 'avance';
  if (score < 8.5) return 'expert';
  return 'competition';
}
