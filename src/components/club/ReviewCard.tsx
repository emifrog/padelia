'use client';

import { memo } from 'react';
import Image from 'next/image';
import StarRating from '@/components/club/StarRating';

export interface ReviewCardData {
  id: string;
  club_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_name: string;
  reviewer_avatar: string | null;
}

interface Props {
  review: ReviewCardData;
}

export default memo(function ReviewCard({ review }: Props) {
  const timeAgo = getRelativeTime(review.created_at);

  return (
    <div className="rounded-xl bg-white p-4 shadow-padel">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-subtle text-[14px] font-bold text-green-padel">
          {review.reviewer_avatar ? (
            <Image
              src={review.reviewer_avatar}
              alt={review.reviewer_name}
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            review.reviewer_name.charAt(0).toUpperCase()
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[13px] font-bold text-navy">
              {review.reviewer_name}
            </p>
            <span className="shrink-0 text-[11px] text-gray-400">{timeAgo}</span>
          </div>

          <div className="mt-0.5">
            <StarRating rating={review.rating} size="sm" />
          </div>

          {review.comment && (
            <p className="mt-2 text-[13px] leading-relaxed text-gray-600">
              {review.comment}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}j`;
  const months = Math.floor(days / 30);
  return `${months}mois`;
}
