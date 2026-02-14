# CLAUDE.md — PadelMatch

## Vision
PadelMatch est une PWA mobile-first de référence pour les joueurs de padel. Clone amélioré de Padel Mates avec un matching intelligent supérieur et un focus sur la progression des joueurs.

**Promesse** : « Joue mieux, plus souvent, avec les bons partenaires. »

## Stack Technique
- **Framework** : Next.js 15 (App Router) + React 19 + TypeScript 5.6+
- **Backend** : Supabase (Auth, PostgreSQL, Realtime, Storage, Edge Functions)
- **UI** : Tailwind CSS 4 + shadcn/ui + Framer Motion
- **State** : TanStack Query (serveur) + Zustand (client)
- **Forms** : React Hook Form + Zod
- **Carte** : Mapbox GL JS
- **Paiement** : Stripe (Billing + Connect + Payment Intents)
- **Chat** : Supabase Realtime (WebSocket channels + Presence)
- **Notifications** : Web Push API + FCM + Resend (emails)
- **PWA** : Serwist (Service Worker, cache, install prompt)
- **Tests** : Vitest + Playwright
- **Deploy** : Vercel

## Structure du Projet
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Login, register, reset, onboarding
│   ├── (main)/             # Layout avec bottom nav
│   │   ├── accueil/        # Feed personnalisé
│   │   ├── matchs/         # CRUD matchs + recherche
│   │   ├── carte/          # Carte Mapbox interactive
│   │   ├── joueurs/        # Recherche + profils joueurs
│   │   ├── chat/           # Conversations + messages
│   │   ├── groupes/        # Communautés
│   │   ├── clubs/          # Annuaire + réservation
│   │   ├── tournois/       # Compétitions
│   │   ├── stats/          # Dashboard stats + progression
│   │   └── profil/         # Mon profil + paramètres
│   └── api/                # Webhooks Stripe, etc.
├── components/
│   ├── ui/                 # shadcn/ui
│   ├── match/              # MatchCard, MatchForm, MatchList
│   ├── player/             # PlayerCard, PlayerSearch
│   ├── chat/               # ChatWindow, MessageBubble
│   ├── map/                # MapView, ClubMarker
│   ├── stats/              # Charts, ProgressionGraph
│   └── layout/             # Navbar, BottomNav
├── lib/
│   ├── supabase/           # Clients (browser, server, admin)
│   ├── stripe/             # Config Stripe
│   ├── matching/           # Algorithme de matching
│   ├── ranking/            # Système de classement
│   └── utils/              # Helpers
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript + database.ts
└── stores/                 # Zustand stores
```

## Conventions
- **Composants** : PascalCase, un fichier par composant
- **Hooks** : préfixe `use*`, un hook par fichier
- **Server Actions** : préfixe `action*`
- **Fichiers** : kebab-case
- **Commits** : Conventional Commits (feat:, fix:, chore:, docs:)
- **Toujours** : TypeScript strict, pas de `any`, Zod pour toute validation
- **Style** : Tailwind utility classes, pas de CSS custom sauf nécessité absolue
- **Exports** : Named exports par défaut (sauf pages Next.js)
- **Erreurs** : Error boundaries par section, toast pour feedback utilisateur
- **Langue** : UI en français, code en anglais

## Base de Données (résumé)
14 tables : profiles, clubs, courts, groups, group_members, matches, match_participants, bookings, conversations, conversation_members, messages, notifications, player_stats, club_reviews

**Enums clés** : player_level (6 niveaux), playing_side, play_style, match_status, participant_status, payment_status, notification_type

**Fonctions SQL** : haversine_distance(), find_nearby_players()

**RLS** activé sur toutes les tables. Triggers pour : updated_at auto, création profil auto, mise à jour conversation, compteur membres groupe.

Schéma complet dans `supabase/migrations/001_initial_schema.sql`

## Algorithme de Matching
Score composite sur 100 points :
- **Niveau** (40%) : diff de level_score, 0 = parfait
- **Position complémentaire** (20%) : gauche + droite = bonus max
- **Fiabilité** (20%) : reliability_score, pénalise no-shows
- **Proximité** (15%) : distance haversine, décroît linéairement
- **Disponibilités** (5%) : créneaux communs

## Évolution du Niveau
Système hybride Elo-like :
- Auto-déclaration initiale (onboarding)
- Ajustement post-match selon résultat + force adversaire
- Peer feedback (30% du calcul) après chaque match
- Score de 1.0 à 10.0, facteur K = 0.5

## Roadmap (12 sprints × 1 semaine)
**Phase 1 — Fondations** (S1-S3) : Auth, profils, onboarding, matching, recherche joueurs
**Phase 2 — Core Match** (S4-S6) : CRUD matchs, résultats, stats, classements
**Phase 3 — Social & Carte** (S7-S9) : Chat realtime, groupes, carte Mapbox
**Phase 4 — Monétisation** (S10-S12) : Stripe, notifications push, PWA polish, déploiement

## Variables d'Environnement Requises
```
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_MAPBOX_TOKEN
NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
RESEND_API_KEY
NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_APP_NAME
```

## Modèle Économique
- **Gratuit** : profil, matching basique, 3 matchs/mois, chat
- **Premium** (5,99€/mois ou 49,99€/an) : matching illimité, stats avancées, classements
- **Club** (sur devis) : dashboard, gestion terrains, tournois, analytics
# CLAUDE.md — PadelMatch

## Vision
PadelMatch est une PWA mobile-first de référence pour les joueurs de padel. Clone amélioré de Padel Mates avec un matching intelligent supérieur et un focus sur la progression des joueurs.

**Promesse** : « Joue mieux, plus souvent, avec les bons partenaires. »

## Stack Technique
- **Framework** : Next.js 15 (App Router) + React 19 + TypeScript 5.6+
- **Backend** : Supabase (Auth, PostgreSQL, Realtime, Storage, Edge Functions)
- **UI** : Tailwind CSS 4 + shadcn/ui + Framer Motion
- **State** : TanStack Query (serveur) + Zustand (client)
- **Forms** : React Hook Form + Zod
- **Carte** : Mapbox GL JS
- **Paiement** : Stripe (Billing + Connect + Payment Intents)
- **Chat** : Supabase Realtime (WebSocket channels + Presence)
- **Notifications** : Web Push API + FCM + Resend (emails)
- **PWA** : Serwist (Service Worker, cache, install prompt)
- **Tests** : Vitest + Playwright
- **Deploy** : Vercel

## Structure du Projet
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Login, register, reset, onboarding
│   ├── (main)/             # Layout avec bottom nav
│   │   ├── accueil/        # Feed personnalisé
│   │   ├── matchs/         # CRUD matchs + recherche
│   │   ├── carte/          # Carte Mapbox interactive
│   │   ├── joueurs/        # Recherche + profils joueurs
│   │   ├── chat/           # Conversations + messages
│   │   ├── groupes/        # Communautés
│   │   ├── clubs/          # Annuaire + réservation
│   │   ├── tournois/       # Compétitions
│   │   ├── stats/          # Dashboard stats + progression
│   │   └── profil/         # Mon profil + paramètres
│   └── api/                # Webhooks Stripe, etc.
├── components/
│   ├── ui/                 # shadcn/ui
│   ├── match/              # MatchCard, MatchForm, MatchList
│   ├── player/             # PlayerCard, PlayerSearch
│   ├── chat/               # ChatWindow, MessageBubble
│   ├── map/                # MapView, ClubMarker
│   ├── stats/              # Charts, ProgressionGraph
│   └── layout/             # Navbar, BottomNav
├── lib/
│   ├── supabase/           # Clients (browser, server, admin)
│   ├── stripe/             # Config Stripe
│   ├── matching/           # Algorithme de matching
│   ├── ranking/            # Système de classement
│   └── utils/              # Helpers
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript + database.ts
└── stores/                 # Zustand stores
```

## Conventions
- **Composants** : PascalCase, un fichier par composant
- **Hooks** : préfixe `use*`, un hook par fichier
- **Server Actions** : préfixe `action*`
- **Fichiers** : kebab-case
- **Commits** : Conventional Commits (feat:, fix:, chore:, docs:)
- **Toujours** : TypeScript strict, pas de `any`, Zod pour toute validation
- **Style** : Tailwind utility classes, pas de CSS custom sauf nécessité absolue
- **Exports** : Named exports par défaut (sauf pages Next.js)
- **Erreurs** : Error boundaries par section, toast pour feedback utilisateur
- **Langue** : UI en français, code en anglais

## Base de Données (résumé)
14 tables : profiles, clubs, courts, groups, group_members, matches, match_participants, bookings, conversations, conversation_members, messages, notifications, player_stats, club_reviews

**Enums clés** : player_level (6 niveaux), playing_side, play_style, match_status, participant_status, payment_status, notification_type

**Fonctions SQL** : haversine_distance(), find_nearby_players()

**RLS** activé sur toutes les tables. Triggers pour : updated_at auto, création profil auto, mise à jour conversation, compteur membres groupe.

Schéma complet dans `supabase/migrations/001_initial_schema.sql`

## Algorithme de Matching
Score composite sur 100 points :
- **Niveau** (40%) : diff de level_score, 0 = parfait
- **Position complémentaire** (20%) : gauche + droite = bonus max
- **Fiabilité** (20%) : reliability_score, pénalise no-shows
- **Proximité** (15%) : distance haversine, décroît linéairement
- **Disponibilités** (5%) : créneaux communs

## Évolution du Niveau
Système hybride Elo-like :
- Auto-déclaration initiale (onboarding)
- Ajustement post-match selon résultat + force adversaire
- Peer feedback (30% du calcul) après chaque match
- Score de 1.0 à 10.0, facteur K = 0.5

## Roadmap (12 sprints × 1 semaine)
**Phase 1 — Fondations** (S1-S3) : Auth, profils, onboarding, matching, recherche joueurs
**Phase 2 — Core Match** (S4-S6) : CRUD matchs, résultats, stats, classements
**Phase 3 — Social & Carte** (S7-S9) : Chat realtime, groupes, carte Mapbox
**Phase 4 — Monétisation** (S10-S12) : Stripe, notifications push, PWA polish, déploiement

## Variables d'Environnement Requises
```
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_MAPBOX_TOKEN
NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
RESEND_API_KEY
NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_APP_NAME
```

## Modèle Économique
- **Gratuit** : profil, matching basique, 3 matchs/mois, chat
- **Premium** (5,99€/mois ou 49,99€/an) : matching illimité, stats avancées, classements
- **Club** (sur devis) : dashboard, gestion terrains, tournois, analytics
