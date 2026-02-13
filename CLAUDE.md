# padelia — App de référence pour le padel

## Vision
Application communautaire pour joueurs de padel : matching intelligent, suivi de progression, compétition amateur.
Promesse : "Joue mieux, plus souvent, avec les bons partenaires."

## Stack technique
- **Framework** : Next.js 16 (App Router) + TypeScript (strict)
- **Styling** : Tailwind CSS 4
- **Backend** : Supabase (Auth, PostgreSQL, RLS, Edge Functions, Realtime)
- **State** : Zustand
- **Forms** : React Hook Form + Zod
- **PWA** : next-pwa
- **Déploiement** : Vercel

## Structure du projet
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Routes authentification
│   │   ├── login/          # Connexion email + Google OAuth
│   │   ├── register/       # Inscription
│   │   └── onboarding/     # Configuration profil post-inscription
│   ├── auth/callback/      # OAuth callback route
│   ├── (app)/              # Routes protégées (layout avec bottom nav)
│   │   ├── feed/           # Accueil / matchs à rejoindre
│   │   ├── matches/        # Créer, chercher, détail match
│   │   │   ├── create/     # Formulaire création match
│   │   │   └── [id]/       # Détail match
│   │   ├── stats/          # Dashboard stats, historique
│   │   └── profile/        # Profil, classements, réglages
│   │       ├── edit/       # Modifier profil
│   │       ├── settings/   # Réglages + déconnexion
│   │       └── availability/ # Gestion des disponibilités
│   ├── layout.tsx
│   └── page.tsx            # Redirect → /feed ou /login
├── components/
│   ├── ui/                 # Button, Input, Select, Textarea, Card, Badge, Modal
│   ├── forms/              # ProfileForm, AvailabilityForm
│   ├── match/              # MatchCard, MatchFilters, PlayerSuggestionCard, SuggestionsSection, UpcomingMatches, ScoreForm
│   ├── stats/              # StatCard, LevelProgressBar, WinRateRing, MatchHistory, PartnerStats
│   └── layout/             # BottomNav, Header
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # Client browser
│   │   ├── server.ts       # Client server (RSC)
│   │   └── middleware.ts    # Auth middleware
│   ├── validations/        # Schémas Zod (profile, availability)
│   ├── matching/           # calculateMatchScore (5 critères) + suggestTeams
│   ├── ranking/            # calculateElo, updateAfterMatch, reliability
│   └── utils/              # Helpers (cn, geo, dates)
├── stores/                 # Zustand stores
├── hooks/                  # usePlayerSuggestions, useMatchRealtime, useMatchInvitations
└── types/                  # Types globaux (index.ts)
```

## Base de données — Tables principales
- **profiles** : joueur (niveau, main, position, style, objectif, fiabilité)
- **availability** : créneaux disponibles (récurrents ou ponctuels)
- **matches** : matchs (statut, type, lieu, score équilibre)
- **match_players** : participation (équipe, côté, statut invitation)
- **match_sets** : scores par set
- **player_stats** : stats agrégées par période
- **rankings** : classements par scope géographique
- **partner_history** : historique entre joueurs (chimie, victoires ensemble/contre)

## Algorithme de matching (pondérations V1)
- Écart de niveau : **40%** → `100 - |levelA - levelB| × 20`
- Compatibilité position : **20%** → droite+gauche=100, même=50, both=80
- Proximité géo : **15%** → `100 - distance_km × 2`
- Disponibilités communes : **15%** → `min(100, slots_communs × 20)`
- Fiabilité : **10%** → `reliability_score` du joueur

## Conventions de code
- Langue du code : **anglais** (noms de variables, fonctions, composants)
- Langue UI : **français** (textes affichés, labels, messages)
- Composants : functional components avec hooks
- Pas de `any` TypeScript — typage strict
- Nommage : PascalCase composants, camelCase fonctions/variables, UPPER_SNAKE constants
- Fichiers composants : PascalCase (ex: `MatchCard.tsx`)
- Fichiers utils/hooks : camelCase (ex: `useAuth.ts`, `calculateMatchScore.ts`)
- Un composant par fichier
- Utiliser les Server Components par défaut, 'use client' uniquement si nécessaire
- Supabase RLS activé sur toutes les tables
- Erreurs gérées avec try/catch + messages utilisateur en français

## Variables d'environnement requises
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Commandes utiles
```bash
npm run dev          # Serveur dev
npm run build        # Build production
npm run lint         # ESLint
npm run type-check   # TypeScript check
npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts
```

## Design system
- **Thème** : Dark-first, vert padel (#4CAF50 primary, #1B5E20 dark) + accent ambre (#FF6F00)
- **Fond** : #0D1117 (dark), cards #161B22, borders #30363D
- **Light mode** : supporté via prefers-color-scheme
- **Composants UI** : Button (5 variants), Input, Select, Textarea, Card, Badge (5 variants), Modal
- **Layout** : BottomNav (4 tabs), Header sticky, max-w-md centré mobile-first

## Système ELO (classement V1)
- K-factor adaptatif : 48 (< 10 matchs), 32 (< 30 matchs), 24 (30+)
- Level → ELO : `400 + (level - 1) × 200`
- Score margin multiplier : 1.0-1.3 selon domination
- Tiers : Bronze (< 3.5), Silver (3.5-5), Gold (5-6.5), Platinum (6.5-8), Diamond (8+)

## Score de fiabilité
- Départ : 100. Pénalités : no-show (-15), annulation tardive < 24h (-10), annulation (-3)
- Bonus : match complété (+2), série de 10 matchs (+5). Borné [0, 100]

## Roadmap MVP (Sprint actuel : 5)
### Sprint 1 — Fondations (Semaines 1-2) ✅
- [x] Setup projet Next.js + Supabase + TypeScript
- [x] Auth (email + Google OAuth) + callback OAuth + middleware redirect
- [x] CRUD profil joueur complet (onboarding + vue + édition)
- [x] Gestion des disponibilités (ajout/suppression créneaux récurrents)
- [x] UI design system (7 composants de base, palette vert/ambre)
- [ ] PWA manifest + service worker (reporté Sprint 4)

### Sprint 2 — Matchs & Matching (Semaines 3-4) ✅
- [x] Listing matchs ouverts + filtres (statut, type, niveau) — MatchCard + MatchFilters
- [x] Page détail match (joueurs, équipes, statut, rejoindre/quitter)
- [x] Création de match (formulaire + auto-ajout créateur en équipe 1)
- [x] Algorithme de matching V1 (calculateMatchScore + suggestTeams) — 5 critères pondérés
- [x] Invitations & confirmations (rejoindre/quitter, auto-confirm à 4 joueurs)
- [x] Notifications Supabase Realtime (useMatchRealtime + useMatchInvitations)
- [x] Suggestions de joueurs compatibles (usePlayerSuggestions + SuggestionsSection)
- [x] UpcomingMatches + SuggestionsSection intégrés dans le feed
- [x] Build + type-check validés

### Sprint 3 — Résultats & Stats (Semaines 5-6) ✅
- [x] Saisie des scores par sets (ScoreForm avec tiebreak, 2-3 sets)
- [x] Calcul automatique ELO/niveau (calculateElo + K-factor adaptatif + margin multiplier)
- [x] Update complet après match (updateAfterMatch : ELO, profil, stats, partenaires)
- [x] Dashboard stats joueur (LevelProgressBar, WinRateRing, StatCard, détails jeux)
- [x] Historique des matchs (MatchHistory avec résultat, rating change)
- [x] Score de fiabilité (reliability.ts — pénalités/bonus paramétrables)
- [x] Partner history tracking (PartnerStats — ensemble/contre, win rate)
- [x] Rating change affiché sur les joueurs dans le détail match
- [x] Build + type-check validés

### Sprint 4 — Polish & Launch (Semaines 7-8) ✅
- [x] PWA manifest + service worker
- [x] Onboarding flow amélioré
- [x] Responsive polish mobile
- [x] Logo & icônes intégrés (favicon, PWA 192/512, Apple touch icon)
- [x] Palette alignée sur le logo (fond bleu nuit #0A1628)

### Sprint 5 — Complétion MVP & Lancement (Semaines 9-12) ✅

#### Fonctionnalités branchées
- [x] Score de fiabilité : reliability.ts intégré dans updateAfterMatch (+2 par match, bonus streak)
- [x] Hook invitations : useMatchInvitations + RealtimeNotifications + ToastContainer
- [x] balance_score du match : calculé à l'auto-confirmation (4 joueurs)

#### Fonctionnalités ajoutées
- [x] Classements (ville) — page /stats/rankings avec leaderboard, tiers, sélecteur de ville
- [x] SEO & meta tags (Open Graph, Twitter Card, keywords, robots, og-image.png)
- [x] Notifications toast — alertes realtime quand joueur rejoint/quitte/match confirmé/terminé
- [x] Géolocalisation — geocodeCity() via Nominatim, intégré onboarding + edit profil
- [x] Avatar / photo de profil — AvatarUpload composant, upload Supabase Storage
- [ ] Landing page marketing — acquisition utilisateurs

#### 🐛 Bugs corrigés
- [x] Erreurs silencieuses sur join/leave match → bannière d'erreur avec AlertCircle
- [x] Validation min 2 joueurs/équipe avant saisie des scores (teamsComplete check)
- [x] Validation end_time > start_time (déjà en place dans le schéma Zod)
