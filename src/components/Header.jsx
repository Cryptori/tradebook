import { useState, useRef, useEffect } from "react";
import { useBreakpoint } from "../hooks/useBreakpoint";
import UserMenu from "./UserMenu";

// ── Tab config ────────────────────────────────────────────────────
const TAB_GROUPS = [
  { label: "Trading",  tabs: ["dashboard", "journal", "calendar", "replay"] },
  { label: "Analysis", tabs: ["analytics", "insights", "review", "backtest"] },
  { label: "Planning", tabs: ["playbook", "daily", "plan", "portfolio", "templates"] },
  { label: "Tools",    tabs: ["risk", "calendar-eco", "broker", "gallery", "scanner", "heatmap", "correlation", "acct-compare", "share"] },
  { label: "Growth",   tabs: ["ai", "achievements"] },
];

const TAB_LABELS = {
  dashboard:      "Dashboard",
  journal:        "Journal",
  analytics:      "Analytics",
  calendar:       "Calendar",
  insights:       "Insights",
  review:         "Review",
  playbook:       "Playbook",
  daily:          "Daily",
  replay:         "Replay",
  share:          "Share",
  ai:             "AI Advisor",
  portfolio:      "Portfolio",
  "calendar-eco": "Eco Calendar",
  achievements:   "Achievements",
  plan:           "Trading Plan",
  backtest:       "Backtest",
  broker:         "Brokers",
  gallery:        "Gallery",
  scanner:        "Scanner",
  heatmap:        "Heatmap",
  correlation:    "Correlation",
  templates:      "Templates",
  "acct-compare": "Accounts",
  risk:           "Risk Calc",
};

// ── Dropdown menu ─────────────────────────────────────────────────
function DropdownMenu({ group, activeTab, onTab, onClose }) {
  const isGroupActive = group.tabs.includes(activeTab);

  return (
    <div style={{
      position: "absolute", top: "calc(100% + 6px)", left: "50%",
      transform: "translateX(-50%)",
      minWidth: 160,
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "var(--r-lg)",
      padding: "4px",
      boxShadow: "var(--shadow-lg)",
      zIndex: 200,
      animation: "fadeIn 100ms ease",
    }}>
      {group.tabs.map(tab => {
        const isActive = tab === activeTab;
        return (
          <button key={tab}
            onClick={() => { onTab(tab); onClose(); }}
            style={{
              display: "flex", alignItems: "center",
              width: "100%", padding: "7px 10px",
              borderRadius: "var(--r-sm)",
              border: "none",
              background: isActive ? "var(--accent-dim)" : "transparent",
              color: isActive ? "var(--accent)" : "var(--text-muted)",
              fontSize: "var(--fs-sm)",
              fontFamily: "var(--font-ui)",
              fontWeight: isActive ? 600 : 400,
              cursor: "pointer",
              textAlign: "left",
              transition: "background var(--t-fast), color var(--t-fast)",
              whiteSpace: "nowrap",
              letterSpacing: "0.01em",
            }}
            onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "var(--bg-subtle)"; e.currentTarget.style.color = "var(--text)"; }}}
            onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}}
          >
            {TAB_LABELS[tab] || tab}
          </button>
        );
      })}
    </div>
  );
}

// ── Nav group button ──────────────────────────────────────────────
function NavGroup({ group, activeTab, onTab }) {
  const [open, setOpen]     = useState(false);
  const ref                 = useRef(null);
  const isGroupActive       = group.tabs.includes(activeTab);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "inline-flex", alignItems: "center", gap: "4px",
          padding: "5px 10px",
          borderRadius: "var(--r-sm)",
          border: "none",
          background: isGroupActive ? "var(--accent-dim)" : "transparent",
          color: isGroupActive ? "var(--accent)" : "var(--text-dim)",
          fontSize: "var(--fs-sm)",
          fontFamily: "var(--font-ui)",
          fontWeight: isGroupActive ? 600 : 500,
          cursor: "pointer",
          letterSpacing: "0.01em",
          transition: "color var(--t-fast), background var(--t-fast)",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={e => { if (!isGroupActive) { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "var(--bg-subtle)"; }}}
        onMouseLeave={e => { if (!isGroupActive) { e.currentTarget.style.color = "var(--text-dim)"; e.currentTarget.style.background = "transparent"; }}}
      >
        {group.label}
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none"
          style={{ opacity: 0.5, transform: open ? "rotate(180deg)" : "none", transition: "transform var(--t-fast)" }}>
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {open && (
        <DropdownMenu group={group} activeTab={activeTab} onTab={onTab} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}

// ── Mobile menu ───────────────────────────────────────────────────
function MobileMenu({ activeTab, onTab, onClose, accounts, activeAccount, onAccountChange, authHook, themeName, onToggleTheme }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 400,
      background: "var(--bg-overlay)",
      backdropFilter: "blur(8px)",
      animation: "fadeIn 150ms ease",
    }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "absolute", top: 48, left: 0, right: 0,
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--border)",
          padding: "var(--sp-3)",
          maxHeight: "calc(100vh - 48px)",
          overflowY: "auto",
        }}
      >
        {TAB_GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom: "var(--sp-3)" }}>
            <div style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600, padding: "4px 8px", marginBottom: "2px" }}>
              {group.label}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px" }}>
              {group.tabs.map(tab => {
                const isActive = tab === activeTab;
                return (
                  <button key={tab}
                    onClick={() => { onTab(tab); onClose(); }}
                    style={{
                      padding: "8px 10px", borderRadius: "var(--r-sm)", border: "none",
                      background: isActive ? "var(--accent-dim)" : "transparent",
                      color: isActive ? "var(--accent)" : "var(--text-muted)",
                      fontSize: "var(--fs-sm)", fontWeight: isActive ? 600 : 400,
                      cursor: "pointer", textAlign: "left", fontFamily: "var(--font-ui)",
                    }}>
                    {TAB_LABELS[tab] || tab}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Active tab breadcrumb ─────────────────────────────────────────
function ActiveBreadcrumb({ activeTab }) {
  const group = TAB_GROUPS.find(g => g.tabs.includes(activeTab));
  if (!group) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>
      <span>{group.label}</span>
      <span style={{ opacity: 0.4 }}>/</span>
      <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>{TAB_LABELS[activeTab] || activeTab}</span>
    </div>
  );
}

// ── Main Header ───────────────────────────────────────────────────
export default function Header({
  activeTab, onTab,
  accounts, activeAccount, onAccountChange,
  authHook, themeName, onToggleTheme,
}) {
  const { isMobile } = useBreakpoint();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border)",
      }}>
        {/* Main nav row */}
        <div style={{
          display: "flex", alignItems: "center",
          height: 46,
          padding: "0 var(--sp-5)",
          gap: "var(--sp-3)",
          maxWidth: 1440,
          margin: "0 auto",
        }}>
          {/* Logo */}
          <div style={{
            fontFamily: "var(--font-disp)",
            fontSize: 18,
            letterSpacing: "4px",
            color: "var(--accent)",
            flexShrink: 0,
            marginRight: "var(--sp-2)",
            userSelect: "none",
          }}>
            TRADEBOOK
          </div>

          {/* Vertical divider */}
          <div style={{ width: 1, height: 20, background: "var(--border)", flexShrink: 0 }} />

          {isMobile ? (
            /* Mobile: breadcrumb + hamburger */
            <>
              <ActiveBreadcrumb activeTab={activeTab} />
              <div style={{ flex: 1 }} />
              <button
                onClick={() => setMobileOpen(o => !o)}
                style={{
                  width: 32, height: 32,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
                  background: "transparent", border: "1px solid var(--border)",
                  borderRadius: "var(--r-md)", cursor: "pointer",
                }}
              >
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 14, height: 1.5, background: "var(--text-muted)", borderRadius: 2 }} />
                ))}
              </button>
            </>
          ) : (
            /* Desktop: nav groups */
            <>
              <nav style={{ display: "flex", alignItems: "center", gap: "2px", flex: 1 }}>
                {TAB_GROUPS.map(group => (
                  <NavGroup key={group.label} group={group} activeTab={activeTab} onTab={onTab} />
                ))}
              </nav>

              {/* Right side */}
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", flexShrink: 0 }}>
                {/* Settings shortcut */}
                <button
                  onClick={() => onTab("settings")}
                  style={{
                    width: 30, height: 30,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: activeTab === "settings" ? "var(--accent-dim)" : "transparent",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--r-md)",
                    color: activeTab === "settings" ? "var(--accent)" : "var(--text-dim)",
                    cursor: "pointer",
                    transition: "all var(--t-fast)",
                    fontSize: 13,
                  }}
                  title="Settings"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 2v2m0 16v2M2 12h2m16 0h2m-3.5-7.5-1.5 1.5M5.5 18.5l1.5-1.5m0-11L5.5 5.5M18.5 18.5l-1.5-1.5"/>
                  </svg>
                </button>

                {/* Theme toggle */}
                <button
                  onClick={onToggleTheme}
                  style={{
                    width: 30, height: 30,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "transparent",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--r-md)",
                    color: "var(--text-dim)",
                    cursor: "pointer",
                    transition: "all var(--t-fast)",
                    fontSize: 13,
                  }}
                  title={themeName === "dark" ? "Light mode" : "Dark mode"}
                >
                  {themeName === "light" ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <circle cx="12" cy="12" r="5"/>
                      <line x1="12" y1="1" x2="12" y2="3"/>
                      <line x1="12" y1="21" x2="12" y2="23"/>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                      <line x1="1" y1="12" x2="3" y2="12"/>
                      <line x1="21" y1="12" x2="23" y2="12"/>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                    </svg>
                  )}
                </button>

                {/* Account switcher */}
                {accounts && accounts.length > 1 && (
                  <select
                    value={activeAccount?.id || ""}
                    onChange={e => onAccountChange?.(e.target.value)}
                    style={{
                      height: 30, padding: "0 24px 0 8px",
                      background: "var(--bg-input)", border: "1px solid var(--border)",
                      borderRadius: "var(--r-md)", color: "var(--text-muted)",
                      fontSize: "var(--fs-xs)", fontFamily: "var(--font-ui)",
                      cursor: "pointer", maxWidth: 130,
                    }}
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                )}

                {/* User menu */}
                {authHook && (
                  <UserMenu authHook={authHook} accounts={accounts} activeAccount={activeAccount} onAccountChange={onAccountChange} theme={{ text: "var(--text)", textDim: "var(--text-dim)", bgCard: "var(--bg-card)", border: "var(--border)", bgSubtle: "var(--bg-subtle)", accent: "var(--accent)" }} />
                )}
              </div>
            </>
          )}
        </div>

        {/* Sub-row: active tab indicator on desktop */}
        {!isMobile && activeTab && (
          <div style={{
            height: 2,
            background: "var(--bg-card)",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: 1,
              background: "var(--border)",
            }} />
          </div>
        )}
      </header>

      {/* Mobile menu overlay */}
      {isMobile && mobileOpen && (
        <MobileMenu
          activeTab={activeTab}
          onTab={onTab}
          onClose={() => setMobileOpen(false)}
          accounts={accounts}
          activeAccount={activeAccount}
          onAccountChange={onAccountChange}
          authHook={authHook}
          themeName={themeName}
          onToggleTheme={onToggleTheme}
        />
      )}
    </>
  );
}