'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
  clubId: string;
  courtId: string;
  date: string;
  hourlyRate: number;
  openingHours: Record<string, { open: string; close: string }>;
  onSelect: (startTime: string, endTime: string) => void;
}

interface OccupiedSlot {
  start_time: string;
  end_time: string;
}

const DAY_MAP = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

export default function AvailabilityGrid({ clubId, courtId, date, hourlyRate, openingHours, onSelect }: Props) {
  const [occupied, setOccupied] = useState<OccupiedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setSelected(null);

    fetch(`/api/clubs/${clubId}/availability?court_id=${courtId}&date=${date}`)
      .then((res) => res.json())
      .then((data) => setOccupied(data.occupied ?? []))
      .catch(() => setOccupied([]))
      .finally(() => setLoading(false));
  }, [clubId, courtId, date]);

  // Generate time slots from opening hours
  const dayOfWeek = DAY_MAP[new Date(date + 'T12:00:00').getDay()];
  const hours = openingHours[dayOfWeek];

  if (!hours) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">Club fermé ce jour</p>
      </div>
    );
  }

  const openHour = parseInt(hours.open.split(':')[0], 10);
  const closeHour = parseInt(hours.close.split(':')[0], 10);

  const slots: { time: string; endTime: string; label: string }[] = [];
  for (let h = openHour; h < closeHour; h++) {
    const time = `${h.toString().padStart(2, '0')}:00`;
    const endTime = `${(h + 1).toString().padStart(2, '0')}:00`;
    slots.push({ time, endTime, label: `${time} – ${endTime}` });
  }

  function isOccupied(slotTime: string): boolean {
    const slotStart = new Date(`${date}T${slotTime}:00`);
    const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);

    return occupied.some((o) => {
      const oStart = new Date(o.start_time);
      const oEnd = new Date(o.end_time);
      return slotStart < oEnd && slotEnd > oStart;
    });
  }

  function isPast(slotTime: string): boolean {
    const slotStart = new Date(`${date}T${slotTime}:00`);
    return slotStart <= new Date();
  }

  function handleSelect(slot: { time: string; endTime: string }) {
    setSelected(slot.time);
    onSelect(`${date}T${slot.time}:00`, `${date}T${slot.endTime}:00`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[12px] text-gray-400">
        Sélectionne un créneau · {hourlyRate}€/h
      </p>
      <div className="grid grid-cols-3 gap-2">
        {slots.map((slot) => {
          const booked = isOccupied(slot.time);
          const past = isPast(slot.time);
          const isSelected = selected === slot.time;
          const disabled = booked || past;

          return (
            <button
              key={slot.time}
              type="button"
              disabled={disabled}
              onClick={() => handleSelect(slot)}
              className={`rounded-lg px-2 py-2.5 text-[13px] font-medium transition-all ${
                disabled
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  : isSelected
                    ? 'bg-green-padel text-white shadow-padel-md'
                    : 'bg-white text-navy shadow-padel hover:shadow-padel-md active:scale-[0.97]'
              }`}
            >
              {slot.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
