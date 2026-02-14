'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Don't show if already installed or dismissed
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    const wasDismissed = localStorage.getItem('pwa_install_dismissed');
    if (wasDismissed) return;

    function handler(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    }

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShow(false);
    }
    setDeferredPrompt(null);
  }

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
