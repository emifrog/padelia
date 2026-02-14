import Stripe from 'stripe';

// Lazy-init to avoid build-time errors when STRIPE_SECRET_KEY is not set
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
    _stripe = new Stripe(key);
  }
  return _stripe;
}

export const PLANS = {
  free: {
    name: 'Gratuit',
    price: 0,
    features: [
      'Profil joueur',
      'Matching basique',
      '3 matchs / mois',
      'Chat illimité',
    ],
  },
  premium_monthly: {
    name: 'Premium Mensuel',
    price: 5.99,
    priceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID ?? '',
    features: [
      'Matching illimité',
      'Stats avancées',
      'Classements détaillés',
      'Badge Premium',
      'Priorité de matching',
    ],
  },
  premium_yearly: {
    name: 'Premium Annuel',
    price: 49.99,
    priceId: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID ?? '',
    features: [
      'Tout Premium Mensuel',
      '2 mois offerts',
      'Accès anticipé nouveautés',
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;
