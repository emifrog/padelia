'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, MapPin } from 'lucide-react';
import type { OnboardingData } from '@/lib/validations/onboarding';

interface Props {
  data: Partial<OnboardingData>;
  onChange: (partial: Partial<OnboardingData>) => void;
}

export default function StepIdentity({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Ton profil joueur</h2>
        <p className="mt-1 text-sm text-gray-400">
          Choisis un pseudo et indique ta ville
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username" className="text-gray-300">
            Pseudo
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              id="username"
              placeholder="lucas_padel"
              value={data.username ?? ''}
              onChange={(e) =>
                onChange({ username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })
              }
              maxLength={20}
              className="border-navy-mid bg-navy-light pl-10 text-white placeholder:text-gray-500"
            />
          </div>
          <p className="text-xs text-gray-500">
            Lettres minuscules, chiffres et _
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="city" className="text-gray-300">
            Ville
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              id="city"
              placeholder="Nice"
              value={data.city ?? ''}
              onChange={(e) => onChange({ city: e.target.value })}
              className="border-navy-mid bg-navy-light pl-10 text-white placeholder:text-gray-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hand" className="text-gray-300">
            Main dominante
          </Label>
          <div className="flex gap-3">
            {(['droite', 'gauche'] as const).map((hand) => (
              <button
                key={hand}
                type="button"
                onClick={() => onChange({ dominant_hand: hand })}
                className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                  data.dominant_hand === hand
                    ? 'border-green-padel bg-green-padel/10 text-green-padel'
                    : 'border-navy-mid bg-navy-light text-gray-400 hover:border-gray-500'
                }`}
              >
                {hand === 'droite' ? 'Droitier' : 'Gaucher'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
