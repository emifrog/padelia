'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';
import { SW_UPDATE_EVENT } from './ServiceWorkerRegister';

export default function UpdatePrompt() {
  const [waitingRegistration, setWaitingRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    function handleSwUpdate(event: Event) {
      const customEvent = event as CustomEvent<{
        registration: ServiceWorkerRegistration;
      }>;
      setWaitingRegistration(customEvent.detail.registration);
    }

    window.addEventListener(SW_UPDATE_EVENT, handleSwUpdate);
    return () => window.removeEventListener(SW_UPDATE_EVENT, handleSwUpdate);
  }, []);

  function handleUpdate() {
    if (!waitingRegistration?.waiting) return;
    setUpdating(true);
    // Tell the waiting SW to skipWaiting — controllerchange listener will reload
    waitingRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  function dismiss() {
    setWaitingRegistration(null);
  }

  if (!waitingRegistration) return null;

  return (
    <div className="fixed inset-x-0 top-4 z-50 mx-auto max-w-lg animate-in fade-in slide-in-from-top-4 px-4">
      <div className="flex items-center gap-3 rounded-2xl border bg-background p-4 shadow-xl">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <RefreshCw className={`h-6 w-6 text-primary ${updating ? 'animate-spin' : ''}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Mise a jour disponible</p>
          <p className="text-xs text-muted-foreground">
            Une nouvelle version de Padelia est prete
          </p>
        </div>
        <Button size="sm" onClick={handleUpdate} disabled={updating}>
          {updating ? 'Mise a jour...' : 'Actualiser'}
        </Button>
        {!updating && (
          <button
            type="button"
            onClick={dismiss}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
