import { useMemo } from "react";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { formatCurrency, formatPct } from "../utils/formatters";

// ── Ring progress (SVG) ──────────────────────────────────────────
function Ring({ pct, color, size = 64, stroke = 6, children }) {
  const r   = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(pct / 100, 1) * circ;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
    </div>
  );
}

// ── Single target row ────────────────────────────────────────────
function TargetRow({ label, current, target, pct, color, currentLabel, targetLabel, theme: t }) {
  const clampedPct = Math.max(0, Math.min(pct, 100));
  const done       = pct >= 100;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <Ring pct={clampedPct} color={done ? "#00d4aa" : color} size={56} stroke={5}>
        <span style={{ fontSize: 10, fontWeight: 600, color: done ? "#00d4aa" : color }}>
          {done ? "✓" : `${Math.round(clampedPct)}%`}
        </span>
      </Ring>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: "var(--text)" }}>{label}</span>
          {done && <span style={{ fontSize: 10, color: "var(--accent)" }}>Tercapai! 🎯</span>}
        </div>
        <div style={{ background: "var(--border-subtle)", borderRadius: 4, height: 5, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 4,
            width: "${clampedPct}%",
            background: done ? "#00d4aa" : color,
            transition: "width 0.6s ease",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontSize: 10, color: "var(--text-dim)" }}>{currentLabel}</span>
          <span style={{ fontSize: 10, color: "var(--text-dim)" }}>Target: {targetLabel}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────
export default function TargetTracker({ stats, settings, currencyMeta, theme }) {
  const t   = theme;
  const sym = currencyMeta?.symbol ?? "$";
  const { isMobile } = useBreakpoint();

  const capital     = settings?.capitalInitial     ?? 10000;
  const targetPPct  = settings?.targetProfitPct    ?? 20;
  const maxDdPct    = settings?.maxDrawdownPct      ?? 10;
  const targetTrades= settings?.targetTradesPerMonth ?? 20;

  const targetProfit   = capital * (targetPPct / 100);
  const maxDrawdown    = capital * (maxDdPct   / 100);
  const currentLoss    = Math.abs(Math.min(stats.totalPnl, 0));

  const profitPct   = targetProfit  > 0 ? (stats.totalPnl  / targetProfit)  * 100 : 0;
  const ddPct       = maxDrawdown   > 0 ? (currentLoss      / maxDrawdown)   * 100 : 0;
  const tradesPct   = targetTrades  > 0 ? (stats.monthTrades / targetTrades) * 100 : 0;
  const winRatePct  = stats.winRate; // target 50%

  // Streak display
  const streakColor = stats.streakType === "win" ? "#00d4aa" : "#ef4444";
  const streakLabel = stats.streakType === "win" ? "Win" : "Loss";
  const streakEmoji = stats.streakType === "win"
    ? stats.currentStreak >= 5 ? "🔥" : "✅"
    : stats.currentStreak >= 3 ? "⚠️" : "❌";

  // This month label
  const monthLabel = new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  return (
    <div className="stat-card" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Target Tracker</div>
          <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 2 }}>{monthLabel}</div>
        </div>
        {/* Current streak badge */}
        <div style={{
          background: `${streakColor}15`,
          border: `1px solid ${streakColor}40`,
          borderRadius: 8, padding: "6px 12px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 18, lineHeight: 1 }}>{streakEmoji}</div>
          <div style={{ fontSize: 11, color: streakColor, fontWeight: 500, marginTop: 2 }}>
            {stats.currentStreak} {streakLabel}
          </div>
          <div style={{ fontSize: 9, color: "var(--text-dim)" }}>streak</div>
        </div>
      </div>

      {/* Targets */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <TargetRow
          label="Profit Target"
          pct={profitPct}
          color={profitPct >= 80 ? "#00d4aa" : "#3b82f6"}
          currentLabel={`${formatCurrency(Math.max(stats.totalPnl, 0), false, sym)} earned`}
          targetLabel={`${formatCurrency(targetProfit, false, sym)} (${targetPPct}%)`}
          theme={t}
        />
        <TargetRow
          label="Drawdown Safety"
          pct={ddPct}
          color={ddPct >= 80 ? "#ef4444" : ddPct >= 50 ? "#f59e0b" : "#00d4aa"}
          currentLabel={`${formatCurrency(currentLoss, false, sym)} used`}
          targetLabel={`Max ${formatCurrency(maxDrawdown, false, sym)}`}
          theme={t}
        />
        <TargetRow
          label={`Trades Bulan Ini`}
          pct={tradesPct}
          color="#8b5cf6"
          currentLabel={`${stats.monthTrades} trades`}
          targetLabel={`${targetTrades} trades`}
          theme={t}
        />
        <TargetRow
          label="Win Rate"
          pct={winRatePct * 2} // 50% win rate = 100% of target
          color={stats.winRate >= 50 ? "#00d4aa" : "#f59e0b"}
          currentLabel={`${stats.winRate.toFixed(1)}% current`}
          targetLabel="50% minimum"
          theme={t}
        />
      </div>

      {/* Month P&L summary */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 8 }}>
        {[
          { label: "Bulan Ini P&L",  value: formatCurrency(stats.monthPnl, false, sym),  color: stats.monthPnl >= 0 ? "#00d4aa" : "#ef4444" },
          { label: "Month Trades",   value: stats.monthTrades,                             color: "var(--text)" },
          { label: "Month Win Rate", value: stats.monthTrades ? `${((stats.monthWins / stats.monthTrades) * 100).toFixed(0)}%` : "—", color: "var(--text)" },
        ].map(s => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 9, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}