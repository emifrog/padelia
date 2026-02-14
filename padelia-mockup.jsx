import { useState, useEffect, useRef } from "react";

// ============ DESIGN TOKENS ============
const T = {
  navy: "#0B1A2E",
  navyLight: "#12253D",
  navyMid: "#1A3352",
  green: "#3EAF4B",
  greenLight: "#4CC659",
  lime: "#C8DC38",
  yellow: "#E8D44D",
  white: "#FFFFFF",
  gray50: "#F7F8FA",
  gray100: "#EEF0F4",
  gray200: "#D8DCE4",
  gray300: "#B0B8C8",
  gray400: "#8892A4",
  gray500: "#6B7280",
  gray600: "#4B5563",
  danger: "#EF4444",
  orange: "#F59E0B",
  radius: "16px",
  radiusSm: "12px",
  radiusXl: "24px",
  shadow: "0 2px 16px rgba(11,26,46,0.08)",
  shadowMd: "0 4px 24px rgba(11,26,46,0.12)",
  shadowLg: "0 8px 40px rgba(11,26,46,0.16)",
};

// ============ MOCK DATA ============
const PLAYERS = [
  { id: 1, name: "Lucas M.", level: 5.2, side: "Gauche", style: "Offensif", city: "Nice", dist: 3, score: 92, avatar: "🧑‍🦱", online: true, matches: 47, winRate: 68 },
  { id: 2, name: "Sophie B.", level: 4.8, side: "Droite", style: "Défensif", city: "Antibes", dist: 8, score: 87, avatar: "👩", online: true, matches: 32, winRate: 62 },
  { id: 3, name: "Marc D.", level: 5.5, side: "Droite", style: "Mixte", city: "Cannes", dist: 15, score: 84, avatar: "👨‍🦰", online: false, matches: 89, winRate: 71 },
  { id: 4, name: "Émilie R.", level: 4.6, side: "Les deux", style: "Polyvalent", city: "Nice", dist: 2, score: 81, avatar: "👩‍🦳", online: false, matches: 21, winRate: 57 },
  { id: 5, name: "Thomas P.", level: 6.1, side: "Gauche", style: "Offensif", city: "Mougins", dist: 12, score: 79, avatar: "🧔", online: true, matches: 103, winRate: 74 },
];

const MATCHES = [
  { id: 1, title: "Match amical", date: "Aujourd'hui", time: "18:30", location: "Padel Club Nice", players: 3, max: 4, level: "4-6", cost: 8, type: "friendly", status: "open" },
  { id: 2, title: "Double compétitif", date: "Demain", time: "10:00", location: "All In Padel Antibes", players: 4, max: 4, level: "5-7", cost: 12, type: "ranked", status: "full" },
  { id: 3, title: "Session débutants", date: "Samedi", time: "14:00", location: "Padel Riviera", players: 2, max: 4, level: "2-4", cost: 6, type: "friendly", status: "open" },
  { id: 4, title: "Tournoi interne", date: "Dimanche", time: "09:00", location: "Mougins Padel", players: 8, max: 16, level: "4-8", cost: 15, type: "tournament", status: "open" },
];

const CONVERSATIONS = [
  { id: 1, name: "Lucas M.", avatar: "🧑‍🦱", lastMsg: "On se fait le match de demain ?", time: "14:32", unread: 2, online: true },
  { id: 2, name: "Match amical 18:30", avatar: "🎾", lastMsg: "Sophie: Je serai un peu en retard", time: "13:15", unread: 1, online: false, isGroup: true },
  { id: 3, name: "Padel Nice Gang", avatar: "🏆", lastMsg: "Marc: Quelqu'un dispo samedi ?", time: "Hier", unread: 0, online: false, isGroup: true },
  { id: 4, name: "Sophie B.", avatar: "👩", lastMsg: "Super match ! À refaire 💪", time: "Hier", unread: 0, online: true },
  { id: 5, name: "Émilie R.", avatar: "👩‍🦳", lastMsg: "Tu joues à quel club ?", time: "Lun.", unread: 0, online: false },
];

const GROUPS = [
  { id: 1, name: "Padel Nice Gang", members: 24, avatar: "🏆", city: "Nice", matches: 12 },
  { id: 2, name: "Compétiteurs 06", members: 48, avatar: "🔥", city: "Alpes-Maritimes", matches: 31 },
  { id: 3, name: "Padel Afterwork", members: 16, avatar: "🌅", city: "Nice", matches: 8 },
];

const MY_STATS = {
  level: 5.2, matches: 47, wins: 32, losses: 15, winRate: 68, streak: 3,
  monthlyMatches: [3, 5, 4, 7, 6, 8, 5, 9, 7, 6, 8, 10],
  levelHistory: [3.0, 3.2, 3.5, 3.8, 4.0, 4.2, 4.1, 4.4, 4.6, 4.8, 5.0, 5.2],
  partners: [
    { name: "Lucas M.", matches: 12, winRate: 75, avatar: "🧑‍🦱" },
    { name: "Sophie B.", matches: 8, winRate: 62, avatar: "👩" },
    { name: "Marc D.", matches: 5, winRate: 80, avatar: "👨‍🦰" },
  ]
};

// ============ ICONS (inline SVG) ============
const Icons = {
  Home: () => <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1"/></svg>,
  Match: () => <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2C6.5 2 2 6.5 2 12h10V2z"/><path d="M12 22c5.5 0 10-4.5 10-10H12v10z"/></svg>,
  Map: () => <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>,
  Chat: () => <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>,
  Profile: () => <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
  Plus: () => <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 4v16m8-8H4"/></svg>,
  Search: () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
  Bell: () => <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>,
  ChevronRight: () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7"/></svg>,
  Star: () => <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  Fire: () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/><path d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"/></svg>,
  Location: () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><circle cx="12" cy="11" r="3"/></svg>,
  Clock: () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  Users: () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  Trophy: () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M8 21h8m-4-4v4m-4.5-9.5L5 7h14l-2.5 4.5M7 3h10v4H7V3z"/></svg>,
  TrendUp: () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>,
  Send: () => <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>,
  Back: () => <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M15 19l-7-7 7-7"/></svg>,
  Settings: () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  Check: () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>,
  Euro: () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M17 8a6 6 0 00-10.5 4 6 6 0 0010.5 4M4 10h10M4 14h10"/></svg>,
};

// ============ MINI CHART COMPONENT ============
function MiniChart({ data, color = T.green, height = 60, width = "100%" }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - ((v - min) / range) * 80 - 10}`).join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width, height, display: "block" }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points}/>
      <polygon fill={`url(#grad-${color.replace('#','')})`} points={`0,100 ${points} 100,100`}/>
    </svg>
  );
}

// ============ BAR CHART ============
function BarChart({ data, color = T.green, height = 80 }) {
  const max = Math.max(...data);
  const months = ["J","F","M","A","M","J","J","A","S","O","N","D"];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height, width: "100%" }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div style={{
            width: "100%", borderRadius: 4, background: i === data.length - 1 ? color : `${color}44`,
            height: `${(v / max) * 100}%`, minHeight: 4, transition: "height 0.5s ease"
          }}/>
          <span style={{ fontSize: 9, color: T.gray400 }}>{months[i]}</span>
        </div>
      ))}
    </div>
  );
}

// ============ APP COMPONENT ============
export default function PadeliaApp() {
  const [screen, setScreen] = useState("splash");
  const [tab, setTab] = useState("home");
  const [subScreen, setSubScreen] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: "Lucas M.", text: "Salut ! Tu es dispo ce soir pour un match ?", time: "14:30", mine: false },
    { id: 2, sender: "Moi", text: "Salut Lucas ! Oui je suis chaud, 18h30 ça te va ?", time: "14:31", mine: true },
    { id: 3, sender: "Lucas M.", text: "Parfait ! J'ai réservé au Padel Club Nice. On cherche 2 joueurs ?", time: "14:32", mine: false },
    { id: 4, sender: "Moi", text: "Go ! Je crée le match sur l'app 🎾", time: "14:32", mine: true },
  ]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (screen === "splash") {
      const t = setTimeout(() => setScreen("app"), 2200);
      return () => clearTimeout(t);
    }
  }, [screen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const navigate = (newTab) => { setTab(newTab); setSubScreen(null); setSelectedMatch(null); setSelectedPlayer(null); };

  // ============ SPLASH SCREEN ============
  if (screen === "splash") {
    return (
      <div style={{
        width: "100%", maxWidth: 390, margin: "0 auto", height: 844,
        background: `linear-gradient(160deg, ${T.navy} 0%, ${T.navyLight} 50%, ${T.navyMid} 100%)`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        borderRadius: 40, overflow: "hidden", position: "relative",
        fontFamily: "'Outfit', 'SF Pro Display', sans-serif",
        boxShadow: "0 24px 80px rgba(0,0,0,0.4)"
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
          @keyframes logoIn { from { transform: scale(0.5) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
          @keyframes textIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 40px rgba(62,175,75,0.15); } 50% { box-shadow: 0 0 80px rgba(62,175,75,0.3); } }
          @keyframes shimmer { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
          * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        `}</style>
        <div style={{ animation: "logoIn 0.8s ease-out both, pulseGlow 2s ease-in-out infinite", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 80, fontWeight: 900, color: T.white, letterSpacing: -2, lineHeight: 1, fontFamily: "'Outfit', sans-serif" }}>
            <span style={{ color: T.green }}>P</span>
          </div>
          <div style={{
            fontSize: 32, fontWeight: 800, color: T.white, letterSpacing: 6,
            marginTop: 8, fontFamily: "'Outfit', sans-serif",
            animation: "textIn 0.6s ease-out 0.4s both"
          }}>PADELIA</div>
        </div>
        <div style={{ animation: "textIn 0.6s ease-out 0.8s both", marginTop: 16, fontSize: 14, color: T.gray300, letterSpacing: 2, fontFamily: "'Outfit', sans-serif" }}>
          JOUE • PROGRESSE • CONNECTE
        </div>
        <div style={{
          position: "absolute", bottom: 80, width: 40, height: 4, borderRadius: 2,
          background: `${T.green}33`, overflow: "hidden"
        }}>
          <div style={{
            width: "50%", height: "100%", background: T.green, borderRadius: 2,
            animation: "shimmer 1.5s ease-in-out infinite"
          }}/>
        </div>
      </div>
    );
  }

  // ============ RENDER HELPERS ============
  const Badge = ({ children, color = T.green }) => (
    <span style={{
      display: "inline-flex", padding: "3px 10px", borderRadius: 20,
      background: `${color}18`, color, fontSize: 11, fontWeight: 600
    }}>{children}</span>
  );

  const LevelBadge = ({ level }) => {
    const c = level >= 6 ? "#9333EA" : level >= 4 ? T.green : T.orange;
    return <Badge color={c}>Niv. {level}</Badge>;
  };

  const MatchTypeBadge = ({ type }) => {
    const config = { friendly: { label: "Amical", c: T.green }, ranked: { label: "Classé", c: "#9333EA" }, tournament: { label: "Tournoi", c: T.orange } };
    const { label, c } = config[type] || config.friendly;
    return <Badge color={c}>{label}</Badge>;
  };

  // ============ MATCH DETAIL SCREEN ============
  const MatchDetail = ({ match }) => (
    <div style={{ padding: "0 20px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 0" }}>
        <button onClick={() => setSubScreen(null)} style={{ background: "none", border: "none", color: T.navy, cursor: "pointer", padding: 0 }}><Icons.Back/></button>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: T.navy, margin: 0 }}>{match.title}</h2>
      </div>
      <div style={{ background: T.white, borderRadius: T.radius, padding: 20, boxShadow: T.shadow }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <MatchTypeBadge type={match.type}/>
          <Badge color={match.status === "open" ? T.green : T.orange}>{match.status === "open" ? "Places dispo" : "Complet"}</Badge>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          {[
            [<Icons.Clock/>, `${match.date} à ${match.time}`],
            [<Icons.Location/>, match.location],
            [<Icons.Users/>, `${match.players}/${match.max} joueurs`],
            [<Icons.Euro/>, `${match.cost}€ par joueur`],
          ].map(([icon, text], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, color: T.gray600, fontSize: 14 }}>
              <span style={{ color: T.green }}>{icon}</span>{text}
            </div>
          ))}
        </div>
        <div style={{ background: T.gray50, borderRadius: T.radiusSm, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.gray500, marginBottom: 12 }}>JOUEURS INSCRITS</div>
          <div style={{ display: "flex", gap: 12 }}>
            {PLAYERS.slice(0, match.players).map((p, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%", background: `linear-gradient(135deg, ${T.green}22, ${T.lime}22)`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                  border: i < 2 ? `2px solid ${T.green}` : `2px solid ${T.orange}`
                }}>{p.avatar}</div>
                <span style={{ fontSize: 11, color: T.gray600, fontWeight: 500 }}>{p.name.split(" ")[0]}</span>
                <span style={{ fontSize: 10, color: i < 2 ? T.green : T.orange, fontWeight: 600 }}>Éq. {i < 2 ? "A" : "B"}</span>
              </div>
            ))}
            {match.players < match.max && Array.from({ length: match.max - match.players }).map((_, i) => (
              <div key={`e${i}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%", border: `2px dashed ${T.gray200}`,
                  display: "flex", alignItems: "center", justifyContent: "center", color: T.gray300, fontSize: 20
                }}>?</div>
                <span style={{ fontSize: 11, color: T.gray400 }}>Libre</span>
              </div>
            ))}
          </div>
        </div>
        {match.status === "open" && (
          <button style={{
            width: "100%", padding: "16px", borderRadius: T.radiusSm, border: "none",
            background: `linear-gradient(135deg, ${T.green}, ${T.greenLight})`,
            color: T.white, fontSize: 16, fontWeight: 700, cursor: "pointer",
            boxShadow: `0 4px 16px ${T.green}44`,
            fontFamily: "'Outfit', sans-serif"
          }}>
            Rejoindre le match • {match.cost}€
          </button>
        )}
      </div>
    </div>
  );

  // ============ PLAYER DETAIL SCREEN ============
  const PlayerDetail = ({ player }) => (
    <div style={{ padding: "0 20px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 0" }}>
        <button onClick={() => setSubScreen(null)} style={{ background: "none", border: "none", color: T.navy, cursor: "pointer", padding: 0 }}><Icons.Back/></button>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: T.navy, margin: 0 }}>Profil joueur</h2>
      </div>
      <div style={{ background: T.white, borderRadius: T.radiusXl, padding: 24, boxShadow: T.shadow, textAlign: "center", marginBottom: 16 }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%", margin: "0 auto 12px",
          background: `linear-gradient(135deg, ${T.green}22, ${T.lime}22)`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40,
          border: `3px solid ${T.green}`,
          position: "relative"
        }}>
          {player.avatar}
          {player.online && <div style={{ position: "absolute", bottom: 2, right: 2, width: 14, height: 14, borderRadius: "50%", background: T.green, border: `2px solid ${T.white}` }}/>}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: T.navy }}>{player.name}</div>
        <div style={{ fontSize: 13, color: T.gray400, marginBottom: 12 }}><Icons.Location/> {player.city} • {player.dist}km</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16 }}>
          <LevelBadge level={player.level}/> <Badge>{player.side}</Badge> <Badge color={T.orange}>{player.style}</Badge>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button style={{
            flex: 1, padding: "12px", borderRadius: T.radiusSm, border: "none",
            background: `linear-gradient(135deg, ${T.green}, ${T.greenLight})`,
            color: T.white, fontSize: 14, fontWeight: 700, cursor: "pointer",
            fontFamily: "'Outfit', sans-serif"
          }}>Inviter à jouer</button>
          <button style={{
            flex: 1, padding: "12px", borderRadius: T.radiusSm,
            border: `2px solid ${T.navy}`, background: "transparent",
            color: T.navy, fontSize: 14, fontWeight: 700, cursor: "pointer",
            fontFamily: "'Outfit', sans-serif"
          }}>Message</button>
        </div>
      </div>
      <div style={{ background: T.white, borderRadius: T.radius, padding: 20, boxShadow: T.shadow }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.gray500, marginBottom: 12 }}>STATISTIQUES</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {[
            [player.matches, "Matchs"],
            [`${player.winRate}%`, "Victoires"],
            [player.level, "Niveau"],
          ].map(([val, label], i) => (
            <div key={i} style={{ textAlign: "center", padding: 12, background: T.gray50, borderRadius: T.radiusSm }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.navy }}>{val}</div>
              <div style={{ fontSize: 11, color: T.gray400, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ============ CHAT DETAIL SCREEN ============
  const ChatDetail = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: `1px solid ${T.gray100}` }}>
        <button onClick={() => setSubScreen(null)} style={{ background: "none", border: "none", color: T.navy, cursor: "pointer", padding: 0 }}><Icons.Back/></button>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${T.green}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🧑‍🦱</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>Lucas M.</div>
          <div style={{ fontSize: 11, color: T.green }}>En ligne</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
        {chatMessages.map(msg => (
          <div key={msg.id} style={{
            display: "flex", justifyContent: msg.mine ? "flex-end" : "flex-start",
            animation: "textIn 0.3s ease-out both"
          }}>
            <div style={{
              maxWidth: "78%", padding: "10px 14px", borderRadius: 18,
              background: msg.mine ? `linear-gradient(135deg, ${T.green}, ${T.greenLight})` : T.white,
              color: msg.mine ? T.white : T.navy,
              boxShadow: msg.mine ? `0 2px 8px ${T.green}33` : T.shadow,
              borderBottomRightRadius: msg.mine ? 4 : 18,
              borderBottomLeftRadius: msg.mine ? 18 : 4,
            }}>
              <div style={{ fontSize: 14, lineHeight: 1.4 }}>{msg.text}</div>
              <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7, textAlign: "right" }}>{msg.time}</div>
            </div>
          </div>
        ))}
        <div ref={chatEndRef}/>
      </div>
      <div style={{ padding: "12px 20px 28px", borderTop: `1px solid ${T.gray100}`, display: "flex", gap: 10, alignItems: "center" }}>
        <input
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && chatInput.trim()) {
              setChatMessages(prev => [...prev, { id: prev.length + 1, sender: "Moi", text: chatInput, time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), mine: true }]);
              setChatInput("");
            }
          }}
          placeholder="Message..."
          style={{
            flex: 1, padding: "12px 16px", borderRadius: 24, border: `1.5px solid ${T.gray200}`,
            fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif",
            background: T.gray50
          }}
        />
        <button
          onClick={() => {
            if (chatInput.trim()) {
              setChatMessages(prev => [...prev, { id: prev.length + 1, sender: "Moi", text: chatInput, time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), mine: true }]);
              setChatInput("");
            }
          }}
          style={{
            width: 44, height: 44, borderRadius: "50%",
            background: `linear-gradient(135deg, ${T.green}, ${T.greenLight})`,
            border: "none", color: T.white, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 2px 12px ${T.green}44`
          }}
        ><Icons.Send/></button>
      </div>
    </div>
  );

  // ============ SCREEN: HOME ============
  const HomeScreen = () => (
    <div style={{ padding: "0 20px 20px" }}>
      {/* Mes prochains matchs */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: T.navy, margin: 0 }}>🎾 Mes prochains matchs</h3>
          <button style={{ background: "none", border: "none", color: T.green, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Voir tout</button>
        </div>
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4, margin: "0 -20px", padding: "0 20px" }}>
          {MATCHES.slice(0, 2).map(m => (
            <div key={m.id} onClick={() => { setSelectedMatch(m); setSubScreen("matchDetail"); }}
              style={{
                minWidth: 240, background: `linear-gradient(135deg, ${T.navy}, ${T.navyMid})`,
                borderRadius: T.radius, padding: 16, cursor: "pointer",
                boxShadow: T.shadowMd, position: "relative", overflow: "hidden"
              }}>
              <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `${T.green}15` }}/>
              <MatchTypeBadge type={m.type}/>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.white, marginTop: 10 }}>{m.title}</div>
              <div style={{ fontSize: 13, color: T.gray300, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                <Icons.Clock/> {m.date} • {m.time}
              </div>
              <div style={{ fontSize: 12, color: T.gray300, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                <Icons.Location/> {m.location}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                <div style={{ display: "flex" }}>
                  {PLAYERS.slice(0, m.players).map((p, i) => (
                    <div key={i} style={{
                      width: 28, height: 28, borderRadius: "50%", background: `${T.green}33`,
                      border: `2px solid ${T.navy}`, marginLeft: i > 0 ? -8 : 0,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13
                    }}>{p.avatar}</div>
                  ))}
                </div>
                <span style={{ fontSize: 12, color: T.lime, fontWeight: 600 }}>{m.players}/{m.max}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Matchs ouverts */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: T.navy, margin: "0 0 12px" }}>🔥 Matchs ouverts à proximité</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {MATCHES.filter(m => m.status === "open").map(m => (
            <div key={m.id} onClick={() => { setSelectedMatch(m); setSubScreen("matchDetail"); }}
              style={{
                background: T.white, borderRadius: T.radius, padding: 16, cursor: "pointer",
                boxShadow: T.shadow, display: "flex", gap: 14, alignItems: "center",
                transition: "transform 0.15s ease",
              }}>
              <div style={{
                width: 48, height: 48, borderRadius: T.radiusSm,
                background: `linear-gradient(135deg, ${T.green}18, ${T.lime}18)`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
              }}>
                <span style={{ fontSize: 22 }}>🎾</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>{m.title}</span>
                  <MatchTypeBadge type={m.type}/>
                </div>
                <div style={{ fontSize: 12, color: T.gray400, marginTop: 3 }}>{m.date} {m.time} • {m.location}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.green }}>{m.cost}€</div>
                <div style={{ fontSize: 11, color: T.gray400 }}>{m.players}/{m.max}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Joueurs suggérés */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: T.navy, margin: "0 0 12px" }}>⚡ Joueurs compatibles</h3>
        <div style={{ display: "flex", gap: 12, overflowX: "auto", margin: "0 -20px", padding: "0 20px 4px" }}>
          {PLAYERS.slice(0, 4).map(p => (
            <div key={p.id} onClick={() => { setSelectedPlayer(p); setSubScreen("playerDetail"); }}
              style={{
                minWidth: 140, background: T.white, borderRadius: T.radius, padding: 16,
                textAlign: "center", boxShadow: T.shadow, cursor: "pointer"
              }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%", margin: "0 auto 8px",
                background: `linear-gradient(135deg, ${T.green}15, ${T.lime}15)`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
                position: "relative"
              }}>
                {p.avatar}
                {p.online && <div style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: "50%", background: T.green, border: `2px solid ${T.white}` }}/>}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{p.name}</div>
              <div style={{ fontSize: 11, color: T.gray400, marginTop: 2 }}>{p.city} • {p.dist}km</div>
              <div style={{
                marginTop: 8, fontSize: 12, fontWeight: 700, color: T.green,
                background: `${T.green}12`, borderRadius: 20, padding: "3px 10px", display: "inline-block"
              }}>
                {p.score}% match
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Groupes */}
      <div>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: T.navy, margin: "0 0 12px" }}>👥 Mes groupes</h3>
        {GROUPS.map(g => (
          <div key={g.id} style={{
            background: T.white, borderRadius: T.radius, padding: 14, marginBottom: 8,
            boxShadow: T.shadow, display: "flex", alignItems: "center", gap: 12, cursor: "pointer"
          }}>
            <div style={{ width: 44, height: 44, borderRadius: T.radiusSm, background: `${T.lime}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
              {g.avatar}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{g.name}</div>
              <div style={{ fontSize: 12, color: T.gray400 }}>{g.members} membres • {g.matches} matchs</div>
            </div>
            <Icons.ChevronRight/>
          </div>
        ))}
      </div>
    </div>
  );

  // ============ SCREEN: MATCHES ============
  const MatchesScreen = () => (
    <div style={{ padding: "0 20px 20px" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["Tous", "Amical", "Classé", "Tournoi"].map((f, i) => (
          <button key={f} style={{
            padding: "8px 16px", borderRadius: 20, border: "none",
            background: i === 0 ? T.navy : T.white, color: i === 0 ? T.white : T.gray600,
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            boxShadow: i === 0 ? T.shadowMd : T.shadow,
            fontFamily: "'Outfit', sans-serif"
          }}>{f}</button>
        ))}
      </div>
      {MATCHES.map(m => (
        <div key={m.id} onClick={() => { setSelectedMatch(m); setSubScreen("matchDetail"); }}
          style={{
            background: T.white, borderRadius: T.radius, padding: 16, marginBottom: 10,
            boxShadow: T.shadow, cursor: "pointer"
          }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: T.navy }}>{m.title}</span>
                <MatchTypeBadge type={m.type}/>
              </div>
              <div style={{ display: "flex", gap: 12, fontSize: 12, color: T.gray400 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Icons.Clock/>{m.date} {m.time}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Icons.Location/>{m.location}</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.green }}>{m.cost}€</div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Badge>Niv. {m.level}</Badge>
              <span style={{ fontSize: 12, color: T.gray400 }}>{m.players}/{m.max} joueurs</span>
            </div>
            <div style={{
              width: Math.min(80, (m.players / m.max) * 80), height: 4, borderRadius: 2,
              background: m.players === m.max ? T.orange : T.green, position: "relative"
            }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: 2, background: T.gray100, width: 80, zIndex: -1 }}/>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // ============ SCREEN: MAP ============
  const MapScreen = () => (
    <div style={{ height: "100%", position: "relative" }}>
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(180deg, #c8e6c9 0%, #a5d6a7 30%, #81c784 50%, #66bb6a 70%, #43a047 100%)`,
        overflow: "hidden"
      }}>
        {/* Fake map grid */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={`h${i}`} style={{ position: "absolute", top: i * 40, left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.15)" }}/>
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={`v${i}`} style={{ position: "absolute", left: i * 35, top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.15)" }}/>
        ))}
        {/* Streets */}
        <div style={{ position: "absolute", top: "30%", left: 0, right: 0, height: 8, background: "rgba(255,255,255,0.4)" }}/>
        <div style={{ position: "absolute", top: "60%", left: 0, right: 0, height: 6, background: "rgba(255,255,255,0.3)" }}/>
        <div style={{ position: "absolute", left: "40%", top: 0, bottom: 0, width: 8, background: "rgba(255,255,255,0.4)" }}/>
        <div style={{ position: "absolute", left: "70%", top: 0, bottom: 0, width: 6, background: "rgba(255,255,255,0.3)" }}/>
        {/* Blue area (sea) */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "15%", background: "linear-gradient(0deg, #42a5f5, #66bb6a)" }}/>

        {/* Club markers */}
        {[
          { x: "25%", y: "25%", name: "Padel Club Nice", courts: 6, rating: 4.5 },
          { x: "60%", y: "35%", name: "All In Padel", courts: 8, rating: 4.7 },
          { x: "45%", y: "55%", name: "Padel Riviera", courts: 4, rating: 4.2 },
          { x: "75%", y: "20%", name: "Mougins Padel", courts: 5, rating: 4.4 },
        ].map((club, i) => (
          <div key={i} style={{
            position: "absolute", left: club.x, top: club.y, transform: "translate(-50%, -100%)",
            cursor: "pointer", animation: `textIn 0.4s ease-out ${i * 0.1}s both`
          }}>
            <div style={{
              background: T.navy, color: T.white, borderRadius: 12, padding: "6px 12px",
              fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", boxShadow: T.shadowLg,
              border: `2px solid ${T.green}`
            }}>
              🏟️ {club.name}
              <div style={{ fontSize: 9, color: T.lime, marginTop: 2 }}>{club.courts} terrains • ⭐ {club.rating}</div>
            </div>
            <div style={{
              width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent",
              borderTop: `8px solid ${T.navy}`, margin: "0 auto"
            }}/>
          </div>
        ))}

        {/* Match markers */}
        {[
          { x: "35%", y: "40%", time: "18:30", spots: 1 },
          { x: "55%", y: "50%", time: "20:00", spots: 2 },
        ].map((m, i) => (
          <div key={`m${i}`} style={{
            position: "absolute", left: m.x, top: m.y, transform: "translate(-50%, -50%)",
            width: 36, height: 36, borderRadius: "50%",
            background: `linear-gradient(135deg, ${T.green}, ${T.greenLight})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 0 4px ${T.green}33, ${T.shadowMd}`,
            cursor: "pointer", animation: `pulseGlow 2s ease-in-out infinite ${i * 0.5}s`
          }}>
            <span style={{ fontSize: 16 }}>🎾</span>
          </div>
        ))}
        {/* User location */}
        <div style={{
          position: "absolute", left: "42%", top: "45%", transform: "translate(-50%, -50%)",
          width: 18, height: 18, borderRadius: "50%", background: "#4285f4",
          border: `3px solid ${T.white}`, boxShadow: `0 0 0 8px rgba(66,133,244,0.2)`
        }}/>
      </div>
      {/* Search overlay */}
      <div style={{ position: "absolute", top: 16, left: 20, right: 20 }}>
        <div style={{
          background: T.white, borderRadius: T.radiusXl, padding: "12px 20px",
          boxShadow: T.shadowLg, display: "flex", alignItems: "center", gap: 10
        }}>
          <Icons.Search/>
          <span style={{ fontSize: 14, color: T.gray400, flex: 1 }}>Rechercher un club, match...</span>
        </div>
      </div>
      {/* Filter pills */}
      <div style={{ position: "absolute", top: 72, left: 20, display: "flex", gap: 8 }}>
        {["Clubs", "Matchs", "Joueurs"].map((f, i) => (
          <button key={f} style={{
            padding: "8px 16px", borderRadius: 20, border: "none",
            background: i === 0 ? T.navy : "rgba(255,255,255,0.9)", color: i === 0 ? T.white : T.gray600,
            fontSize: 12, fontWeight: 600, cursor: "pointer", boxShadow: T.shadow,
            fontFamily: "'Outfit', sans-serif"
          }}>{f}</button>
        ))}
      </div>
    </div>
  );

  // ============ SCREEN: CHAT ============
  const ChatScreen = () => (
    <div style={{ padding: "0 20px 20px" }}>
      <div style={{
        background: T.gray50, borderRadius: T.radiusXl, padding: "10px 16px",
        display: "flex", alignItems: "center", gap: 10, marginBottom: 16
      }}>
        <Icons.Search/><span style={{ fontSize: 14, color: T.gray400 }}>Rechercher une conversation...</span>
      </div>
      {CONVERSATIONS.map(c => (
        <div key={c.id} onClick={() => setSubScreen("chatDetail")}
          style={{
            display: "flex", gap: 12, alignItems: "center", padding: "12px 0",
            borderBottom: `1px solid ${T.gray100}`, cursor: "pointer"
          }}>
          <div style={{
            width: 50, height: 50, borderRadius: "50%", flexShrink: 0,
            background: c.isGroup ? `linear-gradient(135deg, ${T.lime}22, ${T.green}22)` : `${T.green}15`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
            position: "relative"
          }}>
            {c.avatar}
            {c.online && !c.isGroup && <div style={{ position: "absolute", bottom: 1, right: 1, width: 12, height: 12, borderRadius: "50%", background: T.green, border: `2px solid ${T.white}` }}/>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 15, fontWeight: c.unread ? 700 : 600, color: T.navy }}>{c.name}</span>
              <span style={{ fontSize: 11, color: c.unread ? T.green : T.gray400 }}>{c.time}</span>
            </div>
            <div style={{
              fontSize: 13, color: c.unread ? T.gray600 : T.gray400, marginTop: 2,
              fontWeight: c.unread ? 500 : 400,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
            }}>{c.lastMsg}</div>
          </div>
          {c.unread > 0 && (
            <div style={{
              width: 22, height: 22, borderRadius: "50%", background: T.green,
              color: T.white, fontSize: 11, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>{c.unread}</div>
          )}
        </div>
      ))}
    </div>
  );

  // ============ SCREEN: PROFILE ============
  const ProfileScreen = () => (
    <div style={{ padding: "0 20px 20px" }}>
      {/* Profile card */}
      <div style={{
        background: `linear-gradient(135deg, ${T.navy}, ${T.navyMid})`,
        borderRadius: T.radiusXl, padding: 24, marginBottom: 16,
        position: "relative", overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: `${T.green}12` }}/>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: `linear-gradient(135deg, ${T.green}33, ${T.lime}33)`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36,
            border: `3px solid ${T.green}55`
          }}>🧑‍💻</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.white }}>Xavier</div>
            <div style={{ fontSize: 13, color: T.gray300, marginTop: 2 }}>@xavier_padel • Nice</div>
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <LevelBadge level={MY_STATS.level}/>
              <Badge color={T.lime}>Gauche</Badge>
              <Badge color={T.orange}>Offensif</Badge>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginTop: 20 }}>
          {[
            [MY_STATS.matches, "Matchs"],
            [`${MY_STATS.winRate}%`, "Win rate"],
            [MY_STATS.streak, "Série 🔥"],
            [MY_STATS.level, "Niveau"],
          ].map(([val, label], i) => (
            <div key={i} style={{ textAlign: "center", padding: "10px 4px", background: "rgba(255,255,255,0.08)", borderRadius: T.radiusSm }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.white }}>{val}</div>
              <div style={{ fontSize: 10, color: T.gray300, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Level progression */}
      <div style={{ background: T.white, borderRadius: T.radius, padding: 20, marginBottom: 12, boxShadow: T.shadow }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>📈 Progression du niveau</span>
          <span style={{ fontSize: 13, color: T.green, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><Icons.TrendUp/> +2.2</span>
        </div>
        <MiniChart data={MY_STATS.levelHistory} color={T.green} height={80}/>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.gray400, marginTop: 4 }}>
          <span>Jan</span><span>Fév</span><span>Mar</span><span>Avr</span><span>Mai</span><span>Jun</span><span>Jul</span><span>Aoû</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Déc</span>
        </div>
      </div>

      {/* Monthly activity */}
      <div style={{ background: T.white, borderRadius: T.radius, padding: 20, marginBottom: 12, boxShadow: T.shadow }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>📊 Matchs par mois</span>
        <div style={{ marginTop: 12 }}>
          <BarChart data={MY_STATS.monthlyMatches} color={T.green} height={70}/>
        </div>
      </div>

      {/* Best partners */}
      <div style={{ background: T.white, borderRadius: T.radius, padding: 20, marginBottom: 12, boxShadow: T.shadow }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>🤝 Meilleurs partenaires</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
          {MY_STATS.partners.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%", background: `${T.green}15`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
              }}>{p.avatar}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.navy }}>{p.name}</div>
                <div style={{ fontSize: 12, color: T.gray400 }}>{p.matches} matchs ensemble</div>
              </div>
              <div style={{
                padding: "4px 12px", borderRadius: 20,
                background: p.winRate >= 70 ? `${T.green}15` : `${T.orange}15`,
                color: p.winRate >= 70 ? T.green : T.orange,
                fontSize: 13, fontWeight: 700
              }}>{p.winRate}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Premium CTA */}
      <div style={{
        background: `linear-gradient(135deg, ${T.lime}, ${T.yellow})`,
        borderRadius: T.radius, padding: 20, marginBottom: 12,
        display: "flex", alignItems: "center", gap: 14, cursor: "pointer"
      }}>
        <div style={{ fontSize: 32 }}>⭐</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.navy }}>Passer Premium</div>
          <div style={{ fontSize: 12, color: T.navyMid }}>Stats avancées, matching illimité, classements</div>
        </div>
        <div style={{
          padding: "8px 16px", borderRadius: T.radiusSm,
          background: T.navy, color: T.white, fontSize: 13, fontWeight: 700
        }}>5,99€/mois</div>
      </div>

      {/* Settings links */}
      {["Modifier mon profil", "Mes disponibilités", "Notifications", "Paramètres du compte"].map((item, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 0", borderBottom: `1px solid ${T.gray100}`,
          cursor: "pointer", fontSize: 14, color: T.gray600
        }}>
          {item} <Icons.ChevronRight/>
        </div>
      ))}
    </div>
  );

  // ============ MAIN RENDER ============
  const tabs = [
    { id: "home", icon: Icons.Home, label: "Accueil" },
    { id: "matches", icon: Icons.Match, label: "Matchs" },
    { id: "map", icon: Icons.Map, label: "Carte" },
    { id: "chat", icon: Icons.Chat, label: "Chat" },
    { id: "profile", icon: Icons.Profile, label: "Profil" },
  ];

  const chatUnread = CONVERSATIONS.reduce((sum, c) => sum + c.unread, 0);
  const screenTitles = { home: "", matches: "Matchs", map: "Carte", chat: "Messages", profile: "Mon profil" };
  const hideNav = subScreen === "chatDetail";

  return (
    <div style={{
      width: "100%", maxWidth: 390, margin: "0 auto", height: 844,
      background: T.gray50, borderRadius: 40, overflow: "hidden",
      position: "relative", fontFamily: "'Outfit', sans-serif",
      boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
      display: "flex", flexDirection: "column"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        @keyframes textIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 0 4px rgba(62,175,75,0.15); } 50% { box-shadow: 0 0 0 8px rgba(62,175,75,0.3); } }
        @keyframes fabPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; scrollbar-width: none; }
        *::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ===== STATUS BAR ===== */}
      <div style={{ padding: "12px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: T.navy }}>9:41</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ width: 16, height: 10, display: "flex", gap: 1, alignItems: "flex-end" }}>
            {[4,6,8,10].map((h,i) => <div key={i} style={{ width: 3, height: h, background: T.navy, borderRadius: 1 }}/>)}
          </div>
          <span style={{ fontSize: 11, color: T.navy }}>5G</span>
          <div style={{ width: 24, height: 11, borderRadius: 3, border: `1.5px solid ${T.navy}`, padding: 1.5 }}>
            <div style={{ height: "100%", width: "70%", background: T.green, borderRadius: 1.5 }}/>
          </div>
        </div>
      </div>

      {/* ===== HEADER ===== */}
      {!hideNav && (
        <div style={{ padding: "12px 20px 8px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          {tab === "home" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: `linear-gradient(135deg, ${T.green}, ${T.lime})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 900, color: T.white, fontSize: 16
              }}>P</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.navy, letterSpacing: 1 }}>PADELIA</div>
              </div>
            </div>
          ) : (
            <h1 style={{ fontSize: 24, fontWeight: 800, color: T.navy, margin: 0 }}>{screenTitles[tab]}</h1>
          )}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button style={{
              width: 40, height: 40, borderRadius: "50%", border: "none",
              background: T.white, boxShadow: T.shadow, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", color: T.navy,
              position: "relative"
            }}>
              <Icons.Bell/>
              <div style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: T.danger }}/>
            </button>
          </div>
        </div>
      )}

      {/* ===== CONTENT ===== */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {subScreen === "matchDetail" && selectedMatch ? <MatchDetail match={selectedMatch}/> :
         subScreen === "playerDetail" && selectedPlayer ? <PlayerDetail player={selectedPlayer}/> :
         subScreen === "chatDetail" ? <ChatDetail/> :
         tab === "home" ? <HomeScreen/> :
         tab === "matches" ? <MatchesScreen/> :
         tab === "map" ? <MapScreen/> :
         tab === "chat" ? <ChatScreen/> :
         tab === "profile" ? <ProfileScreen/> :
         null}
      </div>

      {/* ===== FAB ===== */}
      {!hideNav && (tab === "home" || tab === "matches") && (
        <button style={{
          position: "absolute", bottom: 90, right: 20,
          width: 56, height: 56, borderRadius: "50%",
          background: `linear-gradient(135deg, ${T.green}, ${T.greenLight})`,
          border: "none", color: T.white, cursor: "pointer",
          boxShadow: `0 4px 20px ${T.green}55`,
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 10, animation: "fabPulse 3s ease-in-out infinite"
        }}><Icons.Plus/></button>
      )}

      {/* ===== BOTTOM NAV ===== */}
      {!hideNav && (
        <div style={{
          flexShrink: 0, display: "flex", justifyContent: "space-around",
          padding: "8px 12px 24px", background: T.white,
          borderTop: `1px solid ${T.gray100}`,
          boxShadow: "0 -2px 12px rgba(0,0,0,0.04)"
        }}>
          {tabs.map(t => {
            const active = tab === t.id;
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => navigate(t.id)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  background: "none", border: "none", cursor: "pointer",
                  color: active ? T.green : T.gray400, padding: "4px 12px",
                  position: "relative", transition: "color 0.2s ease",
                  fontFamily: "'Outfit', sans-serif"
                }}>
                {active && <div style={{
                  position: "absolute", top: -8, width: 24, height: 3,
                  borderRadius: 2, background: T.green
                }}/>}
                <div style={{ position: "relative" }}>
                  <Icon/>
                  {t.id === "chat" && chatUnread > 0 && (
                    <div style={{
                      position: "absolute", top: -4, right: -8,
                      width: 16, height: 16, borderRadius: "50%",
                      background: T.danger, color: T.white,
                      fontSize: 9, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>{chatUnread}</div>
                  )}
                </div>
                <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
