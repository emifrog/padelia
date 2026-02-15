'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Globe, Lock, Moon, Shield, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import LogoutButton from '@/components/layout/LogoutButton';
import { getDeferredPrompt, clearDeferredPrompt, isStandalone, type BeforeInstallPromptEvent } from '@/components/layout/InstallPrompt';

export default function ParametresPage() {
  const [changingPassword, setChangingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    setInstalled(isStandalone());
    setInstallPrompt(getDeferredPrompt());

    // Listen for new beforeinstallprompt in case it fires while on this page
    function handler(e: Event) {
      setInstallPrompt(e as BeforeInstallPromptEvent);
    }
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstallApp() {
    const prompt = installPrompt || getDeferredPrompt();
    if (!prompt) {
      toast.info('Utilise le menu de ton navigateur pour installer l\'application');
      return;
    }
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
      toast.success('Application installee !');
    }
    setInstallPrompt(null);
    clearDeferredPrompt();
  }

  async function handleChangePassword() {
    setChangingPassword(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error('Aucun email associé');
        return;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/profil/parametres`,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Email de réinitialisation envoyé !');
      }
    } catch {
      toast.error('Erreur');
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    setDeletingAccount(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Soft delete: anonymize profile
      await supabase
        .from('profiles')
        .update({
          full_name: 'Compte supprimé',
          username: `deleted_${user.id.slice(0, 8)}`,
          bio: null,
          avatar_url: null,
          city: null,
          phone: null,
        })
        .eq('id', user.id);

      await supabase.auth.signOut();
      toast.success('Compte supprimé');
      router.push('/login');
    } catch {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeletingAccount(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/profil"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-xl font-bold text-navy">Paramètres</h1>
      </div>

      {/* Account section */}
      <div className="space-y-1">
        <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-gray-400">
          Compte
        </h2>

        <button
          type="button"
          onClick={handleChangePassword}
          disabled={changingPassword}
          className="flex w-full items-center justify-between rounded-xl bg-white p-4 shadow-padel transition-colors active:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <Lock className="h-4 w-4 text-gray-400" />
            <span className="text-[14px] text-gray-600">Changer le mot de passe</span>
          </div>
          {changingPassword && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
        </button>

        <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-padel">
          <div className="flex items-center gap-3">
            <Globe className="h-4 w-4 text-gray-400" />
            <div>
              <span className="text-[14px] text-gray-600">Langue</span>
              <p className="text-[11px] text-gray-400">Français</p>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy section */}
      <div className="space-y-1">
        <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-gray-400">
          Confidentialité
        </h2>

        <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-padel">
          <div className="flex items-center gap-3">
            <Shield className="h-4 w-4 text-gray-400" />
            <div>
              <span className="text-[14px] text-gray-600">Profil visible</span>
              <p className="text-[11px] text-gray-400">Les autres joueurs peuvent te trouver</p>
            </div>
          </div>
          <div className="h-6 w-11 rounded-full bg-green-padel relative">
            <span className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-white shadow" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-padel">
          <div className="flex items-center gap-3">
            <Moon className="h-4 w-4 text-gray-400" />
            <div>
              <span className="text-[14px] text-gray-600">Statut en ligne</span>
              <p className="text-[11px] text-gray-400">Afficher quand tu es connecté</p>
            </div>
          </div>
          <div className="h-6 w-11 rounded-full bg-green-padel relative">
            <span className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-white shadow" />
          </div>
        </div>
      </div>

      {/* Application section */}
      <div className="space-y-1">
        <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-gray-400">
          Application
        </h2>

        {!installed ? (
          <button
            type="button"
            onClick={handleInstallApp}
            className="flex w-full items-center justify-between rounded-xl bg-white p-4 shadow-padel transition-colors active:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Download className="h-4 w-4 text-primary" />
              <div>
                <span className="text-[14px] text-gray-600">Installer Padelia</span>
                <p className="text-[11px] text-gray-400">Ajouter a l&apos;ecran d&apos;accueil</p>
              </div>
            </div>
          </button>
        ) : (
          <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-padel">
            <div className="flex items-center gap-3">
              <Download className="h-4 w-4 text-green-500" />
              <div>
                <span className="text-[14px] text-gray-600">Application installee</span>
                <p className="text-[11px] text-gray-400">Padelia est sur ton ecran d&apos;accueil</p>
              </div>
            </div>
            <span className="text-[11px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Actif</span>
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="space-y-1">
        <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-red-400">
          Zone dangereuse
        </h2>

        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex w-full items-center gap-3 rounded-xl bg-white p-4 shadow-padel text-red-500 transition-colors active:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            <span className="text-[14px] font-medium">Supprimer mon compte</span>
          </button>
        ) : (
          <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 space-y-3">
            <p className="text-[14px] font-semibold text-red-700">
              Es-tu sûr de vouloir supprimer ton compte ?
            </p>
            <p className="text-[12px] text-red-500">
              Cette action est irréversible. Ton profil sera anonymisé et tes données personnelles supprimées.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
              >
                {deletingAccount ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-1.5 h-3.5 w-3.5" />}
                Confirmer la suppression
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Logout */}
      <div className="pt-2">
        <LogoutButton />
      </div>

      {/* App info */}
      <div className="pb-8 text-center">
        <p className="text-[11px] text-gray-300">Padelia v1.0.0</p>
        <p className="text-[11px] text-gray-300">Made with 🎾 for padel players</p>
        <p className="text-[11px] text-gray-300">Made by XRWeb</p>
      </div>
    </div>
  );
}
