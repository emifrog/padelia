'use client';

import { useRouter } from 'next/navigation';
import BookingCard, { type BookingCardData } from '@/components/club/BookingCard';
import { useBookingActions } from '@/hooks/use-booking-actions';
import { CalendarDays } from 'lucide-react';

interface Props {
  upcoming: BookingCardData[];
  past: BookingCardData[];
}

export default function ReservationsList({ upcoming, past }: Props) {
  const { cancelBooking, loading } = useBookingActions();
  const router = useRouter();

  async function handleCancel(bookingId: string) {
    const ok = await cancelBooking(bookingId);
    if (ok) router.refresh();
  }

  return (
    <div className="space-y-5">
      {/* Upcoming */}
      <section>
        <h2 className="mb-3 text-[15px] font-bold text-navy">À venir</h2>
        {upcoming.length > 0 ? (
          <div className="space-y-2.5">
            {upcoming.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                onCancel={handleCancel}
                cancelling={loading}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-8 text-center">
            <CalendarDays className="mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Aucune réservation à venir</p>
          </div>
        )}
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 className="mb-3 text-[15px] font-bold text-navy">Passées</h2>
          <div className="space-y-2.5">
            {past.map((b) => (
              <BookingCard key={b.id} booking={b} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
