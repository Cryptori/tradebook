import { useBreakpoint } from "../hooks/useBreakpoint";

import { useMemo, useState } from "react";
import { calcAllAdvancedStats } from "../utils/advancedStats";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatCurrency } from "../utils/formatters";
import HeatmapChart   from "./charts/HeatmapChart";
import RRScatterChart from "./charts/ScatterChart";

const tooltipStyle = (t) => ({
  contentStyle: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 8, fontFamily: "DM Mono", fontSize: 12, color: t.text },
});


// ── Pair Performance Matrix ───────────────────────────────────────
function PairPerformanceMatrix({ trades, currencyMeta, theme: t }) {
  const sym = currencyMeta?.symbol ?? "$";
  const { isMobile } = useBreakpoint();
  const [sortKey,  setSortKey]  = useState("totalPnl");
  const [sortDir,  setSortDir]  = useState("desc");
  const [filterMin, setFilterMin] = useState(1); // min trades

  const pairData = useMemo(() => {
    const map = {};
    (trades || []).forEach(tr => {
      if (!tr.pair) return;
      if (!map[tr.pair]) map[tr.pair] = { pair: tr.pair, trades: 0, wins: 0, losses: 0, pnl: 0, rrs: [], months: {} };
      const d = map[tr.pair];
      d.trades++;
      if (tr.pnl >= 0) d.wins++; else d.losses++;
      d.pnl += tr.pnl || 0;
      if (tr.rr) d.rrs.push(parseFloat(tr.rr));
      // Monthly tracking
      const month = tr.date?.slice(0, 7);
      if (month) {
        if (!d.months[month]) d.months[month] = { pnl: 0, wins: 0, trades: 0 };
        d.months[month].pnl    += tr.pnl || 0;
        d.months[month].trades += 1;
        if (tr.pnl >= 0) d.months[month].wins++;
      }
    });

    return Object.values(map).map(d => {
      const winRate      = d.trades > 0 ? (d.wins / d.trades) * 100 : 0;
      const avgRR        = d.rrs.length > 0 ? d.rrs.reduce((s, r) => s + r, 0) / d.rrs.length : 0;
      const grossWin     = (trades || []).filter(tr => tr.pair === d.pair && tr.pnl > 0).reduce((s, tr) => s + tr.pnl, 0);
      const grossLoss    = Math.abs((trades || []).filter(tr => tr.pair === d.pair && tr.pnl < 0).reduce((s, tr) => s + tr.pnl, 0));
      const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 999 : 0;
      const avgWin       = d.wins   > 0 ? grossWin  / d.wins   : 0;
      const avgLoss      = d.losses > 0 ? grossLoss / d.losses : 0;
      // Trend: compare last 2 months
      const months = Object.entries(d.months).sort();
      const lastMonth = months.length >= 1 ? months[months.length - 1][1] : null;
      const prevMonth = months.length >= 2 ? months[months.length - 2][1] : null;
      const trend = lastMonth && prevMonth
        ? lastMonth.pnl > prevMonth.pnl ? "up" : lastMonth.pnl < prevMonth.pnl ? "down" : "flat"
        : null;

      return { ...d, winRate, avgRR, profitFactor, avgWin, avgLoss, grossWin, grossLoss, trend };
    }).filter(d => d.trades >= filterMin);
  }, [trades, filterMin]);

  const sorted = useMemo(() => {
    return [...pairData].sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [pairData, sortKey, sortDir]);

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  const maxPnl = sorted.length > 0 ? Math.max(...sorted.map(d => Math.abs(d.totalPnl || d.pnl)), 1) : 1;

  const best  = [...pairData].sort((a, b) => b.winRate - a.winRate).slice(0, 3);
  const worst = [...pairData].filter(d => d.winRate < 50 && d.trades >= 5).sort((a, b) => a.winRate - b.winRate).slice(0, 3);

  const COLS = [
    { key: "pair",         label: "Pair",    fmt: d => d.pair },
    { key: "trades",       label: "Trades",  fmt: d => d.trades },
    { key: "winRate",      label: "WR%",     fmt: d => d.winRate.toFixed(1) + "%" },
    { key: "profitFactor", label: "PF",      fmt: d => d.profitFactor >= 999 ? "∞" : d.profitFactor.toFixed(2) },
    { key: "avgRR",        label: "Avg R:R", fmt: d => d.avgRR.toFixed(2) },
    { key: "pnl",          label: "Total PnL", fmt: d => (d.pnl >= 0 ? "+" : "") + sym + d.pnl.toFixed(0) },
    { key: "avgWin",       label: "Avg Win", fmt: d => sym + d.avgWin.toFixed(0) },
    { key: "avgLoss",      label: "Avg Loss", fmt: d => sym + d.avgLoss.toFixed(0) },
    { key: "trend",        label: "Trend",   fmt: d => d.trend === "up" ? "↑" : d.trend === "down" ? "↓" : d.trend === "flat" ? "→" : "—" },
  ];

  function colColor(col, d) {
    if (col === "winRate")      return d.winRate >= 60 ? "#00c896" : d.winRate >= 40 ? "#f59e0b" : "#ef4444";
    if (col === "profitFactor") return d.profitFactor >= 1.5 ? "#00c896" : d.profitFactor >= 1 ? "#f59e0b" : "#ef4444";
    if (col === "avgRR")        return d.avgRR >= 1.5 ? "#00c896" : d.avgRR >= 1 ? "#f59e0b" : "#ef4444";
    if (col === "pnl")          return d.pnl >= 0 ? "#00c896" : "#ef4444";
    if (col === "trend")        return d.trend === "up" ? "#00c896" : d.trend === "down" ? "#ef4444" : t.textDim;
    return t.text;
  }

  if (pairData.length === 0) return (
    <div style={{ textAlign: "center", padding: "24px 0", color: t.textDim, fontSize: 13 }}>
      Belum ada data pair yang cukup (min {filterMin} trade)
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Best & Avoid */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
        <div style={{ background: "rgba(0,200,150,0.06)", border: "1px solid rgba(0,200,150,0.2)", borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontSize: 9, color: "#00c896", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600, marginBottom: 10 }}>🏆 Best Pairs</div>
          {best.map((d, i) => (
            <div key={d.pair} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 10, color: "#00c896" }}>{i + 1}.</span>
                <span style={{ fontSize: 12, color: t.text, fontFamily: "DM Mono, monospace" }}>{d.pair}</span>
              </div>
              <div style={{ display: "flex", gap: 10, fontSize: 11 }}>
                <span style={{ color: "#00c896" }}>{d.winRate.toFixed(0)}% WR</span>
                <span style={{ color: t.textDim }}>{d.trades}x</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontSize: 9, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600, marginBottom: 10 }}>⚠️ Pairs to Avoid</div>
          {worst.length > 0 ? worst.map((d, i) => (
            <div key={d.pair} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 10, color: "#ef4444" }}>{i + 1}.</span>
                <span style={{ fontSize: 12, color: t.text, fontFamily: "DM Mono, monospace" }}>{d.pair}</span>
              </div>
              <div style={{ display: "flex", gap: 10, fontSize: 11 }}>
                <span style={{ color: "#ef4444" }}>{d.winRate.toFixed(0)}% WR</span>
                <span style={{ color: t.textDim }}>{d.trades}x</span>
              </div>
            </div>
          )) : <div style={{ fontSize: 12, color: t.textDim }}>Semua pair performa baik 👍</div>}
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ fontSize: 11, color: t.textDim }}>Min trades:</div>
        {[1, 3, 5, 10].map(n => (
          <button key={n} onClick={() => setFilterMin(n)}
            style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${filterMin === n ? t.accent : t.border}`, background: filterMin === n ? "rgba(0,200,150,0.08)" : "transparent", color: filterMin === n ? "#00c896" : t.textDim, fontSize: 11, cursor: "pointer" }}>
            {n}+
          </button>
        ))}
        <div style={{ marginLeft: "auto", fontSize: 11, color: t.textDim }}>{sorted.length} pairs</div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              {COLS.map(col => (
                <th key={col.key} onClick={() => col.key !== "pair" && col.key !== "trend" && toggleSort(col.key)}
                  style={{ fontSize: 9, color: sortKey === col.key ? t.accent : t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", padding: "8px 10px", textAlign: col.key === "pair" ? "left" : "right", cursor: col.key !== "pair" && col.key !== "trend" ? "pointer" : "default", whiteSpace: "nowrap", borderBottom: `1px solid ${t.border}`, userSelect: "none" }}>
                  {col.label} {sortKey === col.key ? (sortDir === "desc" ? "↓" : "↑") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((d, idx) => (
              <tr key={d.pair}
                onMouseEnter={e => e.currentTarget.style.background = t.bgSubtle}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                style={{ transition: "background 0.1s" }}>
                {COLS.map(col => (
                  <td key={col.key} style={{ padding: "10px 10px", borderBottom: `1px solid ${t.borderSubtle}`, textAlign: col.key === "pair" ? "left" : "right", color: colColor(col.key, d), fontFamily: col.key !== "pair" ? "DM Mono, monospace" : "inherit", fontWeight: col.key === "pnl" || col.key === "winRate" ? 600 : 400 }}>
                    {col.fmt(d)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Analytics({ trades, stats, strategyStats, marketBreakdown, emotionStats, currencyMeta, theme, settings }) {
  const t   = theme;
  const sym = currencyMeta?.symbol ?? "$";
  const { isMobile, md } = useBreakpoint();
  const maxStrategyPnl = strategyStats.length > 0 ? Math.max(...strategyStats.map(x => Math.abs(x.pnl)), 1) : 1;
  const capital = settings?.capitalInitial ?? 10000;
  const adv = useMemo(() => calcAllAdvancedStats(trades, capital), [trades, capital]);

  return (
    <div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2, marginBottom: 20, color: t.text }}>
        PERFORMANCE ANALYTICS
      </div>

      {/* Win/Loss + Strategy */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div className="stat-card" style={{ background: `linear-gradient(135deg, ${t.bgCard}, ${t.bgCard2})`, borderColor: t.border }}>
          <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Win vs Loss</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
            <div style={{ textAlign: "center", background: "rgba(0,212,170,0.06)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 10, color: t.textDim, marginBottom: 4 }}>AVG WIN</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: "#00d4aa" }}>{formatCurrency(stats.avgWin, false, sym)}</div>
            </div>
            <div style={{ textAlign: "center", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 10, color: t.textDim, marginBottom: 4 }}>AVG LOSS</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: "#ef4444" }}>{formatCurrency(stats.avgLoss, false, sym)}</div>
            </div>
          </div>
          <div style={{ marginTop: 12, padding: 12, background: t.bgSubtle, borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: t.textDim }}>Profit Factor</span>
            <span style={{ fontSize: 14, color: stats.profitFactor >= 1.5 ? "#00d4aa" : "#f59e0b", fontWeight: 500 }}>
              {stats.profitFactor >= 999 ? "∞" : stats.profitFactor.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="stat-card" style={{ background: `linear-gradient(135deg, ${t.bgCard}, ${t.bgCard2})`, borderColor: t.border }}>
          <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Strategy Performance</div>
          {strategyStats.length === 0 ? (
            <div style={{ color: t.textDim, fontSize: 12, textAlign: "center", paddingTop: 20 }}>Belum ada data</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {strategyStats.map(s => (
                <div key={s.strategy} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 11, color: t.textMuted, width: 90, flexShrink: 0 }}>{s.strategy}</div>
                  <div style={{ flex: 1, background: t.bgSubtle, borderRadius: 4, height: 6, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(Math.abs(s.pnl) / maxStrategyPnl) * 100}%`, background: s.pnl >= 0 ? "#00d4aa" : "#ef4444", borderRadius: 4 }} />
                  </div>
                  <div style={{ fontSize: 11, color: s.pnl >= 0 ? "#00d4aa" : "#ef4444", width: 70, textAlign: "right" }}>{formatCurrency(s.pnl, false, sym)}</div>
                  <div style={{ fontSize: 10, color: t.textDim, width: 30, textAlign: "right" }}>{s.count}x</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* P&L by Market */}
      <div className="stat-card" style={{ background: `linear-gradient(135deg, ${t.bgCard}, ${t.bgCard2})`, borderColor: t.border, marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>P&L by Market</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={marketBreakdown} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} horizontal={false} />
            <XAxis type="number" tick={{ fill: t.textDim, fontSize: 10, fontFamily: "DM Mono" }} tickLine={false} axisLine={false} tickFormatter={v => `${sym}${v}`} />
            <YAxis type="category" dataKey="market" tick={{ fill: t.textMuted, fontSize: 11, fontFamily: "DM Mono" }} tickLine={false} axisLine={false} width={90} />
            <Tooltip {...tooltipStyle(t)} formatter={v => [formatCurrency(v, false, sym), "P&L"]} />
            <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
              {marketBreakdown.map(m => <Cell key={m.market} fill={m.pnl >= 0 ? "#00d4aa" : "#ef4444"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Scatter + Heatmap */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div className="stat-card" style={{ background: `linear-gradient(135deg, ${t.bgCard}, ${t.bgCard2})`, borderColor: t.border }}>
          <RRScatterChart trades={trades} symbol={sym} theme={t} />
        </div>
        <div className="stat-card" style={{ background: `linear-gradient(135deg, ${t.bgCard}, ${t.bgCard2})`, borderColor: t.border }}>
          <HeatmapChart trades={trades} symbol={sym} theme={t} />
        </div>
      </div>

      {/* Emotion stats */}
      <div className="stat-card" style={{ background: `linear-gradient(135deg, ${t.bgCard}, ${t.bgCard2})`, borderColor: t.border }}>
        <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>P&L by Emotion State</div>
        {emotionStats.length === 0 ? (
          <div style={{ color: t.textDim, fontSize: 12, textAlign: "center", padding: "20px 0" }}>Belum ada data</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {emotionStats.map(({ emotion, pnl, count }) => (
              <div key={emotion} style={{ background: t.bgSubtle, borderRadius: 8, padding: "12px 14px", border: `1px solid ${t.borderSubtle}` }}>
                <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 4 }}>{emotion}</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: pnl >= 0 ? "#00d4aa" : "#ef4444" }}>{formatCurrency(pnl, false, sym)}</div>
                <div style={{ fontSize: 10, color: t.textDim, marginTop: 2 }}>{count} trades</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* ── Advanced Statistics ─────────────────────────────── */}
      <div className="stat-card" style={{ background: `linear-gradient(135deg, ${t.bgCard}, ${t.bgCard2})`, borderColor: t.border }}>
        <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>Advanced Statistics</div>

        {/* Row 1 — Risk-adjusted returns */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
          {[
            { label: "Sharpe Ratio",   value: adv.sharpe   ?? "—", desc: "Return per unit risk",      color: parseFloat(adv.sharpe)  >= 1 ? "#00c896" : "#f59e0b" },
            { label: "Sortino Ratio",  value: adv.sortino  ?? "—", desc: "Return per downside risk",  color: parseFloat(adv.sortino) >= 1 ? "#00c896" : "#f59e0b" },
            { label: "Calmar Ratio",   value: adv.calmar   ?? "—", desc: "Return / max drawdown",     color: parseFloat(adv.calmar)  >= 1 ? "#00c896" : "#f59e0b" },
            { label: "Recovery Factor",value: adv.recovery ?? "—", desc: "Profit / max drawdown $",   color: parseFloat(adv.recovery) >= 2 ? "#00c896" : "#f59e0b" },
          ].map(s => (
            <div key={s.label} style={{ background: t.bgSubtle, borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: 22, color: s.value === "—" ? t.textDim : s.color, fontWeight: 600 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: t.textDim, marginTop: 4 }}>{s.desc}</div>
            </div>
          ))}
        </div>

        {/* Row 2 — Trade quality */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
          {[
            { label: "Expectancy",   value: adv.expectancy ? `${sym}${adv.expectancy}` : "—", desc: "Expected $ per trade",    color: parseFloat(adv.expectancy) >= 0 ? "#00c896" : "#ef4444" },
            { label: "Payoff Ratio", value: adv.payoff     ?? "—",                            desc: "Avg win / avg loss",       color: parseFloat(adv.payoff) >= 1.5 ? "#00c896" : "#f59e0b" },
            { label: "Kelly %",      value: adv.kelly      ? `${adv.kelly}%` : "—",           desc: "Optimal position size",    color: "#3b82f6" },
            { label: "MAE/MFE Ratio",value: adv.maemfe?.mfeMAERatio ?? "—",                   desc: "Favorable / adverse range", color: parseFloat(adv.maemfe?.mfeMAERatio) >= 1 ? "#00c896" : "#f59e0b" },
          ].map(s => (
            <div key={s.label} style={{ background: t.bgSubtle, borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: 22, color: s.value === "—" ? t.textDim : s.color, fontWeight: 600 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: t.textDim, marginTop: 4 }}>{s.desc}</div>
            </div>
          ))}
        </div>

        {/* Row 3 — Streak & Duration */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
          {/* Consecutive stats */}
          {adv.consecutive && (
            <div style={{ background: t.bgSubtle, borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>Consecutive Analysis</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "Max Win Streak",    value: adv.consecutive.maxWin,        color: "#00c896" },
                  { label: "Max Loss Streak",   value: adv.consecutive.maxLoss,       color: "#ef4444" },
                  { label: "Avg Win Streak",    value: adv.consecutive.avgWinStreak,  color: "#00c896" },
                  { label: "Avg Loss Streak",   value: adv.consecutive.avgLossStreak, color: "#ef4444" },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: 9, color: t.textDim, marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: 16, color: s.color, fontWeight: 500 }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Duration stats */}
          {adv.duration && (
            <div style={{ background: t.bgSubtle, borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>Duration & Activity</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "Trading Days",     value: adv.duration.tradingDays,   color: t.text },
                  { label: "Active Days %",    value: adv.duration.activeDaysPct + "%", color: t.text },
                  { label: "Trades / Day",     value: adv.duration.tradesPerDay,  color: t.text },
                  { label: "Best Day",         value: `${sym}${parseFloat(adv.duration.bestDay).toFixed(0)}`, color: "#00c896" },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: 9, color: t.textDim, marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: 16, color: s.color, fontWeight: 500 }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* MAE/MFE detail */}
        {adv.maemfe && (
          <div style={{ marginTop: 12, background: t.bgSubtle, borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>
              MAE/MFE Analysis <span style={{ color: t.textDim, fontWeight: 400 }}>({adv.maemfe.sampleSize} trades with SL/TP data)</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 10 }}>
              {[
                { label: "Avg MAE",       value: adv.maemfe.avgMAE ? adv.maemfe.avgMAE + "%" : "—",       desc: "Max adverse excursion",   color: "#ef4444" },
                { label: "Avg MFE",       value: adv.maemfe.avgMFE ? adv.maemfe.avgMFE + "%" : "—",       desc: "Max favorable excursion", color: "#00c896" },
                { label: "MFE/MAE Ratio", value: adv.maemfe.mfeMAERatio ?? "—",                            desc: "> 1 = good trade management", color: parseFloat(adv.maemfe.mfeMAERatio) >= 1 ? "#00c896" : "#f59e0b" },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 9, color: t.textDim, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: 18, color: s.value === "—" ? t.textDim : s.color, fontWeight: 500 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: t.textDim, marginTop: 2 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Kelly explanation */}
        {adv.kelly && (
          <div style={{ marginTop: 12, fontSize: 11, color: t.textDim, padding: "10px 14px", background: "rgba(59,130,246,0.05)", borderRadius: 8, border: "1px solid rgba(59,130,246,0.15)" }}>
            💡 Kelly Criterion: {adv.kelly}% — gunakan maksimal {adv.kelly}% dari modal per trade untuk sizing optimal. Half-Kelly ({(parseFloat(adv.kelly)/2).toFixed(1)}%) lebih konservatif dan direkomendasikan.
          </div>
        )}
      </div>

      {/* ── Pair Performance Matrix ─────────────────────────────── */}
      <div className="stat-card">
        <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Pair Performance Matrix</div>
        <PairPerformanceMatrix trades={trades} currencyMeta={currencyMeta} theme={t} />
      </div>
    </div>
  );
}