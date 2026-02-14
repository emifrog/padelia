'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DAYS, TIME_SLOTS, type AvailabilityData } from '@/lib/validations/availability';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, ChevronLeft, Save, Check } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const DAY_LABELS: Record<string, string> = {
  lundi: 'Lun',
  mardi: 'Mar',
  mercredi: 'Mer',
  jeudi: 'Jeu',
  vendredi: 'Ven',
  samedi: 'Sam',
  dimanche: 'Dim',
};

const SLOT_LABELS: Record<string, string> = {
  '06:00-08:00': '6h-8h',
  '08:00-10:00': '8h-10h',
  '10:00-12:00': '10h-12h',
  '12:00-14:00': '12h-14h',
  '14:00-16:00': '14h-16h',
  '16:00-18:00': '16h-18h',
  '18:00-20:00': '18h-20h',
  '20:00-22:00': '20h-22h',
};

export default function DisponibilitesPage() {
  const [availability, setAvailability] = useState<AvailabilityData>({
    lundi: [], mardi: [], mercredi: [], jeudi: [],
    vendredi: [], samedi: [], dimanche: [],
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('availability')
        .eq('id', user.id)
        .single();

      if (profile?.availability) {
        setAvailability((prev) => ({ ...prev, ...profile.availability }));
      }
      setFetching(false);
    }
    load();
  }, [supabase, router]);

  function toggleSlot(day: string, slot: string) {
    setAvailability((prev) => {
      const daySlots = prev[day as keyof AvailabilityData] ?? [];
      const has = daySlots.includes(slot);
      return {
        ...prev,
        [day]: has ? daySlots.filter((s) => s !== slot) : [...daySlots, slot],
      };
    });
  }

  function isSelected(day: string, slot: string): boolean {
    return (availability[day as keyof AvailabilityData] ?? []).includes(slot);
  }

  async function handleSave() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ availability })
      .eq('id', user.id);

    if (error) {
      toast.error('Erreur lors de la sauvegarde');
      setLoading(false);
      return;
    }

    toast.success('Disponibilités mises à jour !');
    router.push('/profil');
    router.refresh();
  }

  const totalSlots = DAYS.reduce(
    (sum, day) => sum + (availability[day]?.length ?? 0),
    0,
  );

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/profil"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Disponibilités</h1>
          <p className="text-xs text-muted-foreground">
            {totalSlots} créneau{totalSlots > 1 ? 'x' : ''} sélectionné{totalSlots > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Sélectionne les créneaux où tu es généralement disponible pour jouer.
      </p>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr>
              <th className="p-1 text-left text-xs text-muted-foreground" />
              {DAYS.map((day) => (
                <th key={day} className="p-1 text-center text-xs font-medium">
                  {DAY_LABELS[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((slot) => (
              <tr key={slot}>
                <td className="whitespace-nowrap p-1 text-right text-xs text-muted-foreground">
                  {SLOT_LABELS[slot]}
                </td>
                {DAYS.map((day) => {
                  const selected = isSelected(day, slot);
                  return (
                    <td key={day} className="p-1">
                      <button
                        type="button"
                        onClick={() => toggleSlot(day, slot)}
                        className={cn(
                          'flex h-9 w-full items-center justify-center rounded-lg text-xs transition-colors',
                          selected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80 text-muted-foreground',
                        )}
                      >
                        {selected && <Check className="h-3.5 w-3.5" />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button
        onClick={handleSave}
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Enregistrer
      </Button>
    </div>
  );
}
