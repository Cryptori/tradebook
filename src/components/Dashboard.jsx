import { formatCurrency, formatPct, formatDate } from "../utils/formatters";
import { useBreakpoint } from "../hooks/useBreakpoint";
import TargetTracker from "./TargetTracker";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

function ProgressBar({ value, color, height = 8, theme: t }) {
  return (
    <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", borderRadius: 6, height, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.max(0, Math.min(value, 100))}%`, background: color, borderRadius: 6, transition: "width 0.5s ease" }} />
    </div>
  );
}

const chartTooltip = (t) => ({
  contentStyle: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 8, fontFamily: "DM Mono", fontSize: 12, color: t.text },
});

export default function Dashboard({ stats, equityCurve, monthlyPnl, marketBreakdown, settings, currencyMeta, theme, onExportPdf, pdfMonth, onPdfMonthChange, trades, gamificationHook }) {
  const t   = theme;
  const sym = currencyMeta?.symbol ?? "$";
  const { isMobile, isTablet, md } = useBreakpoint();

  const capital          = settings?.capitalInitial ?? 10000;
  const totalReturn      = capital > 0 ? (stats.totalPnl / capital) * 100 : 0;
  const targetProfit     = capital * ((settings?.targetProfitPct ?? 20) / 100);
  const maxDrawdown      = capital * ((settings?.maxDrawdownPct  ?? 10) / 100);
  const profitProgress   = targetProfit > 0 ? (stats.totalPnl / targetProfit) * 100 : 0;
  const drawdownProgress = maxDrawdown  > 0 ? (Math.abs(Math.min(stats.worstTrade, 0)) / maxDrawdown) * 100 : 0;
  const ddColor          = drawdownProgress >= 80 ? "#ef4444" : drawdownProgress >= 50 ? "#f59e0b" : "#00d4aa";

  const statCols = isMobile ? "1fr 1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(4, 1fr)";
  const chartCols = md ? "1fr 1fr" : "1fr";

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2, color: t.text }}>DASHBOARD</div>
        {onExportPdf && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <input
              type="month" value={pdfMonth ?? ""}
              onChange={e => onPdfMonthChange?.(e.target.value)}
              style={{ width: "auto", padding: "7px 10px", fontSize: 12, background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8 }}
            />
            <button onClick={() => onExportPdf(pdfMonth)} className="btn-ghost"
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, whiteSpace: "nowrap" }}>
              ↓ Export PDF
            </button>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: statCols, gap: isMobile ? 10 : 16, marginBottom: 24 }}>
        {[
          { label: "Total P&L",     value: formatCurrency(stats.totalPnl, false, sym), sub: `${formatPct(totalReturn)} return`,              color: stats.totalPnl >= 0 ? "#00d4aa" : "#ef4444" },
          { label: "Win Rate",      value: `${stats.winRate.toFixed(1)}%`,              sub: `${stats.wins}W / ${stats.losses}L`,             color: stats.winRate >= 50 ? "#00d4aa" : "#f59e0b" },
          { label: "Profit Factor", value: stats.profitFactor >= 999 ? "∞" : stats.profitFactor.toFixed(2), sub: `Avg RR: ${stats.avgRR.toFixed(2)}`, color: stats.profitFactor >= 1.5 ? "#00d4aa" : "#f59e0b" },
          { label: "Total Trades",  value: stats.totalTrades, sub: `Best: ${formatCurrency(stats.bestTrade, true, sym)}`, color: "#3b82f6" },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: t.textDim, marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Progress bars */}
      <div className="stat-card" style={{ marginBottom: 20, gridColumn: md ? "span 2" : "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: chartCols, gap: 20 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: t.textMuted }}>Profit Target</span>
              <span style={{ fontSize: 11, color: "#00d4aa" }}>{profitProgress.toFixed(0)}%</span>
            </div>
            <ProgressBar value={profitProgress} color="#00d4aa" theme={t} />
            <div style={{ fontSize: 10, color: t.textDim, marginTop: 4 }}>{formatCurrency(stats.totalPnl, false, sym)} / {formatCurrency(targetProfit, false, sym)}</div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: t.textMuted }}>Drawdown Limit</span>
              <span style={{ fontSize: 11, color: ddColor }}>{drawdownProgress.toFixed(0)}%</span>
            </div>
            <ProgressBar value={drawdownProgress} color={ddColor} theme={t} />
            <div style={{ fontSize: 10, color: t.textDim, marginTop: 4 }}>Max: {formatCurrency(maxDrawdown, false, sym)}</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: chartCols, gap: 16, marginBottom: 20 }}>
        {/* Equity curve */}
        <div className="stat-card">
          <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Equity Curve</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={equityCurve}>
              <defs>
                <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#00d4aa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} vertical={false} />
              <XAxis dataKey="date" tick={{ fill: t.textDim, fontSize: 9, fontFamily: "DM Mono" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: t.textDim, fontSize: 9, fontFamily: "DM Mono" }} tickLine={false} axisLine={false} tickFormatter={v => `${sym}${(v / 1000).toFixed(0)}k`} width={45} />
              <Tooltip {...chartTooltip(t)} formatter={v => [formatCurrency(v, false, sym), "Equity"]} />
              {equityCurve?.length > 0 && <Area type="monotone" dataKey="equity" stroke="#00d4aa" strokeWidth={2} fill="url(#eqGrad)" dot={false} />}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly P&L */}
        <div className="stat-card">
          <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Monthly P&L</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyPnl} barSize={isMobile ? 12 : 20}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} vertical={false} />
              <XAxis dataKey="month" tick={{ fill: t.textDim, fontSize: 9, fontFamily: "DM Mono" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: t.textDim, fontSize: 9, fontFamily: "DM Mono" }} tickLine={false} axisLine={false} tickFormatter={v => `${sym}${v}`} width={45} />
              <Tooltip {...chartTooltip(t)} formatter={v => [formatCurrency(v, false, sym), "P&L"]} />
              <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                {monthlyPnl.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? "#00d4aa" : "#ef4444"} fillOpacity={0.8} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Market breakdown */}
      {marketBreakdown?.length > 0 && (
        <div className="stat-card" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Market Breakdown</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10 }}>
            {marketBreakdown.map(m => (
              <div key={m.market} style={{ background: "var(--bg-subtle)", borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 4 }}>{m.market}</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: m.pnl >= 0 ? "#00d4aa" : "#ef4444" }}>{formatCurrency(m.pnl, true, sym)}</div>
                <div style={{ fontSize: 10, color: t.textDim }}>{m.count} trades</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Target Tracker */}
      <TargetTracker stats={stats} settings={settings} currencyMeta={currencyMeta} theme={t} />

      {/* Gamification Widget */}
      {gamificationHook && (
        <div className="stat-card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            {/* Level */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, rgba(0,212,170,0.15), rgba(0,212,170,0.3))", border: "2px solid rgba(0,212,170,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                {gamificationHook.level.current.icon}
              </div>
              <div>
                <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em" }}>Level {gamificationHook.level.current.level}</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#00d4aa" }}>{gamificationHook.level.current.name}</div>
                <div style={{ fontSize: 10, color: t.textDim }}>{gamificationHook.xp} XP</div>
              </div>
            </div>

            {/* Streaks */}
            <div style={{ display: "flex", gap: 16 }}>
              {[
                { icon: "📝", count: gamificationHook.journalStreak,  label: "Journal" },
                { icon: "📅", count: gamificationHook.tradingStreak,  label: "Trading" },
                { icon: "🔥", count: gamificationHook.maxWinStreak,   label: "Win Max" },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 16 }}>{s.icon}</div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: s.count > 0 ? "#00d4aa" : t.textDim, lineHeight: 1 }}>{s.count}</div>
                  <div style={{ fontSize: 9, color: t.textDim }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Badges count */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Badges</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: "#f59e0b" }}>
                {gamificationHook.earnedBadges.filter(b => b.earned).length}/{gamificationHook.earnedBadges.length}
              </div>
            </div>

            {/* Level progress bar */}
            {gamificationHook.level.next && (
              <div style={{ flex: 1, minWidth: 120 }}>
                <div style={{ fontSize: 10, color: t.textDim, marginBottom: 4 }}>
                  Menuju {gamificationHook.level.next.name} {gamificationHook.level.next.icon}
                </div>
                <div style={{ height: 6, background: t.bgSubtle, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${gamificationHook.level.progress}%`, background: "linear-gradient(90deg, #00d4aa60, #00d4aa)", borderRadius: 3, transition: "width 0.8s ease" }} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Trades */}
      {trades?.length > 0 && (
        <div className="stat-card" style={{ marginTop: 20 }}>
          <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
            Recent Trades
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[...trades]
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 5)
              .map(trade => (
                <div key={trade.id} style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr 1fr" : "90px 1fr 70px 80px 80px",
                  gap: 8, alignItems: "center",
                  padding: "8px 12px",
                  background: t.bgSubtle,
                  borderRadius: 8,
                  fontSize: 12,
                }}>
                  <span style={{ color: t.textDim, fontSize: 11 }}>{trade.date?.slice(5)}</span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontWeight: 500, color: t.text }}>{trade.pair}</span>
                    <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: (trade.side === "BUY") ? "rgba(0,212,170,0.15)" : "rgba(245,158,11,0.15)", color: (trade.side === "BUY") ? "#00d4aa" : "#f59e0b", border: `1px solid ${(trade.side === "BUY") ? "#00d4aa40" : "#f59e0b40"}` }}>{trade.side}</span>
                  </div>
                  {!isMobile && <span style={{ color: t.textDim }}>{trade.strategy}</span>}
                  {!isMobile && <span style={{ color: t.textDim }}>{(trade.rr ?? 0) >= 0 ? "+" : ""}{(trade.rr ?? 0).toFixed(1)}R</span>}
                  <span style={{ color: trade.pnl >= 0 ? "#00d4aa" : "#ef4444", fontWeight: 500, textAlign: "right" }}>
                    {formatCurrency(trade.pnl, true, sym)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}