import { useState, useMemo } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { formatCurrency } from "../../utils/formatters";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

// ── Compute per-account stats ─────────────────────────────────────
function calcAccountStats(trades, capital = 10000) {
  if (!trades || trades.length === 0) return null;
  const wins    = trades.filter(t => t.pnl >= 0);
  const losses  = trades.filter(t => t.pnl <  0);
  const totalPnl    = trades.reduce((s, t) => s + (t.pnl || 0), 0);
  const grossWin    = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss   = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const winRate     = (wins.length / trades.length) * 100;
  const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 999 : 0;
  const avgRR       = trades.filter(t => t.rr).reduce((s, t) => s + parseFloat(t.rr || 0), 0) / (trades.filter(t => t.rr).length || 1);
  const avgWin      = wins.length  > 0 ? grossWin  / wins.length  : 0;
  const avgLoss     = losses.length > 0 ? grossLoss / losses.length : 0;
  const bestTrade   = Math.max(...trades.map(t => t.pnl || 0));
  const worstTrade  = Math.min(...trades.map(t => t.pnl || 0));

  // Equity curve
  const sorted  = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  let equity    = capital;
  const curve   = sorted.map(t => { equity += (t.pnl || 0); return { date: t.date?.slice(5), equity: parseFloat(equity.toFixed(2)) }; });

  // Monthly PnL
  const monthMap = {};
  trades.forEach(t => {
    const m = t.date?.slice(0, 7);
    if (m) { if (!monthMap[m]) monthMap[m] = 0; monthMap[m] += t.pnl || 0; }
  });
  const monthlyPnl = Object.entries(monthMap).sort().map(([m, pnl]) => ({ month: m.slice(5), pnl }));

  return { totalPnl, winRate, profitFactor, avgRR, avgWin, avgLoss, bestTrade, worstTrade, trades: trades.length, wins: wins.length, losses: losses.length, grossWin, grossLoss, curve, monthlyPnl, capital };
}

// ── Stat cell with comparison delta ──────────────────────────────
function StatCell({ label, value, delta, highlight, theme: t }) {
  const dColor = delta > 0 ? "#00c896" : delta < 0 ? "#ef4444" : t.textDim;
  return (
    <td style={{ padding: "10px 12px", borderBottom: `1px solid ${t.borderSubtle}`, background: highlight ? "rgba(0,200,150,0.05)" : "transparent" }}>
      <div style={{ fontFamily: "DM Mono, monospace", fontSize: 13, fontWeight: 600, color: highlight ? "#00c896" : t.text }}>{value}</div>
      {delta !== undefined && delta !== 0 && (
        <div style={{ fontSize: 9, color: dColor, marginTop: 2 }}>{delta > 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}{label?.includes("%") || label?.includes("Rate") || label?.includes("RR") ? "" : ""}</div>
      )}
    </td>
  );
}

// ── Account color palette ─────────────────────────────────────────
const PALETTE = ["#00c896", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ef4444", "#f97316"];

// ── Main ──────────────────────────────────────────────────────────
export default function AccountComparison({ accounts, allTradesByAccount, settings, currencyMeta, theme }) {
  const t   = theme;
  const sym = currencyMeta?.symbol ?? "$";
  const { isMobile } = useBreakpoint();
  const capital = settings?.capitalInitial ?? 10000;

  const [selectedIds, setSelectedIds] = useState(() => (accounts || []).slice(0, 4).map(a => a.id));

  const filtered  = (accounts || []).filter(a => selectedIds.includes(a.id));
  const statsMap  = useMemo(() => {
    const map = {};
    (accounts || []).forEach(a => {
      const trades = allTradesByAccount?.[a.id] || [];
      map[a.id]    = calcAccountStats(trades, capital);
    });
    return map;
  }, [accounts, allTradesByAccount, capital]);

  function toggleAccount(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  if (!accounts || accounts.length === 0) return (
    <div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 3, color: t.text, marginBottom: 20 }}>ACCOUNT COMPARISON</div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏦</div>
        <div style={{ fontSize: 15, color: t.text, marginBottom: 8 }}>Belum ada akun</div>
        <div style={{ fontSize: 12, color: t.textDim, maxWidth: 280, lineHeight: 1.8 }}>Buat lebih dari satu akun untuk mulai membandingkan performa</div>
      </div>
    </div>
  );

  if (accounts.length < 2) return (
    <div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 3, color: t.text, marginBottom: 20 }}>ACCOUNT COMPARISON</div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>➕</div>
        <div style={{ fontSize: 15, color: t.text, marginBottom: 8 }}>Butuh minimal 2 akun</div>
        <div style={{ fontSize: 12, color: t.textDim, maxWidth: 280, lineHeight: 1.8 }}>Buat akun kedua (misal: Demo vs Live, atau Personal vs Prop Firm) untuk membandingkan performa</div>
      </div>
    </div>
  );

  // Best account by total PnL
  const sortedByPnl = [...accounts].filter(a => statsMap[a.id]).sort((a, b) => (statsMap[b.id]?.totalPnl || 0) - (statsMap[a.id]?.totalPnl || 0));
  const bestAccount = sortedByPnl[0];

  // Combined equity curve data
  const equityData = useMemo(() => {
    const allDates = [...new Set(filtered.flatMap(a => (statsMap[a.id]?.curve || []).map(p => p.date)))].sort();
    return allDates.map(date => {
      const point = { date };
      filtered.forEach(a => {
        const curve = statsMap[a.id]?.curve || [];
        const found = curve.find(p => p.date === date);
        if (found) point[a.id] = found.equity;
      });
      return point;
    });
  }, [filtered, statsMap]);

  // Monthly PnL comparison data
  const monthlyData = useMemo(() => {
    const allMonths = [...new Set(filtered.flatMap(a => (statsMap[a.id]?.monthlyPnl || []).map(p => p.month)))].sort();
    return allMonths.map(month => {
      const point = { month };
      filtered.forEach(a => {
        const mp = statsMap[a.id]?.monthlyPnl || [];
        const found = mp.find(p => p.month === month);
        point[a.id] = found ? found.pnl : 0;
      });
      return point;
    });
  }, [filtered, statsMap]);

  const METRICS = [
    { key: "totalPnl",     label: "Total P&L",      fmt: v => `${sym}${v?.toFixed(0)}`,  better: "higher" },
    { key: "winRate",      label: "Win Rate",        fmt: v => `${v?.toFixed(1)}%`,        better: "higher" },
    { key: "profitFactor", label: "Profit Factor",   fmt: v => v >= 999 ? "∞" : v?.toFixed(2), better: "higher" },
    { key: "avgRR",        label: "Avg R:R",         fmt: v => v?.toFixed(2),              better: "higher" },
    { key: "trades",       label: "Total Trades",    fmt: v => `${v}x`,                   better: "higher" },
    { key: "avgWin",       label: "Avg Win",         fmt: v => `${sym}${v?.toFixed(0)}`,  better: "higher" },
    { key: "avgLoss",      label: "Avg Loss",        fmt: v => `${sym}${v?.toFixed(0)}`,  better: "lower"  },
    { key: "bestTrade",    label: "Best Trade",      fmt: v => `${sym}${v?.toFixed(0)}`,  better: "higher" },
    { key: "worstTrade",   label: "Worst Trade",     fmt: v => `${sym}${v?.toFixed(0)}`,  better: "higher" },
  ];

  const chartTooltip = {
    contentStyle: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, fontSize: 11, color: t.text },
    cursor: { stroke: t.border },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 3, color: t.text, lineHeight: 1 }}>ACCOUNT COMPARISON</div>
          <div style={{ fontSize: 11, color: t.textDim, marginTop: 4 }}>Bandingkan performa antar akun trading kamu</div>
        </div>
        {/* Best account badge */}
        {bestAccount && statsMap[bestAccount.id] && (
          <div style={{ background: "rgba(0,200,150,0.08)", border: "1px solid rgba(0,200,150,0.25)", borderRadius: 10, padding: "8px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16 }}>🏆</span>
            <div>
              <div style={{ fontSize: 9, color: "#00c896", textTransform: "uppercase", letterSpacing: "0.1em" }}>Best Account</div>
              <div style={{ fontSize: 13, color: t.text, fontWeight: 600 }}>{bestAccount.name}</div>
              <div style={{ fontSize: 11, color: "#00c896", fontFamily: "DM Mono, monospace" }}>+{sym}{statsMap[bestAccount.id].totalPnl.toFixed(0)} P&L</div>
            </div>
          </div>
        )}
      </div>

      {/* Account selector */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {accounts.map((a, i) => {
          const color    = a.color || PALETTE[i % PALETTE.length];
          const selected = selectedIds.includes(a.id);
          const stats    = statsMap[a.id];
          return (
            <button key={a.id} onClick={() => toggleAccount(a.id)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, border: `1px solid ${selected ? color : t.border}`, background: selected ? color + "12" : "transparent", cursor: "pointer", transition: "all 0.15s" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: selected ? color : t.textDim }} />
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: selected ? color : t.textDim }}>{a.name}</div>
                <div style={{ fontSize: 9, color: t.textDim }}>{a.type} · {stats?.trades || 0} trades</div>
              </div>
            </button>
          );
        })}
      </div>

      {filtered.length < 2 ? (
        <div style={{ textAlign: "center", padding: "24px 0", color: t.textDim, fontSize: 13 }}>Pilih minimal 2 akun untuk membandingkan</div>
      ) : (
        <>
          {/* Equity curve comparison */}
          {equityData.length > 1 && (
            <div className="stat-card">
              <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 14 }}>Equity Curve Comparison</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={equityData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: t.textDim, fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: t.textDim, fontSize: 9 }} tickLine={false} axisLine={false} width={50} tickFormatter={v => `${sym}${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`} />
                  <Tooltip {...chartTooltip} formatter={(v, name) => [`${sym}${v?.toFixed(0)}`, accounts.find(a => a.id === name)?.name || name]} />
                  <Legend formatter={id => accounts.find(a => a.id === id)?.name || id} />
                  {filtered.map((a, i) => (
                    <Line key={a.id} type="monotone" dataKey={a.id} stroke={a.color || PALETTE[i % PALETTE.length]} strokeWidth={2} dot={false} connectNulls />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Monthly P&L comparison */}
          {monthlyData.length > 0 && (
            <div className="stat-card">
              <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 14 }}>Monthly P&L Comparison</div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={monthlyData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: t.textDim, fontSize: 9 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: t.textDim, fontSize: 9 }} tickLine={false} axisLine={false} width={40} />
                  <Tooltip {...chartTooltip} formatter={(v, name) => [`${sym}${v?.toFixed(0)}`, accounts.find(a => a.id === name)?.name || name]} />
                  {filtered.map((a, i) => (
                    <Line key={a.id} type="monotone" dataKey={a.id} stroke={a.color || PALETTE[i % PALETTE.length]} strokeWidth={1.5} dot={false} connectNulls />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Stats table */}
          <div className="stat-card">
            <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 14 }}>Ranking & Stats</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", padding: "8px 12px", textAlign: "left", borderBottom: `1px solid ${t.border}` }}>Metrik</th>
                    {filtered.map((a, i) => (
                      <th key={a.id} style={{ fontSize: 10, padding: "8px 12px", textAlign: "right", borderBottom: `1px solid ${t.border}`, color: a.color || PALETTE[i % PALETTE.length] }}>
                        {a.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {METRICS.map(metric => {
                    const values  = filtered.map(a => statsMap[a.id]?.[metric.key] ?? null);
                    const validVals = values.filter(v => v !== null);
                    const best    = validVals.length > 0
                      ? (metric.better === "higher" ? Math.max(...validVals) : Math.min(...validVals))
                      : null;

                    return (
                      <tr key={metric.key} onMouseEnter={e => e.currentTarget.style.background = t.bgSubtle} onMouseLeave={e => e.currentTarget.style.background = "transparent"} style={{ transition: "background 0.1s" }}>
                        <td style={{ padding: "10px 12px", borderBottom: `1px solid ${t.borderSubtle}`, fontSize: 11, color: t.textDim }}>{metric.label}</td>
                        {filtered.map((a, i) => {
                          const val  = statsMap[a.id]?.[metric.key] ?? null;
                          const isB  = val !== null && val === best;
                          const prev = filtered[0]?.id !== a.id ? (statsMap[filtered[0].id]?.[metric.key] ?? null) : null;
                          const delta = prev !== null && val !== null ? val - prev : undefined;
                          return (
                            <StatCell key={a.id} label={metric.label} value={val !== null ? metric.fmt(val) : "—"} delta={i > 0 ? delta : undefined} highlight={isB} theme={t} />
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: 10, color: t.textDim, marginTop: 10 }}>▲▼ = delta dibanding akun pertama · 🟢 = nilai terbaik</div>
          </div>
        </>
      )}
    </div>
  );
}