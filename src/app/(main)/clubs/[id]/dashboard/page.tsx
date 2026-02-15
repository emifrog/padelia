import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import DashboardStats from '@/components/club/DashboardStats';
import DashboardTimeline from '@/components/club/DashboardTimeline';
import DashboardWeekView from '@/components/club/DashboardWeekView';
import type { Club } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('clubs').select('name').eq('id', id).single();
  return { title: `Dashboard — ${data?.name ?? 'Club'}` };
}

export default async function DashboardPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: club } = await supabase
    .from('clubs')
    .select('*')
    .eq('id', id)
    .single();

  if (!club) notFound();
  const typedClub = club as Club;

  // Check ownership
  if (typedClub.owner_id !== user.id) {
    redirect(`/clubs/${id}`);
  }

  // Get courts
  const { data: courts } = await supabase
    .from('courts')
    .select('id, name')
    .eq('club_id', id)
    .eq('is_active', true);

  const courtIds = (courts ?? []).map((c) => c.id);

  // Today boundaries
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  // Week boundaries
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Month boundaries
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Fetch data in parallel
  const [
    { data: todayBookings },
    { data: weekBookings },
    { data: monthBookings },
  ] = await Promise.all([
    courtIds.length > 0
      ? supabase
          .from('bookings')
          .select('id, court_id, start_time, end_time, total_amount, status, profiles!bookings_booked_by_fkey (full_name), courts (name)')
          .in('court_id', courtIds)
          .eq('status', 'confirmed')
          .gte('start_time', todayStart.toISOString())
          .lte('start_time', todayEnd.toISOString())
          .order('start_time')
      : Promise.resolve({ data: [] }),
    courtIds.length > 0
      ? supabase
          .from('bookings')
          .select('id, start_time, total_amount, status')
          .in('court_id', courtIds)
          .eq('status', 'confirmed')
          .gte('start_time', weekStart.toISOString())
          .lte('start_time', weekEnd.toISOString())
      : Promise.resolve({ data: [] }),
    courtIds.length > 0
      ? supabase
          .from('bookings')
          .select('id, total_amount')
          .in('court_id', courtIds)
          .eq('status', 'confirmed')
          .gte('start_time', monthStart.toISOString())
          .lte('start_time', monthEnd.toISOString())
      : Promise.resolve({ data: [] }),
  ]);

  // Calculate stats
  const revenue = (monthBookings ?? []).reduce(
    (sum, b) => sum + Number(b.total_amount ?? 0),
    0,
  );

  // Fill rate: assume 12h open * courts count = total slots/day, bookings today / total
  const totalSlotsToday = (courts ?? []).length * 12;
  const fillRate = totalSlotsToday > 0
    ? ((todayBookings ?? []).length / totalSlotsToday) * 100
    : 0;

  // Format today bookings for timeline
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timelineBookings = (todayBookings ?? []).map((b: any) => {
    const profile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
    const court = Array.isArray(b.courts) ? b.courts[0] : b.courts;
    return {
      id: b.id,
      court_name: court?.name ?? 'Terrain',
      booker_name: profile?.full_name ?? 'Joueur',
      start_time: b.start_time,
      end_time: b.end_time,
    };
  });

  // Week view data
  const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const count = (weekBookings ?? []).filter(
      (b) => b.start_time.split('T')[0] === dateStr,
    ).length;
    return {
      date: dateStr,
      label: DAY_NAMES[i],
      bookingCount: count,
      maxSlots: (courts ?? []).length * 12,
    };
  });

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link
          href={`/clubs/${id}`}
          className="flex items-center gap-1 text-[14px] font-semibold text-gray-500"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-[20px] font-extrabold text-navy">
          Dashboard
        </h1>
      </div>

      <p className="text-[14px] text-gray-500">{typedClub.name}</p>

      {/* Stats */}
      <DashboardStats
        revenue={revenue}
        fillRate={fillRate}
        totalBookings={(monthBookings ?? []).length}
        averageRating={Number(typedClub.rating)}
      />

      {/* Week view */}
      <DashboardWeekView days={weekDays} />

      {/* Today timeline */}
      <div>
        <h3 className="mb-3 text-[15px] font-bold text-navy">Aujourd&apos;hui</h3>
        <DashboardTimeline
          bookings={timelineBookings}
          courts={(courts ?? []).map((c) => ({ id: c.id, name: c.name }))}
        />
      </div>
    </div>
  );
}
