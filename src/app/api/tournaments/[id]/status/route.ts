import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['registration_open', 'cancelled'],
  registration_open: ['registration_closed', 'cancelled'],
  registration_closed: ['registration_open', 'in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    let status: string;
    const contentType = request.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      status = body.status;
    } else {
      const formData = await request.formData();
      status = formData.get('status') as string;
    }

    if (!status) {
      return NextResponse.json({ error: 'Statut requis' }, { status: 400 });
    }

    // Fetch tournament
    const { data: tournament, error: fetchError } = await supabase
      .from('tournaments')
      .select('id, organizer_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !tournament) {
      return NextResponse.json({ error: 'Tournoi introuvable' }, { status: 404 });
    }

    // Check organizer
    if (tournament.organizer_id !== user.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
    }

    // Check valid transition
    const allowed = VALID_TRANSITIONS[tournament.status] ?? [];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: `Transition invalide: ${tournament.status} → ${status}` },
        { status: 400 },
      );
    }

    // Update
    const { error: updateError } = await supabase
      .from('tournaments')
      .update({ status })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: 'Erreur lors de la mise a jour' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Statut mis a jour' });
  } catch (error) {
    console.error('[tournaments/status]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
