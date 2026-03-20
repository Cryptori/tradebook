import { useState } from "react";
import { useBreakpoint } from "../hooks/useBreakpoint";

// ── Goal progress card ────────────────────────────────────────────
function GoalCard({ goal, period, onSetTarget, onToggle, theme: t }) {
  const [editing, setEditing] = useState(false);
  const [input,   setInput]   = useState(goal.target.toString());

  const pct       = goal.inverted
    ? Math.max(0, 100 - goal.pct)
    : goal.pct;
  const barColor  = goal.achieved ? "#00c896" : goal.color;
  const isAtRisk  = !goal.achieved && goal.pct >= 80 && goal.inverted;
  const isAlmost  = !goal.achieved && goal.pct >= 80 && !goal.inverted;

  return (
    <div style={{ background: goal.achieved ? "rgba(0,200,150,0.06)" : t.bgSubtle, border: `1px solid ${goal.achieved ? "rgba(0,200,150,0.25)" : isAtRisk ? "rgba(239,68,68,0.25)" : t.borderSubtle}`, borderRadius: 12, padding: "14px 16px", transition: "all 0.2s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>
            {goal.achieved ? "✅" : isAtRisk ? "⚠️" : isAlmost ? "🔥" : "🎯"}
          </span>
          <span style={{ fontSize: 12, fontWeight: 500, color: t.text }}>{goal.label}</span>
        </div>
        <button onClick={() => onToggle(period, goal.id)}
          style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 11 }}>
          {goal.enabled ? "👁" : "🙈"}
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ height: 6, background: t.bgCard, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(100, goal.inverted ? 100 - goal.pct : goal.pct)}%`, background: `linear-gradient(90deg, ${barColor}80, ${barColor})`, borderRadius: 3, transition: "width 0.8s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 11 }}>
          <span style={{ color: barColor, fontFamily: "DM Mono, monospace", fontWeight: 600 }}>
            {goal.format(goal.current)}
          </span>
          <span style={{ color: t.textDim }}>
            target: {editing ? (
              <input
                autoFocus
                value={input}
                onChange={e => setInput(e.target.value)}
                onBlur={() => { onSetTarget(period, goal.id, input); setEditing(false); }}
                onKeyDown={e => { if (e.key === "Enter") { onSetTarget(period, goal.id, input); setEditing(false); } if (e.key === "Escape") setEditing(false); }}
                style={{ background: "transparent", border: "none", borderBottom: `1px solid ${t.accent}`, color: t.accent, fontFamily: "DM Mono, monospace", fontSize: 11, width: 60, outline: "none", padding: 0 }}
              />
            ) : (
              <span onClick={() => { setInput(goal.target.toString()); setEditing(true); }}
                style={{ color: t.textDim, cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted" }}>
                {goal.format(goal.target)}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Status message */}
      {goal.achieved && <div style={{ fontSize: 10, color: "#00c896" }}>✓ Goal tercapai!</div>}
      {isAlmost && <div style={{ fontSize: 10, color: "#f59e0b" }}>🔥 Hampir tercapai — {(100 - goal.pct).toFixed(0)}% lagi!</div>}
      {isAtRisk && <div style={{ fontSize: 10, color: "#ef4444" }}>⚠️ Drawdown mendekati batas!</div>}
    </div>
  );
}

// ── Achievement history ───────────────────────────────────────────
function AchievementHistory({ history, theme: t }) {
  if (!history || history.length === 0) return (
    <div style={{ fontSize: 12, color: t.textDim, textAlign: "center", padding: "16px 0" }}>
      Belum ada goal yang tercapai. Terus trading!
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
      {[...history].reverse().map((h, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "rgba(0,200,150,0.06)", border: "1px solid rgba(0,200,150,0.15)", borderRadius: 8 }}>
          <span style={{ fontSize: 16 }}>🏆</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: t.text, fontWeight: 500 }}>{h.label}</div>
            <div style={{ fontSize: 10, color: t.textDim }}>{h.period === "monthly" ? "Bulanan" : "Tahunan"} · {new Date(h.achievedAt).toLocaleDateString("id-ID")}</div>
          </div>
          <div style={{ fontSize: 11, color: "#00c896", fontFamily: "DM Mono, monospace" }}>✓</div>
        </div>
      ))}
    </div>
  );
}

// ── Main GoalTrackerPanel ─────────────────────────────────────────
export default function GoalTrackerPanel({ goalHook, theme: t }) {
  const { isMobile } = useBreakpoint();
  const [activePeriod, setActivePeriod] = useState("monthly");
  const [showHistory,  setShowHistory]  = useState(false);

  const { monthGoals, yearGoals, monthStats, yearStats, thisMonth, thisYear, setGoalTarget, toggleGoal, goals } = goalHook;
  const activeGoals = activePeriod === "monthly" ? monthGoals : yearGoals;
  const activeStats = activePeriod === "monthly" ? monthStats : yearStats;

  const achievedCount = activeGoals.filter(g => g.achieved).length;
  const totalEnabled  = activeGoals.length;

  return (
    <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${t.borderSubtle}` }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${t.border})` }} />
        <div style={{ fontSize: 9, color: t.accent, textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 600 }}>Goal Tracker</div>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(270deg, transparent, ${t.border})` }} />
      </div>

      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 4, background: t.bgSubtle, border: `1px solid ${t.border}`, borderRadius: 8, padding: 3 }}>
          {[{ v: "monthly", l: `📅 ${thisMonth}` }, { v: "yearly", l: `📊 ${thisYear}` }].map(p => (
            <button key={p.v} onClick={() => setActivePeriod(p.v)}
              style={{ padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, background: activePeriod === p.v ? t.accent : "transparent", color: activePeriod === p.v ? "#090e1a" : t.textDim, fontWeight: activePeriod === p.v ? 600 : 400 }}>
              {p.l}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 12, color: achievedCount === totalEnabled ? "#00c896" : t.textDim }}>
            {achievedCount}/{totalEnabled} goals tercapai
          </div>
          <button onClick={() => setShowHistory(h => !h)} className="btn-ghost" style={{ fontSize: 11, padding: "5px 10px" }}>
            🏆 History
          </button>
        </div>
      </div>

      {/* Goals grid */}
      {!showHistory ? (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
          {activeGoals.map(goal => (
            <GoalCard key={goal.id} goal={goal} period={activePeriod} onSetTarget={setGoalTarget} onToggle={toggleGoal} theme={t} />
          ))}
          {activeGoals.length === 0 && (
            <div style={{ gridColumn: "span 2", textAlign: "center", padding: "24px 0", color: t.textDim, fontSize: 12 }}>
              Belum ada trade bulan/tahun ini
            </div>
          )}
        </div>
      ) : (
        <AchievementHistory history={goals.history} theme={t} />
      )}

      {/* Summary */}
      {!showHistory && activeStats.trades > 0 && (
        <div style={{ marginTop: 14, padding: "12px 16px", background: t.bgSubtle, borderRadius: 10, display: "flex", gap: 20, flexWrap: "wrap" }}>
          {[
            { label: "P&L", value: `${activeStats.pnl >= 0 ? "+" : ""}$${activeStats.pnl.toFixed(0)}` },
            { label: "Win Rate", value: `${activeStats.winRate.toFixed(1)}%` },
            { label: "Trades", value: `${activeStats.trades}x` },
            { label: "Max DD", value: `${activeStats.maxDrawdown.toFixed(1)}%` },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</div>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: 14, color: t.text, fontWeight: 600 }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}