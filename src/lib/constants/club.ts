import type { CourtSurface, ClubStatus, BookingStatus } from '@/types';

export const SURFACE_LABELS: Record<CourtSurface, string> = {
  vitree: 'Vitrée',
  mur: 'Mur',
  panoramique: 'Panoramique',
  exterieur: 'Extérieur',
};

export const SURFACE_COLORS: Record<CourtSurface, string> = {
  vitree: 'bg-blue-100 text-blue-700',
  mur: 'bg-amber-100 text-amber-700',
  panoramique: 'bg-emerald-100 text-emerald-700',
  exterieur: 'bg-orange-100 text-orange-700',
};

export const CLUB_STATUS_LABELS: Record<ClubStatus, string> = {
  pending: 'En attente',
  active: 'Actif',
  suspended: 'Suspendu',
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  cancelled: 'Annulé',
  completed: 'Terminé',
};

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-gray-100 text-gray-700',
};

export const AMENITY_LABELS: Record<string, string> = {
  parking: 'Parking',
  vestiaires: 'Vestiaires',
  douches: 'Douches',
  bar: 'Bar',
  boutique: 'Boutique',
  wifi: 'Wi-Fi',
  climatisation: 'Climatisation',
  eclairage: 'Éclairage',
};

export const AMENITY_ICONS: Record<string, string> = {
  parking: '🅿️',
  vestiaires: '🧳',
  douches: '🚿',
  bar: '🍺',
  boutique: '🛍️',
  wifi: '📶',
  climatisation: '❄️',
  eclairage: '💡',
};

export const DAY_LABELS: Record<string, string> = {
  lundi: 'Lundi',
  mardi: 'Mardi',
  mercredi: 'Mercredi',
  jeudi: 'Jeudi',
  vendredi: 'Vendredi',
  samedi: 'Samedi',
  dimanche: 'Dimanche',
};

export const DAY_ORDER = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
