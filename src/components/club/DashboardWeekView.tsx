'use client';

interface DayData {
  date: string;
  label: string;
  bookingCount: number;
  maxSlots: number;
}

interface Props {
  days: DayData[];
}

export default function DashboardWeekView({ days }: Props) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-padel">
      <h4 className="mb-3 text-[13px] font-bold text-navy">Cette semaine</h4>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {days.map((day) => {
          const fillRate = day.maxSlots > 0 ? (day.bookingCount / day.maxSlots) * 100 : 0;
          const isToday = day.date === new Date().toISOString().split('T')[0];

          return (
            <div
              key={day.date}
              className={`flex min-w-[70px] flex-col items-center rounded-lg px-2 py-3 ${
                isToday ? 'bg-green-subtle ring-1 ring-green-padel/30' : 'bg-gray-50'
              }`}
            >
              <span className="text-[10px] font-medium text-gray-400">{day.label}</span>
              <span className="mt-1 text-[16px] font-bold text-navy">{day.bookingCount}</span>

              {/* Fill bar */}
              <div className="mt-1.5 h-1.5 w-10 overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full rounded-full ${
                    fillRate > 80 ? 'bg-amber-500' : fillRate > 50 ? 'bg-green-padel' : 'bg-green-padel/50'
                  }`}
                  style={{ width: `${Math.min(fillRate, 100)}%` }}
                />
              </div>

              <span className="mt-0.5 text-[9px] text-gray-400">{fillRate.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
