import { useState, useMemo } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import { formatCurrency, formatPct, formatRR } from "../../utils/formatters";

// ── Chart tooltip style ───────────────────────────────────────────
const chartTip = {
  contentStyle: {
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: "var(--r-md)", fontSize: 11, color: "var(--text)",
    boxShadow: "var(--shadow-md)",
  },
  cursor: { stroke: "var(--border)", strokeWidth: 1 },
};

// ── Helpers ───────────────────────────────────────────────────────
function getWeekKey(dateStr) {
  const d   = new Date(dateStr + "T00:00:00");
  const mon = new Date(d);
  mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return mon.toISOString().slice(0, 10);
}

function calcPeriodStats(trades) {
  if (!trades.length) return null;
  const wins   = trades.filter(tr => tr.pnl > 0);
  const losses = trades.filter(tr => tr.pnl <= 0);
  const totalPnl    = trades.reduce((s, tr) => s + (tr.pnl || 0), 0);
  const grossProfit = wins.reduce((s, tr) => s + tr.pnl, 0);
  const grossLoss   = Math.abs(losses.reduce((s, tr) => s + tr.pnl, 0));
  const rrTrades    = trades.filter(tr => tr.rr);
  const avgRR       = rrTrades.length ? rrTrades.reduce((s, tr) => s + (tr.rr ?? 0), 0) / rrTrades.length : 0;

  let maxWin = 0, maxLoss = 0, curStreak = 0, curType = null;
  [...trades].sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(tr => {
    const type = tr.pnl > 0 ? "win" : "loss";
    curStreak = type === curType ? curStreak + 1 : 1;
    curType   = type;
    if (type === "win"  && curStreak > maxWin)  maxWin  = curStreak;
    if (type === "loss" && curStreak > maxLoss) maxLoss = curStreak;
  });

  const count    = (arr, key) => arr.reduce((m, t) => { m[t[key]] = (m[t[key]] ?? 0) + 1; return m; }, {});
  const topOf    = obj  => Object.entries(obj).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  return {
    totalPnl, trades: trades.length,
    wins: wins.length, losses: losses.length,
    winRate:      trades.length ? (wins.length / trades.length) * 100 : 0,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0,
    avgWin:       wins.length   ? grossProfit / wins.length   : 0,
    avgLoss:      losses.length ? -grossLoss  / losses.length : 0,
    avgRR, maxWinStreak: maxWin, maxLossStreak: maxLoss,
    topPair:     topOf(count(trades, "pair")),
    topStrategy: topOf(count(trades, "strategy")),
    topEmotion:  topOf(count(trades, "emotion")),
    bestTrade:   Math.max(...trades.map(tr => tr.pnl)),
    worstTrade:  Math.min(...trades.map(tr => tr.pnl)),
  };
}

function groupByPeriod(trades, mode) {
  const groups = {};
  trades.forEach(tr => {
    const key = mode === "weekly" ? getWeekKey(tr.date) : tr.date.slice(0, 7);
    if (!groups[key]) groups[key] = [];
    groups[key].push(tr);
  });
  return Object.entries(groups)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, ts]) => ({ key, stats: calcPeriodStats(ts), trades: ts }));
}

function periodLabel(key) {
  return key.length === 7
    ? new Date(key + "-01").toLocaleDateString("id-ID", { month: "long", year: "numeric" })
    : `W ${new Date(key + "T00:00:00").toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}`;
}

// ── Period Card ───────────────────────────────────────────────────
function PeriodCard({ period, sym, isSelected, onClick }) {
  const { stats, key } = period;
  if (!stats) return null;
  const color = stats.totalPnl >= 0 ? "var(--success)" : "var(--danger)";
  const dimBg = stats.totalPnl >= 0 ? "var(--success-dim)" : "var(--danger-dim)";

  return (
    <div onClick={onClick} style={{
      background: isSelected ? dimBg : "var(--bg-card)",
      border:     `1px solid ${isSelected ? (stats.totalPnl >= 0 ? "var(--success)" : "var(--danger)") : "var(--border)"}`,
      borderLeft: `3px solid ${color}`,
      borderRadius: "var(--r-lg)",
      padding: "12px 14px",
      cursor: "pointer",
      transition: "all var(--t-base)",
    }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "var(--bg-hover)"; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "var(--bg-card)"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: "var(--fs-sm)", fontWeight: 500, color: "var(--text)" }}>{periodLabel(key)}</div>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 2 }}>
            {stats.trades} trades · {stats.winRate.toFixed(0)}% WR
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "var(--fs-base)", fontWeight: 600, color, fontFamily: "var(--font-mono)" }}>
            {formatCurrency(stats.totalPnl, false, sym)}
          </div>
          <div style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)" }}>
            PF: {stats.profitFactor >= 999 ? "∞" : stats.profitFactor.toFixed(2)}
          </div>
        </div>
      </div>
      {/* Win/loss bar */}
      <div style={{ display: "flex", gap: 2, height: 3 }}>
        {[...Array(stats.wins)].map((_, i)   => <div key={`w${i}`} style={{ flex: 1, background: "var(--success)", borderRadius: 1 }}/>)}
        {[...Array(stats.losses)].map((_, i) => <div key={`l${i}`} style={{ flex: 1, background: "var(--danger)",  borderRadius: 1 }}/>)}
      </div>
    </div>
  );
}

// ── Detail Panel ──────────────────────────────────────────────────
function DetailPanel({ period, sym }) {
  const { isMobile } = useBreakpoint();
  const { stats, trades, key } = period;
  if (!stats) return null;

  const accentColor = stats.totalPnl >= 0 ? "var(--success)" : "var(--danger)";

  const dailyData = useMemo(() => {
    const map = {};
    trades.forEach(tr => { map[tr.date] = (map[tr.date] ?? 0) + tr.pnl; });
    return Object.entries(map).sort().map(([date, pnl]) => ({ date: date.slice(5), pnl }));
  }, [trades]);

  const kpis = [
    { label: "Total P&L",     val: formatCurrency(stats.totalPnl, false, sym),  color: accentColor },
    { label: "Win Rate",      val: `${stats.winRate.toFixed(1)}%`,               color: stats.winRate >= 50 ? "var(--success)" : "var(--warning)" },
    { label: "Profit Factor", val: stats.profitFactor >= 999 ? "∞" : stats.profitFactor.toFixed(2), color: stats.profitFactor >= 1 ? "var(--success)" : "var(--danger)" },
    { label: "Avg R:R",       val: formatRR(stats.avgRR),                        color: stats.avgRR >= 1 ? "var(--success)" : "var(--warning)" },
    { label: "Avg Win",       val: formatCurrency(stats.avgWin,  false, sym),    color: "var(--success)" },
    { label: "Avg Loss",      val: formatCurrency(stats.avgLoss, false, sym),    color: "var(--danger)" },
    { label: "Best Trade",    val: formatCurrency(stats.bestTrade,  false, sym), color: "var(--success)" },
    { label: "Worst Trade",   val: formatCurrency(stats.worstTrade, false, sym), color: "var(--danger)" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Title */}
      <div>
        <h2 style={{ fontFamily: "var(--font-disp)", fontSize: 20, letterSpacing: 2, color: "var(--text)", fontWeight: 400 }}>
          {periodLabel(key)}
        </h2>
        <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 3 }}>
          {stats.trades} trades · {stats.wins}W {stats.losses}L
        </p>
      </div>

      {/* KPI grid */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 8 }}>
        {kpis.map(s => (
          <div key={s.label} className="stat-card" style={{ padding: "10px 12px" }}>
            <div className="kpi-label">{s.label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-lg)", fontWeight: 600, color: s.color, marginTop: 2 }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Daily P&L */}
      {dailyData.length > 1 && (
        <div className="stat-card">
          <div className="section-label" style={{ marginBottom: 12 }}>Daily P&L</div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={dailyData} barSize={18} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false}/>
              <XAxis dataKey="date" tick={{ fill: "var(--text-dim)", fontSize: 9 }} tickLine={false} axisLine={false}/>
              <YAxis tick={{ fill: "var(--text-dim)", fontSize: 9 }} tickLine={false} axisLine={false} width={40}/>
              <Tooltip {...chartTip} formatter={v => [formatCurrency(v, false, sym), "P&L"]}/>
              <ReferenceLine y={0} stroke="var(--border)"/>
              <Bar dataKey="pnl" radius={[3,3,0,0]}>
                {dailyData.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? "var(--success)" : "var(--danger)"} fillOpacity={0.85}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Insights row */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, 1fr)", gap: 8 }}>
        {[
          { label: "Top Pair",       val: stats.topPair,     color: "var(--text)" },
          { label: "Top Strategy",   val: stats.topStrategy, color: "var(--text)" },
          { label: "Top Emotion",    val: stats.topEmotion,  color: "var(--text)" },
          { label: "Max Win Streak", val: `${stats.maxWinStreak}x`,  color: "var(--success)" },
          { label: "Max Loss Streak",val: `${stats.maxLossStreak}x`, color: "var(--danger)" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "8px 12px" }}>
            <div className="kpi-label">{s.label}</div>
            <div style={{ fontSize: "var(--fs-base)", color: s.color, fontWeight: 500, marginTop: 2 }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Trade list */}
      <div className="stat-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)" }}>
          <span className="section-label">Trades</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th><th>Pair</th><th>Side</th><th>Strategy</th>
                <th className="text-right">P&L</th><th className="text-right">R:R</th><th>Emotion</th>
              </tr>
            </thead>
            <tbody>
              {[...trades].sort((a, b) => new Date(b.date) - new Date(a.date)).map(tr => (
                <tr key={tr.id}>
                  <td style={{ color: "var(--text-dim)", fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)" }}>{tr.date.slice(5)}</td>
                  <td style={{ fontWeight: 500, color: "var(--text)", fontFamily: "var(--font-mono)" }}>{tr.pair}</td>
                  <td><span className={`badge ${tr.side === "BUY" ? "badge-green" : "badge-yellow"}`}>{tr.side}</span></td>
                  <td style={{ color: "var(--text-muted)" }}>{tr.strategy}</td>
                  <td className="text-right">
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: (tr.pnl ?? 0) >= 0 ? "var(--success)" : "var(--danger)" }}>
                      {formatCurrency(tr.pnl ?? 0, false, sym)}
                    </span>
                  </td>
                  <td className="text-right mono" style={{ color: (tr.rr ?? 0) >= 1 ? "var(--success)" : "var(--warning)" }}>
                    {formatRR(tr.rr ?? 0)}
                  </td>
                  <td style={{ color: "var(--text-dim)", fontSize: "var(--fs-xs)" }}>{tr.emotion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Comparison Section ────────────────────────────────────────────
function calcCompStats(trades) {
  if (!trades?.length) return null;
  const wins      = trades.filter(tr => tr.pnl > 0);
  const losses    = trades.filter(tr => tr.pnl <= 0);
  const totalPnl  = trades.reduce((s, tr) => s + (tr.pnl || 0), 0);
  const grossWin  = wins.reduce((s, tr) => s + tr.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, tr) => s + (tr.pnl || 0), 0));
  const rrTrades  = trades.filter(tr => tr.rr);
  const avgRR     = rrTrades.length ? rrTrades.reduce((s, tr) => s + (tr.rr || 0), 0) / rrTrades.length : 0;
  let equity = 0;
  const curve = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((tr, i) => { equity += tr.pnl || 0; return { i: i + 1, equity }; });
  return {
    totalTrades: trades.length, wins: wins.length, losses: losses.length,
    winRate: trades.length ? (wins.length / trades.length) * 100 : 0,
    totalPnl, profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 999 : 0,
    avgRR, avgWin: wins.length ? grossWin / wins.length : 0,
    avgLoss: losses.length ? grossLoss / losses.length : 0,
    grossWin, grossLoss, curve,
  };
}

function ComparisonSection({ trades, currencyMeta }) {
  const { isMobile } = useBreakpoint();
  const sym = currencyMeta?.symbol ?? "$";
  const [mode,    setMode]    = useState("month");
  const [periodA, setPeriodA] = useState("");
  const [periodB, setPeriodB] = useState("");

  const months = useMemo(() => {
    const s = new Set((trades || []).map(tr => tr.date?.slice(0,7)).filter(Boolean));
    return [...s].sort().reverse();
  }, [trades]);

  const strategies = useMemo(() => {
    const s = new Set((trades || []).map(tr => tr.strategy).filter(Boolean));
    return [...s].sort();
  }, [trades]);

  const options = mode === "month" ? months : strategies;

  useMemo(() => {
    if (options.length >= 2 && !periodA) { setPeriodA(options[1]); setPeriodB(options[0]); }
  }, [options]); // eslint-disable-line

  const filter = (p) => !p ? [] : mode === "month"
    ? (trades || []).filter(tr => tr.date?.startsWith(p))
    : (trades || []).filter(tr => tr.strategy === p);

  const tradesA = useMemo(() => filter(periodA), [trades, periodA, mode]); // eslint-disable-line
  const tradesB = useMemo(() => filter(periodB), [trades, periodB, mode]); // eslint-disable-line
  const statsA  = useMemo(() => calcCompStats(tradesA), [tradesA]);
  const statsB  = useMemo(() => calcCompStats(tradesB), [tradesB]);

  const curveData = useMemo(() => {
    if (!statsA || !statsB) return [];
    const maxLen = Math.max(statsA.curve.length, statsB.curve.length);
    return Array.from({ length: maxLen }, (_, i) => ({
      i: i + 1,
      A: statsA.curve[i]?.equity ?? statsA.curve.at(-1)?.equity ?? 0,
      B: statsB.curve[i]?.equity ?? statsB.curve.at(-1)?.equity ?? 0,
    }));
  }, [statsA, statsB]);

  const metrics = statsA && statsB ? [
    { label: "Total Trades",  a: statsA.totalTrades,   b: statsB.totalTrades,   fmt: v => v,                              higher: true },
    { label: "Win Rate",      a: statsA.winRate,        b: statsB.winRate,        fmt: v => `${v.toFixed(1)}%`,            higher: true },
    { label: "Total P&L",     a: statsA.totalPnl,       b: statsB.totalPnl,       fmt: v => `${sym}${v.toFixed(0)}`,       higher: true },
    { label: "Profit Factor", a: statsA.profitFactor,   b: statsB.profitFactor,   fmt: v => v >= 999 ? "∞" : v.toFixed(2), higher: true },
    { label: "Avg R:R",       a: statsA.avgRR,          b: statsB.avgRR,          fmt: v => v.toFixed(2),                  higher: true },
    { label: "Avg Win",       a: statsA.avgWin,         b: statsB.avgWin,         fmt: v => `${sym}${v.toFixed(0)}`,       higher: true },
    { label: "Avg Loss",      a: statsA.avgLoss,        b: statsB.avgLoss,        fmt: v => `${sym}${v.toFixed(0)}`,       higher: false },
    { label: "Gross Profit",  a: statsA.grossWin,       b: statsB.grossWin,       fmt: v => `${sym}${v.toFixed(0)}`,       higher: true },
  ] : [];

  return (
    <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
      <div className="divider-with-label" style={{ marginBottom: 20 }}>
        <span className="divider-label">Performance Comparison</span>
      </div>

      {/* Mode + selectors */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 2, background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 2 }}>
          {[{ v: "month", l: "Bulan" }, { v: "strategy", l: "Strategi" }].map(m => (
            <button key={m.v} onClick={() => { setMode(m.v); setPeriodA(""); setPeriodB(""); }} style={{
              padding: "5px 14px", borderRadius: "var(--r-sm)", border: "none", cursor: "pointer",
              fontSize: "var(--fs-sm)",
              background: mode === m.v ? "var(--accent)"    : "transparent",
              color:      mode === m.v ? "var(--text-inverse)" : "var(--text-dim)",
              fontWeight: mode === m.v ? 600 : 400,
            }}>{m.l}</button>
          ))}
        </div>
        <select value={periodA} onChange={e => setPeriodA(e.target.value)} style={{
          background: "var(--success-dim)", border: "1px solid var(--success)",
          color: "var(--success)", borderRadius: "var(--r-md)", padding: "6px 10px",
          fontSize: "var(--fs-sm)", fontFamily: "var(--font-mono)", cursor: "pointer",
        }}>
          <option value="">— Periode A —</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <span style={{ color: "var(--text-dim)", fontSize: "var(--fs-base)" }}>vs</span>
        <select value={periodB} onChange={e => setPeriodB(e.target.value)} style={{
          background: "var(--accent2-dim)", border: "1px solid var(--accent2)",
          color: "var(--accent2)", borderRadius: "var(--r-md)", padding: "6px 10px",
          fontSize: "var(--fs-sm)", fontFamily: "var(--font-mono)", cursor: "pointer",
        }}>
          <option value="">— Periode B —</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      {(!periodA || !periodB) ? (
        <div className="empty-state"><div className="empty-desc">Pilih dua periode untuk dibandingkan</div></div>
      ) : (!statsA || !statsB) ? (
        <div className="empty-state"><div className="empty-desc">Tidak ada trade untuk salah satu periode</div></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 40px 1fr", gap: 10, alignItems: "center" }}>
            {[
              { label: `A — ${periodA}`, s: statsA, color: "var(--success)",  bg: "var(--success-dim)",  border: "var(--success)" },
              { label: `B — ${periodB}`, s: statsB, color: "var(--accent2)",  bg: "var(--accent2-dim)",  border: "var(--accent2)" },
            ].map((item, idx) => (
              <>
                {idx === 1 && !isMobile && (
                  <div key="vs" style={{ textAlign: "center", fontSize: 18, color: "var(--text-dim)" }}>⇆</div>
                )}
                <div key={item.label} style={{ background: item.bg, border: `1px solid ${item.border}`, borderRadius: "var(--r-lg)", padding: "14px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: "var(--fs-2xs)", color: item.color, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-2xl)", color: item.s.totalPnl >= 0 ? "var(--success)" : "var(--danger)", fontWeight: 700 }}>
                    {item.s.totalPnl >= 0 ? "+" : ""}{sym}{item.s.totalPnl.toFixed(0)}
                  </div>
                  <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 4 }}>
                    {item.s.totalTrades} trades · {item.s.winRate.toFixed(0)}% WR
                  </div>
                </div>
              </>
            ))}
          </div>

          {/* Equity comparison */}
          {curveData.length > 0 && (
            <div className="stat-card">
              <div className="section-label" style={{ marginBottom: 12 }}>Equity Curve Comparison</div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={curveData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false}/>
                  <XAxis dataKey="i" tick={{ fill: "var(--text-dim)", fontSize: 9 }} tickLine={false} axisLine={false}/>
                  <YAxis tick={{ fill: "var(--text-dim)", fontSize: 9 }} tickLine={false} axisLine={false}
                    tickFormatter={v => `${sym}${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v.toFixed(0)}`} width={44}/>
                  <Tooltip {...chartTip} formatter={(v, name) => [`${sym}${v.toFixed(0)}`, name === "A" ? periodA : periodB]}/>
                  <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="4 4"/>
                  <Line type="monotone" dataKey="A" stroke="var(--success)" strokeWidth={2} dot={false}/>
                  <Line type="monotone" dataKey="B" stroke="var(--accent2)"  strokeWidth={2} dot={false}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Metrics table */}
          <div className="stat-card">
            <div className="section-label" style={{ marginBottom: 12 }}>Perbandingan Metrik</div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Metrik</th>
                  <th className="text-right" style={{ color: "var(--success)" }}>A — {periodA}</th>
                  <th className="text-center">Delta</th>
                  <th className="text-right" style={{ color: "var(--accent2)" }}>B — {periodB}</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map(m => {
                  const delta = m.b - m.a;
                  const aWins = m.higher ? m.a > m.b : m.a < m.b;
                  const bWins = m.higher ? m.b > m.a : m.b < m.a;
                  const dColor = delta === 0 ? "var(--text-dim)" : (m.higher ? delta > 0 : delta < 0) ? "var(--success)" : "var(--danger)";
                  return (
                    <tr key={m.label}>
                      <td style={{ color: "var(--text-muted)" }}>{m.label}</td>
                      <td className="text-right" style={{ fontFamily: "var(--font-mono)", color: aWins ? "var(--success)" : "var(--text)", fontWeight: aWins ? 600 : 400 }}>
                        {m.fmt(m.a)}
                      </td>
                      <td className="text-center">
                        <span style={{ fontSize: "var(--fs-xs)", color: dColor, fontFamily: "var(--font-mono)" }}>
                          {delta > 0 ? "▲" : delta < 0 ? "▼" : "—"} {delta !== 0 ? m.fmt(Math.abs(delta)) : ""}
                        </span>
                      </td>
                      <td className="text-right" style={{ fontFamily: "var(--font-mono)", color: bWins ? "var(--accent2)" : "var(--text)", fontWeight: bWins ? 600 : 400 }}>
                        {m.fmt(m.b)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Insights */}
          <div style={{ background: "var(--success-dim)", border: "1px solid var(--success)", borderRadius: "var(--r-lg)", padding: "14px 16px" }}>
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--success)", fontWeight: 500, marginBottom: 8 }}>💡 Insight</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {[
                statsB.winRate - statsA.winRate > 5  ? `Win rate naik ${(statsB.winRate - statsA.winRate).toFixed(1)}% dari ${periodA} ke ${periodB}` : null,
                statsA.winRate - statsB.winRate > 5  ? `Win rate turun ${(statsA.winRate - statsB.winRate).toFixed(1)}% — perlu evaluasi` : null,
                statsB.totalPnl > statsA.totalPnl    ? `P&L lebih baik di ${periodB} (+${sym}${(statsB.totalPnl - statsA.totalPnl).toFixed(0)} selisih)` : null,
                statsA.totalPnl > statsB.totalPnl    ? `P&L lebih baik di ${periodA} (+${sym}${(statsA.totalPnl - statsB.totalPnl).toFixed(0)} selisih)` : null,
                statsB.avgRR - statsA.avgRR > 0.2    ? `R:R membaik di ${periodB} (+${(statsB.avgRR - statsA.avgRR).toFixed(2)})` : null,
              ].filter(Boolean).map((tip, i) => (
                <div key={i} style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", display: "flex", gap: 8 }}>
                  <span style={{ color: "var(--accent)", flexShrink: 0 }}>→</span>{tip}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Review ───────────────────────────────────────────────────
export default function Review({ trades, currencyMeta, theme }) {
  const sym = currencyMeta?.symbol ?? "$";
  const { isMobile } = useBreakpoint();
  const [mode,     setMode]     = useState("monthly");
  const [selected, setSelected] = useState(0);

  const periods = useMemo(() => groupByPeriod(trades, mode), [trades, mode]);

  if (!trades?.length) return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 20 }}>Review</h1>
      <div className="stat-card">
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-title">Belum ada trade</div>
          <div className="empty-desc">Log beberapa trade untuk melihat review performa</div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Review</h1>
          <p className="page-subtitle">Analisis performa per periode</p>
        </div>
        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 2, background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 2 }}>
          {[["weekly","Weekly"],["monthly","Monthly"]].map(([m, label]) => (
            <button key={m} onClick={() => { setMode(m); setSelected(0); }} style={{
              padding: "6px 18px", borderRadius: "var(--r-sm)", border: "none", cursor: "pointer",
              background: mode === m ? "var(--bg-card)" : "transparent",
              color:      mode === m ? "var(--text)"    : "var(--text-dim)",
              fontSize: "var(--fs-sm)", fontWeight: mode === m ? 500 : 400,
              boxShadow:  mode === m ? "var(--shadow-sm)" : "none",
              transition: "all var(--t-base)",
            }}>{label}</button>
          ))}
        </div>
      </div>

      {periods.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-dim)" }}>Tidak ada data.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "260px 1fr", gap: 16, alignItems: "start" }}>
          {/* Period list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: isMobile ? "40vh" : "80vh", overflowY: "auto", paddingRight: 2 }}>
            {periods.map((p, i) => (
              <PeriodCard key={p.key} period={p} sym={sym} isSelected={i === selected} onClick={() => setSelected(i)}/>
            ))}
          </div>
          {/* Detail */}
          <div>
            {periods[selected] && <DetailPanel period={periods[selected]} sym={sym}/>}
          </div>
        </div>
      )}

      {/* Comparison */}
      <ComparisonSection trades={trades} currencyMeta={currencyMeta}/>
    </div>
  );
}