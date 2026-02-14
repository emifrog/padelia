'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';

const SCREEN_TITLES: Record<string, string> = {
  '/matchs': 'Matchs',
  '/joueurs': 'Joueurs',
  '/carte': 'Carte',
  '/chat': 'Messages',
  '/groupes': 'Groupes',
  '/stats': 'Statistiques',
  '/profil': 'Mon profil',
};

export default function Header() {
  const pathname = usePathname();

  // Find matching title (startsWith for nested routes)
  const title = Object.entries(SCREEN_TITLES).find(([path]) =>
    pathname.startsWith(path),
  )?.[1];

  const isHome = pathname === '/accueil' || pathname === '/';

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        {isHome ? (
          <Link href="/accueil" className="flex items-center gap-2.5">
            {/* Green gradient logo "P" */}
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-gradient text-base font-black text-white">
              P
            </div>
            <span className="text-lg font-extrabold tracking-wider text-navy">
              PADELIA
            </span>
          </Link>
        ) : (
          <h1 className="text-2xl font-extrabold text-navy">
            {title ?? 'Padelia'}
          </h1>
        )}

        {/* Bell with red notification dot */}
        <Link
          href="/notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-padel"
        >
          <Bell className="h-[22px] w-[22px] text-navy" />
          <div className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          <span className="sr-only">Notifications</span>
        </Link>
      </div>
    </header>
  );
}
