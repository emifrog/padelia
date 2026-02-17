'use client';

import { memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Swords, Map, MessageCircle, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/accueil', label: 'Accueil', icon: Home },
  { href: '/matchs', label: 'Matchs', icon: Swords },
  { href: '/carte', label: 'Carte', icon: Map },
  { href: '/chat', label: 'Chat', icon: MessageCircle },
  { href: '/profil', label: 'Profil', icon: User },
] as const;

export default memo(function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white shadow-[0_-2px_12px_rgba(0,0,0,0.04)]" aria-label="Navigation principale">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-3 pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors"
            >
              {/* Green indicator line above active tab */}
              {isActive && (
                <div className="absolute -top-2 h-[3px] w-6 rounded-full bg-green-padel" />
              )}

              <div className="relative">
                <Icon
                  aria-hidden="true"
                  className={`h-6 w-6 ${isActive ? 'text-green-padel' : 'text-gray-400'}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>

              <span
                className={`text-[10px] ${
                  isActive ? 'font-bold text-green-padel' : 'font-medium text-gray-400'
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
});
