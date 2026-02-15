'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export function useBookingActions() {
  const [loading, setLoading] = useState(false);

  async function cancelBooking(bookingId: string): Promise<boolean> {
    setLoading(true);
    try {
      const res = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'Erreur lors de l\'annulation');
        return false;
      }

      toast.success('Réservation annulée et remboursée');
      return true;
    } catch {
      toast.error('Erreur de connexion');
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { cancelBooking, loading };
}
