'use client';

import { useEffect } from 'react';

// Custom event dispatched when a new SW is waiting
const SW_UPDATE_EVENT = 'sw-update-available';

export function dispatchSwUpdate(registration: ServiceWorkerRegistration) {
  window.dispatchEvent(
    new CustomEvent(SW_UPDATE_EVENT, { detail: { registration } })
  );
}

export { SW_UPDATE_EVENT };

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[SW] Registered:', registration.scope);

        // If there's already a waiting worker (e.g. page was refreshed after install)
        if (registration.waiting) {
          dispatchSwUpdate(registration);
        }

        // Detect when a new SW is found and installed
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            // New SW is installed and waiting to activate
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] New version available');
              dispatchSwUpdate(registration);
            }
          });
        });

        // Check for updates every 30 minutes
        const interval = setInterval(() => {
          registration.update().catch(() => {
            // Silently ignore update check failures (offline, etc.)
          });
        }, 30 * 60 * 1000);

        return () => clearInterval(interval);
      })
      .catch((error) => {
        console.error('[SW] Registration failed:', error);
      });

    // When the new SW takes control, reload the page for fresh content
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }, []);

  return null;
}
