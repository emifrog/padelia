import { Euro, CalendarDays, BarChart3, Star } from 'lucide-react';

interface Props {
  revenue: number;
  fillRate: number;
  totalBookings: number;
  averageRating: number;
}

export default function DashboardStats({ revenue, fillRate, totalBookings, averageRating }: Props) {
  const stats = [
    {
      label: 'Revenu du mois',
      value: `${revenue.toFixed(0)}€`,
      icon: Euro,
      color: 'bg-green-subtle text-green-padel',
    },
    {
      label: 'Taux remplissage',
      value: `${fillRate.toFixed(0)}%`,
      icon: BarChart3,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Réservations',
      value: totalBookings.toString(),
      icon: CalendarDays,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Note moyenne',
      value: averageRating > 0 ? averageRating.toFixed(1) : '—',
      icon: Star,
      color: 'bg-purple-50 text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl bg-white p-4 shadow-padel">
          <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${s.color}`}>
            <s.icon className="h-4.5 w-4.5" />
          </div>
          <p className="text-[22px] font-extrabold text-navy">{s.value}</p>
          <p className="text-[11px] text-gray-400">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
