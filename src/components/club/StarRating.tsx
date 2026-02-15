'use client';

import { Star } from 'lucide-react';

interface Props {
  rating: number;
  size?: 'sm' | 'md';
}

export default function StarRating({ rating, size = 'sm' }: Props) {
  const px = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${px} ${
            i < Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'fill-gray-200 text-gray-200'
          }`}
        />
      ))}
    </div>
  );
}
