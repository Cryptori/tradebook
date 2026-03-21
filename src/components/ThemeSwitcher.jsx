import { THEMES } from "../hooks/useTheme";

// ── Floating theme switcher ───────────────────────────────────────
export function FloatingThemeSwitcher({ currentTheme, onSetTheme, theme: t }) {
  const themes = Object.values(THEMES);

  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 100,
      display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8,
    }}>
      <div style={{
        display: "flex", gap: 6, padding: "8px 10px",
        background: t.bgCard, border: `1px solid ${t.border}`,
        borderRadius: 100, boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        backdropFilter: "blur(12px)",
      }}>
        {themes.map(thm => (
          <button
            key={thm.name}
            onClick={() => onSetTheme(thm.name)}
            title={thm.label}
            style={{
              width: 24, height: 24, borderRadius: "50%",
              border: `2px solid ${currentTheme === thm.name ? "#fff" : "transparent"}`,
              background: thm.accent,
              cursor: "pointer", padding: 0,
              boxShadow: currentTheme === thm.name ? `0 0 8px ${thm.accent}` : "none",
              transition: "all 0.2s",
              transform: currentTheme === thm.name ? "scale(1.2)" : "scale(1)",
              fontSize: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Theme picker for Settings ─────────────────────────────────────
export function ThemePicker({ currentTheme, onSetTheme, theme: t }) {
  const themes = Object.values(THEMES);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 9, color: t.accent, textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 600 }}>Tema Aplikasi</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {themes.map(thm => (
          <button
            key={thm.name}
            onClick={() => onSetTheme(thm.name)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              padding: "14px 8px", borderRadius: 12, cursor: "pointer",
              border: `2px solid ${currentTheme === thm.name ? thm.accent : t.border}`,
              background: currentTheme === thm.name ? thm.accent + "12" : t.bgSubtle,
              transition: "all 0.2s",
            }}
          >
            {/* Mini preview */}
            <div style={{ width: 48, height: 32, borderRadius: 8, background: thm.bg, border: `1px solid ${thm.border}`, overflow: "hidden", position: "relative" }}>
              <div style={{ position: "absolute", top: 4, left: 4, right: 4, height: 6, background: thm.bgCard, borderRadius: 3 }} />
              <div style={{ position: "absolute", bottom: 4, left: 4, width: "40%", height: 4, background: thm.accent, borderRadius: 2 }} />
              <div style={{ position: "absolute", bottom: 4, right: 4, width: "30%", height: 4, background: thm.border, borderRadius: 2 }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14 }}>{thm.emoji}</div>
              <div style={{ fontSize: 10, color: currentTheme === thm.name ? thm.accent : t.textMuted, fontWeight: currentTheme === thm.name ? 600 : 400, marginTop: 2 }}>{thm.label}</div>
            </div>
            {currentTheme === thm.name && (
              <div style={{ fontSize: 9, color: thm.accent, fontWeight: 700 }}>✓ Aktif</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}