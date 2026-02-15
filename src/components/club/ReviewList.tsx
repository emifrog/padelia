'use client';

import { useState, useCallback } from 'react';
import ReviewCard, { type ReviewCardData } from '@/components/club/ReviewCard';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const PAGE_SIZE = 10;

interface Props {
  reviews: ReviewCardData[];
  clubId: string;
}

export default function ReviewList({ reviews: initialReviews, clubId }: Props) {
  const [reviews, setReviews] = useState<ReviewCardData[]>(initialReviews);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialReviews.length >= PAGE_SIZE);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    try {
      const supabase = createClient();
      const lastReview = reviews[reviews.length - 1];
      if (!lastReview) return;

      const { data } = await supabase
        .from('club_reviews')
        .select('id, club_id, user_id, rating, comment, created_at, profiles (full_name, avatar_url)')
        .eq('club_id', clubId)
        .lt('created_at', lastReview.created_at)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (!data || data.length === 0) {
        setHasMore(false);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newReviews: ReviewCardData[] = data.map((r: any) => {
        const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
        return {
          id: r.id,
          club_id: r.club_id,
          user_id: r.user_id,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
          reviewer_name: profile?.full_name ?? 'Joueur',
          reviewer_avatar: profile?.avatar_url ?? null,
        };
      });

      setReviews((prev) => [...prev, ...newReviews]);
      if (newReviews.length < PAGE_SIZE) setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [reviews, loadingMore, hasMore, clubId]);

  if (reviews.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground">
        Aucun avis pour le moment. Sois le premier !
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      {reviews.map((r) => (
        <ReviewCard key={r.id} review={r} />
      ))}

      {hasMore && (
        <Button
          variant="outline"
          className="w-full"
          onClick={loadMore}
          disabled={loadingMore}
        >
          {loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Charger plus d&apos;avis
        </Button>
      )}
    </div>
  );
}
