'use client';

import { useMemo } from 'react';
import BracketMatch from './BracketMatch';
import { getRoundLabel } from '@/lib/tournament/bracket-generator';
import type { TournamentBracket } from '@/types';

interface TeamInfo {
  id: string;
  name: string;
}

interface Props {
  brackets: TournamentBracket[];
  teamsMap: Record<string, TeamInfo>;
  isOrganizer: boolean;
  tournamentId: string;
  onScoreSubmitted?: () => void;
}

export default function BracketView({
  brackets,
  teamsMap,
  isOrganizer,
  tournamentId,
  onScoreSubmitted,
}: Props) {
  const { rounds, totalRounds } = useMemo(() => {
    if (brackets.length === 0) return { rounds: [], totalRounds: 0 };

    const maxRound = Math.max(...brackets.map((b) => b.round));

    // Group by round
    const roundGroups: Record<number, TournamentBracket[]> = {};
    for (const b of brackets) {
      if (!roundGroups[b.round]) roundGroups[b.round] = [];
      roundGroups[b.round].push(b);
    }

    // Sort each round by position
    for (const round of Object.values(roundGroups)) {
      round.sort((a, b) => a.position - b.position);
    }

    const roundNums = Object.keys(roundGroups)
      .map(Number)
      .sort((a, b) => a - b);

    return {
      rounds: roundNums.map((r) => ({
        round: r,
        matches: roundGroups[r],
      })),
      totalRounds: maxRound,
    };
  }, [brackets]);

  if (brackets.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Le bracket n&apos;a pas encore ete genere
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-[14px] font-bold text-navy">Bracket</h3>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-6" style={{ minWidth: `${rounds.length * 230}px` }}>
          {rounds.map(({ round, matches }) => (
            <div key={round} className="flex flex-col">
              {/* Round label */}
              <div className="mb-3 text-center">
                <span className="text-[12px] font-bold uppercase tracking-wider text-gray-400">
                  {getRoundLabel(round, totalRounds)}
                </span>
              </div>

              {/* Matches in this round */}
              <div
                className="flex flex-1 flex-col justify-around gap-4"
              >
                {matches.map((match) => (
                  <BracketMatch
                    key={match.id}
                    matchId={match.id}
                    tournamentId={tournamentId}
                    teamA={match.team_a_id ? teamsMap[match.team_a_id] ?? null : null}
                    teamB={match.team_b_id ? teamsMap[match.team_b_id] ?? null : null}
                    scoreA={match.score_a}
                    scoreB={match.score_b}
                    winnerId={match.winner_team_id}
                    status={match.status}
                    isOrganizer={isOrganizer}
                    onScoreSubmitted={onScoreSubmitted}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
