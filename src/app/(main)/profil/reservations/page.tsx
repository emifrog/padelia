import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ReservationsList from '@/components/club/ReservationsList';

export const metadata = { title: 'Mes réservations' };

export default async function ReservationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id, start_time, end_time, status, total_amount, stripe_payment_intent_id,
      courts (id, name, club_id, clubs (id, name))
    `)
    .eq('booked_by', user.id)
    .order('start_time', { ascending: false })
    .limit(20);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatted = (bookings ?? []).map((b: any) => {
    const court = Array.isArray(b.courts) ? b.courts[0] : b.courts;
    const club = court ? (Array.isArray(court.clubs) ? court.clubs[0] : court.clubs) : null;
    return {
      id: b.id,
      court_name: court?.name ?? 'Terrain',
      club_name: club?.name ?? 'Club',
      club_id: club?.id ?? '',
      start_time: b.start_time,
      end_time: b.end_time,
      status: b.status,
      total_amount: Number(b.total_amount),
    };
  });

  const upcoming = formatted.filter(
    (b: { status: string; start_time: string }) =>
      b.status === 'confirmed' && new Date(b.start_time) > new Date(),
  );
  const past = formatted.filter(
    (b: { status: string; start_time: string }) =>
      b.status !== 'confirmed' || new Date(b.start_time) <= new Date(),
  );

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center gap-2">
        <Link
          href="/profil"
          className="flex items-center gap-1 text-[14px] font-semibold text-gray-500"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-[20px] font-extrabold text-navy">Mes réservations</h1>
      </div>

      <ReservationsList upcoming={upcoming} past={past} />
    </div>
  );
}
