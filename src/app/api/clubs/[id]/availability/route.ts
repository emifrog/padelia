import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/clubs/[id]/availability?court_id=X&date=YYYY-MM-DD
 * Returns occupied time slots for a court on a given date.
 * Public endpoint (no auth required) — only exposes slot times, not booking details.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { id: clubId } = await context.params;
  const { searchParams } = new URL(request.url);
  const courtId = searchParams.get('court_id');
  const date = searchParams.get('date');

  if (!courtId || !date) {
    return NextResponse.json(
      { error: 'court_id et date requis' },
      { status: 400 },
    );
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: 'Format date invalide (YYYY-MM-DD)' },
      { status: 400 },
    );
  }

  const supabase = getAdminClient();

  // Verify court belongs to this club
  const { data: court } = await supabase
    .from('courts')
    .select('id, club_id')
    .eq('id', courtId)
    .eq('club_id', clubId)
    .single();

  if (!court) {
    return NextResponse.json(
      { error: 'Terrain non trouvé' },
      { status: 404 },
    );
  }

  // Get all non-cancelled bookings for this court on this date
  const dayStart = `${date}T00:00:00.000Z`;
  const dayEnd = `${date}T23:59:59.999Z`;

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('start_time, end_time')
    .eq('court_id', courtId)
    .neq('status', 'cancelled')
    .gte('start_time', dayStart)
    .lte('start_time', dayEnd)
    .order('start_time');

  if (error) {
    console.error('[availability] Query error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }

  const occupied = (bookings ?? []).map((b) => ({
    start_time: b.start_time,
    end_time: b.end_time,
  }));

  return NextResponse.json({ occupied });
}
