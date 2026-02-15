'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bell, BellOff, Loader2, Mail, MessageSquare, Swords, Users } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface NotifPrefs {
  push_enabled: boolean;
  email_match_invite: boolean;
  email_match_reminder: boolean;
  push_new_message: boolean;
  push_match_update: boolean;
  push_group_activity: boolean;
}

const DEFAULT_PREFS: NotifPrefs = {
  push_enabled: true,
  email_match_invite: true,
  email_match_reminder: true,
  push_new_message: true,
  push_match_update: true,
  push_group_activity: true,
};

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const supabase = createClient();

  useEffect(() => {
    setPushSupported('Notification' in window && 'serviceWorker' in navigator);
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }

    async function loadPrefs() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .single();
      if (profile?.notification_preferences) {
        setPrefs({ ...DEFAULT_PREFS, ...profile.notification_preferences as Partial<NotifPrefs> });
      }
    }
    loadPrefs();
  }, [supabase]);

  async function savePrefs() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from('profiles')
        .update({ notification_preferences: prefs })
        .eq('id', user.id);
      toast.success('Préférences sauvegardées');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  async function requestPush() {
    if (!pushSupported) return;
    const result = await Notification.requestPermission();
    setPushPermission(result);
    if (result === 'granted') {
      setPrefs(p => ({ ...p, push_enabled: true }));
      toast.success('Notifications push activées');
    } else {
      toast.error('Notifications push refusées');
    }
  }

  function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? 'bg-green-padel' : 'bg-gray-200'
        } ${disabled ? 'opacity-50' : ''}`}
      >
        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`} />
      </button>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/profil"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-xl font-bold text-navy">Notifications</h1>
      </div>

      {/* Push status */}
      <div className="rounded-xl bg-white p-4 shadow-padel">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {pushPermission === 'granted' ? (
              <Bell className="h-5 w-5 text-green-padel" />
            ) : (
              <BellOff className="h-5 w-5 text-gray-400" />
            )}
            <div>
              <p className="text-[14px] font-semibold text-navy">Notifications push</p>
              <p className="text-[12px] text-gray-400">
                {pushPermission === 'granted' ? 'Activées' :
                 pushPermission === 'denied' ? 'Bloquées dans le navigateur' :
                 'Non activées'}
              </p>
            </div>
          </div>
          {pushPermission !== 'granted' && pushPermission !== 'denied' && (
            <Button size="sm" variant="outline" onClick={requestPush}>
              Activer
            </Button>
          )}
          {pushPermission === 'granted' && (
            <Toggle checked={prefs.push_enabled} onChange={(v) => setPrefs(p => ({ ...p, push_enabled: v }))} />
          )}
        </div>
      </div>

      {/* Push notification settings */}
      <div className="space-y-1">
        <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-gray-400">
          Notifications push
        </h2>

        <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-padel">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-4 w-4 text-gray-400" />
            <span className="text-[14px] text-gray-600">Nouveaux messages</span>
          </div>
          <Toggle
            checked={prefs.push_new_message}
            onChange={(v) => setPrefs(p => ({ ...p, push_new_message: v }))}
            disabled={!prefs.push_enabled}
          />
        </div>

        <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-padel">
          <div className="flex items-center gap-3">
            <Swords className="h-4 w-4 text-gray-400" />
            <span className="text-[14px] text-gray-600">Mises à jour de matchs</span>
          </div>
          <Toggle
            checked={prefs.push_match_update}
            onChange={(v) => setPrefs(p => ({ ...p, push_match_update: v }))}
            disabled={!prefs.push_enabled}
          />
        </div>

        <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-padel">
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-[14px] text-gray-600">Activité des groupes</span>
          </div>
          <Toggle
            checked={prefs.push_group_activity}
            onChange={(v) => setPrefs(p => ({ ...p, push_group_activity: v }))}
            disabled={!prefs.push_enabled}
          />
        </div>
      </div>

      {/* Email settings */}
      <div className="space-y-1">
        <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-gray-400">
          Emails
        </h2>

        <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-padel">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-[14px] text-gray-600">Invitations de match</span>
          </div>
          <Toggle
            checked={prefs.email_match_invite}
            onChange={(v) => setPrefs(p => ({ ...p, email_match_invite: v }))}
          />
        </div>

        <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-padel">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-[14px] text-gray-600">Rappels avant match</span>
          </div>
          <Toggle
            checked={prefs.email_match_reminder}
            onChange={(v) => setPrefs(p => ({ ...p, email_match_reminder: v }))}
          />
        </div>
      </div>

      {/* Save button */}
      <Button
        className="w-full bg-green-gradient text-white hover:opacity-90"
        onClick={savePrefs}
        disabled={saving}
      >
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Sauvegarder les préférences
      </Button>
    </div>
  );
}
