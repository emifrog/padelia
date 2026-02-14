'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useGroupActions } from '@/hooks/use-group-actions';
import { LogOut, Trash2, UserPlus, Loader2 } from 'lucide-react';

interface GroupActionsProps {
  groupId: string;
  userId: string;
  isMember: boolean;
  isAdmin: boolean;
  visibility: string;
}

export default function GroupActions({ groupId, userId, isMember, isAdmin, visibility }: GroupActionsProps) {
  const router = useRouter();

  const { joinGroup, leaveGroup, deleteGroup, loading } = useGroupActions({
    groupId,
    userId,
    onUpdate: () => router.refresh(),
  });

  if (loading) {
    return (
      <Button disabled className="w-full">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Chargement...
      </Button>
    );
  }

  // Not a member — show join button
  if (!isMember) {
    if (visibility === 'invite_only') {
      return (
        <Button variant="outline" disabled className="w-full">
          Sur invitation uniquement
        </Button>
      );
    }

    return (
      <Button onClick={joinGroup} className="w-full">
        <UserPlus className="mr-2 h-4 w-4" />
        Rejoindre le groupe
      </Button>
    );
  }

  // Member actions
  return (
    <div className="flex gap-2">
      {isAdmin && (
        <Button
          variant="destructive"
          size="sm"
          onClick={async () => {
            if (confirm('Supprimer ce groupe définitivement ?')) {
              await deleteGroup();
              router.push('/groupes');
            }
          }}
        >
          <Trash2 className="mr-1.5 h-4 w-4" />
          Supprimer
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          await leaveGroup();
          router.refresh();
        }}
      >
        <LogOut className="mr-1.5 h-4 w-4" />
        Quitter
      </Button>
    </div>
  );
}
