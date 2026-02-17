'use client';

import { memo } from 'react';
import { Users, Shield } from 'lucide-react';

interface TeamWithPlayers {
  id: string;
  name: string;
  seed: number | null;
  payment_status: string;
  captain_id: string;
  player_ids: string[];
  profiles: { full_name: string; avatar_url: string | null }[];
}

interface Props {
  teams: TeamWithPlayers[];
}

export default memo(function TeamList({ teams }: Props) {
  if (teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Users className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="font-medium">Aucune equipe inscrite</p>
        <p className="text-sm text-muted-foreground">
          Sois le premier a t&apos;inscrire !
        </p>
      </div>
    );
  }

  const sorted = [...teams].sort((a, b) => {
    // Seeded first
    if (a.seed !== null && b.seed !== null) return a.seed - b.seed;
    if (a.seed !== null) return -1;
    if (b.seed !== null) return 1;
    return 0;
  });

  return (
    <div className="space-y-2">
      {sorted.map((team) => (
        <div
          key={team.id}
          className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-padel"
        >
          {/* Seed badge */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50">
            {team.seed !== null ? (
              <span className="text-[14px] font-bold text-navy">#{team.seed}</span>
            ) : (
              <Shield className="h-4 w-4 text-gray-300" />
            )}
          </div>

          {/* Team info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-bold text-navy">{team.name}</p>
            <div className="flex items-center gap-1.5">
              {team.profiles.map((p, i) => (
                <div key={i} className="flex items-center gap-1">
                  {p.avatar_url ? (
                    <img
                      src={p.avatar_url}
                      alt={p.full_name}
                      className="h-5 w-5 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-400">
                      {p.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-[12px] text-gray-500">{p.full_name}</span>
                  {i < team.profiles.length - 1 && (
                    <span className="text-gray-300">&</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Payment status */}
          {team.payment_status === 'paid' && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
              Paye
            </span>
          )}
          {team.payment_status === 'pending' && (
            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold text-yellow-700">
              En attente
            </span>
          )}
        </div>
      ))}
    </div>
  );
});
