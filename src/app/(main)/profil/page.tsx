import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LEVEL_LABELS, SIDE_LABELS, STYLE_LABELS } from '@/types';
import type { PlayerLevel, PlayingSide, PlayStyle } from '@/types';
import { BarChart3, Calendar, CalendarCheck, ChevronRight, Pencil, Bell, Settings, Star, Crown, Users } from 'lucide-react';
import Image from 'next/image';
import LogoutButton from '@/components/layout/LogoutButton';

export const metadata = { title: 'Profil' };

export default async function ProfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/onboarding');

  const availabilityCount = Object.values(profile.availability ?? {}).reduce(
    (sum: number, slots: unknown) => sum + (Array.isArray(slots) ? slots.length : 0),
    0,
  );

  const isPremium = profile.is_premium;

  return (
    <div className="space-y-4">
      {/* ── Profile hero card (navy gradient) ── */}
      <div className="relative overflow-hidden rounded-2xl bg-navy-gradient p-6">
        {/* Decorative circle */}
        <div className="absolute -right-8 -top-8 h-[120px] w-[120px] rounded-full bg-green-padel/8" />

        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full border-[3px] border-green-padel/35 bg-gradient-to-br from-green-padel/20 to-lime-padel/20 text-4xl">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.full_name ?? 'Avatar'}
                width={72}
                height={72}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              profile.full_name?.charAt(0)?.toUpperCase() ?? '?'
            )}
          </div>

          <div>
            <h1 className="text-[22px] font-extrabold text-white">{profile.full_name}</h1>
            <p className="mt-0.5 text-[13px] text-gray-300">
              @{profile.username}
              {profile.city && ` · ${profile.city}`}
            </p>
            {/* Badges */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-green-padel/25 px-2 py-0.5 text-[11px] font-bold text-green-padel-light">
                {LEVEL_LABELS[profile.level as PlayerLevel]}
              </span>
              <span className="rounded-full bg-lime-padel/20 px-2 py-0.5 text-[11px] font-bold text-lime-padel">
                {SIDE_LABELS[profile.preferred_side as PlayingSide]}
              </span>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-400">
                {STYLE_LABELS[profile.play_style as PlayStyle]}
              </span>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="mt-5 grid grid-cols-4 gap-2">
          {[
            [String(profile.total_matches), 'Matchs'],
            [`${profile.win_rate}%`, 'Win rate'],
            [String(profile.wins), 'Victoires'],
            [String(profile.level_score), 'Niveau'],
          ].map(([val, label]) => (
            <div key={label} className="rounded-lg bg-white/8 py-2.5 text-center">
              <p className="text-[20px] font-extrabold text-white">{val}</p>
              <p className="mt-0.5 text-[10px] text-gray-300">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Premium CTA (lime gradient) ── */}
      {!isPremium && (
        <Link
          href="/profil/abonnement"
          className="flex items-center gap-3.5 rounded-xl bg-lime-gradient p-5"
        >
          <span className="text-[32px]">⭐</span>
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-extrabold text-navy">Passer Premium</p>
            <p className="text-[12px] text-navy-mid">Stats avancées, matching illimité, classements</p>
          </div>
          <span className="shrink-0 rounded-lg bg-navy px-3 py-2 text-[13px] font-bold text-white">
            5,99€/mois
          </span>
        </Link>
      )}

      {isPremium && (
        <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 p-4">
          <Crown className="h-7 w-7 text-amber-500" />
          <div>
            <p className="font-semibold text-amber-700">Premium actif</p>
            <Link href="/profil/abonnement" className="text-xs text-amber-600 underline">
              Gérer mon abonnement
            </Link>
          </div>
        </div>
      )}

      {/* ── Settings links ── */}
      <div className="divide-y divide-gray-100">
        {[
          { label: 'Modifier mon profil', icon: Pencil, href: '/profil/edit' },
          { label: 'Mes stats', icon: BarChart3, href: '/stats' },
          { label: 'Mes réservations', icon: CalendarCheck, href: '/profil/reservations' },
          { label: 'Rechercher des joueurs', icon: Users, href: '/joueurs' },
          { label: 'Mes disponibilités', icon: Calendar, href: '/profil/disponibilites', subtitle: availabilityCount > 0 ? `${availabilityCount} créneau${availabilityCount > 1 ? 'x' : ''}` : undefined },
          { label: 'Notifications', icon: Bell, href: '/profil/notifications' },
          { label: 'Abonnement', icon: Star, href: '/profil/abonnement' },
          { label: 'Paramètres du compte', icon: Settings, href: '/profil/parametres' },
        ].map(({ label, icon: Icon, href, subtitle }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center justify-between py-3.5 text-[14px] text-gray-600"
          >
            <div className="flex items-center gap-3">
              <Icon className="h-4 w-4 text-gray-400" />
              <div>
                <span>{label}</span>
                {subtitle && (
                  <p className="text-[11px] text-gray-400">{subtitle}</p>
                )}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300" />
          </Link>
        ))}
      </div>

      <LogoutButton />
    </div>
  );
}
