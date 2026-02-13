import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/layout/BottomNav'
import { RealtimeNotifications } from '@/components/layout/RealtimeNotifications'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-background relative">
      <main className="pb-20">{children}</main>
      <BottomNav />
      <RealtimeNotifications />
    </div>
  )
}
