'use client';

import Link from 'next/link';
import { Users, Lock, Globe, Mail, ChevronRight } from 'lucide-react';
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
      className="flex items-center gap-3 rounded-xl bg-white p-3.5 shadow-padel transition-transform active:scale-[0.98]"
    >
      {/* Avatar */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-lime-padel/15 text-lg font-bold text-navy">
        {group.name.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[14px] font-bold text-navy">{group.name}</p>
          <VisibilityIcon className="h-3.5 w-3.5 shrink-0 text-gray-300" aria-hidden="true" />
        </div>
        {group.description && (
          <p className="truncate text-[12px] text-gray-400">
            {group.description}
          </p>
        )}
        <div className="mt-1 flex items-center gap-3 text-[11px] text-gray-400">
          <span className="flex items-center gap-0.5">
            <Users className="h-3 w-3" aria-hidden="true" />
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

      <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" aria-hidden="true" />
    </Link>
  );
}
