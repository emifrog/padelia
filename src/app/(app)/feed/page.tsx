import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui'
import { Zap, Calendar, Users, Clock } from 'lucide-react'
import Link from 'next/link'
import { UpcomingMatches } from '@/components/match/UpcomingMatches'
import { SuggestionsSection } from '@/components/match/SuggestionsSection'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, level, matches_played')
    .eq('id', user!.id)
    .single()

  const displayName = profile?.full_name?.split(' ')[0] || profile?.username || 'Joueur'

  return (
    <>
      {/* Hero header avec gradient */}
      <div className="bg-gradient-to-br from-primary-dark to-background px-4 pt-6 pb-5 border-b border-border">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">🎾</span>
          <h1 className="text-xl font-black tracking-tight">padelia</h1>
        </div>
        <h2 className="text-lg font-bold mt-3">Salut {displayName} !</h2>
        <p className="text-sm text-muted-foreground">Prêt pour un match ?</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Upcoming matches (client component) */}
        <UpcomingMatches />

        {/* Quick actions */}
        <div className="grid gap-3">
          <Link href="/matches/create">
            <Card className="flex items-center gap-4 hover:border-primary/50 transition-colors cursor-pointer">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Créer un match</h3>
                <p className="text-sm text-muted-foreground">Organise une partie de padel</p>
              </div>
            </Card>
          </Link>

          <Link href="/matches">
            <Card className="flex items-center gap-4 hover:border-secondary/50 transition-colors cursor-pointer">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/15">
                <Calendar className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold">Rejoindre un match</h3>
                <p className="text-sm text-muted-foreground">Trouve un match près de chez toi</p>
              </div>
            </Card>
          </Link>

          <Link href="/profile/availability">
            <Card className="flex items-center gap-4 hover:border-primary/50 transition-colors cursor-pointer">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Mes disponibilités</h3>
                <p className="text-sm text-muted-foreground">Configure tes créneaux de jeu</p>
              </div>
            </Card>
          </Link>

          <Link href="/profile">
            <Card className="flex items-center gap-4 hover:border-primary/50 transition-colors cursor-pointer">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-light/15">
                <Users className="h-6 w-6 text-secondary-light" />
              </div>
              <div>
                <h3 className="font-semibold">Mon profil</h3>
                <p className="text-sm text-muted-foreground">
                  Niveau {profile?.level ?? '–'} · {profile?.matches_played ?? 0} matchs joués
                </p>
              </div>
            </Card>
          </Link>
        </div>

        {/* Player suggestions (client component) */}
        <SuggestionsSection />
      </div>
    </>
  )
}
