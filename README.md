# Padelia

**Joue mieux, plus souvent, avec les bons partenaires.**

Padelia est une Progressive Web App (PWA) mobile-first pour les joueurs de padel. Matching intelligent, gestion de matchs, chat en temps reel, groupes, clubs, tournois, carte interactive et suivi de progression.

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
- Peer feedback post-match (etoiles + ajustement niveau)
- Filtres par type avec recherche texte et pagination cursor-based

### Systeme de Classement
- Systeme hybride Elo-like (score 1.0 a 10.0)
- Facteur K dynamique selon l'experience
- Bonus de marge (sweep, domination)
- Score de fiabilite base sur la presence

### Statistiques & Progression
- Dashboard : niveau, win rate, serie en cours
- Historique des matchs avec pagination
- Meilleurs partenaires
- Classements generaux et par niveau

### Chat en Temps Reel
- Conversations directes et de groupe
- Messages en temps reel via Supabase Realtime
- Indicateurs de non-lus et badges
- Pagination scroll infini (30 messages par page)

### Groupes / Communautes
- Creation de groupe (public, prive, sur invitation)
- Gestion des membres et des roles (admin, moderateur, membre)
- Decouverte de groupes publics

### Clubs & Terrains
- Annuaire clubs avec recherche par ville, nom et note
- Detail club : info, terrains, horaires, avis
- Systeme d'avis (etoiles 1-5 + commentaire, recalcul automatique)
- Reservation de terrains : grille disponibilites, flow 4 etapes, paiement Stripe
- Annulation avec politique de remboursement (>24h = remboursement complet)
- Dashboard club : stats (revenue, remplissage, bookings, note), timeline, vue semaine
- Section "Mes reservations" dans le profil

### Tournois & Competition
- CRUD tournois (brouillon, inscriptions ouvertes/fermees, en cours, termine)
- Inscription en duo : flow 3 etapes (nom equipe, choix partenaire, confirmation)
- Paiement Stripe pour les tournois payants
- Generation automatique de brackets eliminatoire (single elimination)
- Gestion des byes pour top seeds, shuffle des non-seeded
- Visualisation brackets CSS pure (scroll horizontal, colonnes par round)
- Saisie des scores par l'organisateur, avancement automatique des vainqueurs
- Detection automatique de la finale → statut "termine"
- Retrait avec remboursement Stripe si deadline non depassee

### Carte Interactive
- Carte Mapbox plein ecran
- Marqueurs clubs (navy) et joueurs (vert)
- Geolocalisation du joueur
- Bascule entre couches clubs/joueurs
- Lien direct vers la page club depuis les popups

### Paiements & Abonnements
- Integration Stripe (Checkout, Billing Portal, Webhooks)
- Plan gratuit : 3 matchs/mois, matching basique
- Plan Premium (5,99EUR/mois ou 49,99EUR/an) : matching illimite, stats avancees, classements
- Paiement reservations de terrains
- Paiement inscriptions tournois

### Notifications
- Web Push API avec cles VAPID
- Service Worker pour reception en arriere-plan
- Emails transactionnels via Resend (bienvenue, match termine)
- Auto-triggers : match join/leave/cancel/complete, groupe, chat (debounce 30s), tournoi
- Rappel automatique 75min avant match (Vercel Cron)

### PWA
- Manifest avec icones, raccourcis et mode standalone
- Service Worker : cache offline, push, install prompt
- Installation native sur mobile et desktop

---

## Stack Technique

| Categorie | Technologie |
|-----------|------------|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript 5.6+ |
| Backend | Supabase (Auth, PostgreSQL, Realtime, Storage) |
| UI | Tailwind CSS 4 + shadcn/ui + Framer Motion |
| State | TanStack Query (serveur) + Zustand (client) |
| Forms | React Hook Form + Zod |
| Carte | Mapbox GL JS |
| Paiement | Stripe (Checkout, Billing, Webhooks) |
| Chat | Supabase Realtime (WebSocket channels) |
| Notifications | Web Push API + Resend (emails) |
| PWA | Service Worker custom + Serwist |
| Tests | Vitest (142 tests) + Playwright (113 tests E2E) |
| Deploy | Vercel |

---

## Qualite & Securite

- **CSP durcie** : pas de `unsafe-inline` dans script-src, directives `base-uri`, `form-action`, `object-src none`
- **Headers securite** : HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy
- **Rate limiting** sur les routes API sensibles (mutations)
- **RLS** (Row-Level Security) active sur toutes les tables Supabase
- **Validation Zod** sur tous les formulaires et routes API
- **TypeScript strict** : zero `as any`, interfaces typees pour Supabase joins et Stripe SDK v20
- **Try/catch** sur 17/17 routes API avec logs structures
- **Accessibilite WCAG** : aria-label sur boutons icon-only et inputs, aria-hidden sur icones decoratives, role=tablist/tab + aria-selected sur filtres, aria-pressed sur toggles
- **Admin client centralise** (`lib/supabase/admin.ts`) remplacant 11 fonctions inline

---

## Tests

### Tests Unitaires (Vitest) — 142 tests
- `calculate-match-score.test.ts` (22 tests) : haversine, score composite, poids
- `calculate-elo.test.ts` (12 tests) : K-factor, margin, conservation, underdog
- `reliability.test.ts` (15 tests) : events, bornes, precision
- `schemas.test.ts` (56 tests) : 5 schemas Zod, valid/invalid/boundary
- `bracket-generator.test.ts` (37 tests) : single elimination, byes, seeds, cas limites

### Tests E2E (Playwright) — 113 tests
- `auth.spec.ts` : login, register, onboarding, redirects (12 tests)
- `match.spec.ts` : CRUD match, detail, cancel, navigation (8 tests)
- `chat.spec.ts` : conversations, new conversation, send message (7 tests)
- `booking.spec.ts` : clubs, detail, booking flow, reservations (7 tests)
- `tournament.spec.ts` : CRUD tournoi, tabs, registration, pagination (11 tests)
- `navigation.spec.ts` : bottom nav, all sections, 404, PWA (12 tests)
- 2 projets : chromium (desktop) + mobile (iPhone 14)

```bash
npm test              # Vitest
npm run test:e2e      # Playwright
npm run test:e2e:ui   # Playwright UI mode
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
git clone https://github.com/emifrog/padelia.git
cd padelia
npm install
```

### Configuration

```bash
cp .env.local.example .env.local
```

Renseigner les variables dans `.env.local` :

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_MAPBOX_TOKEN
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
RESEND_API_KEY
CRON_SECRET
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_APP_NAME
```

### Base de Donnees

Executer le schema SQL dans votre projet Supabase :

```bash
# Via Supabase CLI
supabase db push

# Ou manuellement via le SQL Editor de Supabase
# Copier le contenu de supabase/schema.sql
# Puis supabase/migrations/20260217_add_tournaments.sql
```

### Lancement

```bash
npm run dev       # Developpement (Turbopack)
npm run build     # Build production
npm start         # Serveur production
npm run lint      # ESLint
npm test          # Tests unitaires (Vitest)
npm run test:e2e  # Tests E2E (Playwright)
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
- `next/image` pour toutes les images avec optimisation automatique
- Dynamic imports pour les composants lourds (carte, brackets)
- Font `display: 'swap'` pour eviter le FOIT

---

## Base de Donnees

### Tables (17)

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
| `tournaments` | Tournois (format, statut, inscriptions, dates) |
| `tournament_teams` | Equipes inscrites (duo, captain, seed, paiement) |
| `tournament_brackets` | Matchs de bracket (round, position, scores, winner) |

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
- [x] **Phase 5** : Notifications auto-triggers, tests (142 Vitest + 113 Playwright), pagination cursor-based, peer feedback
- [x] **Phase 6** : Annuaire clubs, avis, reservation terrains + Stripe, dashboard club
- [x] **Phase 7** : Tournois CRUD, inscription duo + Stripe, brackets eliminatoire, saisie scores
- [x] **Hardening** : Securite (CSP, headers, rate limiting), accessibilite WCAG, typage strict, factorisation code

### A venir
- [ ] **Phase 8 — Engagement** : Gamification (badges), ameliorations chat (images, reactions, presence), notifications intelligentes
- [ ] **Phase 9 — Distribution** : Stores mobiles (Capacitor), SEO, analytics (Sentry, Vercel Analytics), i18n
- [ ] **Phase 10 — Scale** : Stripe Connect, offre club avancee, API publique

---

## Licence

Projet prive. Tous droits reserves. XRWeb
