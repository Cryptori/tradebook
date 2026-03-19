import { useBreakpoint } from "../../hooks/useBreakpoint";
import { formatCurrency } from "../../utils/formatters";
import { BADGES } from "../../hooks/useGamification";

// ── Streak Card ──────────────────────────────────────────────────
function StreakCard({ label, count, icon, color, suffix = "hari", theme: t }) {
  return (
    <div style={{ background: count > 0 ? `${color}10` : t.bgSubtle, border: `1px solid ${count > 0 ? color + "40" : t.borderSubtle}`, borderRadius: 12, padding: "20px 16px", textAlign: "center", transition: "all 0.2s" }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, color: count > 0 ? color : t.textDim, lineHeight: 1 }}>{count}</div>
      <div style={{ fontSize: 11, color: t.textDim, marginTop: 4 }}>{suffix}</div>
      <div style={{ fontSize: 12, color: count > 0 ? color : t.textDim, marginTop: 4, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

// ── Level Card ───────────────────────────────────────────────────
function LevelCard({ level, xp, theme: t }) {
  const { current, next, progress } = level;
  return (
    <div style={{ background: `linear-gradient(135deg, ${t.bgCard}, ${t.bgCard2})`, border: `1px solid ${t.border}`, borderRadius: 16, padding: "24px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #00d4aa20, #00d4aa40)", border: "2px solid #00d4aa60", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>
          {current.icon}
        </div>
        <div>
          <div style={{ fontSize: 10, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em" }}>Level {current.level}</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: "#00d4aa", letterSpacing: 1 }}>{current.name}</div>
          <div style={{ fontSize: 12, color: t.textDim }}>{xp} XP total</div>
        </div>
      </div>

      {next && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: t.textDim, marginBottom: 6 }}>
            <span>Progress ke Level {next.level} — {next.name} {next.icon}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: 8, background: t.bgSubtle, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #00d4aa80, #00d4aa)", borderRadius: 4, transition: "width 0.8s ease" }} />
          </div>
          <div style={{ fontSize: 10, color: t.textDim, marginTop: 6 }}>
            {next.xp - xp} XP lagi untuk naik level
          </div>
        </>
      )}
      {!next && (
        <div style={{ textAlign: "center", fontSize: 13, color: "#00d4aa" }}>👑 Max Level Tercapai!</div>
      )}
    </div>
  );
}

// ── Badge Grid ───────────────────────────────────────────────────
function BadgeGrid({ badges, theme: t }) {
  const earned  = badges.filter(b => b.earned);
  const locked  = badges.filter(b => !b.earned);

  return (
    <div>
      {/* Earned */}
      {earned.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#00d4aa", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
            ✅ Earned ({earned.length})
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
            {earned.map(b => (
              <div key={b.id} style={{ background: "rgba(0,212,170,0.06)", border: "1px solid rgba(0,212,170,0.3)", borderRadius: 10, padding: "14px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{b.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: t.text, marginBottom: 3 }}>{b.name}</div>
                <div style={{ fontSize: 10, color: t.textDim }}>{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
            🔒 Belum Unlock ({locked.length})
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
            {locked.map(b => (
              <div key={b.id} style={{ background: t.bgSubtle, border: `1px solid ${t.borderSubtle}`, borderRadius: 10, padding: "14px 12px", textAlign: "center", opacity: 0.5 }}>
                <div style={{ fontSize: 24, marginBottom: 6, filter: "grayscale(1)" }}>{b.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: t.textDim, marginBottom: 3 }}>{b.name}</div>
                <div style={{ fontSize: 10, color: t.textDim }}>{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Monthly Progress ─────────────────────────────────────────────
function MonthlyProgress({ monthProgress, currencyMeta, theme: t }) {
  const { isMobile } = useBreakpoint();
  const sym = currencyMeta?.symbol ?? "$";
  return (
    <div style={{ background: `linear-gradient(135deg, ${t.bgCard}, ${t.bgCard2})`, border: `1px solid ${t.border}`, borderRadius: 16, padding: "20px" }}>
      <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Progress Bulan Ini</div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Trades",   value: `${monthProgress.trades}/${monthProgress.target}`, color: t.text },
          { label: "Wins",     value: monthProgress.wins,                                 color: "#00d4aa" },
          { label: "P&L",      value: (monthProgress.pnl >= 0 ? "+" : "") + formatCurrency(monthProgress.pnl, false, sym), color: monthProgress.pnl >= 0 ? "#00d4aa" : "#ef4444" },
        ].map(s => (
          <div key={s.label} style={{ textAlign: "center", background: t.bgSubtle, borderRadius: 8, padding: "10px 8px" }}>
            <div style={{ fontSize: 9, color: t.textDim, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: s.color, fontFamily: "DM Mono, monospace" }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: t.textDim, display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span>Target Trades</span>
        <span>{Math.round(monthProgress.pct)}%</span>
      </div>
      <div style={{ height: 10, background: t.bgSubtle, borderRadius: 5, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${monthProgress.pct}%`, background: monthProgress.pct >= 100 ? "#00d4aa" : "linear-gradient(90deg, #00d4aa60, #00d4aa)", borderRadius: 5, transition: "width 0.8s ease" }} />
      </div>
      {monthProgress.pct >= 100 && (
        <div style={{ fontSize: 11, color: "#00d4aa", marginTop: 8, textAlign: "center" }}>🎯 Target bulan ini tercapai!</div>
      )}
    </div>
  );
}

// ── Main Gamification Page ───────────────────────────────────────
export default function Gamification({ gamificationHook, currencyMeta, theme }) {
  const t = theme;
  const { isMobile } = useBreakpoint();
  const { xp, level, journalStreak, tradingStreak, maxWinStreak, earnedBadges, monthProgress } = gamificationHook;

  return (
    <div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2, color: t.text, marginBottom: 4 }}>ACHIEVEMENTS</div>
      <div style={{ fontSize: 11, color: t.textDim, marginBottom: 24 }}>Streak, level, dan badge trading kamu</div>

      {/* Level + Streaks */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <LevelCard level={level} xp={xp} theme={t} />

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em" }}>Streak Aktif</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 10 }}>
            <StreakCard label="Journal Streak"  count={journalStreak}  icon="📝" color="#00d4aa" theme={t} />
            <StreakCard label="Trading Streak"  count={tradingStreak}  icon="📅" color="#3b82f6" theme={t} />
            <StreakCard label="Win Streak Max"  count={maxWinStreak}   icon="🔥" color="#f59e0b" theme={t} suffix="wins" />
          </div>
        </div>
      </div>

      {/* Monthly progress */}
      <div style={{ marginBottom: 20 }}>
        <MonthlyProgress monthProgress={monthProgress} currencyMeta={currencyMeta} theme={t} />
      </div>

      {/* XP breakdown */}
      <div className="stat-card" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Cara Dapat XP</div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 8 }}>
          {[
            { action: "Log Trade",      xp: 10,  icon: "📊" },
            { action: "Trade Win",      xp: 15,  icon: "✅" },
            { action: "Isi Jurnal",     xp: 20,  icon: "📝" },
            { action: "3-Day Streak",   xp: 50,  icon: "🔥" },
            { action: "7-Day Streak",   xp: 100, icon: "⚡" },
            { action: "14-Day Streak",  xp: 200, icon: "💎" },
            { action: "30-Day Streak",  xp: 500, icon: "👑" },
            { action: "Win 3 Streak",   xp: 75,  icon: "🎯" },
          ].map(r => (
            <div key={r.action} style={{ background: t.bgSubtle, borderRadius: 8, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>{r.icon}</span>
              <div>
                <div style={{ fontSize: 11, color: t.text }}>{r.action}</div>
                <div style={{ fontSize: 10, color: "#00d4aa", fontFamily: "DM Mono, monospace" }}>+{r.xp} XP</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="stat-card">
        <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
          Badges — {earnedBadges.filter(b => b.earned).length}/{earnedBadges.length} Unlocked
        </div>
        <BadgeGrid badges={earnedBadges} theme={t} />
      </div>
    </div>
  );
}