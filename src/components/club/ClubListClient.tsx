'use client';

import { useState, useCallback } from 'react';
import ClubCard, { type ClubCardData } from '@/components/club/ClubCard';
import { Search, Building2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

const PAGE_SIZE = 12;

interface Props {
  clubs: ClubCardData[];
}

export default function ClubListClient({ clubs: initialClubs }: Props) {
  const [search, setSearch] = useState('');
  const [clubs, setClubs] = useState<ClubCardData[]>(initialClubs);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialClubs.length >= PAGE_SIZE);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    try {
      const supabase = createClient();
      const lastClub = clubs[clubs.length - 1];
      if (!lastClub) return;

      const { data } = await supabase
        .from('clubs')
        .select('id, name, city, address, rating, total_reviews, amenities, logo_url')
        .eq('status', 'active')
        .or(`rating.lt.${lastClub.rating},and(rating.eq.${lastClub.rating},id.gt.${lastClub.id})`)
        .order('rating', { ascending: false })
        .order('id', { ascending: true })
        .limit(PAGE_SIZE);

      if (!data || data.length === 0) {
        setHasMore(false);
        return;
      }

      const newClubs: ClubCardData[] = data.map((c) => ({
        id: c.id,
        name: c.name,
        city: c.city,
        address: c.address,
        rating: Number(c.rating),
        total_reviews: c.total_reviews,
        amenities: c.amenities ?? [],
        logo_url: c.logo_url,
      }));

      setClubs((prev) => [...prev, ...newClubs]);
      if (newClubs.length < PAGE_SIZE) setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [clubs, loadingMore, hasMore]);

  const filtered = clubs.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          placeholder="Chercher un club, une ville..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          aria-label="Rechercher un club"
        />
      </div>

      {/* Results */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((c) => (
            <ClubCard key={c.id} club={c} />
          ))}

          {hasMore && !search && (
            <Button
              variant="outline"
              className="w-full"
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Charger plus
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">Aucun club trouvé</p>
          <p className="text-sm text-muted-foreground">
            Modifie ta recherche
          </p>
        </div>
      )}
    </div>
  );
}
