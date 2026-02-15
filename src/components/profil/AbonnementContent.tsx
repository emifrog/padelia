'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PLANS, type PlanKey } from '@/lib/stripe/config';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Check, Crown, Loader2, Sparkles, Star } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function AbonnementContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumExpires, setPremiumExpires] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Abonnement Premium activé !');
    }
    if (searchParams.get('cancelled') === 'true') {
      toast.info('Paiement annulé');
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium, premium_expires_at')
        .eq('id', user.id)
        .single();
      if (profile) {
        setIsPremium(profile.is_premium);
        setPremiumExpires(profile.premium_expires_at);
      }
    }
    loadProfile();
  }, [supabase]);

  async function handleCheckout(plan: PlanKey) {
    if (plan === 'free') return;
    setLoading(plan);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error ?? 'Erreur');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setLoading(null);
    }
  }

  async function handlePortal() {
    setLoading('portal');
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error ?? 'Erreur');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/profil"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-xl font-bold text-navy">Abonnement</h1>
      </div>

      {/* Current status */}
      {isPremium && (
        <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 p-4">
          <Crown className="h-8 w-8 text-amber-500" />
          <div>
            <p className="font-semibold text-amber-700">Premium actif</p>
            {premiumExpires && (
              <p className="text-xs text-amber-600/70">
                Expire le {new Date(premiumExpires).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={handlePortal}
            disabled={loading === 'portal'}
          >
            {loading === 'portal' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Gérer'}
          </Button>
        </div>
      )}

      {/* Plans */}
      <div className="space-y-4">
        {/* Free plan */}
        <div className="rounded-xl bg-white p-4 shadow-padel">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-navy">{PLANS.free.name}</h3>
              <p className="text-2xl font-bold text-navy">0€</p>
            </div>
          </div>
          <ul className="space-y-1.5">
            {PLANS.free.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-500">
                <Check className="h-3.5 w-3.5 text-gray-400" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Premium Monthly */}
        <div className={cn(
          'rounded-xl p-4 shadow-padel-md transition-colors',
          'border-2 border-green-padel bg-green-subtle',
        )}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-navy">{PLANS.premium_monthly.name}</h3>
                <Sparkles className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-navy">
                {PLANS.premium_monthly.price}€
                <span className="text-sm font-normal text-gray-400">/mois</span>
              </p>
            </div>
          </div>
          <ul className="mb-4 space-y-1.5">
            {PLANS.premium_monthly.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-navy">
                <Check className="h-3.5 w-3.5 text-green-padel" />
                {f}
              </li>
            ))}
          </ul>
          {!isPremium && (
            <Button
              className="w-full bg-green-gradient text-white hover:opacity-90"
              onClick={() => handleCheckout('premium_monthly')}
              disabled={loading === 'premium_monthly'}
            >
              {loading === 'premium_monthly' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Star className="mr-2 h-4 w-4" />
              )}
              S&apos;abonner — {PLANS.premium_monthly.price}€/mois
            </Button>
          )}
        </div>

        {/* Premium Yearly */}
        <div className="relative rounded-xl bg-white p-4 shadow-padel">
          <div className="absolute -top-2.5 right-3 rounded-full bg-green-padel px-2.5 py-0.5 text-[10px] font-bold text-white">
            -30%
          </div>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-navy">{PLANS.premium_yearly.name}</h3>
              <p className="text-2xl font-bold text-navy">
                {PLANS.premium_yearly.price}€
                <span className="text-sm font-normal text-gray-400">/an</span>
              </p>
              <p className="text-xs text-gray-400">
                soit {(PLANS.premium_yearly.price / 12).toFixed(2)}€/mois
              </p>
            </div>
          </div>
          <ul className="mb-4 space-y-1.5">
            {PLANS.premium_yearly.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-navy">
                <Check className="h-3.5 w-3.5 text-green-padel" />
                {f}
              </li>
            ))}
          </ul>
          {!isPremium && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleCheckout('premium_yearly')}
              disabled={loading === 'premium_yearly'}
            >
              {loading === 'premium_yearly' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Crown className="mr-2 h-4 w-4" />
              )}
              S&apos;abonner — {PLANS.premium_yearly.price}€/an
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
