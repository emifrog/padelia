import { useState } from "react";

const tabs = ["Vision", "Data Model", "Matching", "UX Flow", "Roadmap"];

const colors = {
  primary: "#1B5E20",
  primaryLight: "#4CAF50",
  accent: "#FF6F00",
  accentLight: "#FFB300",
  dark: "#0D1117",
  darkCard: "#161B22",
  darkBorder: "#30363D",
  text: "#E6EDF3",
  textMuted: "#8B949E",
  surface: "#1C2128",
};

function Badge({ children, color = colors.primaryLight }) {
  return (
    <span
      style={{
        background: `${color}22`,
        color: color,
        padding: "3px 10px",
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: 0.3,
      }}
    >
      {children}
    </span>
  );
}

function Card({ title, icon, children, accent = false }) {
  return (
    <div
      style={{
        background: colors.darkCard,
        border: `1px solid ${accent ? colors.accent : colors.darkBorder}`,
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
      }}
    >
      {title && (
        <h3
          style={{
            margin: "0 0 12px 0",
            color: accent ? colors.accentLight : colors.primaryLight,
            fontSize: 16,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 20 }}>{icon}</span> {title}
        </h3>
      )}
      {children}
    </div>
  );
}

function EntityCard({ name, icon, fields, relations }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      style={{
        background: colors.darkCard,
        border: `1px solid ${colors.darkBorder}`,
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 12,
      }}
    >
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: "14px 18px",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: expanded ? colors.surface : "transparent",
          transition: "background 0.2s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>{icon}</span>
          <span style={{ fontWeight: 700, color: colors.text, fontSize: 15 }}>
            {name}
          </span>
          <Badge>{fields.length} champs</Badge>
        </div>
        <span
          style={{
            color: colors.textMuted,
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            fontSize: 18,
          }}
        >
          ▼
        </span>
      </div>
      {expanded && (
        <div style={{ padding: "0 18px 16px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: colors.textMuted, textAlign: "left" }}>
                <th style={{ padding: "6px 0", fontWeight: 600 }}>Champ</th>
                <th style={{ padding: "6px 0", fontWeight: 600 }}>Type</th>
                <th style={{ padding: "6px 0", fontWeight: 600 }}>Note</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((f, i) => (
                <tr
                  key={i}
                  style={{
                    borderTop: `1px solid ${colors.darkBorder}`,
                    color: colors.text,
                  }}
                >
                  <td style={{ padding: "8px 0", fontFamily: "monospace", color: colors.primaryLight, fontSize: 12 }}>
                    {f.name}
                  </td>
                  <td style={{ padding: "8px 0", color: colors.textMuted, fontSize: 12 }}>
                    {f.type}
                  </td>
                  <td style={{ padding: "8px 0", fontSize: 12, color: colors.textMuted }}>
                    {f.note || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {relations && relations.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <span style={{ fontSize: 11, color: colors.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
                Relations
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                {relations.map((r, i) => (
                  <Badge key={i} color={colors.accentLight}>
                    → {r}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScreenCard({ name, icon, features, priority }) {
  const priorityColors = { MVP: colors.primaryLight, V1: colors.accentLight, V2: colors.textMuted };
  return (
    <div
      style={{
        background: colors.darkCard,
        border: `1px solid ${colors.darkBorder}`,
        borderRadius: 10,
        padding: 16,
        minWidth: 220,
        flex: "1 1 220px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 24 }}>{icon}</span>
        <Badge color={priorityColors[priority]}>{priority}</Badge>
      </div>
      <div style={{ fontWeight: 700, color: colors.text, fontSize: 14, marginBottom: 8 }}>
        {name}
      </div>
      {features.map((f, i) => (
        <div
          key={i}
          style={{
            fontSize: 12,
            color: colors.textMuted,
            padding: "3px 0",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ color: colors.primaryLight, fontSize: 10 }}>●</span> {f}
        </div>
      ))}
    </div>
  );
}

// ─── TAB CONTENT ────────────────────────────────

function VisionTab() {
  return (
    <div>
      <Card title="Positionnement" icon="🎯">
        <div style={{ fontSize: 20, fontWeight: 800, color: colors.accentLight, marginBottom: 8, lineHeight: 1.3 }}>
          "Joue mieux, plus souvent, avec les bons partenaires."
        </div>
        <p style={{ color: colors.textMuted, fontSize: 13, margin: 0, lineHeight: 1.6 }}>
          Padelia n'est pas une app de réservation. C'est la plateforme communautaire qui rend chaque match meilleur grâce au matching intelligent, au suivi de progression, et à une communauté engagée.
        </p>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        {[
          { icon: "🧩", title: "Profil Intelligent", desc: "Niveau, style, position, objectifs — la base du matching" },
          { icon: "🤝", title: "Matching Smart", desc: "Matchs équilibrés, pas juste proximité géographique" },
          { icon: "📊", title: "Stats & Progression", desc: "Suivi objectif pour tous les niveaux" },
          { icon: "🏆", title: "Compétition", desc: "Classements, ligues, tournois automatisés" },
          { icon: "🏟️", title: "Clubs (B2B)", desc: "Levier business à moyen terme" },
        ].map((p, i) => (
          <Card key={i} title={p.title} icon={p.icon}>
            <p style={{ color: colors.textMuted, fontSize: 13, margin: 0 }}>{p.desc}</p>
          </Card>
        ))}
      </div>

      <Card title="Modèle Économique" icon="💰" accent>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          {[
            { tier: "Free", price: "0€", features: ["Profil joueur", "Recherche partenaires", "Matchs basiques", "Stats limitées"] },
            { tier: "Premium", price: "7€/mois", features: ["Stats avancées", "Matching prioritaire", "Historique détaillé", "Classements & ligues"] },
            { tier: "Club", price: "Sur devis", features: ["Outils d'orga", "Accès joueurs", "Tournois & ligues", "Visibilité renforcée"] },
          ].map((t, i) => (
            <div
              key={i}
              style={{
                background: colors.surface,
                borderRadius: 10,
                padding: 16,
                border: i === 1 ? `2px solid ${colors.accent}` : `1px solid ${colors.darkBorder}`,
              }}
            >
              <div style={{ fontSize: 12, color: colors.textMuted, fontWeight: 600, textTransform: "uppercase" }}>
                {t.tier}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: i === 1 ? colors.accentLight : colors.text, margin: "4px 0 10px" }}>
                {t.price}
              </div>
              {t.features.map((f, j) => (
                <div key={j} style={{ fontSize: 12, color: colors.textMuted, padding: "2px 0" }}>
                  ✓ {f}
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function DataModelTab() {
  const entities = [
    {
      name: "profiles",
      icon: "👤",
      relations: ["matches (via match_players)", "stats", "rankings", "availability"],
      fields: [
        { name: "id", type: "uuid (PK)", note: "= auth.users.id" },
        { name: "username", type: "text UNIQUE", note: "Pseudo affiché" },
        { name: "full_name", type: "text", note: "" },
        { name: "avatar_url", type: "text", note: "Stockage Supabase" },
        { name: "city", type: "text", note: "Ville principale" },
        { name: "latitude", type: "float", note: "Géoloc pour matching" },
        { name: "longitude", type: "float", note: "" },
        { name: "level", type: "float (1.0-10.0)", note: "Niveau déclaré puis ajusté" },
        { name: "computed_level", type: "float", note: "Calculé par l'algo" },
        { name: "dominant_hand", type: "enum", note: "left | right" },
        { name: "preferred_side", type: "enum", note: "left | right | both" },
        { name: "play_style", type: "enum", note: "offensive | defensive | mixed" },
        { name: "goal", type: "enum", note: "casual | improvement | competition" },
        { name: "bio", type: "text", note: "Courte description" },
        { name: "reliability_score", type: "float (0-100)", note: "Fiabilité (annulations)" },
        { name: "is_premium", type: "boolean", note: "" },
        { name: "matches_played", type: "int", note: "Counter dénormalisé" },
        { name: "wins", type: "int", note: "Counter dénormalisé" },
        { name: "created_at", type: "timestamptz", note: "" },
      ],
    },
    {
      name: "availability",
      icon: "📅",
      relations: ["profiles"],
      fields: [
        { name: "id", type: "uuid (PK)", note: "" },
        { name: "player_id", type: "uuid (FK)", note: "→ profiles.id" },
        { name: "day_of_week", type: "int (0-6)", note: "0=lundi" },
        { name: "start_time", type: "time", note: "" },
        { name: "end_time", type: "time", note: "" },
        { name: "is_recurring", type: "boolean", note: "Chaque semaine ?" },
        { name: "specific_date", type: "date", note: "Si ponctuel" },
      ],
    },
    {
      name: "matches",
      icon: "🎾",
      relations: ["match_players", "match_sets", "match_stats"],
      fields: [
        { name: "id", type: "uuid (PK)", note: "" },
        { name: "created_by", type: "uuid (FK)", note: "→ profiles.id" },
        { name: "status", type: "enum", note: "pending | confirmed | in_progress | completed | cancelled" },
        { name: "match_type", type: "enum", note: "friendly | ranked | tournament" },
        { name: "scheduled_at", type: "timestamptz", note: "Date/heure prévue" },
        { name: "location_name", type: "text", note: "Nom du club/terrain" },
        { name: "latitude", type: "float", note: "" },
        { name: "longitude", type: "float", note: "" },
        { name: "is_public", type: "boolean", note: "Visible pour rejoindre" },
        { name: "max_level", type: "float", note: "Filtre niveau max" },
        { name: "min_level", type: "float", note: "Filtre niveau min" },
        { name: "winner_team", type: "int (1|2)", note: "null si pas fini" },
        { name: "balance_score", type: "float", note: "Score d'équilibre calculé" },
        { name: "completed_at", type: "timestamptz", note: "" },
      ],
    },
    {
      name: "match_players",
      icon: "👥",
      relations: ["matches", "profiles"],
      fields: [
        { name: "id", type: "uuid (PK)", note: "" },
        { name: "match_id", type: "uuid (FK)", note: "→ matches.id" },
        { name: "player_id", type: "uuid (FK)", note: "→ profiles.id" },
        { name: "team", type: "int (1|2)", note: "Équipe 1 ou 2" },
        { name: "side", type: "enum", note: "left | right" },
        { name: "status", type: "enum", note: "invited | accepted | declined" },
        { name: "rating_change", type: "float", note: "Variation niveau post-match" },
        { name: "invited_at", type: "timestamptz", note: "" },
        { name: "responded_at", type: "timestamptz", note: "" },
      ],
    },
    {
      name: "match_sets",
      icon: "📋",
      relations: ["matches"],
      fields: [
        { name: "id", type: "uuid (PK)", note: "" },
        { name: "match_id", type: "uuid (FK)", note: "→ matches.id" },
        { name: "set_number", type: "int", note: "1, 2, 3" },
        { name: "team1_score", type: "int", note: "Jeux gagnés" },
        { name: "team2_score", type: "int", note: "Jeux gagnés" },
        { name: "is_tiebreak", type: "boolean", note: "Super tiebreak ?" },
      ],
    },
    {
      name: "player_stats",
      icon: "📊",
      relations: ["profiles"],
      fields: [
        { name: "id", type: "uuid (PK)", note: "" },
        { name: "player_id", type: "uuid (FK)", note: "→ profiles.id" },
        { name: "period", type: "enum", note: "weekly | monthly | all_time" },
        { name: "period_start", type: "date", note: "" },
        { name: "matches_played", type: "int", note: "" },
        { name: "wins", type: "int", note: "" },
        { name: "losses", type: "int", note: "" },
        { name: "sets_won", type: "int", note: "" },
        { name: "sets_lost", type: "int", note: "" },
        { name: "games_won", type: "int", note: "" },
        { name: "games_lost", type: "int", note: "" },
        { name: "avg_balance_score", type: "float", note: "Qualité des matchs joués" },
        { name: "win_streak", type: "int", note: "Série de victoires en cours" },
        { name: "best_streak", type: "int", note: "Meilleure série" },
        { name: "level_at_period", type: "float", note: "Niveau snapshot" },
      ],
    },
    {
      name: "rankings",
      icon: "🏆",
      relations: ["profiles"],
      fields: [
        { name: "id", type: "uuid (PK)", note: "" },
        { name: "player_id", type: "uuid (FK)", note: "→ profiles.id" },
        { name: "scope", type: "enum", note: "city | region | national" },
        { name: "scope_value", type: "text", note: "Ex: 'Nice', 'PACA'" },
        { name: "rank_position", type: "int", note: "" },
        { name: "points", type: "float", note: "Points ELO adaptés" },
        { name: "tier", type: "enum", note: "bronze | silver | gold | platinum | diamond" },
        { name: "updated_at", type: "timestamptz", note: "" },
      ],
    },
    {
      name: "partner_history",
      icon: "🤝",
      relations: ["profiles"],
      fields: [
        { name: "id", type: "uuid (PK)", note: "" },
        { name: "player_id", type: "uuid (FK)", note: "→ profiles.id" },
        { name: "partner_id", type: "uuid (FK)", note: "→ profiles.id" },
        { name: "matches_together", type: "int", note: "En tant que coéquipiers" },
        { name: "wins_together", type: "int", note: "" },
        { name: "matches_against", type: "int", note: "En tant qu'adversaires" },
        { name: "wins_against", type: "int", note: "" },
        { name: "chemistry_score", type: "float", note: "Compatibilité calculée" },
        { name: "last_played_at", type: "timestamptz", note: "" },
      ],
    },
  ];

  return (
    <div>
      <Card title="Architecture de données — Supabase/PostgreSQL" icon="🗄️">
        <p style={{ color: colors.textMuted, fontSize: 13, margin: "0 0 8px", lineHeight: 1.6 }}>
          8 tables pensées pour le MVP mais scalables. Cliquez sur chaque entité pour voir le détail des champs.
          Les <code style={{ color: colors.primaryLight, background: colors.surface, padding: "1px 6px", borderRadius: 4, fontSize: 11 }}>computed_level</code> et <code style={{ color: colors.primaryLight, background: colors.surface, padding: "1px 6px", borderRadius: 4, fontSize: 11 }}>chemistry_score</code> sont calculés côté serveur via des fonctions Supabase Edge.
        </p>
      </Card>

      {entities.map((e, i) => (
        <EntityCard key={i} {...e} />
      ))}

      <Card title="Schéma relationnel simplifié" icon="🔗">
        <pre
          style={{
            background: colors.surface,
            padding: 16,
            borderRadius: 8,
            fontSize: 11,
            color: colors.primaryLight,
            overflowX: "auto",
            lineHeight: 1.8,
            margin: 0,
            fontFamily: "monospace",
          }}
        >
{`profiles ──┬── availability     (1:N)
            ├── match_players    (N:M via matches)
            ├── player_stats     (1:N par période)
            ├── rankings         (1:N par scope)
            └── partner_history  (N:N self-join)

matches ───┬── match_players    (1:N, max 4)
           └── match_sets       (1:N, max 3)

💡 RLS Supabase :
   - profiles : lecture publique, écriture owner
   - matches  : lecture publique, écriture participants
   - stats    : lecture publique, écriture system`}
        </pre>
      </Card>
    </div>
  );
}

function MatchingTab() {
  return (
    <div>
      <Card title="Algorithme de Matching — padelia Score™" icon="🧠" accent>
        <p style={{ color: colors.textMuted, fontSize: 13, margin: "0 0 12px", lineHeight: 1.6 }}>
          Le matching est le cœur du produit. L'objectif : proposer des matchs équilibrés et fun, pas juste des joueurs proches.
          L'algorithme calcule un <strong style={{ color: colors.accentLight }}>score de compatibilité</strong> entre 0 et 100 pour chaque paire possible.
        </p>
      </Card>

      <Card title="Composantes du Score (V1 MVP)" icon="⚖️">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            {
              name: "Écart de niveau",
              weight: "40%",
              formula: "100 - (|levelA - levelB| × 20)",
              detail: "Un écart de 0.5 = score 90. Un écart de 2+ = score < 60.",
              color: "#4CAF50",
            },
            {
              name: "Compatibilité de position",
              weight: "20%",
              formula: "Bonus si côtés complémentaires",
              detail: "Droite + Gauche = 100. Même côté = 50. Both = 80.",
              color: "#2196F3",
            },
            {
              name: "Proximité géographique",
              weight: "15%",
              formula: "100 - (distance_km × 2)",
              detail: "< 5km = score max. > 30km = score 0. Haversine distance.",
              color: "#FF9800",
            },
            {
              name: "Disponibilités communes",
              weight: "15%",
              formula: "Nombre de créneaux communs / max",
              detail: "Plus de créneaux en commun = plus de chances de jouer.",
              color: "#9C27B0",
            },
            {
              name: "Fiabilité",
              weight: "10%",
              formula: "reliability_score du joueur",
              detail: "Pénalise les joueurs qui annulent souvent.",
              color: "#F44336",
            },
          ].map((c, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 14,
                alignItems: "flex-start",
                padding: 14,
                background: colors.surface,
                borderRadius: 10,
                borderLeft: `4px solid ${c.color}`,
              }}
            >
              <div
                style={{
                  minWidth: 50,
                  height: 50,
                  borderRadius: 10,
                  background: `${c.color}22`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  color: c.color,
                  fontSize: 16,
                }}
              >
                {c.weight}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: colors.text, fontSize: 14, marginBottom: 4 }}>
                  {c.name}
                </div>
                <code
                  style={{
                    fontSize: 11,
                    color: c.color,
                    background: `${c.color}11`,
                    padding: "2px 8px",
                    borderRadius: 4,
                    display: "inline-block",
                    marginBottom: 4,
                  }}
                >
                  {c.formula}
                </code>
                <div style={{ fontSize: 12, color: colors.textMuted }}>{c.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Pseudo-code — Fonction de matching" icon="💻">
        <pre
          style={{
            background: colors.surface,
            padding: 16,
            borderRadius: 8,
            fontSize: 11,
            color: colors.text,
            overflowX: "auto",
            lineHeight: 1.7,
            margin: 0,
            fontFamily: "monospace",
          }}
        >
{`function calculateMatchScore(playerA, playerB) {
  // 1. Écart de niveau (40%)
  const levelGap = Math.abs(playerA.computed_level - playerB.computed_level)
  const levelScore = Math.max(0, 100 - levelGap * 20)

  // 2. Compatibilité position (20%)
  const sideScore = getSideCompatibility(
    playerA.preferred_side, 
    playerB.preferred_side
  ) // returns 50 | 80 | 100

  // 3. Distance géographique (15%)
  const distKm = haversine(playerA, playerB)
  const geoScore = Math.max(0, 100 - distKm * 2)

  // 4. Créneaux communs (15%)
  const commonSlots = getOverlappingSlots(
    playerA.availability, 
    playerB.availability
  )
  const availScore = Math.min(100, commonSlots.length * 20)

  // 5. Fiabilité (10%)
  const reliabilityScore = playerB.reliability_score

  // Score final pondéré
  return (
    levelScore      * 0.40 +
    sideScore       * 0.20 +
    geoScore        * 0.15 +
    availScore      * 0.15 +
    reliabilityScore * 0.10
  )
}

// Pour un match 2v2 : optimiser l'équilibre des équipes
function suggestTeams(players: Player[4]) {
  // Tester les 3 combinaisons possibles
  // Retourner celle qui minimise |avg(team1) - avg(team2)|
  // + bonus si sides complémentaires dans chaque équipe
}`}
        </pre>
      </Card>

      <Card title="Évolutions prévues (V2+)" icon="🚀">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            "Historique de chimie entre partenaires",
            "Préférences implicites (ML)",
            "Variété des adversaires rencontrés",
            "Pondérations ajustables par le joueur",
            "Score de fun post-match (feedback)",
            "Facteur météo pour matchs extérieurs",
          ].map((item, i) => (
            <div
              key={i}
              style={{
                fontSize: 12,
                color: colors.textMuted,
                padding: "8px 12px",
                background: colors.surface,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ color: colors.accentLight }}>◆</span> {item}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function UXFlowTab() {
  return (
    <div>
      <Card title="Arborescence des écrans" icon="📱">
        <p style={{ color: colors.textMuted, fontSize: 13, margin: "0 0 16px", lineHeight: 1.6 }}>
          UX pensée mobile-first (PWA). Navigation bottom tabs pour les 4 sections clés. 
          Chaque écran est taggé par priorité de développement.
        </p>
      </Card>

      <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 12, display: "flex", gap: 12 }}>
        <Badge color={colors.primaryLight}>MVP</Badge>
        <Badge color={colors.accentLight}>V1</Badge>
        <Badge color={colors.textMuted}>V2</Badge>
      </div>

      <h4 style={{ color: colors.text, fontSize: 14, margin: "16px 0 10px", display: "flex", alignItems: "center", gap: 8 }}>
        🔐 Onboarding
      </h4>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <ScreenCard name="Splash & Auth" icon="🔑" priority="MVP" features={["Login email/Google", "Magic link Supabase", "Onboarding en 3 steps"]} />
        <ScreenCard name="Création profil" icon="✏️" priority="MVP" features={["Niveau (slider)", "Main & position", "Style de jeu", "Objectif", "Photo + bio"]} />
      </div>

      <h4 style={{ color: colors.text, fontSize: 14, margin: "20px 0 10px", display: "flex", alignItems: "center", gap: 8 }}>
        🏠 Tab 1 — Accueil / Feed
      </h4>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <ScreenCard name="Feed principal" icon="🏠" priority="MVP" features={["Matchs à rejoindre", "Prochains matchs", "Joueurs suggérés", "Quick match CTA"]} />
        <ScreenCard name="Notifications" icon="🔔" priority="MVP" features={["Invitations reçues", "Résultats à valider", "Rappels de matchs"]} />
      </div>

      <h4 style={{ color: colors.text, fontSize: 14, margin: "20px 0 10px", display: "flex", alignItems: "center", gap: 8 }}>
        🤝 Tab 2 — Matchs
      </h4>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <ScreenCard name="Créer un match" icon="➕" priority="MVP" features={["Date, lieu, type", "Niveau min/max", "Public ou privé", "Inviter des joueurs"]} />
        <ScreenCard name="Trouver un match" icon="🔍" priority="MVP" features={["Matchs ouverts", "Filtres (niveau, lieu)", "Score de compatibilité", "Rejoindre en 1 tap"]} />
        <ScreenCard name="Détail match" icon="📋" priority="MVP" features={["Joueurs & équipes", "Lieu & horaire", "Statut en temps réel", "Saisie du score"]} />
        <ScreenCard name="Suggestions IA" icon="🧠" priority="V1" features={["Matchs suggérés", "Partenaires idéaux", "Créneaux optimaux"]} />
      </div>

      <h4 style={{ color: colors.text, fontSize: 14, margin: "20px 0 10px", display: "flex", alignItems: "center", gap: 8 }}>
        📊 Tab 3 — Stats
      </h4>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <ScreenCard name="Dashboard stats" icon="📈" priority="MVP" features={["V/D ratio", "Niveau actuel", "Matchs ce mois", "Série en cours"]} />
        <ScreenCard name="Historique matchs" icon="📜" priority="MVP" features={["Liste des matchs", "Résultats & scores", "Filtre par période"]} />
        <ScreenCard name="Progression" icon="📉" priority="V1" features={["Courbe de niveau", "Stats par partenaire", "Points forts/faibles"]} />
      </div>

      <h4 style={{ color: colors.text, fontSize: 14, margin: "20px 0 10px", display: "flex", alignItems: "center", gap: 8 }}>
        👤 Tab 4 — Profil
      </h4>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <ScreenCard name="Mon profil" icon="👤" priority="MVP" features={["Infos & niveau", "Disponibilités", "Badge fiabilité", "Édition"]} />
        <ScreenCard name="Classements" icon="🏆" priority="V1" features={["Classement ville", "Classement régional", "Tier & points"]} />
        <ScreenCard name="Réglages" icon="⚙️" priority="MVP" features={["Notifications", "Compte", "Premium", "Déconnexion"]} />
      </div>

      <Card title="Navigation principale" icon="📲" accent>
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            background: colors.surface,
            borderRadius: 16,
            padding: "14px 8px",
            marginTop: 8,
          }}
        >
          {[
            { icon: "🏠", label: "Accueil" },
            { icon: "🎾", label: "Matchs" },
            { icon: "📊", label: "Stats" },
            { icon: "👤", label: "Profil" },
          ].map((tab, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span style={{ fontSize: 22 }}>{tab.icon}</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: i === 0 ? colors.primaryLight : colors.textMuted,
                }}
              >
                {tab.label}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function RoadmapTab() {
  const phases = [
    {
      phase: "Sprint 1",
      duration: "Semaine 1-2",
      title: "Fondations",
      status: "next",
      tasks: [
        "Setup Next.js + Supabase + TypeScript",
        "Auth (email + Google OAuth)",
        "CRUD profil joueur complet",
        "Gestion des disponibilités",
        "UI système de design (composants de base)",
        "PWA manifest + service worker",
      ],
    },
    {
      phase: "Sprint 2",
      duration: "Semaine 3-4",
      title: "Matchs & Matching",
      status: "planned",
      tasks: [
        "Création de match (formulaire)",
        "Listing matchs ouverts + filtres",
        "Algorithme de matching V1",
        "Invitations & confirmations",
        "Système de notifications (Supabase Realtime)",
        "Page détail match",
      ],
    },
    {
      phase: "Sprint 3",
      duration: "Semaine 5-6",
      title: "Résultats & Stats",
      status: "planned",
      tasks: [
        "Saisie des scores (sets)",
        "Calcul automatique ELO/niveau",
        "Dashboard stats joueur",
        "Historique des matchs",
        "Score de fiabilité",
        "Partner history tracking",
      ],
    },
    {
      phase: "Sprint 4",
      duration: "Semaine 7-8",
      title: "Polish & Launch",
      status: "planned",
      tasks: [
        "Classements (ville)",
        "Onboarding flow complet",
        "Responsive polish mobile",
        "SEO & meta tags",
        "Landing page marketing",
        "Beta test avec vrais joueurs 🎾",
      ],
    },
  ];

  return (
    <div>
      <Card title="Roadmap MVP — 8 semaines" icon="🗺️" accent>
        <p style={{ color: colors.textMuted, fontSize: 13, margin: "0 0 8px", lineHeight: 1.6 }}>
          4 sprints de 2 semaines. À la fin du Sprint 4, on a un produit testable avec de vrais joueurs.
          Stack : <strong style={{ color: colors.text }}>Next.js 15 + TypeScript + Supabase + Tailwind CSS</strong>
        </p>
      </Card>

      {phases.map((p, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              minWidth: 40,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: p.status === "next" ? colors.primaryLight : colors.surface,
                border: `2px solid ${p.status === "next" ? colors.primaryLight : colors.darkBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: 14,
                color: p.status === "next" ? "#fff" : colors.textMuted,
              }}
            >
              {i + 1}
            </div>
            {i < phases.length - 1 && (
              <div
                style={{
                  width: 2,
                  flex: 1,
                  background: colors.darkBorder,
                  marginTop: 4,
                }}
              />
            )}
          </div>

          <div
            style={{
              flex: 1,
              background: colors.darkCard,
              border: `1px solid ${p.status === "next" ? colors.primaryLight : colors.darkBorder}`,
              borderRadius: 12,
              padding: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <div>
                <span style={{ fontWeight: 800, color: colors.text, fontSize: 15 }}>
                  {p.phase} — {p.title}
                </span>
              </div>
              <Badge color={p.status === "next" ? colors.primaryLight : colors.textMuted}>
                {p.duration}
              </Badge>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 6,
              }}
            >
              {p.tasks.map((t, j) => (
                <div
                  key={j}
                  style={{
                    fontSize: 12,
                    color: colors.textMuted,
                    padding: "4px 0",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span style={{ color: p.status === "next" ? colors.primaryLight : colors.darkBorder }}>
                    ○
                  </span>
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      <Card title="Stack technique détaillée" icon="🛠️">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          {[
            { cat: "Framework", items: ["Next.js 15 (App Router)", "TypeScript strict", "Tailwind CSS"] },
            { cat: "Backend", items: ["Supabase (Auth + DB + RLS)", "Edge Functions (matching)", "Realtime (notifs)"] },
            { cat: "PWA", items: ["next-pwa", "Service Worker", "Manifest + icons"] },
            { cat: "Outils", items: ["Zustand (state)", "React Hook Form", "Zod (validation)"] },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                background: colors.surface,
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: colors.primaryLight,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                {s.cat}
              </div>
              {s.items.map((item, j) => (
                <div key={j} style={{ fontSize: 12, color: colors.text, padding: "3px 0" }}>
                  {item}
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>

      <Card title="Prêt à coder ? 🚀" icon="⚡" accent>
        <p style={{ color: colors.text, fontSize: 14, margin: 0, lineHeight: 1.7 }}>
          L'architecture est posée. Le data model est défini. L'algo de matching est conçu. L'UX est mappée.
          <br />
          <strong style={{ color: colors.accentLight }}>
            Prochaine étape → Sprint 1 : Setup du projet Next.js + Supabase + Auth + Profil joueur.
          </strong>
        </p>
      </Card>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────

export default function padeliaArchitecture() {
  const [activeTab, setActiveTab] = useState(0);

  const tabContent = [
    <VisionTab />,
    <DataModelTab />,
    <MatchingTab />,
    <UXFlowTab />,
    <RoadmapTab />,
  ];

  return (
    <div
      style={{
        background: colors.dark,
        minHeight: "100vh",
        color: colors.text,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: "0 0 40px",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.dark} 100%)`,
          padding: "32px 24px 20px",
          borderBottom: `1px solid ${colors.darkBorder}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 36 }}>🎾</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, letterSpacing: -0.5 }}>
              padelia
            </h1>
            <p style={{ margin: 0, color: colors.textMuted, fontSize: 13 }}>
              Architecture & Spécifications — MVP V1
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: "12px 16px",
          overflowX: "auto",
          borderBottom: `1px solid ${colors.darkBorder}`,
          position: "sticky",
          top: 0,
          background: colors.dark,
          zIndex: 10,
        }}
      >
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: activeTab === i ? colors.primaryLight : "transparent",
              color: activeTab === i ? "#fff" : colors.textMuted,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "16px 16px 0", maxWidth: 800, margin: "0 auto" }}>
        {tabContent[activeTab]}
      </div>
    </div>
  );
}
