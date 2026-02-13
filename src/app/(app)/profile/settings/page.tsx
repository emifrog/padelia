'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { Button, Card } from '@/components/ui'

export default function SettingsPage() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      <Header title="Réglages">
        <button
          onClick={() => router.back()}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </Header>

      <div className="p-4 space-y-4">
        <Card>
          <h3 className="font-semibold mb-1">Compte</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Gère ton compte et tes préférences.
          </p>
          <Button variant="destructive" className="w-full" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </Button>
        </Card>

        <Card>
          <p className="text-xs text-muted-foreground text-center">
            Padelia v0.1.0
          </p>
        </Card>
      </div>
    </>
  )
}
