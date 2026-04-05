// ── Streak Widget — Duolingo style ────────────────────────────────
export default function StreakWidget({ streakData, onNavigate, theme: t }) {
  const { currentStreak, todayActive, streakAtRisk, freezesLeft, weeklyActiveDays, weeklyGoal, weeklyProgress } = streakData;

  const flameColor = currentStreak >= 30 ? "#c9a84c" : currentStreak >= 7 ? "#f97316" : currentStreak >= 3 ? "#ef4444" : "#64748b";
  const flameSize  = currentStreak >= 30 ? 32 : currentStreak >= 7 ? 28 : 24;

  return (
    <div
      onClick={() => onNavigate?.("achievements")}
      style={{
        background: streakAtRisk
          ? "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.04))"
          : "linear-gradient(135deg, rgba(0,200,150,0.06), rgba(0,200,150,0.02))",
        border: `1px solid ${streakAtRisk ? "rgba(239,68,68,0.2)" : "rgba(0,200,150,0.15)"}`,
        borderRadius: 12, padding: "14px 18px",
        cursor: onNavigate ? "pointer" : "default",
        display: "flex", alignItems: "center", gap: 16,
        transition: "all 0.2s",
      }}>
      {/* Flame */}
      <div style={{ fontSize: flameSize, lineHeight: 1, flexShrink: 0 }}>
        {currentStreak === 0 ? "🌑" : streakAtRisk ? "⚠️" : "🔥"}
      </div>

      {/* Streak count */}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 26, fontWeight: 700, color: flameColor, lineHeight: 1 }}>
            {currentStreak}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-dim)" }}>hari streak</span>
        </div>
        {streakAtRisk && (
          <div style={{ fontSize: 10, color: "var(--danger)", marginTop: 2 }}>Selesaikan 1 trade atau jurnal hari ini!</div>
        )}
        {!streakAtRisk && todayActive && (
          <div style={{ fontSize: 10, color: "var(--accent)", marginTop: 2 }}>✓ Streak aman hari ini</div>
        )}
      </div>

      {/* Weekly progress */}
      <div style={{ textAlign: "center", flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 4 }}>
          {weeklyActiveDays}/{weeklyGoal} minggu ini
        </div>
        <div style={{ width: 60, height: 4, background: "var(--bg-subtle)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${weeklyProgress}%`, background: "#00c896", borderRadius: 2, transition: "width 0.5s" }} />
        </div>
      </div>

      {/* Freeze */}
      {freezesLeft > 0 && (
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontSize: 18 }}>🧊</div>
          <div style={{ fontSize: 9, color: "var(--text-dim)" }}>{freezesLeft}x freeze</div>
        </div>
      )}
    </div>
  );
}