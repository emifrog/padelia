import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CalendarPlus } from 'lucide-react';
import ClubInfo from '@/components/club/ClubInfo';
import CourtList from '@/components/club/CourtList';
import OpeningHours from '@/components/club/OpeningHours';
import ReviewList from '@/components/club/ReviewList';
import ReviewForm from '@/components/club/ReviewForm';
import type { Club, Court } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('clubs')
    .select('name')
    .eq('id', id)
    .single();
  return { title: data?.name ?? 'Club' };
}

export default async function ClubDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: club },
    { data: courts },
    { data: reviews },
  ] = await Promise.all([
    supabase
      .from('clubs')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('courts')
      .select('*')
      .eq('club_id', id)
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('club_reviews')
      .select('id, club_id, user_id, rating, comment, created_at, profiles (full_name, avatar_url)')
      .eq('club_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  if (!club) notFound();

  const typedClub = club as Club;
  const typedCourts = (courts ?? []) as Court[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedReviews = (reviews ?? []).map((r: any) => {
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

  const hasReviewed = user
    ? formattedReviews.some((r: { user_id: string }) => r.user_id === user.id)
    : true;

  const isOwner = user && typedClub.owner_id === user.id;

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/clubs"
          className="flex items-center gap-1 text-[14px] font-semibold text-gray-500"
        >
          <ArrowLeft className="h-4 w-4" />
          Clubs
        </Link>

        {isOwner && (
          <Link
            href={`/clubs/${id}/dashboard`}
            className="rounded-full bg-navy px-3 py-1.5 text-[12px] font-semibold text-white"
          >
            Dashboard
          </Link>
        )}
      </div>

      {/* Club info */}
      <ClubInfo club={typedClub} />

      {/* Opening hours */}
      <OpeningHours openingHours={typedClub.opening_hours} />

      {/* Courts */}
      <CourtList courts={typedCourts} clubId={id} />

      {/* Reserve CTA */}
      {typedCourts.length > 0 && (
        <Link
          href={`/clubs/${id}/reserver`}
          className="flex items-center justify-center gap-2 rounded-xl bg-green-padel py-3 text-[15px] font-bold text-white shadow-padel-md transition-transform active:scale-[0.98]"
        >
          <CalendarPlus className="h-5 w-5" />
          Réserver un terrain
        </Link>
      )}

      {/* Reviews */}
      <div className="space-y-3">
        <h3 className="text-[14px] font-bold text-navy">
          Avis ({typedClub.total_reviews})
        </h3>

        <ReviewList
          reviews={formattedReviews}
          clubId={id}
        />

        {user && !hasReviewed && (
          <ReviewForm clubId={id} />
        )}
      </div>
    </div>
  );
}
