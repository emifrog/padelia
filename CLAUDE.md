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
│   ├── tournament/         # TournamentCard, BracketView, BracketMatch, TeamList
│   ├── layout/             # Header, BottomNav, PushPermission, GeolocationPermission
│   └── providers/          # QueryProvider (TanStack Query)
├── lib/
│   ├── supabase/           # Clients (browser, server, admin)
│   ├── stripe/             # Config Stripe
│   ├── matching/           # Algorithme de matching
│   ├── ranking/            # Systeme de classement (ELO + reliability)
│   ├── tournament/         # Bracket generator (single elimination)
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
17 tables : profiles, clubs, courts, groups, group_members, matches, match_participants, bookings, conversations, conversation_members, messages, notifications, player_stats, club_reviews, tournaments, tournament_teams, tournament_brackets

**Enums cles** : player_level (6 niveaux), playing_side, play_style, match_status, participant_status, payment_status, notification_type, tournament_status, tournament_format, bracket_match_status

**Fonctions SQL** : haversine_distance(), find_nearby_players(), update_tournament_team_count()

**RLS** active sur toutes les tables. Triggers pour : updated_at auto, creation profil auto, mise a jour conversation, compteur membres groupe, compteur equipes tournoi.

Schema complet dans `supabase/schema.sql` + migration `supabase/migrations/20260217_add_tournaments.sql`

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
| Carte Mapbox | FAIT | Clubs + joueurs, geolocalisation, layers, lien vers page club |
| Stats + classements | FAIT | Win rate, streak, partenaires, historique, ELO |
| Paiements Stripe | FAIT | Checkout, webhooks, abonnement premium, paiement reservation |
| PWA | FAIT | Service Worker, manifest, install prompt |
| Geolocalisation | FAIT | Permission prompt, sauvegarde coords profil |
| Notifications auto-triggers | FAIT | Join/leave/cancel match, groupe, chat (debounce 30s), match completed, tournoi |
| Notifications email | FAIT | Templates Resend (bienvenue, match termine), lazy-init |
| Rappel match (cron) | FAIT | Vercel Cron 1x/jour 8h UTC (Hobby plan), push + email 75min avant |
| Tests unitaires (Vitest) | FAIT | 142 tests : matching, ELO, reliability, Zod schemas, bracket generator |
| Pagination "Charger plus" | FAIT | Matchs, joueurs, stats, chat, tournois (cursor-based) |
| Peer feedback post-match | FAIT | Etoiles 1-5, slider niveau, blend 70/30 dans level_score |
| Annuaire clubs | FAIT | `/clubs` annuaire recherche ville/nom/rating, `/clubs/[id]` detail, carte lien popup |
| Systeme d'avis clubs | FAIT | Formulaire note 1-5 + commentaire, recalcul moyenne, liste paginee |
| Reservation terrains | FAIT | Grille dispo, flow 4 etapes, Stripe Checkout, annulation >24h remboursement |
| Dashboard club | FAIT | Stats (revenue, remplissage, bookings, rating), timeline jour, vue semaine |
| Mes reservations | FAIT | `/profil/reservations` a venir/passees, annulation avec hook |
| Tournois & Competition | FAIT | CRUD, inscription duo + Stripe, bracket eliminatoire, saisie scores, avancement auto |

### Fonctionnalites PARTIELLEMENT implementees
| Module | Statut | Manque |
|--------|--------|-------|
| Tests E2E (Playwright) | PARTIEL | Setup manquant, flows auth/match/chat a ecrire |

### Fonctionnalites MANQUANTES
| Module | Priorite | Effort estime |
|--------|----------|--------------|
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

### PHASE 6 — Clubs & Terrains ✅ TERMINEE
> Attirer les clubs comme utilisateurs de la plateforme.

- [x] **Pages clubs**
  - `/clubs` : annuaire avec recherche par ville/nom, filtre rating, pagination cursor-based (12/page)
  - `/clubs/[id]` : detail club (ClubInfo, CourtList, OpeningHours, ReviewList, ReviewForm)
  - Section "Clubs a proximite" sur la page accueil (top 3 par rating)
  - Lien "Voir le club" dans popup carte Mapbox
  - Types : Club, Court, Booking, ClubReview + enums ClubStatus, CourtSurface, BookingStatus
  - Constantes : `lib/constants/club.ts` (surfaces, amenites, labels, couleurs)
  - Composants : ClubCard, ClubListClient, ClubInfo, OpeningHours, CourtList, StarRating
- [x] **Systeme d'avis**
  - ReviewForm : etoiles 1-5 cliquables + commentaire optionnel (max 500 chars)
  - Recalcul automatique clubs.rating et clubs.total_reviews apres insert
  - ReviewList : pagination cursor created_at, 10 par page
  - ReviewCard : memo(), date relative, avatar
  - Validation Zod : `clubReviewSchema`
- [x] **Reservation de terrains**
  - API availability : GET public, retourne creneaux occupes sans details (bypass RLS)
  - AvailabilityGrid : creneaux horaires generes depuis opening_hours JSONB
  - Flow 4 etapes : terrain → date (14j max) → creneau → confirmation + paiement
  - API bookings/create : Stripe Checkout mode payment, GIST exclusion (23P01 → 409)
  - API bookings/cancel : politique >24h remboursement complet Stripe, <24h refuse
  - Webhook Stripe : checkout.session.completed (booking) + charge.refunded
  - Hook `use-booking-actions.ts` : cancelBooking avec toast feedback
  - BookingCard, BookingConfirmation, ReservationsList
  - `/profil/reservations` : a venir / passees, annulation
  - Validation Zod : `createBookingSchema`
- [x] **Dashboard club (base)**
  - Auth check owner_id + redirect si non-proprietaire
  - DashboardStats : 4 cards (revenue mois, taux remplissage, total bookings, note moyenne)
  - DashboardTimeline : reservations du jour par terrain
  - DashboardWeekView : 7 jours scrollable, barres remplissage colorees
  - Fetch parallele : bookings jour/semaine/mois via Promise.all

### PHASE 7 — Tournois & Competition ✅ TERMINEE
> Ajouter la dimension competitive pour fideliser les joueurs.

- [x] **Schema tournois**
  - 3 enums : `tournament_status`, `tournament_format`, `bracket_match_status`
  - 3 tables : `tournaments`, `tournament_teams`, `tournament_brackets`
  - 6 indexes, 2 triggers (updated_at + team_count auto), 9 RLS policies
  - Migration standalone : `supabase/migrations/20260217_add_tournaments.sql`
  - Types TypeScript : Tournament, TournamentTeam, TournamentBracket + status/format types
  - Constantes : `lib/constants/tournament.ts` (labels, couleurs, options)
  - Validations Zod : `lib/validations/tournament.ts` (create, register, complete bracket)
- [x] **CRUD tournois**
  - `/tournois` : liste avec recherche nom/lieu, tabs (A venir / En cours / Termines), pagination cursor-based (12/page)
  - `/tournois/creer` : formulaire RHF + Zod (name, format, max_teams, entry_fee, niveaux, dates, lieu, regles)
  - `/tournois/[id]` : detail avec TournamentInfo, TeamList, BracketView, actions organisateur
  - API status : transitions validees (draft→registration_open→registration_closed→in_progress→completed)
  - Hook `use-tournament-actions.ts` : openRegistrations, closeRegistrations, generateBracket, cancelTournament, withdrawTeam
  - Composants : TournamentCard (memo), TournamentListClient, TournamentInfo, TeamList
  - Skeletons : TournoisSkeleton, TournamentDetailSkeleton
- [x] **Gestion brackets**
  - Algorithme single elimination : `lib/tournament/bracket-generator.ts` (fonctions pures, testables)
  - nextPowerOf2, calculateTotalRounds, advanceWinner, generateSingleEliminationBracket, generateSeedOrder
  - Byes pour top seeds, shuffle unseeded, two-pass insert (entries puis next_bracket_id)
  - BracketView : visualisation CSS pure, scroll horizontal, colonnes par round, labels dynamiques
  - BracketMatch : card avec equipes + scores, winner surligne, formulaire inline saisie score (organizer)
  - API generate-bracket : organizer only, min 4 equipes, insert + status→in_progress
  - API complete bracket match : score + winner, avancement auto, detection finale→completed
  - 37 tests unitaires (Vitest) : bracket-generator.test.ts
- [x] **Inscriptions**
  - `/tournois/[id]/inscrire` : flow 3 etapes (nom equipe → choisir partenaire → confirmation)
  - API register : validation Zod, checks (status, capacite, captain unique, niveaux), Stripe Checkout si payant
  - API withdraw : refund Stripe si deadline pas passee, set withdrawn_at, decrement team_count
  - Webhook Stripe : `tournament_registration` metadata → update payment_status=paid
  - Notifications : triggerTournamentUpdate, triggerTournamentNextMatch, triggerTournamentRegistration
  - Section "Tournois" sur page accueil (top 3 registration_open/in_progress)

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
1. Tests E2E Playwright sur les flows critiques (auth, match, chat, booking, tournoi)
2. Photos club (Supabase Storage) et moderation avis
3. Engagement & Retention (Phase 8) — notifications intelligentes, gamification, ameliorations chat
