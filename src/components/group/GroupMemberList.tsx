'use client';

import { LEVEL_LABELS } from '@/types';
import type { PlayerLevel } from '@/types';
import { Shield, Crown } from 'lucide-react';

interface Member {
  user_id: string;
  role: string;
  joined_at: string;
  profile: {
    full_name: string;
    username: string;
    level: PlayerLevel;
    avatar_url: string | null;
  } | null;
}

interface GroupMemberListProps {
  members: Member[];
}

const ROLE_ICONS: Record<string, typeof Shield | null> = {
  admin: Crown,
  moderator: Shield,
  member: null,
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  moderator: 'Modérateur',
  member: 'Membre',
};

export default function GroupMemberList({ members }: GroupMemberListProps) {
  // Sort: admins first, then moderators, then members
  const sorted = [...members].sort((a, b) => {
    const order: Record<string, number> = { admin: 0, moderator: 1, member: 2 };
    return (order[a.role] ?? 2) - (order[b.role] ?? 2);
  });

  return (
    <div className="space-y-1">
      {sorted.map((member) => {
        const RoleIcon = ROLE_ICONS[member.role];
        const profile = member.profile;

        return (
          <div
            key={member.user_id}
            className="flex items-center gap-3 rounded-xl p-2.5"
          >
            {/* Avatar */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {profile?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-medium">
                  {profile?.full_name ?? 'Joueur'}
                </p>
                {RoleIcon && (
                  <RoleIcon className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>@{profile?.username ?? '...'}</span>
                <span>·</span>
                <span>{LEVEL_LABELS[profile?.level ?? 'initie']}</span>
                <span>·</span>
                <span>{ROLE_LABELS[member.role] ?? 'Membre'}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
