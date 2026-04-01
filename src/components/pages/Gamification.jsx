import { useState } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import StreakPage from "./StreakPage";
import { formatCurrency } from "../../utils/formatters";

// ── Streak card ───────────────────────────────────────────────────
function StreakCard({ label, count, icon, color, suffix = "hari" }) {
  return (
    <div style={{
      background: count > 0 ? "var(--bg-subtle)" : "var(--bg-subtle)",
      border: `1px solid ${count > 0 ? color : "var(--border)"}`,
      borderRadius: "var(--r-lg)", padding: "16px 12px", textAlign: "center",
      transition: "all var(--t-base)",
    }}>
      <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontFamily: "var(--font-disp)", fontSize: 36, color: count > 0 ? color : "var(--text-dim)", lineHeight: 1 }}>
        {count}
      </div>
      <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 3 }}>{suffix}</div>
      <div style={{ fontSize: "var(--fs-sm)", color: count > 0 ? color : "var(--text-dim)", marginTop: 4, fontWeight: 500 }}>
        {label}
      </div>
    </div>
  );
}

// ── Level card ────────────────────────────────────────────────────
function LevelCard({ level, xp }) {
  const { current, next, progress } = level;
  return (
    <div className="stat-card">
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--accent-dim)", border: "2px solid var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>
          {current.icon}
        </div>
        <div>
          <div className="kpi-label">Level {current.level}</div>
          <div style={{ fontFamily: "var(--font-disp)", fontSize: "var(--fs-2xl)", color: "var(--accent)", letterSpacing: 1 }}>
            {current.name}
          </div>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>{xp} XP total</div>
        </div>
      </div>

      {next ? (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginBottom: 6 }}>
            <span>Progress ke {next.name} {next.icon}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: 6, background: "var(--bg-subtle)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "var(--accent)", borderRadius: 3, transition: "width 0.8s ease" }}/>
          </div>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 5 }}>
            {next.xp - xp} XP lagi untuk naik level
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center", fontSize: "var(--fs-sm)", color: "var(--gold)" }}>👑 Max Level Tercapai!</div>
      )}
    </div>
  );
}

// ── Badge grid ────────────────────────────────────────────────────
function BadgeGrid({ badges }) {
  const earned = badges.filter(b => b.earned);
  const locked = badges.filter(b => !b.earned);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {earned.length > 0 && (
        <div>
          <div className="section-label" style={{ marginBottom: 10, color: "var(--success)" }}>
            ✅ Earned ({earned.length})
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 }}>
            {earned.map(b => (
              <div key={b.id} style={{ background: "var(--success-dim)", border: "1px solid var(--success)", borderRadius: "var(--r-lg)", padding: "12px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 22, marginBottom: 5 }}>{b.icon}</div>
                <div style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text)", marginBottom: 3 }}>{b.name}</div>
                <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {locked.length > 0 && (
        <div>
          <div className="section-label" style={{ marginBottom: 10 }}>🔒 Belum Unlock ({locked.length})</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 }}>
            {locked.map(b => (
              <div key={b.id} style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "12px 10px", textAlign: "center", opacity: 0.45 }}>
                <div style={{ fontSize: 22, marginBottom: 5, filter: "grayscale(1)" }}>{b.icon}</div>
                <div style={{ fontSize: "var(--fs-sm)", fontWeight: 500, color: "var(--text-dim)", marginBottom: 3 }}>{b.name}</div>
                <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Monthly progress ──────────────────────────────────────────────
function MonthlyProgress({ monthProgress, currencyMeta }) {
  const { isMobile } = useBreakpoint();
  const sym = currencyMeta?.symbol ?? "$";
  const pct = monthProgress.pct ?? 0;

  return (
    <div className="stat-card">
      <div className="section-label" style={{ marginBottom: 14 }}>Progress Bulan Ini</div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[
          { label: "Trades", val: `${monthProgress.trades}/${monthProgress.target}`, color: "var(--text)" },
          { label: "Wins",   val: monthProgress.wins, color: "var(--success)" },
          { label: "P&L",    val: `${(monthProgress.pnl ?? 0) >= 0 ? "+" : ""}${formatCurrency(monthProgress.pnl ?? 0, false, sym)}`, color: (monthProgress.pnl ?? 0) >= 0 ? "var(--success)" : "var(--danger)" },
        ].map(s => (
          <div key={s.label} style={{ textAlign: "center", background: "var(--bg-subtle)", borderRadius: "var(--r-md)", padding: "10px 8px" }}>
            <div className="kpi-label">{s.label}</div>
            <div style={{ fontSize: "var(--fs-lg)", fontWeight: 600, color: s.color, fontFamily: "var(--font-mono)", marginTop: 3 }}>{s.val}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginBottom: 5 }}>
        <span>Target Trades</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div style={{ height: 6, background: "var(--bg-subtle)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: pct >= 100 ? "var(--success)" : "var(--accent)", borderRadius: 3, transition: "width 0.8s ease" }}/>
      </div>
      {pct >= 100 && (
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--success)", marginTop: 8, textAlign: "center" }}>
          🎯 Target bulan ini tercapai!
        </div>
      )}
    </div>
  );
}

// ── Main Gamification ─────────────────────────────────────────────
export default function Gamification({ gamificationHook, streakHook, currencyMeta, theme }) {
  const { isMobile } = useBreakpoint();
  const [panel, setPanel] = useState("achievements");
  const { xp, level, journalStreak, tradingStreak, maxWinStreak, earnedBadges, monthProgress } = gamificationHook;

  const XP_REWARDS = [
    { action: "Log Trade",     xp: 10,  icon: "📊" },
    { action: "Trade Win",     xp: 15,  icon: "✅" },
    { action: "Isi Jurnal",    xp: 20,  icon: "📝" },
    { action: "3-Day Streak",  xp: 50,  icon: "🔥" },
    { action: "7-Day Streak",  xp: 100, icon: "⚡" },
    { action: "14-Day Streak", xp: 200, icon: "💎" },
    { action: "30-Day Streak", xp: 500, icon: "👑" },
    { action: "Win 3 Streak",  xp: 75,  icon: "🎯" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Achievements</h1>
          <p className="page-subtitle">Streak, level, dan badge trading kamu</p>
        </div>
        <div style={{ display: "flex", gap: 2, background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 2 }}>
          {[{ v: "achievements", l: "🏆 Badges" }, { v: "streak", l: "🔥 Streak" }].map(p => (
            <button key={p.v} onClick={() => setPanel(p.v)} style={{
              padding: "5px 14px", borderRadius: "var(--r-sm)", border: "none", cursor: "pointer",
              fontSize: "var(--fs-sm)",
              background: panel === p.v ? "var(--accent)"      : "transparent",
              color:      panel === p.v ? "var(--text-inverse)" : "var(--text-dim)",
              fontWeight: panel === p.v ? 600 : 400,
            }}>{p.l}</button>
          ))}
        </div>
      </div>

      {/* Streak panel */}
      {panel === "streak" && streakHook && <StreakPage streakHook={streakHook} theme={theme}/>}

      {/* Achievements panel */}
      {panel === "achievements" && (
        <>
          {/* Level + streaks */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
            <LevelCard level={level} xp={xp}/>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="section-label">Streak Aktif</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <StreakCard label="Journal"   count={journalStreak} icon="📝" color="var(--success)"/>
                <StreakCard label="Trading"   count={tradingStreak} icon="📅" color="var(--accent2)"/>
                <StreakCard label="Win Max"   count={maxWinStreak}  icon="🔥" color="var(--gold)" suffix="wins"/>
              </div>
            </div>
          </div>

          {/* Monthly progress */}
          <MonthlyProgress monthProgress={monthProgress} currencyMeta={currencyMeta}/>

          {/* XP table */}
          <div className="stat-card">
            <div className="section-label" style={{ marginBottom: 12 }}>Cara Dapat XP</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 8 }}>
              {XP_REWARDS.map(r => (
                <div key={r.action} style={{ background: "var(--bg-subtle)", borderRadius: "var(--r-md)", padding: "8px 10px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{r.icon}</span>
                  <div>
                    <div style={{ fontSize: "var(--fs-xs)", color: "var(--text)" }}>{r.action}</div>
                    <div style={{ fontSize: "var(--fs-xs)", color: "var(--accent)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>+{r.xp} XP</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Badges */}
          <div className="stat-card">
            <div className="section-label" style={{ marginBottom: 14 }}>
              Badges — {earnedBadges.filter(b => b.earned).length}/{earnedBadges.length} Unlocked
            </div>
            <BadgeGrid badges={earnedBadges}/>
          </div>
        </>
      )}
    </div>
  );
}