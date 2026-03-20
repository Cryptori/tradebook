import { useState, useRef, useEffect } from "react";
import { useBreakpoint } from "../hooks/useBreakpoint";
import UserMenu from "./UserMenu";

// ── Tab groups ───────────────────────────────────────────────────
const TAB_GROUPS = [
  {
    label: "Trading",
    icon: "📊",
    tabs: ["dashboard", "journal", "calendar", "replay"],
  },
  {
    label: "Analysis",
    icon: "📈",
    tabs: ["analytics", "insights", "review", "backtest"],
  },
  {
    label: "Planning",
    icon: "🎯",
    tabs: ["playbook", "daily", "plan", "portfolio"],
  },
  {
    label: "Tools",
    icon: "⚡",
    tabs: ["risk", "calendar-eco", "broker", "gallery", "scanner", "heatmap", "correlation", "share"],
  },
  {
    label: "Growth",
    icon: "🏆",
    tabs: ["ai", "achievements"],
  },
];

const TAB_LABELS = {
  dashboard:     "Dashboard",
  journal:       "Journal",
  analytics:     "Analytics",
  calendar:      "Calendar",
  insights:      "Insights",
  review:        "Review",
  playbook:      "Playbook",
  daily:         "Daily",
  replay:        "Replay",
  share:         "Share",
  ai:            "AI Advisor",
  portfolio:     "Portfolio",
  "calendar-eco":"Eco Calendar",
  achievements:  "Achievements",
  plan:          "Trading Plan",
  backtest:      "Backtest",
  broker:        "Broker",
  gallery:       "Gallery",
  risk:          "Risk Calc",
  settings:      "Settings",
};

const TAB_ICONS = {
  dashboard:     "▣",
  journal:       "◎",
  analytics:     "◈",
  calendar:      "◷",
  insights:      "◉",
  review:        "◐",
  playbook:      "◑",
  daily:         "◌",
  replay:        "▶",
  share:         "◎",
  ai:            "✦",
  portfolio:     "◈",
  "calendar-eco":"◷",
  achievements:  "★",
  plan:          "◎",
  backtest:      "◐",
  broker:        "◈",
  gallery:       "🖼",
  scanner:       "📡",
  heatmap:       "🔥",
  correlation:   "🔗",
  "screenshot-gallery": "🖼",
  risk:          "⊖",
  settings:      "◎",
};

// ── Dropdown group menu ──────────────────────────────────────────
function GroupMenu({ group, activeTab, setActiveTab, theme: t, onClose }) {
  return (
    <div style={{
      position: "absolute", top: "calc(100% + 8px)", left: "50%",
      transform: "translateX(-50%)",
      background: t.bgCard,
      border: `1px solid ${t.border}`,
      borderRadius: 10,
      padding: 6,
      minWidth: 160,
      zIndex: 200,
      boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
      animation: "fadeDown 0.15s ease both",
    }}>
      {group.tabs.map(tab => (
        <button key={tab} onClick={() => { setActiveTab(tab); onClose(); }}
          style={{
            width: "100%", textAlign: "left", padding: "9px 12px",
            borderRadius: 7, border: "none", cursor: "pointer",
            background: activeTab === tab ? "rgba(0,200,150,0.08)" : "transparent",
            color: activeTab === tab ? "#00c896" : t.textMuted,
            fontSize: 12, display: "flex", alignItems: "center", gap: 8,
            transition: "all 0.12s",
            fontFamily: "DM Sans, sans-serif",
          }}
          onMouseEnter={e => { if (activeTab !== tab) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
          onMouseLeave={e => { if (activeTab !== tab) e.currentTarget.style.background = "transparent"; }}>
          <span style={{ fontSize: 11, opacity: 0.6 }}>{TAB_ICONS[tab]}</span>
          {TAB_LABELS[tab] ?? tab}
          {activeTab === tab && <span style={{ marginLeft: "auto", fontSize: 8, color: "#00c896" }}>●</span>}
        </button>
      ))}
    </div>
  );
}

export default function Header({
  activeTab, setActiveTab, onAddTrade,
  themeName, onToggleTheme, theme,
  syncing, tabs, user, profile,
  onSignOut, accountSwitcher, globalSearch,
}) {
  const t = theme;
  const { isMobile, md } = useBreakpoint();
  const [openGroup, setOpenGroup] = useState(null);
  const headerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setOpenGroup(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Find which group the active tab belongs to
  const activeGroup = TAB_GROUPS.find(g => g.tabs.includes(activeTab));

  // Settings tab always visible
  const settingsActive = activeTab === "settings";

  return (
    <header ref={headerRef} style={{
      background: t.bgCard,
      borderBottom: `1px solid ${t.border}`,
      position: "sticky", top: 0, zIndex: 40,
    }}>
      {/* ── Top row ─────────────────────────────── */}
      <div style={{
        maxWidth: 1280, margin: "0 auto",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        height: 52, padding: "0 20px", gap: 10,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{
            width: 26, height: 26,
            background: "linear-gradient(135deg, #00c896, #0ea5e9)",
            borderRadius: 6, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 12,
            position: "relative", flexShrink: 0,
          }}>
            ◈
            {syncing && (
              <div className="sync-dot" style={{
                position: "absolute", top: -2, right: -2,
                width: 6, height: 6, borderRadius: "50%", background: "#f59e0b",
              }} />
            )}
          </div>
          {!isMobile && (
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 16, letterSpacing: 3, color: t.text, lineHeight: 1,
            }}>
              TRADEBOOK
            </div>
          )}
        </div>

        {/* Account switcher */}
        {accountSwitcher && <div style={{ flexShrink: 0 }}>{accountSwitcher}</div>}

        <div style={{ flex: 1 }} />

        {/* Right actions */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
          {globalSearch}
          <button onClick={onToggleTheme}
            style={{
              background: t.bgSubtle, border: `1px solid ${t.border}`,
              color: t.textMuted, borderRadius: 6,
              padding: "5px 8px", cursor: "pointer", fontSize: 12,
              transition: "all 0.2s",
            }}>
            {themeName === "dark" ? "☀" : "☽"}
          </button>
          <button className="btn-primary" onClick={onAddTrade}
            style={{ fontSize: 11, padding: "6px 12px", whiteSpace: "nowrap" }}>
            {isMobile ? "+" : "+ LOG"}
          </button>
          <UserMenu user={user} profile={profile} onSignOut={onSignOut} theme={t} />
        </div>
      </div>

      {/* ── Navigation row ──────────────────────── */}
      <div style={{
        maxWidth: 1280, margin: "0 auto",
        padding: "0 20px",
        borderTop: `1px solid ${t.borderSubtle}`,
        display: "flex", alignItems: "stretch",
        gap: 0,
      }}>
        {/* Group tabs */}
        {TAB_GROUPS.map(group => {
          const isGroupActive = group.tabs.includes(activeTab);
          const isOpen = openGroup === group.label;

          return (
            <div key={group.label} style={{ position: "relative" }}>
              <button
                onClick={() => setOpenGroup(isOpen ? null : group.label)}
                style={{
                  background: "none",
                  borderTop: "none", borderLeft: "none", borderRight: "none",
                  borderBottom: isGroupActive
                    ? `2px solid ${t.accent}`
                    : isOpen ? `2px solid ${t.border}` : "2px solid transparent",
                  color: isGroupActive ? t.accent : isOpen ? t.textMuted : t.textDim,
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: isMobile ? 10 : 11,
                  fontWeight: isGroupActive ? 500 : 400,
                  padding: isMobile ? "8px 10px" : "9px 14px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s",
                  display: "flex", alignItems: "center", gap: 5,
                }}>
                {!isMobile && <span style={{ fontSize: 10 }}>{group.icon}</span>}
                {isMobile ? group.icon : group.label}
                {isGroupActive && !isMobile && (
                  <span style={{ fontSize: 8, color: t.accent, marginLeft: 2 }}>
                    {TAB_LABELS[activeTab]}
                  </span>
                )}
                <span style={{ fontSize: 8, color: t.textDim, marginLeft: 1 }}>
                  {isOpen ? "▲" : "▾"}
                </span>
              </button>

              {isOpen && (
                <GroupMenu
                  group={group} activeTab={activeTab}
                  setActiveTab={setActiveTab} theme={t}
                  onClose={() => setOpenGroup(null)}
                />
              )}
            </div>
          );
        })}

        {/* Divider */}
        <div style={{ width: 1, background: t.borderSubtle, margin: "8px 6px" }} />

        {/* Settings — always visible */}
        <button onClick={() => { setActiveTab("settings"); setOpenGroup(null); }}
          style={{
            background: "none",
            borderTop: "none", borderLeft: "none", borderRight: "none",
            borderBottom: settingsActive ? `2px solid ${t.accent}` : "2px solid transparent",
            color: settingsActive ? t.accent : t.textDim,
            fontFamily: "DM Sans, sans-serif",
            fontSize: isMobile ? 10 : 11,
            padding: isMobile ? "8px 10px" : "9px 14px",
            cursor: "pointer", whiteSpace: "nowrap",
            transition: "all 0.15s",
          }}>
          ⚙ {!isMobile && "Settings"}
        </button>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fadeDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .sync-dot { animation: pulse 1s infinite; }
      `}</style>
    </header>
  );
}