# Padelia

**Joue mieux, plus souvent, avec les bons partenaires.**

Padelia est une Progressive Web App (PWA) mobile-first pour les joueurs de padel. Matching intelligent, gestion de matchs, chat en temps reel, groupes, carte interactive et suivi de progression.

> **Live** : [padelia-beta.vercel.app](https://padelia-beta.vercel.app)

---

## Fonctionnalites

### Authentification & Profils
- Inscription / connexion par email ou Google OAuth
- Onboarding en 3 etapes (identite, niveau, style de jeu)
- Profil complet : niveau, cote main, style, objectifs, disponibilites
- Edition de profil et gestion des creneaux horaires
- Geolocalisation avec sauvegarde dans le profil

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
- Saisie des scores (jusqu'a 3 sets) et finalisation
- Calcul ELO automatique post-match
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
- Service Worker pour reception en arriere-plan
- Emails transactionnels via Resend

### PWA
- Manifest avec icones, raccourcis et mode standalone
- Service Worker : cache offline, push, install prompt
- Installation native sur mobile et desktop

---

## Stack Technique

| Categorie | Technologie |
|-----------|------------|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript 5.6+ |
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

## Demarrage Rapide

### Prerequisites

- Node.js 20+
- npm ou pnpm
- Un projet [Supabase](https://supabase.com)
- Un compte [Stripe](https://stripe.com) (pour les paiements)
- Un token [Mapbox](https://mapbox.com) (pour la carte)

### Installation

```bash
git clone https://github.com/emifrog/padelia.git
cd padelia
npm install
```

### Configuration

```bash
cp .env.local.example .env.local
```

Renseigner les variables dans `.env.local` (voir `.env.local.example` pour la liste complete).

### Base de Donnees

Executer le schema SQL dans votre projet Supabase :

```bash
# Via Supabase CLI
supabase db push

# Ou manuellement via le SQL Editor de Supabase
# Copier le contenu de supabase/schema.sql
```

### Lancement

```bash
npm run dev       # Developpement (Turbopack)
npm run build     # Build production
npm start         # Serveur production
npm run lint      # ESLint
```

L'application est accessible sur `http://localhost:3000`.

---

## Architecture

### App Router

Le projet utilise Next.js App Router avec deux groupes de routes :
- `(auth)` : Pages publiques (login, register, onboarding)
- `(main)` : Pages authentifiees avec layout commun (Header + BottomNav)

### Server vs Client Components

- **Server Components** par defaut pour le SSR et le data fetching
- **Client Components** (`'use client'`) pour l'interactivite (formulaires, realtime, state)
- `dynamic(() => import(...), { ssr: false })` pour Mapbox

### Performance

- Requetes Supabase avec joins (pas de N+1)
- `Promise.all()` pour les requetes paralleles
- TanStack Query avec `staleTime: 5min` pour le cache client
- `React.memo` sur les composants de liste (MatchCard, PlayerSuggestionCard, BottomNav)
- `Suspense` boundaries pour le rendu progressif
- Font `display: 'swap'` pour eviter le FOIT

### Securite

- Row-Level Security (RLS) sur toutes les tables Supabase
- Middleware de session pour la persistence auth
- Validation Zod sur tous les formulaires
- Verification de signature Stripe pour les webhooks
- Service Role Key uniquement cote serveur

---

## Base de Donnees

### Tables Principales

| Table | Description |
|-------|------------|
| `profiles` | Joueurs (niveau, stats, geo, disponibilites) |
| `matches` | Matchs (type, statut, lieu, date, scores) |
| `match_participants` | Inscriptions + statuts |
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

---

## Design System

- **Font** : Outfit (300-900, display swap)
- **Couleurs** : Navy (#0B1A2E), Green (#3EAF4B), Lime (#C8DC38)
- **Gradients** : Navy (135deg), Green (135deg)
- **Cards** : Blanches avec shadow-padel, rounded-xl
- **Matchs hero** : Cards navy gradient, scroll horizontal
- **Chat** : Bulles vertes gradient (propres) / grises (recues)
- **FAB** : Bouton flottant vert gradient avec pulse animation

---

## Modele Economique

| Plan | Prix | Fonctionnalites |
|------|------|-----------------|
| **Gratuit** | 0EUR | Profil, matching basique, 3 matchs/mois, chat |
| **Premium** | 5,99EUR/mois ou 49,99EUR/an | Matching illimite, stats avancees, classements |
| **Club** | Sur devis | Dashboard club, gestion terrains, tournois |

---

## Roadmap

### Fait
- [x] **Phase 1** : Auth, profils, onboarding, matching, recherche joueurs
- [x] **Phase 2** : CRUD matchs, resultats, ELO, stats, classements
- [x] **Phase 3** : Chat realtime, groupes, carte Mapbox
- [x] **Phase 4** : Stripe, notifications push, PWA, design polish

### A venir
- [ ] **Phase 5 — Solidification** : Notifications auto-triggers, tests (Vitest + Playwright), pagination, peer feedback post-match
- [ ] **Phase 6 — Clubs & Terrains** : Pages clubs, avis, reservation de terrains, dashboard club
- [ ] **Phase 7 — Tournois** : Schema, CRUD, brackets, inscriptions
- [ ] **Phase 8 — Engagement** : Gamification (badges), ameliorations chat (images, reactions, presence), notifications intelligentes
- [ ] **Phase 9 — Distribution** : Stores mobiles (Capacitor), SEO, analytics, i18n
- [ ] **Phase 10 — Scale** : Stripe Connect, offre club avancee, API publique

---

## Licence

Projet prive. Tous droits reserves. XRWeb
