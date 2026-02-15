'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { SURFACE_LABELS, SURFACE_COLORS } from '@/lib/constants/club';
import type { Court, CourtSurface, Club } from '@/types';
import AvailabilityGrid from '@/components/club/AvailabilityGrid';
import BookingConfirmation from '@/components/club/BookingConfirmation';
import { toast } from 'sonner';

type Step = 'court' | 'date' | 'slot' | 'confirm';

export default function ReserverPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const clubId = params.id;

  const [club, setClub] = useState<Club | null>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>('court');
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [paying, setPaying] = useState(false);

  // Load club + courts
  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const [{ data: clubData }, { data: courtsData }] = await Promise.all([
        supabase.from('clubs').select('*').eq('id', clubId).single(),
        supabase.from('courts').select('*').eq('club_id', clubId).eq('is_active', true).order('name'),
      ]);

      setClub(clubData as Club | null);
      setCourts((courtsData ?? []) as Court[]);
      setLoading(false);

      // Pre-select court from URL param
      const courtParam = searchParams.get('court');
      if (courtParam && courtsData) {
        const found = courtsData.find((c: Court) => c.id === courtParam);
        if (found) {
          setSelectedCourt(found as Court);
          setStep('date');
        }
      }
    }

    load();
  }, [clubId, searchParams]);

  // Generate next 14 days
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  async function handlePay() {
    if (!selectedCourt || !selectedSlot) return;

    setPaying(true);
    try {
      const startTime = selectedSlot.start.split('T')[1]?.slice(0, 5) ?? '00:00';

      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          court_id: selectedCourt.id,
          date: selectedDate,
          start_time: startTime,
          duration_minutes: 60,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'Erreur lors de la réservation');
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!club) {
    return <p className="py-12 text-center text-muted-foreground">Club non trouvé</p>;
  }

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link
          href={`/clubs/${clubId}`}
          className="flex items-center gap-1 text-[14px] font-semibold text-gray-500"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-[20px] font-extrabold text-navy">Réserver</h1>
      </div>

      {/* Step indicator */}
      <div className="flex gap-1">
        {(['court', 'date', 'slot', 'confirm'] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${
              i <= ['court', 'date', 'slot', 'confirm'].indexOf(step)
                ? 'bg-green-padel'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Choose court */}
      {step === 'court' && (
        <div className="space-y-3">
          <h2 className="text-[16px] font-bold text-navy">Choisis un terrain</h2>
          {courts.map((court) => (
            <button
              key={court.id}
              type="button"
              onClick={() => { setSelectedCourt(court); setStep('date'); }}
              className={`flex w-full items-center gap-3.5 rounded-xl p-4 text-left transition-all active:scale-[0.98] ${
                selectedCourt?.id === court.id
                  ? 'bg-green-padel/10 ring-2 ring-green-padel shadow-padel-md'
                  : 'bg-white shadow-padel'
              }`}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-green-subtle text-[20px]">
                🎾
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-navy">{court.name}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${SURFACE_COLORS[court.surface as CourtSurface] ?? 'bg-gray-100 text-gray-600'}`}>
                    {SURFACE_LABELS[court.surface as CourtSurface] ?? court.surface}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {court.is_indoor ? 'Intérieur' : 'Extérieur'}
                  </span>
                </div>
              </div>
              {court.hourly_rate != null && (
                <div className="shrink-0 text-right">
                  <p className="text-[16px] font-extrabold text-green-padel">{court.hourly_rate}€</p>
                  <p className="text-[10px] text-gray-400">/heure</p>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Choose date */}
      {step === 'date' && (
        <div className="space-y-3">
          <h2 className="text-[16px] font-bold text-navy">Choisis une date</h2>
          <div className="grid grid-cols-4 gap-2">
            {dates.map((d) => {
              const dateObj = new Date(d + 'T12:00:00');
              const isSelected = selectedDate === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => { setSelectedDate(d); setStep('slot'); }}
                  className={`rounded-lg px-2 py-3 text-center transition-all ${
                    isSelected
                      ? 'bg-green-padel text-white shadow-padel-md'
                      : 'bg-white text-navy shadow-padel hover:shadow-padel-md active:scale-[0.97]'
                  }`}
                >
                  <p className="text-[11px] capitalize">
                    {dateObj.toLocaleDateString('fr-FR', { weekday: 'short' })}
                  </p>
                  <p className="text-[18px] font-bold">{dateObj.getDate()}</p>
                  <p className="text-[10px] capitalize">
                    {dateObj.toLocaleDateString('fr-FR', { month: 'short' })}
                  </p>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setStep('court')}
            className="text-[13px] font-medium text-gray-400"
          >
            ← Changer de terrain
          </button>
        </div>
      )}

      {/* Step 3: Choose slot */}
      {step === 'slot' && selectedCourt && selectedDate && (
        <div className="space-y-3">
          <h2 className="text-[16px] font-bold text-navy">
            Choisis un créneau — {new Date(selectedDate + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>
          <AvailabilityGrid
            clubId={clubId}
            courtId={selectedCourt.id}
            date={selectedDate}
            hourlyRate={selectedCourt.hourly_rate ?? 0}
            openingHours={club.opening_hours}
            onSelect={(start, end) => {
              setSelectedSlot({ start, end });
              setStep('confirm');
            }}
          />
          <button
            type="button"
            onClick={() => setStep('date')}
            className="text-[13px] font-medium text-gray-400"
          >
            ← Changer de date
          </button>
        </div>
      )}

      {/* Step 4: Confirmation */}
      {step === 'confirm' && selectedCourt && selectedSlot && (
        <BookingConfirmation
          clubName={club.name}
          courtName={selectedCourt.name}
          date={selectedDate}
          startTime={selectedSlot.start.split('T')[1]?.slice(0, 5) ?? ''}
          endTime={selectedSlot.end.split('T')[1]?.slice(0, 5) ?? ''}
          totalAmount={selectedCourt.hourly_rate ?? 0}
          loading={paying}
          onConfirm={handlePay}
          onBack={() => setStep('slot')}
        />
      )}
    </div>
  );
}
