import Link from 'next/link';
import { SURFACE_LABELS, SURFACE_COLORS } from '@/lib/constants/club';
import type { Court, CourtSurface } from '@/types';

interface Props {
  courts: Court[];
  clubId: string;
}

export default function CourtList({ courts, clubId }: Props) {
  if (courts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">Aucun terrain disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <h3 className="text-[14px] font-bold text-navy">
        Terrains ({courts.length})
      </h3>
      {courts.map((court) => (
        <Link
          key={court.id}
          href={`/clubs/${clubId}/reserver?court=${court.id}`}
          className="flex items-center gap-3.5 rounded-xl bg-white p-4 shadow-padel transition-transform active:scale-[0.98]"
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
        </Link>
      ))}
    </div>
  );
}
