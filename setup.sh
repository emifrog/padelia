#!/bin/bash
# =====================================================
# padelia — Script d'initialisation du projet
# =====================================================
# Usage: chmod +x setup.sh && ./setup.sh
# =====================================================

set -e

echo "🎾 padelia — Initialisation du projet"
echo "========================================="

# 1. Créer le projet Next.js
echo ""
echo "📦 Création du projet Next.js..."
npx create-next-app@latest padelia \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --turbopack \
  --yes

cd padelia

# 2. Installer les dépendances
echo ""
echo "📦 Installation des dépendances..."

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# State management
npm install zustand

# Forms & validation
npm install react-hook-form @hookform/resolvers zod

# UI utilities
npm install clsx tailwind-merge
npm install lucide-react

# PWA
npm install next-pwa

# Date utils
npm install date-fns

# Dev dependencies
npm install -D @types/node supabase

echo ""
echo "📁 Création de la structure de dossiers..."

# 3. Créer la structure de dossiers
mkdir -p src/app/\(auth\)/login
mkdir -p src/app/\(auth\)/register
mkdir -p src/app/\(auth\)/onboarding
mkdir -p src/app/\(app\)/feed
mkdir -p src/app/\(app\)/matches
mkdir -p src/app/\(app\)/matches/\[id\]
mkdir -p src/app/\(app\)/matches/create
mkdir -p src/app/\(app\)/stats
mkdir -p src/app/\(app\)/profile
mkdir -p src/app/\(app\)/profile/edit
mkdir -p src/app/\(app\)/profile/settings

mkdir -p src/components/ui
mkdir -p src/components/forms
mkdir -p src/components/match
mkdir -p src/components/stats
mkdir -p src/components/layout

mkdir -p src/lib/supabase
mkdir -p src/lib/matching
mkdir -p src/lib/ranking
mkdir -p src/lib/utils

mkdir -p src/stores
mkdir -p src/hooks
mkdir -p src/types

mkdir -p supabase

echo ""
echo "📝 Création des fichiers de base..."

# 4. Fichier .env.local
cat > .env.local << 'EOF'
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=padelia
EOF

# 5. Types globaux
cat > src/types/index.ts << 'TYPES_EOF'
// Types générés par Supabase CLI : npx supabase gen types typescript
// Pour l'instant, types manuels alignés sur le schéma SQL

export type DominantHand = 'left' | 'right'
export type PreferredSide = 'left' | 'right' | 'both'
export type PlayStyle = 'offensive' | 'defensive' | 'mixed'
export type PlayerGoal = 'casual' | 'improvement' | 'competition'
export type MatchStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
export type MatchType = 'friendly' | 'ranked' | 'tournament'
export type InvitationStatus = 'invited' | 'accepted' | 'declined'
export type StatPeriod = 'weekly' | 'monthly' | 'all_time'
export type RankingScope = 'city' | 'region' | 'national'
export type RankingTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'

export interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  level: number
  computed_level: number
  dominant_hand: DominantHand
  preferred_side: PreferredSide
  play_style: PlayStyle
  goal: PlayerGoal
  bio: string | null
  reliability_score: number
  is_premium: boolean
  matches_played: number
  wins: number
  created_at: string
  updated_at: string
}

export interface Availability {
  id: string
  player_id: string
  day_of_week: number | null
  start_time: string
  end_time: string
  is_recurring: boolean
  specific_date: string | null
  created_at: string
}

export interface Match {
  id: string
  created_by: string
  status: MatchStatus
  match_type: MatchType
  scheduled_at: string
  location_name: string | null
  latitude: number | null
  longitude: number | null
  is_public: boolean
  min_level: number
  max_level: number
  winner_team: 1 | 2 | null
  balance_score: number | null
  notes: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface MatchPlayer {
  id: string
  match_id: string
  player_id: string
  team: 1 | 2
  side: PreferredSide | null
  status: InvitationStatus
  rating_change: number | null
  invited_at: string
  responded_at: string | null
}

export interface MatchSet {
  id: string
  match_id: string
  set_number: number
  team1_score: number
  team2_score: number
  is_tiebreak: boolean
}

export interface PlayerStats {
  id: string
  player_id: string
  period: StatPeriod
  period_start: string
  matches_played: number
  wins: number
  losses: number
  sets_won: number
  sets_lost: number
  games_won: number
  games_lost: number
  avg_balance_score: number | null
  win_streak: number
  best_streak: number
  level_at_period: number | null
  created_at: string
  updated_at: string
}

export interface Ranking {
  id: string
  player_id: string
  scope: RankingScope
  scope_value: string
  rank_position: number
  points: number
  tier: RankingTier
  updated_at: string
}

export interface PartnerHistory {
  id: string
  player_id: string
  partner_id: string
  matches_together: number
  wins_together: number
  matches_against: number
  wins_against: number
  chemistry_score: number | null
  last_played_at: string | null
  updated_at: string
}

// Types utilitaires pour le matching
export interface MatchScore {
  playerId: string
  totalScore: number
  levelScore: number
  sideScore: number
  geoScore: number
  availabilityScore: number
  reliabilityScore: number
}

// Types pour les formulaires
export interface ProfileFormData {
  username: string
  full_name: string
  city: string
  level: number
  dominant_hand: DominantHand
  preferred_side: PreferredSide
  play_style: PlayStyle
  goal: PlayerGoal
  bio: string
}

export interface CreateMatchFormData {
  scheduled_at: string
  location_name: string
  match_type: MatchType
  is_public: boolean
  min_level: number
  max_level: number
  notes: string
}
TYPES_EOF

# 6. Supabase client (browser)
cat > src/lib/supabase/client.ts << 'SUPA_CLIENT_EOF'
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
SUPA_CLIENT_EOF

# 7. Supabase client (server)
cat > src/lib/supabase/server.ts << 'SUPA_SERVER_EOF'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — ignore
          }
        },
      },
    }
  )
}
SUPA_SERVER_EOF

# 8. Middleware Supabase Auth
cat > src/lib/supabase/middleware.ts << 'SUPA_MW_EOF'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users to login
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/register')
  const isAppPage = !isAuthPage && !request.nextUrl.pathname.startsWith('/')
  
  if (!user && !isAuthPage && request.nextUrl.pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/feed'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
SUPA_MW_EOF

# 9. Middleware Next.js
cat > src/middleware.ts << 'MW_EOF'
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
MW_EOF

# 10. Utility: cn (classnames)
cat > src/lib/utils/cn.ts << 'CN_EOF'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
CN_EOF

cat > src/lib/utils/index.ts << 'UTILS_IDX_EOF'
export { cn } from './cn'
UTILS_IDX_EOF

# 11. Copier le CLAUDE.md à la racine du projet
cp ../CLAUDE.md ./CLAUDE.md

# 12. Copier le schema SQL
cp ../supabase/schema.sql ./supabase/schema.sql

echo ""
echo "✅ padelia initialisé avec succès !"
echo ""
echo "📋 Prochaines étapes :"
echo "  1. cd padelia"
echo "  2. Créer un projet Supabase sur https://supabase.com"
echo "  3. Copier les clés dans .env.local"
echo "  4. Exécuter supabase/schema.sql dans l'éditeur SQL Supabase"
echo "  5. npm run dev"
echo "  6. Ouvrir Claude Code dans le dossier et commencer à développer 🚀"
echo ""
echo "🎾 Let's go !"
