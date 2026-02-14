'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function FabButton() {
  return (
    <Link
      href="/matchs/creer"
      className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-gradient text-white shadow-green animate-fab-pulse"
      aria-label="Créer un match"
    >
      <Plus className="h-7 w-7" strokeWidth={2.5} />
    </Link>
  );
}
