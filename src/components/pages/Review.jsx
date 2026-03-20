import { useState, useMemo } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import { formatCurrency, formatPct, formatRR } from "../../utils/formatters";

// ── Pure helpers ─────────────────────────────────────────────────

function getWeekKey(dateStr) {
  const d   = new Date(dateStr + "T00:00:00");
  const day = d.getDay(); // 0=Sun
  const mon = new Date(d);
  mon.setDate(d.getDate() - ((day + 6) % 7)); // Monday
  return mon.toISOString().slice(0, 10);
}

function getMonthKey(dateStr) {
  return dateStr.slice(0, 7);
}

function calcPeriodStats(trades) {
  if (!trades.length) return null;
  const wins   = trades.filter(tr => tr.pnl > 0);
  const losses = trades.filter(tr => tr.pnl <= 0);
  const totalPnl    = trades.reduce((s, tr) => s + tr.pnl, 0);
  const grossProfit = wins.reduce((s, tr) => s + tr.pnl, 0);
  const grossLoss   = Math.abs(losses.reduce((s, tr) => s + tr.pnl, 0));
  const avgRR       = trades.filter(tr => tr.rr).length
    ? trades.filter(tr => tr.rr).reduce((s, tr) => s + (tr.rr ?? 0), 0) / trades.filter(tr => tr.rr).length
    : 0;

  // Best/worst streak
  let streak = 0, maxWin = 0, maxLoss = 0, curStreak = 0, curType = null;
  [...trades].sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(tr => {
    const type = tr.pnl > 0 ? "win" : "loss";
    if (type === curType) { curStreak++; }
    else { curStreak = 1; curType = type; }
    if (type === "win"  && curStreak > maxWin)  maxWin  = curStreak;
    if (type === "loss" && curStreak > maxLoss) maxLoss = curStreak;
  });

  // Most traded pair & strategy
  const pairCount     = {};
  const stratCount    = {};
  const emotionCount  = {};
  trades.forEach(tr => {
    pairCount[tr.pair]         = (pairCount[tr.pair]         ?? 0) + 1;
    stratCount[tr.strategy]    = (stratCount[tr.strategy]    ?? 0) + 1;
    emotionCount[tr.emotion]   = (emotionCount[tr.emotion]   ?? 0) + 1;
  });
  const topPair     = Object.entries(pairCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
  const topStrategy = Object.entries(stratCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
  const topEmotion  = Object.entries(emotionCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";

  return {
    totalPnl, trades: trades.length,
    wins: wins.length, losses: losses.length,
    winRate: trades.length ? (wins.length / trades.length) * 100 : 0,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0,
    avgWin:  wins.length   ? grossProfit / wins.length   : 0,
    avgLoss: losses.length ? -grossLoss  / losses.length : 0,
    avgRR, maxWinStreak: maxWin, maxLossStreak: maxLoss,
    topPair, topStrategy, topEmotion,
    bestTrade:  trades.length > 0 ? Math.max(...trades.map(tr => tr.pnl)) : 0,
    worstTrade: trades.length > 0 ? Math.min(...trades.map(tr => tr.pnl)) : 0,
  };
}

function groupTradesByPeriod(trades, mode) {
  const groups = {};
  trades.forEach(tr => {
    const key = mode === "weekly" ? getWeekKey(tr.date) : getMonthKey(tr.date);
    if (!groups[key]) groups[key] = [];
    groups[key].push(tr);
  });
  return Object.entries(groups)
    .sort((a, b) => b[0].localeCompare(a[0])) // newest first
    .map(([key, ts]) => ({ key, stats: calcPeriodStats(ts), trades: ts }));
}

// ── Sub-components ───────────────────────────────────────────────

function StatChip({ label, value, color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "inherit", opacity: 0.6 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500, color: color ?? "inherit" }}>{value}</span>
    </div>
  );
}

function PeriodCard({ period, sym, isSelected, onClick, theme: t }) {
  const { stats, key } = period;
  if (!stats) return null;
  const positive = stats.totalPnl >= 0;
  const accent   = positive ? "#00d4aa" : "#ef4444";

  const label = key.length === 7
    ? new Date(key + "-01").toLocaleDateString("id-ID", { month: "long", year: "numeric" })
    : `W ${new Date(key + "T00:00:00").toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}`;

  return (
    <div onClick={onClick} style={{
      background:  isSelected ? `${accent}12` : t.bgCard,
      borderTop:    `1px solid ${isSelected ? accent : t.border}`,
      borderRight:  `1px solid ${isSelected ? accent : t.border}`,
      borderBottom: `1px solid ${isSelected ? accent : t.border}`,
      borderLeft:   `3px solid ${accent}`,
      borderRadius: 10, padding: "14px 16px",
      cursor: "pointer", transition: "all 0.15s",
    }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = t.bgHover; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = t.bgCard; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: t.text }}>{label}</div>
          <div style={{ fontSize: 10, color: t.textDim, marginTop: 2 }}>{stats.trades} trades · {stats.winRate.toFixed(0)}% WR</div>
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: accent, textAlign: "right" }}>
          {formatCurrency(stats.totalPnl, false, sym)}
          <div style={{ fontSize: 9, color: t.textDim, fontWeight: 400 }}>
            {stats.profitFactor >= 999 ? "PF: ∞" : `PF: ${stats.profitFactor.toFixed(2)}`}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {[...Array(stats.wins)].map((_, i)  => <div key={`w${i}`}  style={{ flex: 1, height: 4, background: "#00d4aa", borderRadius: 2 }} />)}
        {[...Array(stats.losses)].map((_, i) => <div key={`l${i}`} style={{ flex: 1, height: 4, background: "#ef4444", borderRadius: 2 }} />)}
      </div>

    </div>
  );
}

function DetailPanel({ period, sym, allTrades, theme: t }) {
  const { isMobile, md } = useBreakpoint();
  const { stats, trades, key } = period;
  if (!stats) return null;

  const accent    = stats.totalPnl >= 0 ? "#00d4aa" : "#ef4444";
  const sortedT   = [...trades].sort((a, b) => new Date(b.date) - new Date(a.date));
  const dailyData = useMemo(() => {
    const map = {};
    trades.forEach(tr => {
      map[tr.date] = (map[tr.date] ?? 0) + tr.pnl;
    });
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, pnl]) => ({ date: date.slice(5), pnl }));
  }, [trades]);

  const label = key.length === 7
    ? new Date(key + "-01").toLocaleDateString("id-ID", { month: "long", year: "numeric" })
    : `Week of ${new Date(key + "T00:00:00").toLocaleDateString("id-ID", { day: "2-digit", month: "long" })}`;

  const tooltipStyle = {
    contentStyle: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 8, fontFamily: "DM Mono", fontSize: 11, color: t.text },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Title */}
      <div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2, color: t.text }}>{label}</div>
        <div style={{ fontSize: 11, color: t.textDim }}>{stats.trades} trades · {stats.wins}W {stats.losses}L</div>
      </div>

      {/* Key stats */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10 }}>
        {[
          { label: "Total P&L",     value: formatCurrency(stats.totalPnl, false, sym),  color: accent },
          { label: "Win Rate",      value: `${stats.winRate.toFixed(1)}%`,               color: stats.winRate >= 50 ? "#00d4aa" : "#f59e0b" },
          { label: "Profit Factor", value: stats.profitFactor >= 999 ? "∞" : stats.profitFactor.toFixed(2), color: stats.profitFactor >= 1 ? "#00d4aa" : "#ef4444" },
          { label: "Avg R:R",       value: formatRR(stats.avgRR),                        color: stats.avgRR >= 1 ? "#00d4aa" : "#f59e0b" },
          { label: "Avg Win",       value: formatCurrency(stats.avgWin,  false, sym),    color: "#00d4aa" },
          { label: "Avg Loss",      value: formatCurrency(stats.avgLoss, false, sym),    color: "#ef4444" },
          { label: "Best Trade",    value: formatCurrency(stats.bestTrade,  false, sym), color: "#00d4aa" },
          { label: "Worst Trade",   value: formatCurrency(stats.worstTrade, false, sym), color: "#ef4444" },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ padding: "12px 14px" }}>
            <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Daily P&L bar chart */}
      {dailyData.length > 1 && (
        <div className="stat-card">
          <div style={{ fontSize: 10, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Daily P&L</div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={dailyData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} vertical={false} />
              <XAxis dataKey="date" tick={{ fill: t.textDim, fontSize: 9, fontFamily: "DM Mono" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: t.textDim, fontSize: 9, fontFamily: "DM Mono" }} tickLine={false} axisLine={false} tickFormatter={v => `${sym}${v}`} />
              <Tooltip {...tooltipStyle} formatter={v => [formatCurrency(v, false, sym), "P&L"]} />
              <ReferenceLine y={0} stroke={t.border} />
              <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                {dailyData.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? "#00d4aa" : "#ef4444"} fillOpacity={0.8} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Insights row */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 10 }}>
        {[
          { label: "Top Pair",     value: stats.topPair },
          { label: "Top Strategy", value: stats.topStrategy },
          { label: "Top Emotion",  value: stats.topEmotion },
        ].map(s => (
          <div key={s.label} style={{ background: t.bgSubtle, border: `1px solid ${t.borderSubtle}`, borderRadius: 8, padding: "10px 14px" }}>
            <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 13, color: t.text }}>{s.value}</div>
          </div>
        ))}
        {[
          { label: "Max Win Streak",  value: `${stats.maxWinStreak}x 🔥`,  color: "#00d4aa" },
          { label: "Max Loss Streak", value: `${stats.maxLossStreak}x`,     color: "#ef4444" },
        ].map(s => (
          <div key={s.label} style={{ background: t.bgSubtle, border: `1px solid ${t.borderSubtle}`, borderRadius: 8, padding: "10px 14px" }}>
            <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 13, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Trade list */}
      <div className="stat-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${t.border}`, fontSize: 10, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Trades
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="trade-table">
            <thead>
              <tr>
                <th>Date</th><th>Pair</th><th>Side</th><th>Strategy</th>
                <th>P&L</th><th>R:R</th><th>Emotion</th>
              </tr>
            </thead>
            <tbody>
              {sortedT.map(trade => (
                <tr key={trade.id}>
                  <td style={{ color: t.textDim, fontSize: 11 }}>{trade.date.slice(5)}</td>
                  <td style={{ fontWeight: 500, color: t.text }}>{trade.pair}</td>
                  <td><span className={`badge badge-${(trade.side ?? "").toLowerCase()}`}>{trade.side}</span></td>
                  <td style={{ color: t.textMuted }}>{trade.strategy}</td>
                  <td style={{ color: trade.pnl >= 0 ? "#00d4aa" : "#ef4444", fontWeight: 500 }}>
                    {formatCurrency(trade.pnl, false, sym)}
                  </td>
                  <td style={{ color: (trade.rr ?? 0) >= 0 ? "#00d4aa" : "#ef4444" }}>
                    {formatRR(trade.rr ?? 0)}
                  </td>
                  <td style={{ color: t.textDim, fontSize: 11 }}>{trade.emotion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// ── Main Review Page ─────────────────────────────────────────────

// ── Comparison helpers ────────────────────────────────────────────
function calcCompStats(trades) {
  if (!trades || trades.length === 0) return null;
  const wins      = trades.filter(tr => tr.pnl > 0);
  const losses    = trades.filter(tr => tr.pnl <= 0);
  const totalPnl  = trades.reduce((s, tr) => s + (tr.pnl || 0), 0);
  const grossWin  = wins.reduce((s, tr) => s + tr.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, tr) => s + (tr.pnl || 0), 0));
  const winRate   = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
  const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 999 : 0;
  const avgRR     = trades.filter(tr => tr.rr).length > 0
    ? trades.filter(tr => tr.rr).reduce((s, tr) => s + (tr.rr || 0), 0) / trades.filter(tr => tr.rr).length : 0;
  const avgWin    = wins.length > 0 ? grossWin / wins.length : 0;
  const avgLoss   = losses.length > 0 ? grossLoss / losses.length : 0;

  // Equity curve
  let equity = 0;
  const curve = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((tr, i) => { equity += tr.pnl || 0; return { i: i + 1, equity }; });

  return { totalTrades: trades.length, wins: wins.length, losses: losses.length,
    winRate, totalPnl, profitFactor, avgRR, avgWin, avgLoss, grossWin, grossLoss, curve };
}

function DeltaBadge({ val, formatFn, theme: t, higherIsBetter = true }) {
  if (val === null || val === undefined || isNaN(val)) return <span style={{ color: t.textDim, fontSize: 11 }}>—</span>;
  const positive = higherIsBetter ? val > 0 : val < 0;
  const color    = val === 0 ? t.textDim : positive ? "#00c896" : "#ef4444";
  const prefix   = val > 0 ? "▲ +" : val < 0 ? "▼ " : "";
  return (
    <span style={{ fontSize: 11, color, fontFamily: "DM Mono, monospace" }}>
      {prefix}{formatFn ? formatFn(Math.abs(val)) : Math.abs(val).toFixed(2)}
    </span>
  );
}

function ComparisonSection({ trades, currencyMeta, theme: t }) {
  const { isMobile } = useBreakpoint();
  const sym = currencyMeta?.symbol ?? "$";

  // Mode: month | strategy | custom
  const [mode, setMode]   = useState("month");
  const [periodA, setPeriodA] = useState("");
  const [periodB, setPeriodB] = useState("");

  // Get available months
  const months = useMemo(() => {
    const map = new Set((trades || []).map(tr => tr.date?.slice(0, 7)).filter(Boolean));
    return [...map].sort().reverse();
  }, [trades]);

  // Get available strategies
  const strategies = useMemo(() => {
    const map = new Set((trades || []).map(tr => tr.strategy).filter(Boolean));
    return [...map].sort();
  }, [trades]);

  const options = mode === "month" ? months : strategies;

  // Auto-set defaults
  useMemo(() => {
    if (options.length >= 2 && !periodA) {
      setPeriodA(options[1]);
      setPeriodB(options[0]);
    }
  }, [options]); // eslint-disable-line

  // Filter trades
  const tradesA = useMemo(() => {
    if (!periodA) return [];
    if (mode === "month")    return (trades || []).filter(tr => tr.date?.startsWith(periodA));
    if (mode === "strategy") return (trades || []).filter(tr => tr.strategy === periodA);
    return [];
  }, [trades, periodA, mode]);

  const tradesB = useMemo(() => {
    if (!periodB) return [];
    if (mode === "month")    return (trades || []).filter(tr => tr.date?.startsWith(periodB));
    if (mode === "strategy") return (trades || []).filter(tr => tr.strategy === periodB);
    return [];
  }, [trades, periodB, mode]);

  const statsA = useMemo(() => calcCompStats(tradesA), [tradesA]);
  const statsB = useMemo(() => calcCompStats(tradesB), [tradesB]);

  const metrics = statsA && statsB ? [
    { label: "Total Trades",   a: statsA.totalTrades, b: statsB.totalTrades, fmt: v => v, higher: true },
    { label: "Win Rate",       a: statsA.winRate,     b: statsB.winRate,     fmt: v => v.toFixed(1) + "%", higher: true },
    { label: "Total P&L",      a: statsA.totalPnl,    b: statsB.totalPnl,    fmt: v => sym + v.toFixed(0), higher: true },
    { label: "Profit Factor",  a: statsA.profitFactor, b: statsB.profitFactor, fmt: v => v >= 999 ? "∞" : v.toFixed(2), higher: true },
    { label: "Avg R:R",        a: statsA.avgRR,        b: statsB.avgRR,       fmt: v => v.toFixed(2), higher: true },
    { label: "Avg Win",        a: statsA.avgWin,       b: statsB.avgWin,      fmt: v => sym + v.toFixed(0), higher: true },
    { label: "Avg Loss",       a: statsA.avgLoss,      b: statsB.avgLoss,     fmt: v => sym + v.toFixed(0), higher: false },
    { label: "Gross Profit",   a: statsA.grossWin,     b: statsB.grossWin,    fmt: v => sym + v.toFixed(0), higher: true },
  ] : [];

  // Combined equity curves
  const curveData = useMemo(() => {
    if (!statsA || !statsB) return [];
    const maxLen = Math.max(statsA.curve.length, statsB.curve.length);
    return Array.from({ length: maxLen }, (_, i) => ({
      i: i + 1,
      A: statsA.curve[i]?.equity ?? statsA.curve[statsA.curve.length - 1]?.equity ?? 0,
      B: statsB.curve[i]?.equity ?? statsB.curve[statsB.curve.length - 1]?.equity ?? 0,
    }));
  }, [statsA, statsB]);

  const chartTooltip = {
    contentStyle: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 8, fontSize: 11 },
  };

  return (
    <div style={{ marginTop: 28, paddingTop: 24, borderTop: `1px solid ${t.borderSubtle}` }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${t.border})` }} />
        <div style={{ fontSize: 9, color: t.accent, textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 600 }}>
          Performance Comparison
        </div>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(270deg, transparent, ${t.border})` }} />
      </div>

      {/* Mode selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 3, background: t.bgSubtle, border: `1px solid ${t.border}`, borderRadius: 8, padding: 3 }}>
          {[{ v: "month", l: "📅 Bulan" }, { v: "strategy", l: "🎯 Strategi" }].map(m => (
            <button key={m.v} onClick={() => { setMode(m.v); setPeriodA(""); setPeriodB(""); }}
              style={{ padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, background: mode === m.v ? t.accent : "transparent", color: mode === m.v ? "#090e1a" : t.textDim, fontWeight: mode === m.v ? 600 : 400 }}>
              {m.l}
            </button>
          ))}
        </div>

        {/* Period selectors */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1, flexWrap: "wrap" }}>
          <select value={periodA} onChange={e => setPeriodA(e.target.value)}
            style={{ background: "rgba(0,200,150,0.08)", border: "1px solid rgba(0,200,150,0.3)", color: "#00c896", borderRadius: 7, padding: "6px 10px", fontSize: 12, fontFamily: "DM Mono, monospace", cursor: "pointer" }}>
            <option value="">— Periode A —</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <span style={{ color: t.textDim, fontSize: 13 }}>vs</span>
          <select value={periodB} onChange={e => setPeriodB(e.target.value)}
            style={{ background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.3)", color: "#0ea5e9", borderRadius: 7, padding: "6px 10px", fontSize: 12, fontFamily: "DM Mono, monospace", cursor: "pointer" }}>
            <option value="">— Periode B —</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {(!periodA || !periodB) ? (
        <div style={{ textAlign: "center", padding: "32px 24px", color: t.textDim, fontSize: 13 }}>
          Pilih dua periode untuk dibandingkan
        </div>
      ) : (!statsA || !statsB) ? (
        <div style={{ textAlign: "center", padding: "32px 24px", color: t.textDim, fontSize: 13 }}>
          Tidak ada trade untuk salah satu periode
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Summary header */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 60px 1fr", gap: 10, alignItems: "center" }}>
            <div style={{ background: "rgba(0,200,150,0.06)", border: "1px solid rgba(0,200,150,0.2)", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#00c896", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>A — {periodA}</div>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: 22, color: statsA.totalPnl >= 0 ? "#00c896" : "#ef4444", fontWeight: 700 }}>
                {statsA.totalPnl >= 0 ? "+" : ""}{sym}{statsA.totalPnl.toFixed(0)}
              </div>
              <div style={{ fontSize: 11, color: t.textDim, marginTop: 4 }}>{statsA.totalTrades} trades · {statsA.winRate.toFixed(0)}% WR</div>
            </div>
            {!isMobile && <div style={{ textAlign: "center", fontSize: 18, color: t.textDim }}>⇆</div>}
            <div style={{ background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#0ea5e9", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>B — {periodB}</div>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: 22, color: statsB.totalPnl >= 0 ? "#00c896" : "#ef4444", fontWeight: 700 }}>
                {statsB.totalPnl >= 0 ? "+" : ""}{sym}{statsB.totalPnl.toFixed(0)}
              </div>
              <div style={{ fontSize: 11, color: t.textDim, marginTop: 4 }}>{statsB.totalTrades} trades · {statsB.winRate.toFixed(0)}% WR</div>
            </div>
          </div>

          {/* Equity curve comparison */}
          {curveData.length > 0 && (
            <div className="stat-card">
              <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600, marginBottom: 14 }}>Equity Curve Comparison</div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={curveData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} vertical={false} />
                  <XAxis dataKey="i" tick={{ fill: t.textDim, fontSize: 9 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: t.textDim, fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `${sym}${v >= 1000 ? (v/1000).toFixed(0)+"k" : v.toFixed(0)}`} width={44} />
                  <Tooltip {...chartTooltip} formatter={(v, name) => [`${sym}${v.toFixed(0)}`, name === "A" ? periodA : periodB]} />
                  <ReferenceLine y={0} stroke={t.border} strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="A" stroke="#00c896" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="B" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Metrics comparison table */}
          <div className="stat-card">
            <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600, marginBottom: 14 }}>Perbandingan Metrik</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 1fr", gap: 8, padding: "6px 0", marginBottom: 4 }}>
                <div style={{ fontSize: 9, color: t.textDim }}>Metrik</div>
                <div style={{ fontSize: 9, color: "#00c896", textAlign: "right" }}>A — {periodA}</div>
                <div style={{ fontSize: 9, color: t.textDim, textAlign: "center" }}>Delta</div>
                <div style={{ fontSize: 9, color: "#0ea5e9", textAlign: "right" }}>B — {periodB}</div>
              </div>
              {metrics.map(m => {
                const delta = m.b - m.a;
                const aWins = m.higher ? m.a > m.b : m.a < m.b;
                const bWins = m.higher ? m.b > m.a : m.b < m.a;
                return (
                  <div key={m.label} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 1fr", gap: 8, padding: "9px 0", borderBottom: `1px solid ${t.borderSubtle}`, alignItems: "center" }}>
                    <div style={{ fontSize: 11, color: t.textMuted }}>{m.label}</div>
                    <div style={{ fontSize: 13, fontFamily: "DM Mono, monospace", color: aWins ? "#00c896" : t.text, fontWeight: aWins ? 600 : 400, textAlign: "right" }}>
                      {m.fmt(m.a)}
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <DeltaBadge val={delta} formatFn={v => m.fmt(v)} theme={t} higherIsBetter={m.higher} />
                    </div>
                    <div style={{ fontSize: 13, fontFamily: "DM Mono, monospace", color: bWins ? "#0ea5e9" : t.text, fontWeight: bWins ? 600 : 400, textAlign: "right" }}>
                      {m.fmt(m.b)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Highlight differences */}
          <div style={{ background: "rgba(0,200,150,0.04)", border: "1px solid rgba(0,200,150,0.15)", borderRadius: 12, padding: "14px 18px" }}>
            <div style={{ fontSize: 11, color: t.accent, fontWeight: 500, marginBottom: 10 }}>💡 Insight Perbandingan</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                statsB.winRate - statsA.winRate > 5 ? `Win rate meningkat ${(statsB.winRate - statsA.winRate).toFixed(1)}% dari ${periodA} ke ${periodB} — bagus!` : null,
                statsA.winRate - statsB.winRate > 5 ? `Win rate turun ${(statsA.winRate - statsB.winRate).toFixed(1)}% dari ${periodA} ke ${periodB} — perlu evaluasi` : null,
                statsB.totalPnl > statsA.totalPnl ? `P&L lebih baik di ${periodB} (+${sym}${(statsB.totalPnl - statsA.totalPnl).toFixed(0)} selisih)` : null,
                statsA.totalPnl > statsB.totalPnl ? `P&L lebih baik di ${periodA} (+${sym}${(statsA.totalPnl - statsB.totalPnl).toFixed(0)} selisih)` : null,
                statsB.avgRR - statsA.avgRR > 0.2 ? `R:R membaik di ${periodB} (+${(statsB.avgRR - statsA.avgRR).toFixed(2)})` : null,
                statsA.avgRR - statsB.avgRR > 0.2 ? `R:R lebih baik di ${periodA} (+${(statsA.avgRR - statsB.avgRR).toFixed(2)})` : null,
              ].filter(Boolean).map((tip, i) => (
                <div key={i} style={{ fontSize: 12, color: t.textMuted, display: "flex", gap: 8 }}>
                  <span style={{ color: t.accent, flexShrink: 0 }}>→</span>{tip}
                </div>
              ))}
              {[statsB.winRate - statsA.winRate, statsA.winRate - statsB.winRate, statsB.totalPnl - statsA.totalPnl].every(d => Math.abs(d) < 5) && (
                <div style={{ fontSize: 12, color: t.textDim }}>Performa kedua periode relatif mirip — tidak ada perbedaan signifikan</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Review({ trades, currencyMeta, theme }) {
  const t   = theme;
  const sym = currencyMeta?.symbol ?? "$";

  const { isMobile } = useBreakpoint();
  const [mode,     setMode]     = useState("monthly");
  const [selected, setSelected] = useState(0);

  const periods = useMemo(() => groupTradesByPeriod(trades, mode), [trades, mode]);

  // Auto-select first period on mode change
  const handleMode = m => { setMode(m); setSelected(0); };

  if (!trades.length) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0", color: t.textDim }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
        <div style={{ fontSize: 14 }}>Belum ada trade untuk direview.</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2, color: t.text }}>REVIEW</div>
          <div style={{ fontSize: 11, color: t.textDim }}>Analisis performa per periode</div>
        </div>
        {/* Mode toggle */}
        <div style={{ display: "flex", background: t.bgSubtle, borderRadius: 10, padding: 3, border: `1px solid ${t.border}` }}>
          {[["weekly", "Weekly"], ["monthly", "Monthly"]].map(([m, label]) => (
            <button key={m} onClick={() => handleMode(m)} style={{
              padding: "7px 20px", borderRadius: 8, border: "none", cursor: "pointer",
              background:  mode === m ? t.bgCard : "transparent",
              color:       mode === m ? t.text   : t.textDim,
              fontFamily: "DM Mono, monospace", fontSize: 12,
              fontWeight:  mode === m ? 500 : 400,
              boxShadow:   mode === m ? "0 1px 4px rgba(0,0,0,0.15)" : "none",
              transition: "all 0.15s",
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {periods.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: t.textDim }}>Tidak ada data.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "280px 1fr", gap: 20, alignItems: "start" }}>

          {/* Left — period list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: isMobile ? "40vh" : "80vh", overflowY: "auto", paddingRight: 4 }}>
            {periods.map((p, i) => (
              <PeriodCard
                key={p.key}
                period={p}
                sym={sym}
                isSelected={i === selected}
                onClick={() => setSelected(i)}
                theme={t}
              />
            ))}
          </div>

          {/* Right — detail */}
          <div>
            {periods[selected] && (
              <DetailPanel
                period={periods[selected]}
                sym={sym}
                allTrades={trades}
                theme={t}
              />
            )}
          </div>
        </div>
      )}


      {/* ── Performance Comparison ─── */}
      <ComparisonSection trades={trades} currencyMeta={currencyMeta} theme={t} />
    </div>
  );
}