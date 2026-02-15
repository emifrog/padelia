import { LEVEL_SCORE_RANGES } from '@/types';
import type { PlayerLevel } from '@/types';

interface Props {
  level: PlayerLevel;
  score: number;
}

export default function LevelProgressBar({ level, score }: Props) {
  const [min, max] = LEVEL_SCORE_RANGES[level];
  const progress = ((score - min) / (max - min)) * 100;
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className="w-28">
      <div className="mb-1 flex justify-between text-[10px] text-gray-400">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-gray-100">
        <div
          className="h-2.5 rounded-full bg-green-padel transition-all"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}
