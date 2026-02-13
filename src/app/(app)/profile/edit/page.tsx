'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { ProfileForm } from '@/components/forms/ProfileForm'
import type { ProfileFormValues } from '@/lib/validations/profile'
import type { Profile } from '@/types'
import { geocodeCity } from '@/lib/utils/geocode'
import { AvatarUpload } from '@/components/ui/AvatarUpload'

export default function EditProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) setProfile(data as Profile)
    }
    load()
  }, [router])

  async function handleSubmit(data: ProfileFormValues) {
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Geocode city if it changed
    let latitude = profile?.latitude ?? null
    let longitude = profile?.longitude ?? null
    if (data.city && data.city !== profile?.city) {
      const geo = await geocodeCity(data.city)
      if (geo) {
        latitude = geo.latitude
        longitude = geo.longitude
      }
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        username: data.username,
        full_name: data.full_name,
        city: data.city,
        latitude,
        longitude,
        level: data.level,
        dominant_hand: data.dominant_hand,
        preferred_side: data.preferred_side,
        play_style: data.play_style,
        goal: data.goal,
        bio: data.bio || null,
      })
      .eq('id', user.id)

    if (updateError) {
      if (updateError.code === '23505') {
        setError('Ce pseudo est déjà pris.')
        return
      }
      setError('Erreur lors de la mise à jour.')
      return
    }

    router.push('/profile')
    router.refresh()
  }

  if (!profile) {
    return (
      <>
        <Header title="Modifier le profil" />
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Modifier le profil">
        <button
          onClick={() => router.back()}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </Header>

      <div className="p-4 space-y-4">
        {/* Avatar upload */}
        <div className="flex justify-center">
          <AvatarUpload
            currentUrl={profile.avatar_url}
            fallbackInitial={profile.full_name?.[0]?.toUpperCase() || profile.username[0].toUpperCase()}
            onUploadComplete={(url) => setProfile({ ...profile, avatar_url: url })}
          />
        </div>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <ProfileForm
          defaultValues={{
            username: profile.username,
            full_name: profile.full_name || '',
            city: profile.city || '',
            level: profile.level,
            dominant_hand: profile.dominant_hand,
            preferred_side: profile.preferred_side,
            play_style: profile.play_style,
            goal: profile.goal,
            bio: profile.bio || '',
          }}
          onSubmit={handleSubmit}
          submitLabel="Sauvegarder"
        />
      </div>
    </>
  )
}
