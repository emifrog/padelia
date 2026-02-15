'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { AbonnementContent } from '@/components/profil/AbonnementContent';

export default function AbonnementPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-green-padel" />
        </div>
      }
    >
      <AbonnementContent />
    </Suspense>
  );
}
