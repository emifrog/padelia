'use client';

import { DAY_LABELS, DAY_ORDER } from '@/lib/constants/club';

interface Props {
  openingHours: Record<string, { open: string; close: string }>;
}

const CURRENT_DAY_INDEX = new Date().getDay();
// JS: 0=dimanche, 1=lundi... → convert to our order (0=lundi)
const TODAY_INDEX = CURRENT_DAY_INDEX === 0 ? 6 : CURRENT_DAY_INDEX - 1;

export default function OpeningHours({ openingHours }: Props) {
  if (!openingHours || Object.keys(openingHours).length === 0) return null;

  return (
    <div className="rounded-xl bg-white p-4 shadow-padel">
      <h3 className="mb-2.5 text-[14px] font-bold text-navy">Horaires</h3>
      <div className="space-y-1.5">
        {DAY_ORDER.map((day, i) => {
          const hours = openingHours[day];
          const isToday = i === TODAY_INDEX;

          return (
            <div
              key={day}
              className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-[13px] ${
                isToday ? 'bg-green-subtle font-semibold text-navy' : 'text-gray-600'
              }`}
            >
              <span>{DAY_LABELS[day]}{isToday && ' (Auj.)'}</span>
              <span>
                {hours ? `${hours.open} – ${hours.close}` : 'Fermé'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
