# Padelia

**Joue mieux, plus souvent, avec les bons partenaires.**

Padelia est une Progressive Web App (PWA) mobile-first pour les joueurs de padel. Matching intelligent, gestion de matchs, chat en temps reel, groupes, carte interactive et suivi de progression.

---

## Fonctionnalites

### Authentification & Profils
- Inscription / connexion par email ou Google OAuth
- Onboarding en 3 etapes (identite, niveau, style de jeu)
- Profil complet : niveau, cote main, style, objectifs, disponibilites
- Edition de profil et gestion des creneaux horaires

### Matching Intelligent
Score composite sur 100 points :
- **Niveau** (40%) : compatibilite basee sur le level_score
- **Position complementaire** (20%) : gauche + droite = bonus max
- **Fiabilite** (20%) : penalise les no-shows
- **Proximite** (15%) : distance haversine, rayon configurable
- **Disponibilites** (5%) : creneaux communs

### Gestion des Matchs
- Creation de match (amical, classe, tournoi)
- Visibilite (public, groupe, prive)
- Inscription / desinscription des joueurs
- Saisie des scores et finalisation
- Filtres par type avec recherche texte

### Systeme de Classement
- Systeme hybride Elo-like (score 1.0 a 10.0)
- Facteur K dynamique selon l'experience
- Bonus de marge (sweep, domination)
- Score de fiabilite base sur la presence

### Statistiques & Progression
- Dashboard : niveau, win rate, serie en cours
- Historique des 20 derniers matchs
- Meilleurs partenaires
- Classements generaux et par niveau

### Chat en Temps Reel
- Conversations directes et de groupe
- Messages en temps reel via Supabase Realtime
- Indicateurs de non-lus et badges
- Bulles de message avec gradient

### Groupes / Communautes
- Creation de groupe (public, prive, sur invitation)
- Gestion des membres et des roles (admin, moderateur, membre)
- Decouverte de groupes publics

### Carte Interactive
- Carte Mapbox plein ecran
- Marqueurs clubs (navy) et joueurs (vert)
- Geolocalisation du joueur
- Bascule entre couches clubs/joueurs

### Paiements & Abonnements
- Integration Stripe (Checkout, Billing Portal, Webhooks)
- Plan gratuit : 3 matchs/mois, matching basique
- Plan Premium (5,99EUR/mois ou 49,99EUR/an) : matching illimite, stats avancees, classements

### Notifications Push
- Web Push API avec cles VAPID
- Notifications pour invitations, rappels, messages
- Emails transactionnels via Resend

### PWA
- Manifest avec icones, raccourcis et mode standalone
- Service Worker : cache offline, push, install prompt
- Installation native sur mobile et desktop

---

## Stack Technique

| Categorie | Technologie |
|-----------|------------|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript 5 |
| Backend | Supabase (Auth, PostgreSQL, Realtime, Storage) |
| UI | Tailwind CSS 4 + shadcn/ui + Framer Motion |
| State | TanStack Query (serveur) + Zustand (client) |
| Forms | React Hook Form + Zod |
| Carte | Mapbox GL JS |
| Paiement | Stripe (Checkout, Billing, Webhooks) |
| Chat | Supabase Realtime (WebSocket channels) |
| Notifications | Web Push API + Resend (emails) |
| PWA | Service Worker custom + Serwist |
| Deploy | Vercel |

---

## Structure du Projet

```
src/
├── app/
│   ├── (auth)/              # Login, register, onboarding
│   │   ├── login/
│   │   ├── register/
│   │   └── onboarding/
│   ├── (main)/              # Layout principal avec bottom nav
│   │   ├── accueil/         # Feed personnalise
│   │   ├── matchs/          # CRUD matchs + recherche + detail
│   │   ├── carte/           # Carte Mapbox interactive
│   │   ├── joueurs/         # Recherche joueurs
│   │   ├── chat/            # Conversations + messages
│   │   ├── groupes/         # Communautes
│   │   ├── stats/           # Dashboard + classements
│   │   └── profil/          # Profil, edit, dispos, abonnement
│   └── api/
│       ├── matches/         # Completion de match
│       ├── notifications/   # Push subscribe + send
│       ├── stripe/          # Checkout + portal
│       └── webhooks/        # Stripe webhooks
├── components/
│   ├── ui/                  # shadcn/ui (Button, Input, Badge, etc.)
│   ├── match/               # MatchCard, MatchForm, MatchActions
│   ├── player/              # PlayerSuggestionCard
│   ├── chat/                # ChatWindow, MessageBubble, ChatInput
│   ├── group/               # GroupCard, GroupActions, GroupMemberList
│   ├── map/                 # MapView, MapWrapper
│   ├── stats/               # LevelProgressBar, WinRateRing
│   ├── accueil/             # SuggestionsSection, FabButton
│   ├── onboarding/          # StepIdentity, StepLevel, StepStyle
│   └── layout/              # Header, BottomNav, LogoutButton
├── hooks/
│   ├── use-chat-realtime.ts
│   ├── use-player-suggestions.ts
│   └── use-group-actions.ts
├── lib/
│   ├── supabase/            # Clients (browser, server, middleware)
│   ├── stripe/              # Config Stripe + plans
│   ├── matching/            # Algorithme de matching
│   ├── ranking/             # Systeme ELO + fiabilite
│   ├── notifications/       # Push + email
│   ├── validations/         # Schemas Zod (match, group)
│   ├── constants/           # Labels et couleurs
│   └── utils.ts             # cn() helper
├── types/                   # TypeScript types + enums
└── stores/                  # Zustand stores
```

---

## Demarrage Rapide

### Prerequisites

- Node.js 20+
- npm ou pnpm
- Un projet [Supabase](https://supabase.com)
- Un compte [Stripe](https://stripe.com) (pour les paiements)
- Un token [Mapbox](https://mapbox.com) (pour la carte)

### Installation

```bash
# Cloner le repo
git clone https://github.com/votre-user/padelia.git
cd padelia

# Installer les dependances
npm install
```

### Configuration

Copier le fichier d'exemple et renseigner les variables :

```bash
cp .env.local.example .env.local
```

Variables requises dans `.env.local` :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Padelia

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_PREMIUM_YEARLY=price_...

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...

# Web Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key

# Resend (emails)
RESEND_API_KEY=re_...
```

### Base de Donnees

Executer le schema SQL dans votre projet Supabase :

```bash
# Via Supabase CLI
supabase db push

# Ou manuellement via le SQL Editor de Supabase
# Copier le contenu de schema.sql
```

Le schema cree 14+ tables avec RLS, triggers et fonctions (haversine_distance, find_nearby_players).

### Lancement

```bash
# Developpement
npm run dev

# Build production
npm run build

# Demarrer en production
npm start
```

L'application est accessible sur `http://localhost:3000`.

---

## Base de Donnees

### Tables Principales

| Table | Description |
|-------|------------|
| `profiles` | Joueurs (niveau, stats, geo, disponibilites) |
| `matches` | Matchs (type, statut, lieu, date, scores) |
| `match_participants` | Inscriptions + statuts (confirmed, invited, left) |
| `conversations` | Conversations (direct, group, match) |
| `messages` | Messages chat |
| `conversation_members` | Membres + last_read_at |
| `groups` | Groupes/communautes |
| `group_members` | Membres de groupe + roles |
| `clubs` | Clubs de padel |
| `courts` | Terrains par club |
| `bookings` | Reservations de terrains |
| `notifications` | Notifications in-app |
| `player_stats` | Stats detaillees par joueur |
| `club_reviews` | Avis sur les clubs |

### Enums

- `player_level` : debutant, intermediaire_moins, intermediaire, intermediaire_plus, avance, expert
- `match_status` : open, full, confirmed, in_progress, completed, cancelled
- `match_type` : friendly, ranked, tournament
- `participant_status` : invited, confirmed, declined, left, no_show

---

## Design System

L'interface suit un design mobile-first avec :

- **Font** : Outfit (300-900)
- **Couleurs** : Navy (#0B1A2E), Green (#3EAF4B), Lime (#C8DC38)
- **Gradients** : Navy (135deg), Green (135deg), Lime-Yellow (135deg)
- **Shadows** : padel (light), padel-md (medium), green (glow)
- **Cards** : Blanches avec shadow-padel, arrondies (rounded-xl)
- **Matchs hero** : Cards navy gradient avec scroll horizontal
- **Badges** : Rounded-full avec couleurs semantiques
- **Profil** : Hero card navy gradient, stats 4 colonnes
- **Chat** : Bulles vertes gradient (propres) / grises (recues)
- **FAB** : Bouton flottant vert gradient avec pulse animation

---

## Scripts

| Commande | Description |
|----------|------------|
| `npm run dev` | Serveur de developpement (Turbopack) |
| `npm run build` | Build de production |
| `npm start` | Serveur de production |
| `npm run lint` | Linting ESLint |

---

## Architecture

### App Router

Le projet utilise Next.js App Router avec deux groupes de routes :
- `(auth)` : Pages publiques (login, register, onboarding)
- `(main)` : Pages authentifiees avec layout commun (Header + BottomNav)

### Server vs Client Components

- **Server Components** par defaut pour le SSR et le data fetching
- **Client Components** (`'use client'`) uniquement pour l'interactivite (formulaires, realtime, state)
- `dynamic(() => import(...), { ssr: false })` pour Mapbox (pas de SSR)

### Securite

- Row-Level Security (RLS) sur toutes les tables Supabase
- Middleware de session pour la persistence auth
- Validation Zod sur tous les formulaires
- Verification de signature Stripe pour les webhooks
- Service Role Key uniquement cote serveur

---

## Modele Economique

| Plan | Prix | Fonctionnalites |
|------|------|-----------------|
| **Gratuit** | 0EUR | Profil, matching basique, 3 matchs/mois, chat |
| **Premium** | 5,99EUR/mois ou 49,99EUR/an | Matching illimite, stats avancees, classements |
| **Club** | Sur devis | Dashboard club, gestion terrains, tournois |

---

## Roadmap

- [x] **Phase 1** (S1-S3) : Auth, profils, onboarding, matching, recherche joueurs
- [x] **Phase 2** (S4-S6) : CRUD matchs, resultats, ELO, stats, classements
- [x] **Phase 3** (S7-S9) : Chat realtime, groupes, carte Mapbox
- [x] **Phase 4** (S10-S12) : Stripe, notifications push, PWA, design polish
- [ ] **Futur** : Page clubs dedicee, tournois, analytics club, Stripe Connect

---

## Licence

Projet prive. Tous droits reserves.
