import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GroupCard from '@/components/group/GroupCard';

export const metadata = { title: 'Groupes' };

export default async function GroupesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch groups user is a member of
  const { data: myMemberships } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id);

  const myGroupIds = (myMemberships ?? []).map((m) => m.group_id);

  // Fetch user's groups
  let myGroups: Array<{
    id: string;
    name: string;
    description: string | null;
    visibility: string;
    city: string | null;
    member_count: number;
    max_members: number;
  }> = [];

  if (myGroupIds.length > 0) {
    const { data } = await supabase
      .from('groups')
      .select('id, name, description, visibility, city, member_count, max_members')
      .in('id', myGroupIds)
      .order('updated_at', { ascending: false });
    myGroups = data ?? [];
  }

  // Fetch public groups (that user is NOT a member of)
  const { data: publicGroupsRaw } = await supabase
    .from('groups')
    .select('id, name, description, visibility, city, member_count, max_members')
    .eq('visibility', 'public')
    .order('member_count', { ascending: false })
    .limit(20);

  const publicGroups = (publicGroupsRaw ?? []).filter(
    (g) => !myGroupIds.includes(g.id),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Groupes</h1>
        <Button size="sm" asChild>
          <Link href="/groupes/creer">
            <Plus className="mr-1.5 h-4 w-4" />
            Créer
          </Link>
        </Button>
      </div>

      {/* My groups */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Mes groupes</h2>
        {myGroups.length > 0 ? (
          <div className="space-y-1">
            {myGroups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Tu n&apos;as rejoint aucun groupe
            </p>
          </div>
        )}
      </section>

      {/* Discover */}
      {publicGroups.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Découvrir</h2>
          <div className="space-y-1">
            {publicGroups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
