import { useBreakpoint } from "../hooks/useBreakpoint";
import UserMenu from "./UserMenu";

const TAB_LABELS = {
  dashboard: "Dashboard",
  journal:   "Journal",
  analytics: "Analytics",
  calendar:  "Calendar",
  insights:  "Insights",
  review:    "Review",
  playbook:  "Playbook",
  daily:     "Daily",
  replay:    "Replay",
  share:     "Share",
  ai:        "AI",
  portfolio:      "Porto",
  "calendar-eco": "Kalender",
  risk:           "Risk",
  settings:  "Settings",
};

export default function Header({
  activeTab, setActiveTab, onAddTrade,
  themeName, onToggleTheme, theme,
  syncing, tabs, user, profile,
  onSignOut, accountSwitcher, globalSearch,
}) {
  const t = theme;
  const { isMobile } = useBreakpoint();

  return (
    <header style={{
      background: t.bgCard,
      borderBottom: `1px solid ${t.border}`,
      position: "sticky", top: 0, zIndex: 40,
    }}>
      {/* ── Top row: logo + right actions ─────────────────────── */}
      <div style={{
        maxWidth: 1280, margin: "0 auto",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        height: 52, padding: "0 20px", gap: 12,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{
            width: 28, height: 28,
            background: "linear-gradient(135deg, #00d4aa, #00b4d8)",
            borderRadius: 7, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 13, position: "relative",
          }}>
            ◈
            {syncing && (
              <div className="sync-dot" style={{
                position: "absolute", top: -2, right: -2,
                width: 7, height: 7, borderRadius: "50%", background: "#f59e0b",
              }} />
            )}
          </div>
          {!isMobile && (
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 17, letterSpacing: 2, color: t.text, lineHeight: 1,
            }}>
              TRADEBOOK
            </div>
          )}
        </div>

        {/* Account switcher */}
        <div style={{ flexShrink: 0 }}>{accountSwitcher}</div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Right actions */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
          {/* Global search */}
          {globalSearch}

          {/* Theme toggle */}
          <button onClick={onToggleTheme}
            style={{
              background: t.bgSubtle, border: `1px solid ${t.border}`,
              color: t.textMuted, borderRadius: 7,
              padding: "5px 9px", cursor: "pointer", fontSize: 13,
            }}>
            {themeName === "dark" ? "☀️" : "🌙"}
          </button>

          {/* Log trade */}
          <button className="btn-primary" onClick={onAddTrade}
            style={{ fontSize: 11, padding: "7px 12px", whiteSpace: "nowrap" }}>
            {isMobile ? "+" : "+ LOG"}
          </button>

          {/* User menu */}
          <UserMenu user={user} profile={profile} onSignOut={onSignOut} theme={t} />
        </div>
      </div>

      {/* ── Bottom row: tabs ───────────────────────────────────── */}
      <div style={{
        maxWidth: 1280, margin: "0 auto",
        padding: "0 20px",
        borderTop: `1px solid ${t.borderSubtle}`,
      }}>
        <nav style={{
          display: "flex",
          overflowX: "auto",
          scrollbarWidth: "none",
          gap: 0,
        }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                background: "none",
                borderTop: "none", borderLeft: "none", borderRight: "none",
                borderBottom: activeTab === tab
                  ? `2px solid ${t.accent}`
                  : "2px solid transparent",
                color: activeTab === tab ? t.accent : t.textDim,
                fontFamily: "DM Mono, monospace",
                fontSize: isMobile ? 10 : 11,
                padding: isMobile ? "8px 10px" : "9px 16px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "color 0.15s, border-color 0.15s",
                flexShrink: 0,
              }}>
              {TAB_LABELS[tab] ?? tab}
            </button>
          ))}
        </nav>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .sync-dot { animation: pulse 1s infinite; }
        nav::-webkit-scrollbar { display: none; }
      `}</style>
    </header>
  );
}