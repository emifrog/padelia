import { createClient } from '@/lib/supabase/server';
import ClubListClient from '@/components/club/ClubListClient';
import type { ClubCardData } from '@/components/club/ClubCard';

export const metadata = { title: 'Clubs' };

export default async function ClubsPage() {
  const supabase = await createClient();

  const { data: rawClubs } = await supabase
    .from('clubs')
    .select('id, name, city, address, rating, total_reviews, amenities, logo_url')
    .eq('status', 'active')
    .order('rating', { ascending: false })
    .limit(12);

  const clubs: ClubCardData[] = (rawClubs ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    city: c.city,
    address: c.address,
    rating: Number(c.rating),
    total_reviews: c.total_reviews,
    amenities: c.amenities ?? [],
    logo_url: c.logo_url,
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-[22px] font-extrabold text-navy">Clubs</h1>
      <ClubListClient clubs={clubs} />
    </div>
  );
}
