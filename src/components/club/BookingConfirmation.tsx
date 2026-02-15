'use client';

import { CalendarDays, Clock, MapPin, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  clubName: string;
  courtName: string;
  date: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  loading: boolean;
  onConfirm: () => void;
  onBack: () => void;
}

export default function BookingConfirmation({
  clubName,
  courtName,
  date,
  startTime,
  endTime,
  totalAmount,
  loading,
  onConfirm,
  onBack,
}: Props) {
  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-4 shadow-padel">
        <h3 className="mb-3 text-[15px] font-bold text-navy">Récapitulatif</h3>

        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5 text-[13px] text-gray-600">
            <MapPin className="h-4 w-4 shrink-0 text-green-padel" />
            <span>{clubName} — {courtName}</span>
          </div>

          <div className="flex items-center gap-2.5 text-[13px] text-gray-600">
            <CalendarDays className="h-4 w-4 shrink-0 text-green-padel" />
            <span className="capitalize">{formattedDate}</span>
          </div>

          <div className="flex items-center gap-2.5 text-[13px] text-gray-600">
            <Clock className="h-4 w-4 shrink-0 text-green-padel" />
            <span>{startTime} – {endTime}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t pt-3">
          <span className="text-[14px] font-bold text-navy">Total</span>
          <span className="text-[20px] font-extrabold text-green-padel">{totalAmount}€</span>
        </div>
      </div>

      <div className="space-y-2">
        <Button
          onClick={onConfirm}
          disabled={loading}
          className="w-full bg-green-padel text-white hover:bg-green-padel/90"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CreditCard className="mr-2 h-4 w-4" />
          )}
          Payer {totalAmount}€
        </Button>

        <Button
          variant="outline"
          onClick={onBack}
          disabled={loading}
          className="w-full"
        >
          Modifier
        </Button>
      </div>

      <p className="text-center text-[11px] text-gray-400">
        Annulation gratuite jusqu&apos;à 24h avant le début
      </p>
    </div>
  );
}
