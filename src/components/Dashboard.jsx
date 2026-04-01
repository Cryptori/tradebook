import { useMemo, useState } from "react";
import { formatCurrency } from "../utils/formatters";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { calcAllAdvancedStats } from "../utils/advancedStats";
import TargetTracker from "./TargetTracker";
import StreakWidget from "./StreakWidget";
import DailyQuote from "./DailyQuote";
import { WIDGET_SIZES } from "../hooks/useDashboardLayout";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";

const chartTip = {
  contentStyle: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--r-md)",
    fontSize: 11,
    color: "var(--text)",
    boxShadow: "var(--shadow-md)",
  },
  cursor: { stroke: "var(--border)", strokeWidth: 1 },
};

// ── Widget shell ──────────────────────────────────────────────────
function Shell({ widget, editMode, dragging, dragOver, onDragStart, onDragOver, onDrop, onDragEnd, onSetSize, children }) {
  const isOver     = dragOver === widget.id;
  const isDragging = dragging === widget.id;
  const cols = editMode ? 1 : (WIDGET_SIZES[widget.size] ?? 2);

  return (
    <div
      draggable={editMode}
      onDragStart={() => onDragStart(widget.id)}
      onDragOver={e => { e.preventDefault(); onDragOver(widget.id); }}
      onDrop={() => onDrop(widget.id)}
      onDragEnd={onDragEnd}
      style={{
        gridColumn: `span ${cols}`,
        opacity: isDragging ? 0.35 : 1,
        transform: isOver && !isDragging ? "scale(1.01)" : "scale(1)",
        transition: "opacity 0.15s, transform 0.15s",
        position: "relative",
      }}
    >
      {editMode && (
        <>
          <div style={{
            position: "absolute", inset: 0, zIndex: 10,
            border: `1.5px dashed ${isOver ? "var(--accent)" : "var(--border)"}`,
            borderRadius: "var(--r-lg)", pointerEvents: "none",
            background: isOver ? "var(--accent-dim)" : "transparent",
            transition: "border-color 0.15s, background 0.15s",
          }} />
          <div style={{
            position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)",
            zIndex: 20, cursor: "grab",
            background: "var(--bg-card2)", border: "1px solid var(--border)",
            borderRadius: "var(--r-sm)", padding: "2px 10px",
            display: "flex", alignItems: "center", gap: 6,
            fontSize: "var(--fs-xs)", color: "var(--text-dim)",
            userSelect: "none",
          }}>
            <span style={{ letterSpacing: 2 }}>⠿</span> {widget.label}
          </div>
          <div style={{ position: "absolute", top: 8, right: 8, zIndex: 20, display: "flex", gap: 2 }}>
            {["small","medium","large"].map(s => (
              <button key={s} onClick={() => onSetSize(widget.id, s)} style={{
                padding: "2px 6px", borderRadius: "var(--r-sm)",
                border: `1px solid ${widget.size === s ? "var(--accent)" : "var(--border)"}`,
                background: widget.size === s ? "var(--accent-dim)" : "var(--bg-card2)",
                color: widget.size === s ? "var(--accent)" : "var(--text-dim)",
                fontSize: 9, cursor: "pointer",
              }}>
                {s[0].toUpperCase()}
              </button>
            ))}
          </div>
        </>
      )}
      {children}
    </div>
  );
}

// ── KPI Cards ─────────────────────────────────────────────────────
function KPICards({ stats, currencyMeta, settings }) {
  const sym     = currencyMeta?.symbol ?? "$";
  const capital = settings?.capitalInitial ?? 10000;
  const equity  = capital + (stats.totalPnl ?? 0);
  const ret     = capital > 0 ? ((stats.totalPnl ?? 0) / capital) * 100 : 0;
  const { isMobile } = useBreakpoint();

  const cards = [
    {
      label: "Total P&L",
      value: formatCurrency(stats.totalPnl ?? 0, false, sym),
      sub: `${ret >= 0 ? "+" : ""}${ret.toFixed(2)}% return`,
      color: (stats.totalPnl ?? 0) >= 0 ? "var(--success)" : "var(--danger)",
    },
    {
      label: "Win Rate",
      value: `${(stats.winRate ?? 0).toFixed(1)}%`,
      sub: `${stats.wins ?? 0}W · ${stats.losses ?? 0}L · ${stats.totalTrades ?? 0} trades`,
      color: (stats.winRate ?? 0) >= 50 ? "var(--success)" : "var(--warning)",
    },
    {
      label: "Profit Factor",
      value: (stats.profitFactor ?? 0) >= 999 ? "∞" : (stats.profitFactor ?? 0).toFixed(2),
      sub: `Avg R:R ${(stats.avgRR ?? 0).toFixed(2)}`,
      color: (stats.profitFactor ?? 0) >= 1.5 ? "var(--success)" : "var(--warning)",
    },
    {
      label: "Equity",
      value: formatCurrency(equity, false, sym),
      sub: `Capital ${formatCurrency(capital, false, sym)}`,
      color: "var(--accent2)",
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12 }}>
      {cards.map(c => (
        <div key={c.label} className="stat-card"
          onMouseEnter={e => e.currentTarget.style.borderColor = c.color}
          onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
          <div className="kpi-label">{c.label}</div>
          <div className="kpi-value" style={{ color: c.color }}>{c.value}</div>
          <div className="kpi-sub">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ── Equity Curve ──────────────────────────────────────────────────
function EquityCurve({ equityCurve, stats, currencyMeta, settings }) {
  const sym     = currencyMeta?.symbol ?? "$";
  const capital = settings?.capitalInitial ?? 10000;
  const pnl     = stats.totalPnl ?? 0;
  return (
    <div className="stat-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span className="section-label">Equity Curve</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-sm)", fontWeight: 500, color: pnl >= 0 ? "var(--success)" : "var(--danger)" }}>
          {pnl >= 0 ? "+" : ""}{formatCurrency(pnl, false, sym)}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={equityCurve} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="var(--accent)" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false}/>
          <XAxis dataKey="date" tick={{ fill: "var(--text-dim)", fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
          <YAxis tick={{ fill: "var(--text-dim)", fontSize: 9 }} tickLine={false} axisLine={false}
            tickFormatter={v => `${sym}${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} width={42}/>
          <Tooltip {...chartTip} formatter={v => [formatCurrency(v, false, sym), "Equity"]}/>
          <ReferenceLine y={capital} stroke="var(--border)" strokeDasharray="4 4"/>
          {(equityCurve?.length ?? 0) > 0 && (
            <Area type="monotone" dataKey="equity" stroke="var(--accent)" strokeWidth={1.5} fill="url(#eqGrad)" dot={false}/>
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Monthly P&L ───────────────────────────────────────────────────
function MonthlyPnL({ monthlyPnl, currencyMeta }) {
  const sym = currencyMeta?.symbol ?? "$";
  return (
    <div className="stat-card">
      <div className="section-label" style={{ marginBottom: 16 }}>Monthly P&L</div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={monthlyPnl} barSize={18} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false}/>
          <XAxis dataKey="month" tick={{ fill: "var(--text-dim)", fontSize: 9 }} tickLine={false} axisLine={false}/>
          <YAxis tick={{ fill: "var(--text-dim)", fontSize: 9 }} tickLine={false} axisLine={false} width={40}/>
          <ReferenceLine y={0} stroke="var(--border)"/>
          <Tooltip {...chartTip} formatter={v => [formatCurrency(v, false, sym), "P&L"]}/>
          <Bar dataKey="pnl" radius={[3,3,0,0]}>
            {(monthlyPnl || []).map((d, i) => (
              <Cell key={i} fill={d.pnl >= 0 ? "var(--success)" : "var(--danger)"} fillOpacity={0.8}/>
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Progress widget ───────────────────────────────────────────────
function ProgressWidget({ stats, settings, currencyMeta }) {
  const sym     = currencyMeta?.symbol ?? "$";
  const capital = settings?.capitalInitial ?? 10000;
  const target  = capital * ((settings?.targetProfitPct ?? 20) / 100);
  const maxDD   = capital * ((settings?.maxDrawdownPct  ?? 10) / 100);
  const profPct = target > 0 ? Math.min(100, ((stats.totalPnl ?? 0) / target) * 100) : 0;
  const ddPct   = maxDD  > 0 ? Math.min(100, (Math.abs(Math.min(stats.worstTrade ?? 0, 0)) / maxDD) * 100) : 0;
  const ddColor = ddPct >= 80 ? "var(--danger)" : ddPct >= 50 ? "var(--warning)" : "var(--success)";

  return (
    <div className="stat-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <span className="section-label">Progress</span>
      {[
        { label: "Profit Target", pct: profPct, cur: formatCurrency(stats.totalPnl ?? 0, false, sym), tot: formatCurrency(target, false, sym), color: "var(--success)" },
        { label: "Drawdown Safety", pct: ddPct, cur: formatCurrency(Math.abs(Math.min(stats.worstTrade ?? 0, 0)), false, sym), tot: formatCurrency(maxDD, false, sym), color: ddColor },
      ].map(s => (
        <div key={s.label}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-sm)", marginBottom: 5 }}>
            <span style={{ color: "var(--text-muted)" }}>{s.label}</span>
            <span style={{ color: s.color, fontFamily: "var(--font-mono)", fontWeight: 500 }}>{s.pct.toFixed(0)}%</span>
          </div>
          <div style={{ height: 4, background: "var(--bg-subtle)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${s.pct}%`, background: s.color, borderRadius: 2, transition: "width 0.6s ease" }}/>
          </div>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 3 }}>{s.cur} / {s.tot}</div>
        </div>
      ))}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          { label: "Best",  val: formatCurrency(stats.bestTrade  ?? 0, false, sym), color: "var(--success)" },
          { label: "Worst", val: formatCurrency(stats.worstTrade ?? 0, false, sym), color: "var(--danger)"  },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--bg-subtle)", borderRadius: "var(--r-md)", padding: "8px 10px" }}>
            <div style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)", marginBottom: 3 }}>{s.label} Trade</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-base)", color: s.color, fontWeight: 500 }}>{s.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Markets widget ────────────────────────────────────────────────
function MarketsWidget({ marketBreakdown, currencyMeta }) {
  const sym    = currencyMeta?.symbol ?? "$";
  const maxPnl = (marketBreakdown?.length ?? 0) > 0 ? Math.max(...marketBreakdown.map(x => Math.abs(x.pnl)), 1) : 1;
  return (
    <div className="stat-card">
      <div className="section-label" style={{ marginBottom: 16 }}>Markets</div>
      {(marketBreakdown?.length ?? 0) > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {marketBreakdown.slice(0, 6).map(m => (
            <div key={m.market} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 72, fontSize: "var(--fs-sm)", color: "var(--text-muted)", flexShrink: 0 }}>{m.market}</span>
              <div style={{ flex: 1, height: 3, background: "var(--bg-subtle)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(Math.abs(m.pnl) / maxPnl) * 100}%`, background: m.pnl >= 0 ? "var(--success)" : "var(--danger)", borderRadius: 2 }}/>
              </div>
              <span style={{ width: 64, fontSize: "var(--fs-sm)", color: m.pnl >= 0 ? "var(--success)" : "var(--danger)", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 500 }}>
                {formatCurrency(m.pnl, true, sym)}
              </span>
              <span style={{ width: 24, fontSize: "var(--fs-xs)", color: "var(--text-dim)", textAlign: "right" }}>{m.count}x</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-dim)", fontSize: "var(--fs-sm)" }}>No data</div>
      )}
    </div>
  );
}

// ── Trader profile ────────────────────────────────────────────────
function TraderProfile({ gamificationHook }) {
  if (!gamificationHook) return null;
  const lvl   = gamificationHook.level.current;
  const color = lvl.level >= 5 ? "var(--gold)" : "var(--accent)";
  const prog  = gamificationHook.level.progress ?? 0;
  return (
    <div className="stat-card">
      <div className="section-label" style={{ marginBottom: 16 }}>Trader Profile</div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: "var(--r-md)", background: "var(--bg-subtle)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
            {lvl.icon}
          </div>
          <div>
            <div style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Level {lvl.level}</div>
            <div style={{ fontSize: "var(--fs-base)", fontWeight: 600, color }}>{lvl.name}</div>
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>{gamificationHook.xp} XP</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {[
            { label: "Journal", val: gamificationHook.journalStreak },
            { label: "Win Max", val: gamificationHook.maxWinStreak },
            { label: "Badges",  val: gamificationHook.earnedBadges?.filter(b => b.earned).length ?? 0 },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-xl)", color: "var(--accent)", fontWeight: 600, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)", marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
        {gamificationHook.level.next && (
          <div style={{ flex: 1, minWidth: 100 }}>
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginBottom: 4 }}>Next: {gamificationHook.level.next.name}</div>
            <div style={{ height: 4, background: "var(--bg-subtle)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${prog}%`, background: color, borderRadius: 2 }}/>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Recent Trades ─────────────────────────────────────────────────
function RecentTrades({ trades, currencyMeta }) {
  const sym = currencyMeta?.symbol ?? "$";
  const { isMobile } = useBreakpoint();
  if (!(trades?.length ?? 0)) return (
    <div className="stat-card">
      <div className="section-label" style={{ marginBottom: 16 }}>Recent Trades</div>
      <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-dim)", fontSize: "var(--fs-sm)" }}>No trades yet</div>
    </div>
  );
  return (
    <div className="stat-card" style={{ padding: 0 }}>
      <div style={{ padding: "16px 16px 12px" }}>
        <span className="section-label">Recent Trades</span>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Pair</th>
            <th>Side</th>
            {!isMobile && <th>Strategy</th>}
            {!isMobile && <th className="text-right">R:R</th>}
            <th className="text-right">P&L</th>
          </tr>
        </thead>
        <tbody>
          {[...trades].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 7).map(tr => (
            <tr key={tr.id}>
              <td style={{ color: "var(--text-dim)", fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)" }}>{tr.date?.slice(5)}</td>
              <td style={{ fontWeight: 500, color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: "var(--fs-sm)" }}>{tr.pair}</td>
              <td>
                <span className={`badge ${tr.side === "BUY" ? "badge-green" : "badge-yellow"}`}>{tr.side}</span>
              </td>
              {!isMobile && <td style={{ color: "var(--text-dim)" }}>{tr.strategy || "—"}</td>}
              {!isMobile && <td className="text-right mono" style={{ color: "var(--text-muted)" }}>{(tr.rr ?? 0).toFixed(1)}R</td>}
              <td className="text-right">
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-sm)", fontWeight: 600, color: (tr.pnl ?? 0) >= 0 ? "var(--success)" : "var(--danger)" }}>
                  {(tr.pnl ?? 0) >= 0 ? "+" : ""}{formatCurrency(tr.pnl ?? 0, true, sym)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Advanced Stats widget ─────────────────────────────────────────
function AdvancedStatsWidget({ trades, settings, currencyMeta }) {
  const sym     = currencyMeta?.symbol ?? "$";
  const capital = settings?.capitalInitial ?? 10000;
  const adv     = useMemo(() => calcAllAdvancedStats(trades, capital), [trades, capital]);
  const metrics = [
    { label: "Sharpe",     val: adv.sharpe    ?? "—", color: parseFloat(adv.sharpe)    >= 1 ? "var(--success)" : "var(--warning)" },
    { label: "Sortino",    val: adv.sortino   ?? "—", color: parseFloat(adv.sortino)   >= 1 ? "var(--success)" : "var(--warning)" },
    { label: "Expectancy", val: adv.expectancy ? `${sym}${adv.expectancy}` : "—", color: parseFloat(adv.expectancy) >= 0 ? "var(--success)" : "var(--danger)" },
    { label: "Kelly %",    val: adv.kelly ? `${adv.kelly}%` : "—", color: "var(--accent2)" },
    { label: "Calmar",     val: adv.calmar    ?? "—", color: "var(--warning)" },
    { label: "Recovery",   val: adv.recovery  ?? "—", color: "var(--warning)" },
    { label: "Payoff",     val: adv.payoff    ?? "—", color: "var(--warning)" },
    { label: "MFE/MAE",    val: adv.maemfe?.mfeMAERatio ?? "—", color: parseFloat(adv.maemfe?.mfeMAERatio) >= 1 ? "var(--success)" : "var(--warning)" },
  ];
  return (
    <div className="stat-card">
      <div className="section-label" style={{ marginBottom: 16 }}>Advanced Statistics</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {metrics.map(m => (
          <div key={m.label} style={{ background: "var(--bg-subtle)", borderRadius: "var(--r-md)", padding: "10px 12px" }}>
            <div style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.1em" }}>{m.label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-xl)", color: m.val === "—" ? "var(--text-dim)" : m.color, fontWeight: 600 }}>{m.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Edit sidebar ──────────────────────────────────────────────────
function EditSidebar({ widgets, onToggle, onReset, onClose }) {
  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0, width: 240,
      background: "var(--bg-card)", borderLeft: "1px solid var(--border)",
      zIndex: 50, overflowY: "auto", padding: 20,
      boxShadow: "var(--shadow-lg)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontFamily: "var(--font-disp)", fontSize: 16, letterSpacing: 2, color: "var(--text)" }}>WIDGETS</span>
        <button onClick={onClose} className="btn-icon">✕</button>
      </div>
      <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginBottom: 16, lineHeight: 1.6 }}>
        Drag to reorder. Toggle to show/hide.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {widgets.map(w => (
          <div key={w.id} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "8px 10px", borderRadius: "var(--r-md)",
            background: "var(--bg-subtle)",
            border: `1px solid ${w.visible ? "rgba(0,200,150,0.15)" : "var(--border-subtle)"}`,
          }}>
            <span style={{ fontSize: "var(--fs-sm)", color: w.visible ? "var(--text)" : "var(--text-dim)" }}>{w.label}</span>
            <div
              className={`toggle ${w.visible ? "on" : ""}`}
              onClick={() => onToggle(w.id)}
              role="button"
            />
          </div>
        ))}
      </div>
      <button onClick={onReset} className="btn-ghost" style={{ width: "100%", marginTop: 16, justifyContent: "center" }}>
        Reset Layout
      </button>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────
export default function Dashboard({
  stats, equityCurve, monthlyPnl, marketBreakdown,
  settings, currencyMeta, onExportPdf, pdfMonth, onPdfMonthChange,
  trades, gamificationHook, streakHook, layoutHook,
}) {
  const { isMobile } = useBreakpoint();
  const {
    widgets, visibleWidgets, editMode, setEditMode,
    dragging, dragOver, toggleVisible, setSize, reset,
    onDragStart, onDragOver, onDrop, onDragEnd,
  } = layoutHook;

  const COLS = isMobile ? 2 : 4;

  function renderWidget(w) {
    switch (w.id) {
      case "kpi":       return <KPICards stats={stats} currencyMeta={currencyMeta} settings={settings}/>;
      case "equity":    return <EquityCurve equityCurve={equityCurve} stats={stats} currencyMeta={currencyMeta} settings={settings}/>;
      case "monthly":   return <MonthlyPnL monthlyPnl={monthlyPnl} currencyMeta={currencyMeta}/>;
      case "progress":  return <ProgressWidget stats={stats} settings={settings} currencyMeta={currencyMeta}/>;
      case "markets":   return <MarketsWidget marketBreakdown={marketBreakdown} currencyMeta={currencyMeta}/>;
      case "streak":    return streakHook ? <div className="stat-card"><StreakWidget streakData={streakHook.streakData} theme={{ accent: "var(--accent)", text: "var(--text)", textDim: "var(--text-dim)", bgSubtle: "var(--bg-subtle)" }}/></div> : null;
      case "gamif":     return <TraderProfile gamificationHook={gamificationHook}/>;
      case "recent":    return <RecentTrades trades={trades} currencyMeta={currencyMeta}/>;
      case "adv_stats": return <AdvancedStatsWidget trades={trades} settings={settings} currencyMeta={currencyMeta}/>;
      case "quote":     return <DailyQuote theme={{ accent: "var(--accent)", text: "var(--text)", textDim: "var(--text-dim)", bgCard: "var(--bg-card)", bgCard2: "var(--bg-card2)", border: "var(--border)" }}/>;
      default:          return null;
    }
  }

  return (
    <div style={{ paddingRight: editMode ? 250 : 0, transition: "padding-right 0.25s" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Performance overview</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {onExportPdf && (
            <>
              <input type="month" value={pdfMonth ?? ""} onChange={e => onPdfMonthChange?.(e.target.value)}
                style={{ width: "auto", height: 30, padding: "0 8px", fontSize: "var(--fs-sm)" }}/>
              <button onClick={() => onExportPdf(pdfMonth)} className="btn-ghost" style={{ height: 30, fontSize: "var(--fs-sm)" }}>Export PDF</button>
            </>
          )}
          <button
            onClick={() => setEditMode(e => !e)}
            className={editMode ? "btn-secondary" : "btn-ghost"}
            style={{ height: 30, fontSize: "var(--fs-sm)", ...(editMode ? { borderColor: "var(--accent)", color: "var(--accent)" } : {}) }}>
            {editMode ? "Done" : "Edit Layout"}
          </button>
        </div>
      </div>

      {/* Widget grid */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 12 }}>
        {visibleWidgets.map(w => {
          const content = renderWidget(w);
          if (!content) return null;
          return (
            <Shell key={w.id} widget={w} editMode={editMode}
              dragging={dragging} dragOver={dragOver}
              onDragStart={onDragStart} onDragOver={onDragOver}
              onDrop={onDrop} onDragEnd={onDragEnd}
              onSetSize={setSize}>
              {content}
            </Shell>
          );
        })}
      </div>

      {/* Target tracker */}
      <div style={{ marginTop: 12 }}>
        <TargetTracker stats={stats} settings={settings} currencyMeta={currencyMeta}
          theme={{ accent: "var(--accent)", text: "var(--text)", textDim: "var(--text-dim)", bgSubtle: "var(--bg-subtle)", border: "var(--border)" }}/>
      </div>

      {/* Edit sidebar */}
      {editMode && <EditSidebar widgets={widgets} onToggle={toggleVisible} onReset={reset} onClose={() => setEditMode(false)}/>}
    </div>
  );
}