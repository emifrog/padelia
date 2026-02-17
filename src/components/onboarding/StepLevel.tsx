'use client';

import { LEVEL_LABELS, LEVEL_SCORE_RANGES } from '@/types';
import type { PlayerLevel } from '@/types';
import type { OnboardingData } from '@/lib/validations/onboarding';

interface Props {
  data: Partial<OnboardingData>;
  onChange: (partial: Partial<OnboardingData>) => void;
}

const LEVEL_DESCRIPTIONS: Record<PlayerLevel, string> = {
  debutant: 'Je découvre le padel',
  initie: 'Je connais les bases',
  intermediaire: 'Je joue régulièrement',
  avance: 'Je maîtrise les techniques',
  expert: 'Niveau compétition loisir',
  competition: 'Compétiteur confirmé',
};

export default function StepLevel({ data, onChange }: Props) {
  function selectLevel(level: PlayerLevel) {
    const [min, max] = LEVEL_SCORE_RANGES[level];
    const midScore = Math.round(((min + max) / 2) * 10) / 10;
    onChange({ level, level_score: midScore });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Ton niveau</h2>
        <p className="mt-1 text-sm text-gray-400">
          Sélectionne le niveau qui te correspond le mieux
        </p>
      </div>

      <div className="space-y-2">
        {(Object.keys(LEVEL_LABELS) as PlayerLevel[]).map((level) => {
          const [min, max] = LEVEL_SCORE_RANGES[level];
          const isSelected = data.level === level;
          return (
            <button
              key={level}
              type="button"
              onClick={() => selectLevel(level)}
              className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                isSelected
                  ? 'border-green-padel bg-green-padel/10'
                  : 'border-navy-mid bg-navy-light hover:border-gray-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-semibold ${isSelected ? 'text-green-padel' : 'text-white'}`}>
                    {LEVEL_LABELS[level]}
                  </p>
                  <p className="text-xs text-gray-400">
                    {LEVEL_DESCRIPTIONS[level]}
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  {min} - {max}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <label htmlFor="years-playing" className="text-sm text-gray-300">
          Années de pratique : <span className="font-semibold text-white">{data.years_playing ?? 0} an{(data.years_playing ?? 0) > 1 ? 's' : ''}</span>
        </label>
        <input
          id="years-playing"
          type="range"
          min={0}
          max={20}
          aria-valuemin={0}
          aria-valuemax={20}
          aria-valuenow={data.years_playing ?? 0}
          value={data.years_playing ?? 0}
          onChange={(e) => onChange({ years_playing: Number(e.target.value) })}
          className="w-full accent-green-padel"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0</span>
          <span>20+</span>
        </div>
      </div>
    </div>
  );
}
