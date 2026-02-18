'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import StarRating from '@/components/club/StarRating';
import { AMENITY_LABELS } from '@/lib/constants/club';

export interface ClubCardData {
  id: string;
  name: string;
  city: string;
  address: string;
  rating: number;
  total_reviews: number;
  amenities: string[];
  logo_url: string | null;
}

interface Props {
  club: ClubCardData;
}

export default memo(function ClubCard({ club }: Props) {
  return (
    <Link
      href={`/clubs/${club.id}`}
      className="block rounded-xl bg-white p-4 shadow-padel transition-transform active:scale-[0.98]"
    >
      <div className="flex items-start gap-3.5">
        {/* Logo */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-green-subtle text-[24px]">
          {club.logo_url ? (
            <Image
              src={club.logo_url}
              alt={club.name}
              width={56}
              height={56}
              className="h-14 w-14 rounded-xl object-cover"
            />
          ) : (
            '🏟️'
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[16px] font-bold text-navy">{club.name}</h3>

          <div className="mt-0.5 flex items-center gap-1 text-[12px] text-gray-400">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{club.city}</span>
          </div>

          {/* Rating */}
          <div className="mt-1.5 flex items-center gap-2">
            <StarRating rating={club.rating} size="sm" />
            <span className="text-[12px] font-semibold text-gray-500">
              {club.rating.toFixed(1)}
            </span>
            <span className="text-[11px] text-gray-400">
              ({club.total_reviews} avis)
            </span>
          </div>
        </div>
      </div>

      {/* Amenities */}
      {club.amenities.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {club.amenities.slice(0, 4).map((a) => (
            <span
              key={a}
              className="rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500"
            >
              {AMENITY_LABELS[a] ?? a}
            </span>
          ))}
          {club.amenities.length > 4 && (
            <span className="rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-400">
              +{club.amenities.length - 4}
            </span>
          )}
        </div>
      )}
    </Link>
  );
});
