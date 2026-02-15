'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Bell } from 'lucide-react';

export default function Header() {

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-navy-inter backdrop-blur supports-[backdrop-filter]:bg-navy-inter">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <Link href="/accueil" className="flex items-center gap-2.5">
          <Image
            src="/logo-small.png"
            alt="Padelia"
            width={50}
            height={50}
            className="rounded-full object-contain"
          />
          <span className="text-lg font-extrabold tracking-wider text-white">
            PADELIA
          </span>
        </Link>

        {/* Bell with red notification dot */}
        <Link
          href="/profil/notifications"
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
