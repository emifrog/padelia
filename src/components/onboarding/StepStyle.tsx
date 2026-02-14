'use client';

import { SIDE_LABELS, STYLE_LABELS, GOAL_LABELS } from '@/types';
import type { PlayingSide, PlayStyle, PlayerGoal } from '@/types';
import type { OnboardingData } from '@/lib/validations/onboarding';

interface Props {
  data: Partial<OnboardingData>;
  onChange: (partial: Partial<OnboardingData>) => void;
}

const SIDE_ICONS: Record<PlayingSide, string> = {
  gauche: 'Revés',
  droite: 'Drive',
  les_deux: 'Polyvalent',
};

const STYLE_ICONS: Record<PlayStyle, string> = {
  offensif: 'Attaque',
  defensif: 'Défense',
  mixte: 'Mixte',
  polyvalent: 'Tout terrain',
};

const GOAL_ICONS: Record<PlayerGoal, string> = {
  loisir: 'Fun',
  progression: 'Evoluer',
  competition: 'Gagner',
  social: 'Rencontres',
};

function OptionGrid<T extends string>({
  label,
  options,
  descriptions,
  value,
  onChange,
}: {
  label: string;
  options: Record<T, string>;
  descriptions: Record<T, string>;
  value: T | undefined;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-300">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(options) as T[]).map((key) => {
          const isSelected = value === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                isSelected
                  ? 'border-green-padel bg-green-padel/10'
                  : 'border-navy-mid bg-navy-light hover:border-gray-500'
              }`}
            >
              <p className={`text-sm font-semibold ${isSelected ? 'text-green-padel' : 'text-white'}`}>
                {options[key]}
              </p>
              <p className="text-xs text-gray-500">{descriptions[key]}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function StepStyle({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Ton style</h2>
        <p className="mt-1 text-sm text-gray-400">
          Dis-nous comment tu joues pour trouver les meilleurs partenaires
        </p>
      </div>

      <OptionGrid
        label="Position préférée"
        options={SIDE_LABELS}
        descriptions={SIDE_ICONS}
        value={data.preferred_side}
        onChange={(v) => onChange({ preferred_side: v })}
      />

      <OptionGrid
        label="Style de jeu"
        options={STYLE_LABELS}
        descriptions={STYLE_ICONS}
        value={data.play_style}
        onChange={(v) => onChange({ play_style: v })}
      />

      <OptionGrid
        label="Objectif principal"
        options={GOAL_LABELS}
        descriptions={GOAL_ICONS}
        value={data.player_goal}
        onChange={(v) => onChange({ player_goal: v })}
      />
    </div>
  );
}
