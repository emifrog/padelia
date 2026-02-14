'use client';

import Link from 'next/link';
import { Users, Lock, Globe, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    description: string | null;
    visibility: string;
    city: string | null;
    member_count: number;
    max_members: number;
  };
}

const VISIBILITY_ICONS: Record<string, typeof Globe> = {
  public: Globe,
  private: Lock,
  invite_only: Mail,
};

export default function GroupCard({ group }: GroupCardProps) {
  const VisibilityIcon = VISIBILITY_ICONS[group.visibility] ?? Globe;
  const isFull = group.member_count >= group.max_members;

  return (
    <Link
      href={`/groupes/${group.id}`}
      className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-accent active:scale-[0.99]"
    >
      {/* Avatar */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
        {group.name.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-semibold">{group.name}</p>
          <VisibilityIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </div>
        {group.description && (
          <p className="truncate text-xs text-muted-foreground">
            {group.description}
          </p>
        )}
        <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <Users className="h-3 w-3" />
            {group.member_count}/{group.max_members}
          </span>
          {group.city && <span>{group.city}</span>}
          {isFull && (
            <span className={cn('rounded-full bg-red-100 px-1.5 py-0.5 font-medium text-red-600')}>
              Complet
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
