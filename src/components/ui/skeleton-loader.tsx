import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-gray-100', className)}
      {...props}
    />
  );
}

export function AccueilSkeleton() {
  return (
    <div className="space-y-6">
      {/* Section title */}
      <Skeleton className="h-5 w-48" />
      {/* Horizontal scroll cards */}
      <div className="flex gap-3 overflow-hidden">
        <Skeleton className="h-[180px] min-w-[240px] rounded-xl" />
        <Skeleton className="h-[180px] min-w-[240px] rounded-xl" />
      </div>
      {/* Section title */}
      <Skeleton className="h-5 w-56" />
      {/* List items */}
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
      {/* Section title */}
      <Skeleton className="h-5 w-40" />
      {/* Horizontal scroll cards */}
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[160px] min-w-[140px] rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function MatchsSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search */}
      <Skeleton className="h-10 w-full rounded-lg" />
      {/* Filter pills */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-full" />
        ))}
      </div>
      {/* Match cards */}
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-[120px] w-full rounded-xl" />
      ))}
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
      {/* Search bar */}
      <Skeleton className="h-11 w-full rounded-2xl" />
      {/* Conversation items */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3">
          <Skeleton className="h-[50px] w-[50px] shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfilSkeleton() {
  return (
    <div className="space-y-4">
      {/* Hero card */}
      <Skeleton className="h-[280px] w-full rounded-2xl" />
      {/* Premium CTA */}
      <Skeleton className="h-[80px] w-full rounded-xl" />
      {/* Settings links */}
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-40" />
      {/* Level bar */}
      <Skeleton className="h-24 w-full rounded-xl" />
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
      {/* Match history */}
      <Skeleton className="h-5 w-36" />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function MatchDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-6 w-48" />
      </div>
      <Skeleton className="h-[200px] w-full rounded-xl" />
      <Skeleton className="h-[120px] w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}

export function GroupesSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-36" />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
      <Skeleton className="h-7 w-44" />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function ClubsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-32" />
      {/* Search */}
      <Skeleton className="h-10 w-full rounded-lg" />
      {/* Club cards */}
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-[100px] w-full rounded-xl" />
      ))}
    </div>
  );
}

export function ClubDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-6 w-16" />
      </div>
      {/* Cover */}
      <Skeleton className="h-44 w-full rounded-xl" />
      {/* Name + rating */}
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-4 w-40" />
      {/* Contact */}
      <Skeleton className="h-[120px] w-full rounded-xl" />
      {/* Hours */}
      <Skeleton className="h-[200px] w-full rounded-xl" />
      {/* Courts */}
      <Skeleton className="h-5 w-32" />
      {Array.from({ length: 2 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function TournoisSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-36" />
      {/* Search */}
      <Skeleton className="h-10 w-full rounded-lg" />
      {/* Tab pills */}
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      {/* Tournament cards */}
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-[120px] w-full rounded-xl" />
      ))}
    </div>
  );
}

export function TournamentDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-6 w-20" />
      </div>
      {/* Title */}
      <Skeleton className="h-8 w-64" />
      {/* Status badge */}
      <Skeleton className="h-6 w-32 rounded-full" />
      {/* Info cards */}
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
      {/* Teams section */}
      <Skeleton className="h-5 w-40" />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function JoueursSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full rounded-lg" />
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-xl" />
      ))}
    </div>
  );
}
