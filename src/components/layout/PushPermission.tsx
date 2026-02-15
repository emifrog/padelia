'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, X } from 'lucide-react';
import { toast } from 'sonner';

function getInitialPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined') return 'default';
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return 'unsupported';
  return Notification.permission;
}

function getInitialDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem('push_dismissed') === '1';
}

export default function PushPermission() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(getInitialPermission);
  const [dismissed, setDismissed] = useState(getInitialDismissed);

  async function requestPermission() {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        // Get the service worker registration
        const registration = await navigator.serviceWorker.ready;

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) return;

        // Subscribe to push
        const keyArray = urlBase64ToUint8Array(vapidKey);
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyArray.buffer as ArrayBuffer,
        });

        // Send to server
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription.toJSON()),
        });

        toast.success('Notifications activées !');
        setDismissed(true);
      } else {
        setDismissed(true);
      }
    } catch (error) {
      console.error('[push] Error:', error);
      toast.error('Erreur d\'activation des notifications');
    }
  }

  function dismiss() {
    setDismissed(true);
    sessionStorage.setItem('push_dismissed', '1');
  }

  // Don't show if already granted, denied, unsupported, or dismissed
  if (permission !== 'default' || dismissed) return null;

  return (
    <div className="mx-auto max-w-lg animate-in fade-in slide-in-from-top-2">
      <div className="mx-3 mb-3 flex items-center gap-3 rounded-xl border bg-background p-3 shadow-lg">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Rester informé ?</p>
          <p className="text-xs text-muted-foreground">
            Reçois des alertes pour tes matchs et messages
          </p>
        </div>
        <Button size="sm" onClick={requestPermission}>
          Activer
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

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
