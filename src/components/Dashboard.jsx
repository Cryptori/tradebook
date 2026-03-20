import { useMemo } from "react";
import { formatCurrency, formatPct } from "../utils/formatters";
import { useBreakpoint } from "../hooks/useBreakpoint";
import TargetTracker from "./TargetTracker";
import StreakWidget from "./StreakWidget";
import DailyQuote from "./DailyQuote";
import { WIDGET_SIZES } from "../hooks/useDashboardLayout";
import { calcAllAdvancedStats } from "../utils/advancedStats";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";

const chartTooltip = (t) => ({
  contentStyle: {
    background: t.bgCard, border: `1px solid ${t.border}`,
    borderRadius: 10, fontSize: 11, color: t.text,
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
  },
  cursor: { stroke: t.border, strokeWidth: 1 },
});

// ── Widget wrapper ────────────────────────────────────────────────
function WidgetShell({ widget, editMode, dragging, dragOver, onDragStart, onDragOver, onDrop, onDragEnd, onSetSize, theme: t, children }) {
  const isDragging = dragging === widget.id;
  const isOver     = dragOver  === widget.id;

  const colSpan = editMode ? 1 : (WIDGET_SIZES[widget.size] ?? 2);

  return (
    <div
      draggable={editMode}
      onDragStart={() => onDragStart(widget.id)}
      onDragOver={e => { e.preventDefault(); onDragOver(widget.id); }}
      onDrop={() => onDrop(widget.id)}
      onDragEnd={onDragEnd}
      style={{
        gridColumn: `span ${colSpan}`,
        opacity: isDragging ? 0.4 : 1,
        transition: "opacity 0.15s, transform 0.15s",
        transform: isOver && !isDragging ? "scale(1.01)" : "scale(1)",
        position: "relative",
      }}>
      {/* Edit mode overlay */}
      {editMode && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 10,
          border: `2px dashed ${isOver ? t.accent : t.border}`,
          borderRadius: 12, pointerEvents: "none",
          background: isOver ? "rgba(0,200,150,0.04)" : "transparent",
          transition: "border-color 0.15s",
        }} />
      )}

      {/* Drag handle */}
      {editMode && (
        <div style={{
          position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)",
          zIndex: 20, cursor: "grab", color: t.textDim, fontSize: 14,
          background: t.bgCard, border: `1px solid ${t.border}`,
          borderRadius: 6, padding: "2px 8px", display: "flex", alignItems: "center", gap: 4,
          userSelect: "none",
        }}>
          ⋮⋮ {widget.label}
        </div>
      )}

      {/* Size controls */}
      {editMode && (
        <div style={{
          position: "absolute", top: 8, right: 8, zIndex: 20,
          display: "flex", gap: 3,
        }}>
          {["small", "medium", "large"].map(s => (
            <button key={s} onClick={() => onSetSize(widget.id, s)}
              style={{
                padding: "2px 6px", borderRadius: 4, border: `1px solid ${widget.size === s ? t.accent : t.border}`,
                background: widget.size === s ? "rgba(0,200,150,0.1)" : t.bgSubtle,
                color: widget.size === s ? "#00c896" : t.textDim,
                fontSize: 9, cursor: "pointer",
              }}>
              {s === "small" ? "S" : s === "medium" ? "M" : "L"}
            </button>
          ))}
        </div>
      )}

      {children}
    </div>
  );
}

// ── Individual widgets ────────────────────────────────────────────
function KPICards({ stats, currencyMeta, settings, theme: t }) {
  const sym    = currencyMeta?.symbol ?? "$";
  const capital    = settings?.capitalInitial ?? 10000;
  const equity     = capital + stats.totalPnl;
  const totalReturn = capital > 0 ? (stats.totalPnl / capital) * 100 : 0;
  const { isMobile } = useBreakpoint();

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12 }}>
      {[
        { label: "Total P&L",      value: formatCurrency(stats.totalPnl, false, sym), sub: `${totalReturn >= 0 ? "+" : ""}${totalReturn.toFixed(2)}% return`, color: stats.totalPnl >= 0 ? "#00c896" : "#ef4444" },
        { label: "Win Rate",       value: `${stats.winRate.toFixed(1)}%`,              sub: `${stats.wins}W · ${stats.losses}L · ${stats.totalTrades} total`, color: stats.winRate >= 50 ? "#00c896" : "#f59e0b" },
        { label: "Profit Factor",  value: stats.profitFactor >= 999 ? "∞" : stats.profitFactor.toFixed(2), sub: `Avg R:R ${(stats.avgRR ?? 0).toFixed(2)}`, color: stats.profitFactor >= 1.5 ? "#00c896" : "#f59e0b" },
        { label: "Current Equity", value: formatCurrency(equity, false, sym),          sub: `Capital: ${formatCurrency(capital, false, sym)}`, color: "#0ea5e9" },
      ].map(s => (
        <div key={s.label} className="stat-card"
          onMouseEnter={e => { e.currentTarget.style.borderColor = s.color + "60"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.transform = "translateY(0)"; }}
          style={{ transition: "all 0.2s", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: 60, height: 60, background: `radial-gradient(circle at top right, ${s.color}08, transparent)`, pointerEvents: "none" }} />
          <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8, fontWeight: 600 }}>{s.label}</div>
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: 22, fontWeight: 600, color: s.color, lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
          <div style={{ fontSize: 11, color: t.textDim }}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

function EquityCurveWidget({ equityCurve, stats, currencyMeta, settings, theme: t }) {
  const sym     = currencyMeta?.symbol ?? "$";
  const capital = settings?.capitalInitial ?? 10000;
  return (
    <div className="stat-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600 }}>Equity Curve</div>
        <div style={{ fontSize: 12, color: stats.totalPnl >= 0 ? "#00c896" : "#ef4444", fontFamily: "DM Mono, monospace" }}>
          {stats.totalPnl >= 0 ? "+" : ""}{formatCurrency(stats.totalPnl, false, sym)}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={150}>
        <AreaChart data={equityCurve} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="eqGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#00c896" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#00c896" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} vertical={false} />
          <XAxis dataKey="date" tick={{ fill: t.textDim, fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fill: t.textDim, fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `${sym}${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`} width={40} />
          <Tooltip {...chartTooltip(t)} formatter={v => [formatCurrency(v, false, sym), "Equity"]} />
          <ReferenceLine y={capital} stroke={t.border} strokeDasharray="4 4" />
          {equityCurve?.length > 0 && <Area type="monotone" dataKey="equity" stroke="#00c896" strokeWidth={1.5} fill="url(#eqGrad2)" dot={false} />}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function MonthlyPnLWidget({ monthlyPnl, currencyMeta, theme: t }) {
  const sym = currencyMeta?.symbol ?? "$";
  const { isMobile } = useBreakpoint();
  return (
    <div className="stat-card">
      <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 14 }}>Monthly P&L</div>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={monthlyPnl} barSize={isMobile ? 10 : 18} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} vertical={false} />
          <XAxis dataKey="month" tick={{ fill: t.textDim, fontSize: 9 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: t.textDim, fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `${v >= 0 ? "+" : ""}${v}`} width={40} />
          <ReferenceLine y={0} stroke={t.border} />
          <Tooltip {...chartTooltip(t)} formatter={v => [formatCurrency(v, false, sym), "P&L"]} />
          <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
            {(monthlyPnl || []).map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? "#00c896" : "#ef4444"} fillOpacity={0.8} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ProgressWidget({ stats, settings, currencyMeta, theme: t }) {
  const sym      = currencyMeta?.symbol ?? "$";
  const capital  = settings?.capitalInitial ?? 10000;
  const target   = capital * ((settings?.targetProfitPct ?? 20) / 100);
  const maxDD    = capital * ((settings?.maxDrawdownPct  ?? 10) / 100);
  const profPct  = target > 0 ? Math.min(100, (stats.totalPnl / target) * 100) : 0;
  const ddPct    = maxDD  > 0 ? Math.min(100, (Math.abs(Math.min(stats.worstTrade ?? 0, 0)) / maxDD) * 100) : 0;
  const ddColor  = ddPct >= 80 ? "#ef4444" : ddPct >= 50 ? "#f59e0b" : "#00c896";
  return (
    <div className="stat-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600 }}>Progress vs Target</div>
      {[
        { label: "Profit Target", pct: profPct, current: formatCurrency(stats.totalPnl, false, sym), total: formatCurrency(target, false, sym), color: "#00c896" },
        { label: "Drawdown Safety", pct: ddPct, current: formatCurrency(Math.abs(Math.min(stats.worstTrade ?? 0, 0)), false, sym), total: formatCurrency(maxDD, false, sym), color: ddColor },
      ].map(s => (
        <div key={s.label}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: t.textMuted, marginBottom: 5 }}>
            <span>{s.label}</span><span style={{ color: s.color, fontFamily: "DM Mono, monospace" }}>{s.pct.toFixed(0)}%</span>
          </div>
          <div style={{ height: 4, background: t.bgSubtle, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${s.pct}%`, background: `linear-gradient(90deg, ${s.color}80, ${s.color})`, borderRadius: 2, transition: "width 0.8s ease" }} />
          </div>
          <div style={{ fontSize: 10, color: t.textDim, marginTop: 3 }}>{s.current} / {s.total}</div>
        </div>
      ))}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          { label: "Best Trade",  value: formatCurrency(stats.bestTrade  ?? 0, false, sym), color: "#00c896" },
          { label: "Worst Trade", value: formatCurrency(stats.worstTrade ?? 0, false, sym), color: "#ef4444" },
        ].map(s => (
          <div key={s.label} style={{ background: t.bgSubtle, borderRadius: 8, padding: "9px 12px" }}>
            <div style={{ fontSize: 9, color: t.textDim, marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: 13, color: s.color, fontFamily: "DM Mono, monospace", fontWeight: 500 }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MarketsWidget({ marketBreakdown, currencyMeta, theme: t }) {
  const sym = currencyMeta?.symbol ?? "$";
  return (
    <div className="stat-card">
      <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 14 }}>Market Breakdown</div>
      {marketBreakdown?.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {marketBreakdown.slice(0, 5).map(m => {
            const maxPnl = marketBreakdown.length > 0 ? Math.max(...marketBreakdown.map(x => Math.abs(x.pnl)), 1) : 1;
            return (
              <div key={m.market} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 70, fontSize: 11, color: t.textMuted, flexShrink: 0 }}>{m.market}</div>
                <div style={{ flex: 1, height: 4, background: t.bgSubtle, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(Math.abs(m.pnl) / maxPnl) * 100}%`, background: m.pnl >= 0 ? "#00c896" : "#ef4444", borderRadius: 2 }} />
                </div>
                <div style={{ width: 70, fontSize: 11, color: m.pnl >= 0 ? "#00c896" : "#ef4444", textAlign: "right", fontFamily: "DM Mono, monospace" }}>{formatCurrency(m.pnl, true, sym)}</div>
                <div style={{ width: 30, fontSize: 10, color: t.textDim, textAlign: "right" }}>{m.count}x</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ color: t.textDim, fontSize: 12, textAlign: "center", padding: "20px 0" }}>Belum ada data</div>
      )}
    </div>
  );
}

function GamifWidget({ gamificationHook, theme: t }) {
  if (!gamificationHook) return null;
  const flameColor = gamificationHook.level.current.level >= 5 ? "#c9a84c" : "#00c896";
  return (
    <div className="stat-card" style={{ background: `linear-gradient(135deg, ${t.bgCard}, ${t.bgCard2})` }}>
      <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 14 }}>Trader Profile</div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(0,200,150,0.1)", border: "2px solid rgba(0,200,150,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
            {gamificationHook.level.current.icon}
          </div>
          <div>
            <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em" }}>Level {gamificationHook.level.current.level}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: flameColor }}>{gamificationHook.level.current.name}</div>
            <div style={{ fontSize: 10, color: t.textDim }}>{gamificationHook.xp} XP</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {[
            { icon: "📝", count: gamificationHook.journalStreak, label: "Journal" },
            { icon: "🔥", count: gamificationHook.maxWinStreak,  label: "Win Max" },
            { icon: "🏆", count: gamificationHook.earnedBadges?.filter(b => b.earned).length, label: "Badges" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16 }}>{s.icon}</div>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: 16, color: "#00c896", fontWeight: 600, lineHeight: 1 }}>{s.count}</div>
              <div style={{ fontSize: 9, color: t.textDim, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
        {gamificationHook.level.next && (
          <div style={{ flex: 1, minWidth: 100 }}>
            <div style={{ fontSize: 9, color: t.textDim, marginBottom: 4 }}>→ {gamificationHook.level.next.name}</div>
            <div style={{ height: 4, background: t.bgSubtle, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${gamificationHook.level.progress}%`, background: "linear-gradient(90deg, #00c89660, #00c896)", borderRadius: 2 }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RecentTradesWidget({ trades, currencyMeta, theme: t }) {
  const sym = currencyMeta?.symbol ?? "$";
  const { isMobile } = useBreakpoint();
  if (!trades?.length) return <div className="stat-card" style={{ color: t.textDim, fontSize: 12, textAlign: "center", padding: 24 }}>Belum ada trade</div>;
  return (
    <div className="stat-card">
      <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 14 }}>Recent Trades</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {[...trades].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6).map(tr => (
          <div key={tr.id} style={{ display: "grid", gridTemplateColumns: isMobile ? "80px 1fr 80px" : "88px 1fr 60px 60px 90px", gap: 8, alignItems: "center", padding: "8px 10px", borderRadius: 7, transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = t.bgSubtle}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <span style={{ color: t.textDim, fontSize: 10, fontFamily: "DM Mono, monospace" }}>{tr.date?.slice(5)}</span>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontWeight: 500, color: t.text, fontSize: 12 }}>{tr.pair}</span>
              <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 4, fontWeight: 600, background: tr.side === "BUY" ? "rgba(0,200,150,0.1)" : "rgba(245,158,11,0.1)", color: tr.side === "BUY" ? "#00c896" : "#f59e0b", letterSpacing: "0.05em" }}>{tr.side}</span>
            </div>
            {!isMobile && <span style={{ color: t.textDim, fontSize: 11 }}>{tr.strategy}</span>}
            {!isMobile && <span style={{ color: t.textDim, fontSize: 11, fontFamily: "DM Mono, monospace" }}>{(tr.rr ?? 0) >= 0 ? "+" : ""}{(tr.rr ?? 0).toFixed(1)}R</span>}
            <span style={{ color: tr.pnl >= 0 ? "#00c896" : "#ef4444", fontWeight: 600, textAlign: "right", fontFamily: "DM Mono, monospace", fontSize: 12 }}>{formatCurrency(tr.pnl, true, sym)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdvancedStatsWidget({ trades, settings, currencyMeta, theme: t }) {
  const sym     = currencyMeta?.symbol ?? "$";
  const capital = settings?.capitalInitial ?? 10000;
  const adv     = useMemo(() => calcAllAdvancedStats(trades, capital), [trades, capital]);
  return (
    <div className="stat-card">
      <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 14 }}>Advanced Statistics</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {[
          { label: "Sharpe",      value: adv.sharpe    ?? "—", color: parseFloat(adv.sharpe)  >= 1 ? "#00c896" : "#f59e0b" },
          { label: "Sortino",     value: adv.sortino   ?? "—", color: parseFloat(adv.sortino) >= 1 ? "#00c896" : "#f59e0b" },
          { label: "Expectancy",  value: adv.expectancy ? `${sym}${adv.expectancy}` : "—", color: parseFloat(adv.expectancy) >= 0 ? "#00c896" : "#ef4444" },
          { label: "Kelly %",     value: adv.kelly ? `${adv.kelly}%` : "—", color: "#3b82f6" },
          { label: "Calmar",      value: adv.calmar    ?? "—", color: "#f59e0b" },
          { label: "Recovery",    value: adv.recovery  ?? "—", color: "#f59e0b" },
          { label: "Payoff",      value: adv.payoff    ?? "—", color: "#f59e0b" },
          { label: "MAE/MFE",     value: adv.maemfe?.mfeMAERatio ?? "—", color: parseFloat(adv.maemfe?.mfeMAERatio) >= 1 ? "#00c896" : "#f59e0b" },
        ].map(s => (
          <div key={s.label} style={{ background: t.bgSubtle, borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontSize: 9, color: t.textDim, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: 16, color: s.value === "—" ? t.textDim : s.color, fontWeight: 600 }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Edit Mode Sidebar ─────────────────────────────────────────────
function EditSidebar({ widgets, onToggle, onReset, onClose, theme: t }) {
  return (
    <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 260, background: t.bgCard, border: `1px solid ${t.border}`, borderRight: "none", zIndex: 50, overflowY: "auto", padding: 20, boxShadow: "-8px 0 32px rgba(0,0,0,0.3)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2, color: t.text }}>WIDGETS</div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 18 }}>✕</button>
      </div>
      <div style={{ fontSize: 11, color: t.textDim, marginBottom: 16, lineHeight: 1.6 }}>
        Drag widget di dashboard untuk reorder. Klik toggle untuk show/hide.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {widgets.map(w => (
          <div key={w.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", background: t.bgSubtle, borderRadius: 8, border: `1px solid ${w.visible ? "rgba(0,200,150,0.2)" : t.borderSubtle}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>{w.icon}</span>
              <span style={{ fontSize: 12, color: w.visible ? t.text : t.textDim }}>{w.label}</span>
            </div>
            <button onClick={() => onToggle(w.id)}
              style={{ width: 36, height: 20, borderRadius: 10, background: w.visible ? "#00c896" : t.bgCard, border: `1px solid ${w.visible ? "#00c896" : t.border}`, cursor: "pointer", position: "relative", transition: "all 0.2s", flexShrink: 0 }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: w.visible ? 18 : 2, transition: "left 0.2s" }} />
            </button>
          </div>
        ))}
      </div>
      <button onClick={onReset} className="btn-ghost" style={{ width: "100%", marginTop: 16, fontSize: 12, justifyContent: "center" }}>
        ↺ Reset Layout
      </button>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────
export default function Dashboard({
  stats, equityCurve, monthlyPnl, marketBreakdown,
  settings, currencyMeta, theme, onExportPdf,
  pdfMonth, onPdfMonthChange, trades, gamificationHook, streakHook,
  layoutHook,
}) {
  const t   = theme;
  const sym = currencyMeta?.symbol ?? "$";
  const { isMobile } = useBreakpoint();
  const {
    widgets, visibleWidgets, editMode, setEditMode,
    dragging, dragOver, toggleVisible, setSize, reset,
    onDragStart, onDragOver, onDrop, onDragEnd,
  } = layoutHook;

  const COLS = isMobile ? 2 : 4;

  function renderWidget(w) {
    const props = { theme: t };
    switch (w.id) {
      case "kpi":       return <KPICards         stats={stats} currencyMeta={currencyMeta} settings={settings} {...props} />;
      case "equity":    return <EquityCurveWidget equityCurve={equityCurve} stats={stats} currencyMeta={currencyMeta} settings={settings} {...props} />;
      case "monthly":   return <MonthlyPnLWidget  monthlyPnl={monthlyPnl} currencyMeta={currencyMeta} {...props} />;
      case "progress":  return <ProgressWidget    stats={stats} settings={settings} currencyMeta={currencyMeta} {...props} />;
      case "markets":   return <MarketsWidget     marketBreakdown={marketBreakdown} currencyMeta={currencyMeta} {...props} />;
      case "streak":    return streakHook ? <div className="stat-card"><StreakWidget streakData={streakHook.streakData} theme={t} /></div> : null;
      case "gamif":     return <GamifWidget       gamificationHook={gamificationHook} {...props} />;
      case "recent":    return <RecentTradesWidget trades={trades} currencyMeta={currencyMeta} {...props} />;
      case "adv_stats": return <AdvancedStatsWidget trades={trades} settings={settings} currencyMeta={currencyMeta} {...props} />;
      default: return null;
    }
  }

  return (
    <div style={{ paddingRight: editMode ? 270 : 0, transition: "padding-right 0.3s" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 3, color: t.text, lineHeight: 1 }}>DASHBOARD</div>
          <div style={{ fontSize: 11, color: t.textDim, marginTop: 4 }}>Overview performa trading kamu</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {onExportPdf && (
            <div style={{ display: "flex", gap: 8 }}>
              <input type="month" value={pdfMonth ?? ""} onChange={e => onPdfMonthChange?.(e.target.value)}
                style={{ width: "auto", padding: "6px 10px", fontSize: 11, background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 7 }} />
              <button onClick={() => onExportPdf(pdfMonth)} className="btn-ghost" style={{ fontSize: 11, padding: "6px 12px" }}>↓ PDF</button>
            </div>
          )}
          <button onClick={() => setEditMode(e => !e)}
            style={{ padding: "6px 14px", borderRadius: 7, border: `1px solid ${editMode ? t.accent : t.border}`, background: editMode ? "rgba(0,200,150,0.08)" : "transparent", color: editMode ? "#00c896" : t.textMuted, cursor: "pointer", fontSize: 11, fontFamily: "DM Mono, monospace", transition: "all 0.2s" }}>
            {editMode ? "✓ Selesai" : "⊞ Edit Layout"}
          </button>
        </div>
      </div>

      {/* Widget grid */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 14 }}>
        {visibleWidgets.map(w => {
          const content = renderWidget(w);
          if (!content) return null;
          return (
            <WidgetShell key={w.id} widget={w} editMode={editMode}
              dragging={dragging} dragOver={dragOver}
              onDragStart={onDragStart} onDragOver={onDragOver}
              onDrop={onDrop} onDragEnd={onDragEnd}
              onSetSize={setSize} theme={t}>
              {content}
            </WidgetShell>
          );
        })}
      </div>

      {/* Target Tracker */}
      <div style={{ marginTop: 14 }}>
        <TargetTracker stats={stats} settings={settings} currencyMeta={currencyMeta} theme={t} />
      </div>

      {/* Edit sidebar */}
      {editMode && (
        <EditSidebar widgets={widgets} onToggle={toggleVisible} onReset={reset} onClose={() => setEditMode(false)} theme={t} />
      )}
    </div>
  );
}