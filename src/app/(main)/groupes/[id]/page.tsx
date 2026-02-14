import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Globe, Lock, Mail, MapPin, Users, CalendarDays } from 'lucide-react';
import GroupActions from '@/components/group/GroupActions';
import GroupMemberList from '@/components/group/GroupMemberList';
import { GROUP_VISIBILITY_LABELS } from '@/lib/validations/group';
import type { PlayerLevel } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: group } = await supabase
    .from('groups')
    .select('name')
    .eq('id', id)
    .single();
  return { title: group?.name ?? 'Groupe' };
}

const VISIBILITY_ICONS: Record<string, typeof Globe> = {
  public: Globe,
  private: Lock,
  invite_only: Mail,
};

export default async function GroupDetailPage({ params }: PageProps) {
  const { id: groupId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch group
  const { data: group } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single();

  if (!group) notFound();

  // Fetch members with profiles
  const { data: membersRaw } = await supabase
    .from('group_members')
    .select(`
      user_id,
      role,
      joined_at,
      profiles (
        full_name,
        username,
        level,
        avatar_url
      )
    `)
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const members = (membersRaw ?? []).map((m: any) => {
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    return {
      user_id: m.user_id,
      role: m.role,
      joined_at: m.joined_at,
      profile: profile ? {
        full_name: profile.full_name,
        username: profile.username,
        level: profile.level as PlayerLevel,
        avatar_url: profile.avatar_url,
      } : null,
    };
  });

  // Check current user membership
  const currentMembership = members.find((m) => m.user_id === user.id);
  const isMember = !!currentMembership;
  const isAdmin = currentMembership?.role === 'admin';

  // Fetch recent matches for this group
  const { data: groupMatches } = await supabase
    .from('matches')
    .select('id, title, status, scheduled_at, max_players')
    .eq('group_id', groupId)
    .order('scheduled_at', { ascending: false })
    .limit(5);

  const VisibilityIcon = VISIBILITY_ICONS[group.visibility] ?? Globe;
  const createdAt = new Date(group.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/groupes"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold">{group.name}</h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <VisibilityIcon className="h-3.5 w-3.5" />
            <span>{GROUP_VISIBILITY_LABELS[group.visibility]}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      {group.description && (
        <p className="text-sm text-muted-foreground">{group.description}</p>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-muted p-3 text-center">
          <Users className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
          <p className="text-lg font-bold">{group.member_count}</p>
          <p className="text-[10px] text-muted-foreground">Membres</p>
        </div>
        <div className="rounded-xl bg-muted p-3 text-center">
          <MapPin className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
          <p className="truncate text-sm font-bold">{group.city ?? '—'}</p>
          <p className="text-[10px] text-muted-foreground">Ville</p>
        </div>
        <div className="rounded-xl bg-muted p-3 text-center">
          <CalendarDays className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-bold">{createdAt.split(' ')[1]}</p>
          <p className="text-[10px] text-muted-foreground">{createdAt.split(' ')[2]}</p>
        </div>
      </div>

      {/* Actions */}
      <GroupActions
        groupId={groupId}
        userId={user.id}
        isMember={isMember}
        isAdmin={isAdmin}
        visibility={group.visibility}
      />

      {/* Members */}
      <section>
        <h2 className="mb-3 text-sm font-semibold">
          Membres ({members.length}/{group.max_members})
        </h2>
        <GroupMemberList members={members} />
      </section>

      {/* Group matches */}
      {isMember && groupMatches && groupMatches.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold">Matchs du groupe</h2>
          <div className="space-y-2">
            {groupMatches.map((match) => {
              const date = new Date(match.scheduled_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <Link
                  key={match.id}
                  href={`/matchs/${match.id}`}
                  className="flex items-center justify-between rounded-xl bg-muted p-3 transition-colors hover:bg-accent"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {match.title ?? 'Match'}
                    </p>
                    <p className="text-xs text-muted-foreground">{date}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    {match.status}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
