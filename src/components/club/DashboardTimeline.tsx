'use client';

interface BookingSlot {
  id: string;
  court_name: string;
  booker_name: string;
  start_time: string;
  end_time: string;
}

interface Props {
  bookings: BookingSlot[];
  courts: { id: string; name: string }[];
}

export default function DashboardTimeline({ bookings, courts }: Props) {
  if (bookings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">Aucune réservation aujourd&apos;hui</p>
      </div>
    );
  }

  // Group bookings by court
  const byCourt = courts.map((court) => ({
    ...court,
    bookings: bookings
      .filter((b) => b.court_name === court.name)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()),
  }));

  return (
    <div className="space-y-3">
      {byCourt.map((court) => (
        <div key={court.id} className="rounded-xl bg-white p-4 shadow-padel">
          <h4 className="mb-2 text-[13px] font-bold text-navy">{court.name}</h4>
          {court.bookings.length > 0 ? (
            <div className="space-y-1.5">
              {court.bookings.map((b) => {
                const start = new Date(b.start_time);
                const end = new Date(b.end_time);
                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-lg bg-green-subtle px-3 py-2"
                  >
                    <span className="text-[12px] font-semibold text-navy">
                      {start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      {' – '}
                      {end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[12px] text-gray-500">{b.booker_name}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[12px] text-gray-400">Aucune réservation</p>
          )}
        </div>
      ))}
    </div>
  );
}
