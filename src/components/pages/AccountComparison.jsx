import { useState, useMemo } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { formatCurrency } from "../../utils/formatters";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const PALETTE = ["var(--success)","var(--accent2)","var(--warning)","#8b5cf6","var(--danger)","#f97316"];

// ── Calc stats ────────────────────────────────────────────────────
function calcStats(trades, capital = 10000) {
  if (!trades?.length) return null;
  const wins      = trades.filter(t => (t.pnl ?? 0) >= 0);
  const losses    = trades.filter(t => (t.pnl ?? 0) <  0);
  const totalPnl  = trades.reduce((s, t) => s + (t.pnl || 0), 0);
  const grossWin  = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const rrTrades  = trades.filter(t => t.rr);
  const avgRR     = rrTrades.length ? rrTrades.reduce((s, t) => s + parseFloat(t.rr || 0), 0) / rrTrades.length : 0;

  let equity = capital;
  const curve = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(t => { equity += (t.pnl || 0); return { date: t.date?.slice(5), equity: parseFloat(equity.toFixed(2)) }; });

  const monthMap = {};
  trades.forEach(t => {
    const m = t.date?.slice(0, 7);
    if (m) { if (!monthMap[m]) monthMap[m] = 0; monthMap[m] += t.pnl || 0; }
  });
  const monthlyPnl = Object.entries(monthMap).sort().map(([m, pnl]) => ({ month: m.slice(5), pnl }));

  return {
    totalPnl, trades: trades.length,
    wins: wins.length, losses: losses.length,
    winRate:      trades.length ? (wins.length / trades.length) * 100 : 0,
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 999 : 0,
    avgRR, avgWin: wins.length ? grossWin / wins.length : 0,
    avgLoss: losses.length ? grossLoss / losses.length : 0,
    bestTrade:  Math.max(...trades.map(t => t.pnl || 0)),
    worstTrade: Math.min(...trades.map(t => t.pnl || 0)),
    curve, monthlyPnl, capital,
  };
}

// ── Main AccountComparison ────────────────────────────────────────
export default function AccountComparison({ accounts, allTradesByAccount, settings, currencyMeta, theme }) {
  const sym     = currencyMeta?.symbol ?? "$";
  const capital = settings?.capitalInitial ?? 10000;
  const { isMobile } = useBreakpoint();

  const [selectedIds, setSelectedIds] = useState(() => (accounts || []).slice(0, 4).map(a => a.id));

  const statsMap = useMemo(() => {
    const map = {};
    (accounts || []).forEach(a => {
      map[a.id] = calcStats(allTradesByAccount?.[a.id] || [], capital);
    });
    return map;
  }, [accounts, allTradesByAccount, capital]);

  const filtered = (accounts || []).filter(a => selectedIds.includes(a.id));
  function toggleAccount(id) {
    setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }

  const chartTip = {
    contentStyle: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", fontSize: 11, color: "var(--text)" },
    cursor: { stroke: "var(--border)" },
  };

  if (!accounts?.length || accounts.length < 2) return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 20 }}>Account Comparison</h1>
      <div className="stat-card">
        <div className="empty-state">
          <div className="empty-icon">{!accounts?.length ? "🏦" : "➕"}</div>
          <div className="empty-title">{!accounts?.length ? "Belum ada akun" : "Butuh minimal 2 akun"}</div>
          <div className="empty-desc">Buat akun kedua (misal: Demo vs Live) untuk membandingkan performa</div>
        </div>
      </div>
    </div>
  );

  const bestAccount = [...accounts].filter(a => statsMap[a.id]).sort((a, b) => (statsMap[b.id]?.totalPnl || 0) - (statsMap[a.id]?.totalPnl || 0))[0];

  const equityData = useMemo(() => {
    const dates = [...new Set(filtered.flatMap(a => (statsMap[a.id]?.curve || []).map(p => p.date)))].sort();
    return dates.map(date => {
      const pt = { date };
      filtered.forEach(a => {
        const found = statsMap[a.id]?.curve?.find(p => p.date === date);
        if (found) pt[a.id] = found.equity;
      });
      return pt;
    });
  }, [filtered, statsMap]);

  const monthlyData = useMemo(() => {
    const months = [...new Set(filtered.flatMap(a => (statsMap[a.id]?.monthlyPnl || []).map(p => p.month)))].sort();
    return months.map(month => {
      const pt = { month };
      filtered.forEach(a => {
        const found = statsMap[a.id]?.monthlyPnl?.find(p => p.month === month);
        pt[a.id] = found?.pnl ?? 0;
      });
      return pt;
    });
  }, [filtered, statsMap]);

  const METRICS = [
    { key: "totalPnl",     label: "Total P&L",    fmt: v => `${sym}${v?.toFixed(0)}`,                        better: "higher" },
    { key: "winRate",      label: "Win Rate",      fmt: v => `${v?.toFixed(1)}%`,                             better: "higher" },
    { key: "profitFactor", label: "Profit Factor", fmt: v => (v ?? 0) >= 999 ? "∞" : v?.toFixed(2),          better: "higher" },
    { key: "avgRR",        label: "Avg R:R",       fmt: v => v?.toFixed(2),                                   better: "higher" },
    { key: "trades",       label: "Total Trades",  fmt: v => `${v}x`,                                         better: "higher" },
    { key: "avgWin",       label: "Avg Win",       fmt: v => `${sym}${v?.toFixed(0)}`,                        better: "higher" },
    { key: "avgLoss",      label: "Avg Loss",      fmt: v => `${sym}${v?.toFixed(0)}`,                        better: "lower"  },
    { key: "bestTrade",    label: "Best Trade",    fmt: v => `${sym}${v?.toFixed(0)}`,                        better: "higher" },
    { key: "worstTrade",   label: "Worst Trade",   fmt: v => `${sym}${v?.toFixed(0)}`,                        better: "higher" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Account Comparison</h1>
          <p className="page-subtitle">Bandingkan performa antar akun trading kamu</p>
        </div>
        {bestAccount && statsMap[bestAccount.id] && (
          <div style={{ background: "var(--success-dim)", border: "1px solid var(--success)", borderRadius: "var(--r-lg)", padding: "8px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16 }}>🏆</span>
            <div>
              <div className="kpi-label" style={{ color: "var(--success)" }}>Best Account</div>
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--text)", fontWeight: 600 }}>{bestAccount.name}</div>
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--success)", fontFamily: "var(--font-mono)" }}>
                +{sym}{(statsMap[bestAccount.id].totalPnl ?? 0).toFixed(0)} P&L
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Account selector */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {accounts.map((a, i) => {
          const color = a.color || PALETTE[i % PALETTE.length];
          const active = selectedIds.includes(a.id);
          return (
            <button key={a.id} onClick={() => toggleAccount(a.id)} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "7px 12px", borderRadius: "var(--r-lg)",
              border: `1px solid ${active ? color : "var(--border)"}`,
              background: active ? `${color}12` : "transparent",
              cursor: "pointer", transition: "all var(--t-base)",
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: active ? color : "var(--text-dim)" }}/>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: active ? color : "var(--text-dim)" }}>{a.name}</div>
                <div style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)" }}>{a.type} · {statsMap[a.id]?.trades || 0} trades</div>
              </div>
            </button>
          );
        })}
      </div>

      {filtered.length < 2 ? (
        <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-dim)", fontSize: "var(--fs-sm)" }}>
          Pilih minimal 2 akun untuk membandingkan
        </div>
      ) : (
        <>
          {/* Equity curve */}
          {equityData.length > 1 && (
            <div className="stat-card">
              <div className="section-label" style={{ marginBottom: 12 }}>Equity Curve Comparison</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={equityData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false}/>
                  <XAxis dataKey="date" tick={{ fill: "var(--text-dim)", fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
                  <YAxis tick={{ fill: "var(--text-dim)", fontSize: 9 }} tickLine={false} axisLine={false} width={46}
                    tickFormatter={v => `${sym}${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}/>
                  <Tooltip {...chartTip} formatter={(v, name) => [`${sym}${v?.toFixed(0)}`, accounts.find(a => a.id === name)?.name || name]}/>
                  <Legend formatter={id => accounts.find(a => a.id === id)?.name || id}/>
                  {filtered.map((a, i) => (
                    <Line key={a.id} type="monotone" dataKey={a.id} stroke={a.color || PALETTE[i % PALETTE.length]} strokeWidth={2} dot={false} connectNulls/>
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Monthly P&L */}
          {monthlyData.length > 0 && (
            <div className="stat-card">
              <div className="section-label" style={{ marginBottom: 12 }}>Monthly P&L Comparison</div>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={monthlyData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false}/>
                  <XAxis dataKey="month" tick={{ fill: "var(--text-dim)", fontSize: 9 }} tickLine={false} axisLine={false}/>
                  <YAxis tick={{ fill: "var(--text-dim)", fontSize: 9 }} tickLine={false} axisLine={false} width={40}/>
                  <Tooltip {...chartTip} formatter={(v, name) => [`${sym}${v?.toFixed(0)}`, accounts.find(a => a.id === name)?.name || name]}/>
                  {filtered.map((a, i) => (
                    <Line key={a.id} type="monotone" dataKey={a.id} stroke={a.color || PALETTE[i % PALETTE.length]} strokeWidth={1.5} dot={false} connectNulls/>
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Stats table */}
          <div className="stat-card">
            <div className="section-label" style={{ marginBottom: 12 }}>Ranking & Stats</div>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Metrik</th>
                    {filtered.map((a, i) => (
                      <th key={a.id} className="text-right" style={{ color: a.color || PALETTE[i % PALETTE.length] }}>
                        {a.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {METRICS.map(metric => {
                    const values = filtered.map(a => statsMap[a.id]?.[metric.key] ?? null);
                    const valid  = values.filter(v => v !== null);
                    const best   = valid.length ? (metric.better === "higher" ? Math.max(...valid) : Math.min(...valid)) : null;
                    return (
                      <tr key={metric.key}>
                        <td style={{ color: "var(--text-dim)" }}>{metric.label}</td>
                        {filtered.map((a, i) => {
                          const val   = statsMap[a.id]?.[metric.key] ?? null;
                          const isBest = val !== null && val === best;
                          const prev  = i > 0 ? (statsMap[filtered[0].id]?.[metric.key] ?? null) : null;
                          const delta = i > 0 && prev !== null && val !== null ? val - prev : null;
                          return (
                            <td key={a.id} className="text-right" style={{ background: isBest ? "var(--success-dim)" : "transparent" }}>
                              <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-sm)", fontWeight: 600, color: isBest ? "var(--success)" : "var(--text)" }}>
                                {val !== null ? metric.fmt(val) : "—"}
                              </div>
                              {delta !== null && delta !== 0 && (
                                <div style={{ fontSize: "var(--fs-2xs)", color: delta > 0 ? "var(--success)" : "var(--danger)", marginTop: 1 }}>
                                  {delta > 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 8 }}>
              ▲▼ = delta dibanding akun pertama · 🟢 = nilai terbaik
            </p>
          </div>
        </>
      )}
    </div>
  );
}