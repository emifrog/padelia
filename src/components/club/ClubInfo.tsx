import { MapPin, Phone, Mail, Globe } from 'lucide-react';
import StarRating from '@/components/club/StarRating';
import { AMENITY_LABELS, AMENITY_ICONS } from '@/lib/constants/club';
import type { Club } from '@/types';

interface Props {
  club: Club;
}

export default function ClubInfo({ club }: Props) {
  return (
    <div className="space-y-4">
      {/* Cover */}
      <div className="relative h-44 overflow-hidden rounded-xl">
        {club.cover_url ? (
          <img
            src={club.cover_url}
            alt={club.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-padel/30 to-navy/30">
            <span className="text-5xl">🏟️</span>
          </div>
        )}

        {/* Logo overlay */}
        {club.logo_url && (
          <div className="absolute -bottom-6 left-4">
            <img
              src={club.logo_url}
              alt={club.name}
              className="h-16 w-16 rounded-xl border-4 border-white object-cover shadow-padel"
            />
          </div>
        )}
      </div>

      {/* Info */}
      <div className={club.logo_url ? 'pt-4' : ''}>
        <h1 className="text-[22px] font-extrabold text-navy">{club.name}</h1>

        <div className="mt-1 flex items-center gap-2">
          <StarRating rating={club.rating} size="md" />
          <span className="text-[14px] font-semibold text-gray-600">
            {club.rating.toFixed(1)}
          </span>
          <span className="text-[13px] text-gray-400">
            ({club.total_reviews} avis)
          </span>
        </div>

        {club.description && (
          <p className="mt-3 text-[14px] leading-relaxed text-gray-600">
            {club.description}
          </p>
        )}
      </div>

      {/* Contact */}
      <div className="space-y-2 rounded-xl bg-white p-4 shadow-padel">
        <div className="flex items-center gap-2.5 text-[13px] text-gray-600">
          <MapPin className="h-4 w-4 shrink-0 text-green-padel" />
          <span>{club.address}, {club.postal_code} {club.city}</span>
        </div>

        {club.phone && (
          <a href={`tel:${club.phone}`} className="flex items-center gap-2.5 text-[13px] text-gray-600">
            <Phone className="h-4 w-4 shrink-0 text-green-padel" />
            <span>{club.phone}</span>
          </a>
        )}

        {club.email && (
          <a href={`mailto:${club.email}`} className="flex items-center gap-2.5 text-[13px] text-gray-600">
            <Mail className="h-4 w-4 shrink-0 text-green-padel" />
            <span>{club.email}</span>
          </a>
        )}

        {club.website && (
          <a
            href={club.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 text-[13px] text-green-padel font-medium"
          >
            <Globe className="h-4 w-4 shrink-0" />
            <span>Site web</span>
          </a>
        )}
      </div>

      {/* Amenities */}
      {club.amenities.length > 0 && (
        <div className="rounded-xl bg-white p-4 shadow-padel">
          <h3 className="mb-2.5 text-[14px] font-bold text-navy">Services</h3>
          <div className="flex flex-wrap gap-2">
            {club.amenities.map((a) => (
              <span
                key={a}
                className="flex items-center gap-1 rounded-full bg-green-subtle px-3 py-1 text-[12px] font-medium text-navy"
              >
                <span>{AMENITY_ICONS[a] ?? '✓'}</span>
                {AMENITY_LABELS[a] ?? a}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
