'use client';

import { memo, useMemo } from 'react';
import Link from 'next/link';
import { CalendarDays, Clock } from 'lucide-react';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from '@/lib/constants/club';
import type { BookingStatus } from '@/types';

export interface BookingCardData {
  id: string;
  court_name: string;
  club_name: string;
  club_id: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  total_amount: number;
}

interface Props {
  booking: BookingCardData;
  onCancel?: (bookingId: string) => void;
  cancelling?: boolean;
}

export default memo(function BookingCard({ booking, onCancel, cancelling }: Props) {
  const startDate = useMemo(() => new Date(booking.start_time), [booking.start_time]);
  const endDate = useMemo(() => new Date(booking.end_time), [booking.end_time]);
  const canCancel = useMemo(() => {
    const now = new Date();
    const upcoming = startDate > now && booking.status === 'confirmed';
    const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return upcoming && hoursUntilStart > 24;
  }, [startDate, booking.status]);

  return (
    <div className="rounded-xl bg-white p-4 shadow-padel">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Link href={`/clubs/${booking.club_id}`} className="text-[15px] font-bold text-navy hover:underline">
            {booking.club_name}
          </Link>
          <p className="mt-0.5 text-[13px] text-gray-500">{booking.court_name}</p>
        </div>

        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${BOOKING_STATUS_COLORS[booking.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] text-gray-400">
        <span className="flex items-center gap-1">
          <CalendarDays className="h-3 w-3" />
          {startDate.toLocaleDateString('fr-FR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          })}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          {' – '}
          {endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[16px] font-bold text-green-padel">{booking.total_amount}€</span>

        {canCancel && onCancel && (
          <button
            type="button"
            onClick={() => onCancel(booking.id)}
            disabled={cancelling}
            className="rounded-lg bg-red-50 px-3 py-1.5 text-[12px] font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
          >
            {cancelling ? 'Annulation...' : 'Annuler'}
          </button>
        )}
      </div>
    </div>
  );
});
