import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { RankingList } from '@/components/stats/RankingList';

export const metadata = { title: 'Classements' };

export default async function ClassementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get current user profile
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('id, city')
    .eq('id', user.id)
    .single();

  // Top players globally
  const { data: globalRanking } = await supabase
    .from('profiles')
    .select('id, full_name, username, level, level_score, total_matches, win_rate, city')
    .eq('is_onboarded', true)
    .gt('total_matches', 0)
    .order('level_score', { ascending: false })
    .limit(20);

  // Top players in same city
  let cityRanking: typeof globalRanking = null;
  if (myProfile?.city) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, username, level, level_score, total_matches, win_rate, city')
      .eq('is_onboarded', true)
      .eq('city', myProfile.city)
      .gt('total_matches', 0)
      .order('level_score', { ascending: false })
      .limit(20);
    cityRanking = data;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/stats"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-xl font-bold text-navy">Classements</h1>
      </div>

      {/* City ranking */}
      {myProfile?.city && (
        <RankingList
          players={cityRanking}
          title={`Classement ${myProfile.city}`}
          currentUserId={user.id}
        />
      )}

      {/* Global ranking */}
      <RankingList
        players={globalRanking}
        title="Classement général"
        currentUserId={user.id}
      />
    </div>
  );
}
