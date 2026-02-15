# CLAUDE.md — Padelia

## Vision
Padelia est une PWA mobile-first de reference pour les joueurs de padel. Clone ameliore de Padel Mates avec un matching intelligent superieur et un focus sur la progression des joueurs.

**Promesse** : "Joue mieux, plus souvent, avec les bons partenaires."

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
- **Deploy** : Vercel (https://padelia-beta.vercel.app)

## Structure du Projet
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Login, register, reset, onboarding
│   ├── (main)/             # Layout avec bottom nav
│   │   ├── accueil/        # Feed personnalise
│   │   ├── matchs/         # CRUD matchs + recherche
│   │   ├── carte/          # Carte Mapbox interactive
│   │   ├── joueurs/        # Recherche + profils joueurs
│   │   ├── chat/           # Conversations + messages
│   │   ├── groupes/        # Communautes
│   │   ├── clubs/          # Annuaire + reservation
│   │   ├── tournois/       # Competitions
│   │   ├── stats/          # Dashboard stats + progression
│   │   └── profil/         # Mon profil + parametres
│   └── api/                # Webhooks Stripe, etc.
├── components/
│   ├── ui/                 # shadcn/ui
│   ├── match/              # MatchCard, MatchForm, MatchList
│   ├── player/             # PlayerCard, PlayerSearch
│   ├── chat/               # ChatWindow, MessageBubble
│   ├── map/                # MapView, ClubMarker
│   ├── stats/              # Charts, ProgressionGraph
│   ├── layout/             # Header, BottomNav, PushPermission, GeolocationPermission
│   └── providers/          # QueryProvider (TanStack Query)
├── lib/
│   ├── supabase/           # Clients (browser, server, admin)
│   ├── stripe/             # Config Stripe
│   ├── matching/           # Algorithme de matching
│   ├── ranking/            # Systeme de classement (ELO + reliability)
│   ├── notifications/      # Push + Email (Resend)
│   └── utils/              # Helpers
├── hooks/                  # Custom React hooks (use-player-suggestions, use-chat-realtime)
├── types/                  # TypeScript + database.ts
└── stores/                 # Zustand stores
```

## Conventions
- **Composants** : PascalCase, un fichier par composant
- **Hooks** : prefixe `use*`, un hook par fichier
- **Server Actions** : prefixe `action*`
- **Fichiers** : kebab-case
- **Commits** : Conventional Commits (feat:, fix:, chore:, docs:)
- **Toujours** : TypeScript strict, pas de `any`, Zod pour toute validation
- **Style** : Tailwind utility classes, pas de CSS custom sauf necessite absolue
- **Exports** : Named exports par defaut (sauf pages Next.js)
- **Erreurs** : Error boundaries par section, toast pour feedback utilisateur
- **Langue** : UI en francais, code en anglais
- **Performance** : React.memo sur composants listes, TanStack Query pour cache, Promise.all pour queries paralleles, pas de N+1

## Base de Donnees (resume)
14 tables : profiles, clubs, courts, groups, group_members, matches, match_participants, bookings, conversations, conversation_members, messages, notifications, player_stats, club_reviews

**Enums cles** : player_level (6 niveaux), playing_side, play_style, match_status, participant_status, payment_status, notification_type

**Fonctions SQL** : haversine_distance(), find_nearby_players()

**RLS** active sur toutes les tables. Triggers pour : updated_at auto, creation profil auto, mise a jour conversation, compteur membres groupe.

Schema complet dans `supabase/schema.sql`

## Algorithme de Matching
Score composite sur 100 points :
- **Niveau** (40%) : diff de level_score, 0 = parfait
- **Position complementaire** (20%) : gauche + droite = bonus max
- **Fiabilite** (20%) : reliability_score, penalise no-shows
- **Proximite** (15%) : distance haversine, decroit lineairement
- **Disponibilites** (5%) : creneaux communs

## Evolution du Niveau
Systeme hybride Elo-like :
- Auto-declaration initiale (onboarding)
- Ajustement post-match selon resultat + force adversaire
- Peer feedback (30% du calcul) apres chaque match
- Score de 1.0 a 10.0, facteur K = 0.5

## Variables d'Environnement Requises
```
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_MAPBOX_TOKEN
NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
RESEND_API_KEY
CRON_SECRET
NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_APP_NAME
```

## Modele Economique
- **Gratuit** : profil, matching basique, 3 matchs/mois, chat
- **Premium** (5,99EUR/mois ou 49,99EUR/an) : matching illimite, stats avancees, classements
- **Club** (sur devis) : dashboard, gestion terrains, tournois, analytics

---

## Etat actuel du projet (Fevrier 2026)

### Fonctionnalites IMPLEMENTEES
| Module | Statut | Details |
|--------|--------|---------|
| Auth (Login/Register/Google) | FAIT | Supabase Auth, middleware, protection routes |
| Onboarding 3 etapes | FAIT | Identite, niveau, style de jeu |
| Profil (vue/edition/parametres) | FAIT | Tous champs, validation Zod, avatar |
| Match CRUD | FAIT | Creer, lister, detail, rejoindre/quitter |
| Scoring post-match | FAIT | 3 sets, calcul vainqueur, ELO |
| Chat temps reel | FAIT | Supabase Realtime, envoi/reception, mark read, pagination scroll infini |
| Recherche joueurs + matching | FAIT | Filtre niveau/distance, algo composite 5 criteres |
| Groupes/communautes | FAIT | CRUD, membres, admin, matchs de groupe |
| Carte Mapbox | FAIT | Clubs + joueurs, geolocalisation, layers |
| Stats + classements | FAIT | Win rate, streak, partenaires, historique, ELO |
| Paiements Stripe | FAIT | Checkout, webhooks, abonnement premium |
| PWA | FAIT | Service Worker, manifest, install prompt |
| Geolocalisation | FAIT | Permission prompt, sauvegarde coords profil |
| Notifications auto-triggers | FAIT | Join/leave/cancel match, groupe, chat (debounce 30s), match completed |
| Notifications email | FAIT | Templates Resend (bienvenue, match termine), lazy-init |
| Rappel match (cron) | FAIT | Vercel Cron 1x/jour 8h UTC (Hobby plan), push + email 75min avant |
| Tests unitaires (Vitest) | FAIT | 105 tests : matching, ELO, reliability, Zod schemas |
| Pagination "Charger plus" | FAIT | Matchs, joueurs, stats, chat (cursor-based) |
| Peer feedback post-match | FAIT | Etoiles 1-5, slider niveau, blend 70/30 dans level_score |

### Fonctionnalites PARTIELLEMENT implementees
| Module | Statut | Manque |
|--------|--------|-------|
| Annuaire clubs | PARTIEL | Visible sur carte, pas de page dediee |
| Avis clubs | PARTIEL | Table club_reviews existe, pas d'UI |
| Tests E2E (Playwright) | PARTIEL | Setup manquant, flows auth/match/chat a ecrire |

### Fonctionnalites MANQUANTES
| Module | Priorite | Effort estime |
|--------|----------|--------------|
| Pages clubs + avis | HAUTE | 1-2 semaines |
| Tournois | MOYENNE | 2-3 semaines |
| Reservation terrains (booking) | MOYENNE | 2-3 semaines |
| Tests E2E (Playwright) | MOYENNE | 1 semaine |
| Page offline (PWA fallback) | BASSE | 2 jours |
| Images dans le chat | BASSE | 1 semaine |

---

## Roadmap — Phases d'implementation

### PHASE 5 — Solidification ✅ TERMINEE
> Rendre l'existant robuste et pret pour de vrais utilisateurs.

- [x] **Notifications automatiques**
  - Triggers : match join/leave/cancel/complete, groupe join, chat message (debounce 30s)
  - Rappel 75min avant match (Vercel Cron 1x/jour 8h UTC (Hobby plan), push + email)
  - Respect `notification_preferences` JSONB par utilisateur
  - Templates email Resend : bienvenue, match termine
  - Fichiers : `lib/notifications/triggers.ts`, `api/notifications/trigger/route.ts`, `api/cron/match-reminder/route.ts`
- [x] **Tests unitaires (Vitest)** — 105 tests, 0 echecs
  - `calculate-match-score.test.ts` (22 tests : haversine, score composite, poids)
  - `calculate-elo.test.ts` (12 tests : K-factor, margin, conservation, underdog)
  - `reliability.test.ts` (15 tests : events, bornes, precision)
  - `schemas.test.ts` (56 tests : 5 schemas Zod, valid/invalid/boundary)
  - Setup : `vitest.config.ts`, `src/__tests__/setup.ts`, scripts npm
- [ ] **Tests E2E (Playwright)** — Reporte Phase 6+
  - Flow auth complet (register -> onboarding -> accueil)
  - Flow match (creer -> rejoindre -> scorer -> stats)
  - Flow chat (nouvelle conversation -> envoyer message)
- [x] **Pagination "Charger plus"**
  - Matchs : cursor `scheduled_at`, 15 par page (`MatchListClient.tsx`)
  - Joueurs : `visibleCount` state, 10 par page
  - Stats historique : cursor `created_at`, 10 par page (`MatchHistory.tsx` client)
  - Chat : scroll-to-top, cursor `created_at`, 30 messages, `prevHeightRef` preserve position
- [x] **Peer feedback post-match**
  - `PeerFeedbackForm.tsx` : etoiles 1-5 cliquables + slider niveau 1.0-10.0 optionnel
  - API `matches/[id]/feedback/route.ts` : validation Zod, blend 70/30 quand tous ont note
  - `scoreToLevel()` recalcule l'enum niveau apres blend
  - Integration dans page detail match (apres score, si completed + participant)

### PHASE 6 — Clubs & Terrains (2-3 semaines)
> Attirer les clubs comme utilisateurs de la plateforme.

- [ ] **Pages clubs**
  - `/clubs` : annuaire avec recherche par ville, nom, rating
  - `/clubs/[id]` : detail club (infos, terrains, horaires, avis)
  - Photos club (Supabase Storage)
  - Lien depuis la carte Mapbox vers page club
- [ ] **Systeme d'avis**
  - Formulaire d'avis apres visite (note 1-5, commentaire)
  - Affichage moyenne + liste avis sur page club
  - Moderation basique (signalement)
- [ ] **Reservation de terrains**
  - Grille de disponibilite par terrain (creneaux horaires)
  - Flow de reservation : choisir creneau -> payer (Stripe) -> confirmation
  - Gestion annulation (politique remboursement)
  - Dashboard club : voir les reservations, bloquer des creneaux
  - Table `bookings` deja en base (schema pret)
- [ ] **Dashboard club (base)**
  - Vue reservations du jour/semaine
  - Stats basiques (taux remplissage, revenus)

### PHASE 7 — Tournois & Competition (2-3 semaines)
> Ajouter la dimension competitive pour fideliser les joueurs.

- [ ] **Schema tournois**
  - Nouvelle table `tournaments` (nom, type, format, dates, club, max_teams)
  - Table `tournament_teams` (equipes inscrites)
  - Table `tournament_brackets` (arbre de competition)
  - Migration Supabase + RLS
- [ ] **CRUD tournois**
  - `/tournois` : liste des tournois (a venir, en cours, passes)
  - `/tournois/creer` : formulaire creation (club organise ou libre)
  - `/tournois/[id]` : detail avec bracket, equipes, resultats
- [ ] **Gestion brackets**
  - Tirage au sort automatique
  - Arbre eliminatoire (visualisation bracket)
  - Saisie des scores par match
  - Avancement automatique du vainqueur
- [ ] **Inscriptions**
  - Inscription en equipe de 2 (duo)
  - Paiement inscription (Stripe)
  - Liste d'attente si complet
  - Notifications aux participants (prochains matchs, resultats)

### PHASE 8 — Engagement & Retention (2 semaines)
> Maximiser l'utilisation recurrente de l'app.

- [ ] **Notifications intelligentes**
  - "Un joueur compatible est disponible ce soir" (push smart)
  - "Tu n'as pas joue depuis 7 jours" (reactivation)
  - Resume hebdomadaire par email (stats, matchs a venir)
  - Digest groupe (nouveaux matchs dans tes groupes)
- [ ] **Gamification**
  - Badges/achievements (premier match, 10 victoires, streak 5 matchs...)
  - Animation d'obtention de badge
  - Section badges dans le profil
  - Classement mensuel avec reset
- [ ] **Ameliorations chat**
  - Partage d'images (Supabase Storage)
  - Reactions sur messages (emoji)
  - Indicateur "en train d'ecrire" (Supabase Presence)
  - Chat de groupe depuis page groupe
- [ ] **Page offline**
  - Fallback PWA quand hors connexion
  - Cache des dernieres donnees consultees

### PHASE 9 — Distribution & Croissance (2-3 semaines)
> Rendre l'app accessible au plus grand nombre.

- [ ] **Stores mobiles**
  - Wrapper PWA avec Capacitor ou Bubblewrap
  - Listing Google Play Store
  - Listing Apple App Store (TestFlight puis production)
  - Deep links (partager un match, un profil)
- [ ] **SEO & Landing**
  - Landing page publique (hors auth) avec features
  - Pages joueurs publiques (profil partage)
  - Open Graph meta pour partage social
  - Sitemap + robots.txt
- [ ] **Analytics & Monitoring**
  - Vercel Analytics (Core Web Vitals)
  - Sentry pour error tracking
  - Mixpanel ou PostHog pour analytics produit
  - Dashboard metriques (DAU, retention, matchs/jour)
- [ ] **Internationalisation (i18n)**
  - Support anglais + espagnol (marches padel majeurs)
  - next-intl ou format messages
  - Switcheur de langue dans parametres

### PHASE 10 — Scale & Monetisation avancee (ongoing)
> Transformer en business viable.

- [ ] **Stripe Connect pour clubs**
  - Clubs recoivent les paiements directement
  - Commission plateforme sur reservations
  - Dashboard financier club
- [ ] **Offre Club avancee**
  - Gestion multi-terrains
  - Calendrier planning
  - CRM joueurs (frequentation, preferences)
  - Analytics avancees (heures de pointe, sports populaires)
- [ ] **API publique**
  - REST API pour clubs tiers
  - Webhooks pour integration calendrier
  - Widget reservation embedable
- [ ] **Optimisations performance**
  - Edge functions pour les calculs lourds
  - CDN images (Cloudflare)
  - Database read replicas si necessaire
  - Rate limiting API

---

## Priorites immediates (prochaine session)
1. Pages clubs + systeme d'avis (Phase 6)
2. Reservation de terrains avec paiement Stripe (Phase 6)
3. Tests E2E Playwright sur les flows critiques
4. Dashboard club basique
