'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useMatchInvitations } from '@/hooks/useMatchInvitations'

/**
 * Client component that sets up realtime notifications for the current user.
 * Wraps useMatchInvitations hook with user auth detection.
 */
export function RealtimeNotifications() {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null)
    })
  }, [])

  useMatchInvitations(userId)

  return null
}
