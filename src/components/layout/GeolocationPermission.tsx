'use client';

import { useEffect, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

function getInitialDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem('geo_dismissed') === '1';
}

export default function GeolocationPermission() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(getInitialDismissed);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    // Check browser support
    if (!('geolocation' in navigator)) return;

    // Check if user already has coordinates in profile
    const supabase = createClient();
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('latitude, longitude')
        .eq('id', user.id)
        .single();

      if (profile?.latitude && profile?.longitude) return;

      // Check permission state if API available
      if ('permissions' in navigator) {
        try {
          const status = await navigator.permissions.query({ name: 'geolocation' });
          if (status.state === 'denied') return;
          if (status.state === 'granted') {
            // Already granted but no coords saved — request silently
            captureAndSave();
            return;
          }
        } catch {
          // permissions API not supported for geolocation in some browsers
        }
      }

      // Permission is 'prompt' — show the banner
      setVisible(true);
    }

    check();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dismissed]);

  async function captureAndSave() {
    setLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        },
      );

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Localisation activée !');
      setVisible(false);
    } catch (err) {
      console.error('[geo] Error:', err);
      toast.error('Impossible d\'obtenir la position');
    } finally {
      setLoading(false);
    }
  }

  function dismiss() {
    setDismissed(true);
    setVisible(false);
    sessionStorage.setItem('geo_dismissed', '1');
  }

  if (!visible) return null;

  return (
    <div className="mx-auto max-w-lg animate-in fade-in slide-in-from-top-2">
      <div className="mx-3 mb-3 flex items-center gap-3 rounded-xl border bg-background p-3 shadow-lg">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Trouve des joueurs proches</p>
          <p className="text-xs text-muted-foreground">
            Active la localisation pour le matching
          </p>
        </div>
        <Button size="sm" onClick={captureAndSave} disabled={loading}>
          {loading ? 'En cours…' : 'Activer'}
        </Button>
        <button
          type="button"
          onClick={dismiss}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
