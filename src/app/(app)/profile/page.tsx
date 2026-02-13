import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { Card, Badge } from '@/components/ui'
import { Settings, Edit, MapPin, Target, Hand, Shield } from 'lucide-react'
import type { Profile, DominantHand, PreferredSide, PlayStyle, PlayerGoal } from '@/types'

const LABELS = {
  dominant_hand: { left: 'Gaucher', right: 'Droitier' } as Record<DominantHand, string>,
  preferred_side: { left: 'Gauche', right: 'Droite', both: 'Les deux' } as Record<PreferredSide, string>,
  play_style: { offensive: 'Offensif', defensive: 'Défensif', mixed: 'Mixte' } as Record<PlayStyle, string>,
  goal: { casual: 'Loisir', improvement: 'Progression', competition: 'Compétition' } as Record<PlayerGoal, string>,
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  const p = profile as Profile

  const winRate = p.matches_played > 0
    ? Math.round((p.wins / p.matches_played) * 100)
    : 0

  return (
    <>
      <Header title="Mon profil">
        <Link href="/profile/settings" className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors">
          <Settings className="h-5 w-5" />
        </Link>
      </Header>

      <div className="space-y-4 p-4">
        {/* En-tête profil */}
        <Card className="flex items-start gap-4">
          {p.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.avatar_url}
              alt={p.full_name || p.username}
              className="h-16 w-16 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary shrink-0">
              {p.full_name?.[0]?.toUpperCase() || p.username[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold truncate">{p.full_name || p.username}</h2>
                <p className="text-sm text-muted-foreground">@{p.username}</p>
              </div>
              <Link
                href="/profile/edit"
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors"
              >
                <Edit className="h-4 w-4" />
              </Link>
            </div>
            {p.city && (
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {p.city}
              </p>
            )}
          </div>
        </Card>

        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center">
            <p className="text-2xl font-bold text-primary">{p.level}</p>
            <p className="text-xs text-muted-foreground">Niveau</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold">{p.matches_played}</p>
            <p className="text-xs text-muted-foreground">Matchs</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold">{winRate}%</p>
            <p className="text-xs text-muted-foreground">Victoires</p>
          </Card>
        </div>

        {/* Détails joueur */}
        <Card>
          <h3 className="font-semibold mb-3">Mon jeu</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Hand className="h-4 w-4" />
                Main dominante
              </span>
              <Badge>{LABELS.dominant_hand[p.dominant_hand]}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                Côté préféré
              </span>
              <Badge>{LABELS.preferred_side[p.preferred_side]}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                Style de jeu
              </span>
              <Badge variant="secondary">{LABELS.play_style[p.play_style]}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                Objectif
              </span>
              <Badge variant="muted">{LABELS.goal[p.goal]}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                Fiabilité
              </span>
              <Badge variant="success">{p.reliability_score}%</Badge>
            </div>
          </div>
        </Card>

        {/* Bio */}
        {p.bio && (
          <Card>
            <h3 className="font-semibold mb-2">Bio</h3>
            <p className="text-sm text-muted-foreground">{p.bio}</p>
          </Card>
        )}
      </div>
    </>
  )
}
