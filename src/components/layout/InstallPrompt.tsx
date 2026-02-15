'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Global ref so the settings page can trigger install too
let deferredPromptGlobal: BeforeInstallPromptEvent | null = null;

export function getDeferredPrompt(): BeforeInstallPromptEvent | null {
  return deferredPromptGlobal;
}

export function clearDeferredPrompt() {
  deferredPromptGlobal = null;
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone === true)
  );
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // If running in standalone mode, clear any old dismiss flag (app is installed)
    if (isStandalone()) {
      localStorage.setItem('pwa_installed', '1');
      return;
    }

    // If app was previously installed but now we're in browser mode = uninstalled
    const wasInstalled = localStorage.getItem('pwa_installed');
    if (wasInstalled) {
      // Clear the installed + dismissed flags so banner can show again
      localStorage.removeItem('pwa_installed');
      localStorage.removeItem('pwa_install_dismissed');
    }

    // Check if user has dismissed the banner (and app was never installed)
    const wasDismissed = localStorage.getItem('pwa_install_dismissed');
    if (wasDismissed) return;

    function handler(e: Event) {
      e.preventDefault();
      const prompt = e as BeforeInstallPromptEvent;
      deferredPromptGlobal = prompt;
      setDeferredPrompt(prompt);
      setShow(true);
    }

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setShow(false);
      setDeferredPrompt(null);
      deferredPromptGlobal = null;
      localStorage.setItem('pwa_installed', '1');
      localStorage.removeItem('pwa_install_dismissed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShow(false);
      localStorage.setItem('pwa_installed', '1');
    }
    setDeferredPrompt(null);
    deferredPromptGlobal = null;
  }, [deferredPrompt]);

  function dismiss() {
    setShow(false);
    localStorage.setItem('pwa_install_dismissed', '1');
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-50 mx-auto max-w-lg animate-in fade-in slide-in-from-bottom-4 px-4">
      <div className="flex items-center gap-3 rounded-2xl border bg-background p-4 shadow-xl">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Download className="h-6 w-6 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Installer Padelia</p>
          <p className="text-xs text-muted-foreground">
            Accès rapide depuis ton écran d&apos;accueil
          </p>
        </div>
        <Button size="sm" onClick={handleInstall}>
          Installer
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
