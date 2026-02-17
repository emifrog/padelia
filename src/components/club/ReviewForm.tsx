'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clubReviewSchema, type ClubReviewData } from '@/lib/validations/club';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Props {
  clubId: string;
}

export default function ReviewForm({ clubId }: Props) {
  const router = useRouter();
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClubReviewData>({
    resolver: zodResolver(clubReviewSchema),
    defaultValues: { rating: 0, comment: '' },
  });

  const currentRating = watch('rating');

  async function onSubmit(data: ClubReviewData) {
    if (data.rating === 0) {
      toast.error('Sélectionne une note');
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Connecte-toi pour laisser un avis');
        return;
      }

      // Insert review
      const { error } = await supabase
        .from('club_reviews')
        .insert({
          club_id: clubId,
          user_id: user.id,
          rating: data.rating,
          comment: data.comment || null,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Tu as déjà laissé un avis pour ce club');
        } else {
          toast.error('Erreur lors de l\'envoi de l\'avis');
        }
        return;
      }

      // Recalculate club average rating
      const { data: allReviews } = await supabase
        .from('club_reviews')
        .select('rating')
        .eq('club_id', clubId);

      if (allReviews && allReviews.length > 0) {
        const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        await supabase
          .from('clubs')
          .update({
            rating: Math.round(avg * 10) / 10,
            total_reviews: allReviews.length,
          })
          .eq('id', clubId);
      }

      toast.success('Avis envoyé !');
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-xl bg-white p-4 shadow-padel"
    >
      <h4 className="mb-3 text-[14px] font-bold text-navy">Laisser un avis</h4>

      {/* Star rating */}
      <div className="mb-3 flex items-center gap-1" role="radiogroup" aria-label="Note du club">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={currentRating === star}
            aria-label={`${star} etoile${star > 1 ? 's' : ''}`}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            onClick={() => setValue('rating', star, { shouldValidate: true })}
            className="p-0.5"
          >
            <Star
              aria-hidden="true"
              className={`h-7 w-7 ${
                star <= (hoveredStar || currentRating)
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-gray-200 text-gray-200'
              } transition-colors`}
            />
          </button>
        ))}
        {currentRating > 0 && (
          <span className="ml-2 text-[13px] font-semibold text-gray-500">
            {currentRating}/5
          </span>
        )}
      </div>
      {errors.rating && (
        <p className="mb-2 text-[12px] text-red-500">{errors.rating.message}</p>
      )}

      {/* Comment */}
      <textarea
        {...register('comment')}
        placeholder="Ton commentaire (optionnel)..."
        rows={3}
        className="mb-3 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-[13px] placeholder:text-gray-400 focus:border-green-padel focus:outline-none focus:ring-1 focus:ring-green-padel"
      />
      {errors.comment && (
        <p className="mb-2 text-[12px] text-red-500">{errors.comment.message}</p>
      )}

      <Button
        type="submit"
        disabled={submitting || currentRating === 0}
        className="w-full bg-green-padel text-white hover:bg-green-padel/90"
      >
        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Envoyer mon avis
      </Button>
    </form>
  );
}
