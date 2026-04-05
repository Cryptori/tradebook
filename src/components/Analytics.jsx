import { useMemo, useState } from "react";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { calcAllAdvancedStats } from "../utils/advancedStats";
import { formatCurrency } from "../utils/formatters";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine, Legend,
} from "recharts";

// ── Shared tooltip ────────────────────────────────────────────────
const tip = {
  contentStyle: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11, color: "var(--text)" },
  cursor: { stroke: "var(--border)", strokeWidth: 1 },
};

// ── KPI card ──────────────────────────────────────────────────────
function KpiCard({ label, value, color, sub, accent }) {
  return (
    <div style={{ background: "var(--bg-card)", border: `1px solid ${accent ? accent + "40" : "var(--border-subtle)"}`, borderRadius: "var(--r-lg)", padding: "12px 14px", borderTop: accent ? `2px solid ${accent}` : undefined }}>
      <div className="kpi-label">{label}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-2xl)", fontWeight: 700, color: color || "var(--text)", lineHeight: 1, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ── Equity curve ──────────────────────────────────────────────────
function EquityCurve({ trades, capital, sym }) {
  const data = useMemo(() => {
    let eq = capital;
    const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
    return [{ date: "Start", equity: capital }, ...sorted.map(tr => {
      eq += tr.pnl || 0;
      return { date: tr.date?.slice(5), equity: parseFloat(eq.toFixed(2)) };
    })];
  }, [trades, capital]);

  const min   = Math.min(...data.map(d => d.equity));
  const max   = Math.max(...data.map(d => d.equity));
  const final = data[data.length - 1]?.equity ?? capital;
  const isPos = final >= capital;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div className="section-label">Equity Curve</div>
        <div style={{ display: "flex", gap: 16, fontSize: "var(--fs-xs)" }}>
          <span style={{ color: "var(--text-dim)" }}>Start: <span style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}>{formatCurrency(capital, false, sym)}</span></span>
          <span style={{ color: "var(--text-dim)" }}>Now: <span style={{ fontFamily: "var(--font-mono)", color: isPos ? "var(--success)" : "var(--danger)", fontWeight: 700 }}>{formatCurrency(final, false, sym)}</span></span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false}/>
          <XAxis dataKey="date" tick={{ fill: "var(--text-dim)", fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
          <YAxis tick={{ fill: "var(--text-dim)", fontSize: 9 }} tickLine={false} axisLine={false} width={46}
            tickFormatter={v => `${sym}${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
            domain={[Math.min(min * 0.99, capital * 0.99), Math.max(max * 1.01, capital * 1.01)]}/>
          <Tooltip {...tip} formatter={v => [formatCurrency(v, false, sym), "Equity"]}/>
          <ReferenceLine y={capital} stroke="var(--border)" strokeDasharray="4 4"/>
          <Line type="monotone" dataKey="equity" stroke={isPos ? "var(--success)" : "var(--danger)"}
            strokeWidth={2} dot={false} activeDot={{ r: 4 }}/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Monthly P&L chart ─────────────────────────────────────────────
function MonthlyChart({ trades, sym, isMobile }) {
  const data = useMemo(() => {
    const map = {};
    trades.forEach(tr => {
      const m = tr.date?.slice(0, 7);
      if (!m) return;
      if (!map[m]) map[m] = { month: m.slice(5), pnl: 0, wins: 0, total: 0 };
      map[m].pnl   += tr.pnl || 0;
      map[m].total += 1;
      if ((tr.pnl ?? 0) >= 0) map[m].wins++;
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  }, [trades]);

  return (
    <>
      <div className="section-label" style={{ marginBottom: 12 }}>Monthly P&L</div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} barSize={isMobile ? 14 : 22} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false}/>
          <XAxis dataKey="month" tick={{ fill: "var(--text-dim)", fontSize: 9 }} tickLine={false} axisLine={false}/>
          <YAxis tick={{ fill: "var(--text-dim)", fontSize: 9 }} tickLine={false} axisLine={false} width={42}
            tickFormatter={v => `${sym}${v}`}/>
          <Tooltip {...tip} formatter={(v, n, props) => [
            `${formatCurrency(v, false, sym)} · ${props.payload.wins}W/${props.payload.total - props.payload.wins}L`,
            "P&L"
          ]}/>
          <ReferenceLine y={0} stroke="var(--border)"/>
          <Bar dataKey="pnl" radius={[3,3,0,0]}>
            {data.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? "var(--success)" : "var(--danger)"} fillOpacity={0.85}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}

// ── Day/Hour heatmap (trades by day of week) ──────────────────────
function DayOfWeekChart({ trades, sym }) {
  const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const data = useMemo(() => {
    const map = {};
    DAYS.forEach(d => { map[d] = { day: d, pnl: 0, trades: 0, wins: 0 }; });
    trades.forEach(tr => {
      if (!tr.date) return;
      const d = new Date(tr.date + "T00:00:00");
      const key = DAYS[(d.getDay() + 6) % 7]; // Mon=0
      map[key].pnl    += tr.pnl || 0;
      map[key].trades += 1;
      if ((tr.pnl ?? 0) >= 0) map[key].wins++;
    });
    return DAYS.map(d => map[d]);
  }, [trades]);

  return (
    <>
      <div className="section-label" style={{ marginBottom: 12 }}>P&L by Day of Week</div>
      <ResponsiveContainer width="100%" height={130}>
        <BarChart data={data} barSize={24} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false}/>
          <XAxis dataKey="day" tick={{ fill: "var(--text-dim)", fontSize: 10 }} tickLine={false} axisLine={false}/>
          <YAxis tick={{ fill: "var(--text-dim)", fontSize: 9 }} tickLine={false} axisLine={false} width={38}
            tickFormatter={v => `${sym}${v}`}/>
          <Tooltip {...tip} formatter={(v, n, p) => [`${formatCurrency(v, false, sym)} (${p.payload.trades}t)`, "P&L"]}/>
          <ReferenceLine y={0} stroke="var(--border)"/>
          <Bar dataKey="pnl" radius={[3,3,0,0]}>
            {data.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? "var(--success)" : "var(--danger)"} fillOpacity={0.8}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}

// ── Session performance ───────────────────────────────────────────
function SessionChart({ trades, sym }) {
  const data = useMemo(() => {
    const map = {};
    trades.forEach(tr => {
      const s = tr.session || "Unknown";
      if (!map[s]) map[s] = { session: s, pnl: 0, trades: 0, wins: 0 };
      map[s].pnl    += tr.pnl || 0;
      map[s].trades += 1;
      if ((tr.pnl ?? 0) >= 0) map[s].wins++;
    });
    return Object.values(map).sort((a, b) => b.pnl - a.pnl);
  }, [trades]);

  if (!data.length) return null;
  return (
    <>
      <div className="section-label" style={{ marginBottom: 10 }}>P&L by Session</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {data.map(s => {
          const wr = s.trades ? (s.wins / s.trades) * 100 : 0;
          return (
            <div key={s.session} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 72, fontSize: "var(--fs-sm)", color: "var(--text-muted)", flexShrink: 0 }}>{s.session}</span>
              <div style={{ flex: 1, height: 6, background: "var(--bg-subtle)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${wr}%`, background: wr >= 50 ? "var(--success)" : "var(--warning)", borderRadius: 3 }}/>
              </div>
              <span style={{ width: 36, fontSize: "var(--fs-xs)", fontFamily: "var(--font-mono)", color: wr >= 50 ? "var(--success)" : "var(--warning)", textAlign: "right" }}>{wr.toFixed(0)}%</span>
              <span style={{ width: 56, fontSize: "var(--fs-xs)", fontFamily: "var(--font-mono)", color: s.pnl >= 0 ? "var(--success)" : "var(--danger)", textAlign: "right" }}>
                {s.pnl >= 0 ? "+" : ""}{formatCurrency(s.pnl, true, sym)}
              </span>
              <span style={{ width: 28, fontSize: "var(--fs-xs)", color: "var(--text-dim)", textAlign: "right" }}>{s.trades}t</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Strategy breakdown ────────────────────────────────────────────
function StrategyBreakdown({ strategyStats, sym, isMobile }) {
  if (!strategyStats?.length) return <p style={{ color: "var(--text-dim)", fontSize: "var(--fs-sm)" }}>No strategy data</p>;
  const maxPnl = Math.max(...strategyStats.map(s => Math.abs(s.pnl ?? 0)), 1);
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Strategy</th>
            <th className="text-right">Trades</th>
            <th className="text-right">WR%</th>
            <th className="text-right">Avg R:R</th>
            <th className="text-right">P&L</th>
            {!isMobile && <th style={{ width: 80 }}/>}
          </tr>
        </thead>
        <tbody>
          {strategyStats.map(s => {
            const wr  = parseFloat(s.winRate ?? 0) || 0;
            const pnl = parseFloat(s.pnl ?? 0) || 0;
            return (
              <tr key={s.strategy}>
                <td style={{ fontWeight: 500, color: "var(--text)" }}>{s.strategy}</td>
                <td className="text-right mono">{s.count}</td>
                <td className="text-right">
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: wr >= 60 ? "var(--success)" : wr >= 40 ? "var(--warning)" : "var(--danger)" }}>
                    {wr.toFixed(0)}%
                  </span>
                </td>
                <td className="text-right mono" style={{ color: "var(--text-muted)" }}>
                  {s.avgRR ? parseFloat(s.avgRR).toFixed(2) : "—"}
                </td>
                <td className="text-right">
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: pnl >= 0 ? "var(--success)" : "var(--danger)" }}>
                    {pnl >= 0 ? "+" : ""}{formatCurrency(pnl, true, sym)}
                  </span>
                </td>
                {!isMobile && (
                  <td>
                    <div style={{ height: 3, background: "var(--bg-subtle)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(Math.abs(pnl) / maxPnl) * 100}%`, background: pnl >= 0 ? "var(--success)" : "var(--danger)", borderRadius: 2 }}/>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Pair matrix ───────────────────────────────────────────────────
function PairMatrix({ trades, currencyMeta }) {
  const sym = currencyMeta?.symbol ?? "$";
  const { isMobile } = useBreakpoint();
  const [sortKey,   setSortKey]   = useState("pnl");
  const [sortDir,   setSortDir]   = useState("desc");
  const [minTrades, setMinTrades] = useState(1);

  const data = useMemo(() => {
    const map = {};
    (trades || []).forEach(tr => {
      if (!tr.pair) return;
      if (!map[tr.pair]) map[tr.pair] = { pair: tr.pair, trades: 0, wins: 0, pnl: 0, rrs: [] };
      map[tr.pair].trades++;
      if ((tr.pnl ?? 0) >= 0) map[tr.pair].wins++;
      map[tr.pair].pnl += tr.pnl || 0;
      if (tr.rr) map[tr.pair].rrs.push(parseFloat(tr.rr));
    });
    return Object.values(map)
      .filter(d => d.trades >= minTrades)
      .map(d => {
        const gw = (trades||[]).filter(t => t.pair === d.pair && (t.pnl??0) > 0).reduce((s,t) => s + t.pnl, 0);
        const gl = Math.abs((trades||[]).filter(t => t.pair === d.pair && (t.pnl??0) < 0).reduce((s,t) => s + t.pnl, 0));
        return { ...d, winRate: (d.wins / d.trades) * 100, avgRR: d.rrs.length ? d.rrs.reduce((s,r) => s+r,0)/d.rrs.length : 0, pf: gl > 0 ? gw/gl : gw > 0 ? 999 : 0 };
      })
      .sort((a, b) => sortDir === "desc" ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]);
  }, [trades, minTrades, sortKey, sortDir]);

  function toggleSort(k) { if (sortKey === k) setSortDir(d => d === "desc" ? "asc" : "desc"); else { setSortKey(k); setSortDir("desc"); } }
  function SortTh({ k, label }) {
    const active = sortKey === k;
    return <th className="sortable text-right" onClick={() => toggleSort(k)} style={{ color: active ? "var(--accent)" : undefined }}>{label}{active && <span style={{ marginLeft: 3, opacity: 0.7 }}>{sortDir === "desc" ? "↓" : "↑"}</span>}</th>;
  }

  const best  = data.length ? [...data].sort((a,b) => b.winRate - a.winRate)[0] : null;
  const worst = data.filter(d => d.trades >= 5).sort((a,b) => a.winRate - b.winRate)[0] ?? null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {(best || worst) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {best && <div style={{ background: "var(--success-dim)", border: "1px solid var(--success)", borderRadius: "var(--r-md)", padding: "10px 14px" }}>
            <div style={{ fontSize: "var(--fs-2xs)", color: "var(--success)", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600 }}>Best Pair</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-xl)", color: "var(--text)", fontWeight: 700, marginTop: 4 }}>{best.pair}</div>
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>{best.winRate.toFixed(0)}% WR · {best.trades}x</div>
          </div>}
          {worst && <div style={{ background: "var(--danger-dim)", border: "1px solid var(--danger)", borderRadius: "var(--r-md)", padding: "10px 14px" }}>
            <div style={{ fontSize: "var(--fs-2xs)", color: "var(--danger)", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600 }}>Avoid</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-xl)", color: "var(--text)", fontWeight: 700, marginTop: 4 }}>{worst.pair}</div>
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>{worst.winRate.toFixed(0)}% WR · {worst.trades}x</div>
          </div>}
        </div>
      )}
      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
        <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>Min trades:</span>
        {[1,3,5,10].map(n => (
          <button key={n} onClick={() => setMinTrades(n)} style={{ height: 24, padding: "0 9px", borderRadius: "var(--r-sm)", border: `1px solid ${minTrades === n ? "var(--accent)" : "var(--border)"}`, background: minTrades === n ? "var(--accent-dim)" : "transparent", color: minTrades === n ? "var(--accent)" : "var(--text-dim)", fontSize: "var(--fs-xs)", cursor: "pointer" }}>{n}+</button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>{data.length} pairs</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Pair</th>
              <SortTh k="trades"  label="Trades"/>
              <SortTh k="winRate" label="WR%"/>
              <SortTh k="pf"      label="PF"/>
              <SortTh k="avgRR"   label="Avg R:R"/>
              <SortTh k="pnl"     label="P&L"/>
            </tr>
          </thead>
          <tbody>
            {data.map(d => (
              <tr key={d.pair}>
                <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text)" }}>{d.pair}</td>
                <td className="text-right mono">{d.trades}</td>
                <td className="text-right"><span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: d.winRate >= 60 ? "var(--success)" : d.winRate >= 40 ? "var(--warning)" : "var(--danger)" }}>{d.winRate.toFixed(0)}%</span></td>
                <td className="text-right mono" style={{ color: d.pf >= 1.5 ? "var(--success)" : d.pf >= 1 ? "var(--warning)" : "var(--danger)" }}>{d.pf >= 999 ? "∞" : d.pf.toFixed(2)}</td>
                <td className="text-right mono" style={{ color: "var(--text-muted)" }}>{d.avgRR.toFixed(2)}</td>
                <td className="text-right"><span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: d.pnl >= 0 ? "var(--success)" : "var(--danger)" }}>{d.pnl >= 0 ? "+" : ""}{formatCurrency(d.pnl, true, sym)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Advanced stats ────────────────────────────────────────────────
function AdvancedStats({ trades, settings, currencyMeta }) {
  const sym     = currencyMeta?.symbol ?? "$";
  const capital = settings?.capitalInitial ?? 10000;
  const adv     = useMemo(() => calcAllAdvancedStats(trades, capital), [trades, capital]);

  const metrics = [
    { label: "Sharpe Ratio",    val: adv.sharpe    ?? "—", color: parseFloat(adv.sharpe)    >= 1 ? "var(--success)" : "var(--warning)", desc: ">1 good, >2 excellent" },
    { label: "Sortino Ratio",   val: adv.sortino   ?? "—", color: parseFloat(adv.sortino)   >= 1 ? "var(--success)" : "var(--warning)", desc: "Downside risk-adjusted" },
    { label: "Calmar Ratio",    val: adv.calmar    ?? "—", color: "var(--accent2)",                                                      desc: "Return / max drawdown" },
    { label: "Recovery Factor", val: adv.recovery  ?? "—", color: "var(--accent2)",                                                      desc: "Net profit / max DD" },
    { label: "Expectancy",      val: adv.expectancy ? `${sym}${adv.expectancy}` : "—", color: parseFloat(adv.expectancy) >= 0 ? "var(--success)" : "var(--danger)", desc: `Avg ${sym} per trade` },
    { label: "Payoff Ratio",    val: adv.payoff    ?? "—", color: "var(--accent2)",                                                      desc: "Avg win / avg loss" },
    { label: "Kelly %",         val: adv.kelly     ? `${adv.kelly}%` : "—", color: "var(--gold)",                                      desc: "Optimal position size" },
    { label: "MFE/MAE Ratio",   val: adv.maemfe?.mfeMAERatio ?? "—", color: parseFloat(adv.maemfe?.mfeMAERatio) >= 1 ? "var(--success)" : "var(--warning)", desc: "Max fav / max adverse" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
      {metrics.map(m => (
        <div key={m.label} style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", borderRadius: "var(--r-md)", padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", fontWeight: 500 }}>{m.label}</div>
            <div style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)", marginTop: 1 }}>{m.desc}</div>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-xl)", fontWeight: 700, flexShrink: 0, color: m.val === "—" ? "var(--text-dim)" : m.color }}>
            {m.val}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Emotion breakdown ─────────────────────────────────────────────
function EmotionBreakdown({ emotionStats }) {
  if (!emotionStats?.length) return <p style={{ color: "var(--text-dim)", fontSize: "var(--fs-sm)" }}>No emotion data</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {emotionStats.map(e => {
        const wr = parseFloat(e.winRate ?? (e.wins && e.count ? (e.wins/e.count)*100 : 0)) || 0;
        const color = wr >= 50 ? "var(--success)" : "var(--warning)";
        return (
          <div key={e.emotion} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 88, fontSize: "var(--fs-sm)", color: "var(--text-muted)", flexShrink: 0 }}>{e.emotion}</span>
            <div style={{ flex: 1, height: 4, background: "var(--bg-subtle)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${wr}%`, background: color, borderRadius: 2 }}/>
            </div>
            <span style={{ width: 38, fontFamily: "var(--font-mono)", fontSize: "var(--fs-sm)", color, textAlign: "right", fontWeight: 600 }}>{wr.toFixed(0)}%</span>
            <span style={{ width: 28, fontSize: "var(--fs-xs)", color: "var(--text-dim)", textAlign: "right" }}>{e.count}x</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Analytics ────────────────────────────────────────────────
export default function Analytics({ trades, stats, strategyStats, emotionStats, currencyMeta, settings }) {
  const sym     = currencyMeta?.symbol ?? "$";
  const capital = settings?.capitalInitial ?? 10000;
  const { isMobile } = useBreakpoint();

  if (!trades?.length) return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 20 }}>Analytics</h1>
      <div className="stat-card">
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <div className="empty-title">No data yet</div>
          <div className="empty-desc">Log beberapa trade untuk melihat analytics</div>
        </div>
      </div>
    </div>
  );

  const totalReturn = capital > 0 ? ((stats.totalPnl ?? 0) / capital) * 100 : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div>
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">{trades.length} trades · {sym}{capital.toLocaleString()} capital</p>
      </div>

      {/* ── KPI row ── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10 }}>
        <KpiCard label="Total P&L"     value={formatCurrency(stats.totalPnl ?? 0, false, sym)}   color={(stats.totalPnl ?? 0) >= 0 ? "var(--success)" : "var(--danger)"} accent={(stats.totalPnl ?? 0) >= 0 ? "var(--success)" : "var(--danger)"}/>
        <KpiCard label="Return"        value={`${totalReturn >= 0 ? "+" : ""}${totalReturn.toFixed(1)}%`} color={totalReturn >= 0 ? "var(--success)" : "var(--danger)"}  accent={totalReturn >= 0 ? "var(--success)" : "var(--danger)"}/>
        <KpiCard label="Win Rate"      value={`${(stats.winRate ?? 0).toFixed(1)}%`}             color={(stats.winRate ?? 0) >= 50 ? "var(--success)" : "var(--warning)"} sub={`${stats.wins ?? 0}W / ${stats.losses ?? 0}L`}/>
        <KpiCard label="Profit Factor" value={(stats.profitFactor ?? 0) >= 999 ? "∞" : (stats.profitFactor ?? 0).toFixed(2)} color={(stats.profitFactor ?? 0) >= 1.5 ? "var(--success)" : "var(--warning)"} sub={`Avg R:R ${(stats.avgRR ?? 0).toFixed(2)}`}/>
      </div>

      {/* ── Equity curve ── */}
      <div className="stat-card">
        <EquityCurve trades={trades} capital={capital} sym={sym}/>
      </div>

      {/* ── Monthly + Day of week ── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
        <div className="stat-card"><MonthlyChart trades={trades} sym={sym} isMobile={isMobile}/></div>
        <div className="stat-card"><DayOfWeekChart trades={trades} sym={sym}/></div>
      </div>

      {/* ── Performance + Emotion + Session ── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 14 }}>
        <div className="stat-card">
          <div className="section-label" style={{ marginBottom: 10 }}>Performance</div>
          <table className="data-table">
            <tbody>
              {[
                { label: "Total Trades",   val: stats.totalTrades ?? 0 },
                { label: "Gross Profit",   val: formatCurrency(stats.grossProfit  ?? 0, false, sym), color: "var(--success)" },
                { label: "Gross Loss",     val: formatCurrency(stats.grossLoss    ?? 0, false, sym), color: "var(--danger)" },
                { label: "Avg Win",        val: formatCurrency(stats.avgWin       ?? 0, false, sym), color: "var(--success)" },
                { label: "Avg Loss",       val: formatCurrency(stats.avgLoss      ?? 0, false, sym), color: "var(--danger)" },
                { label: "Best Trade",     val: formatCurrency(stats.bestTrade    ?? 0, false, sym), color: "var(--success)" },
                { label: "Worst Trade",    val: formatCurrency(stats.worstTrade   ?? 0, false, sym), color: "var(--danger)" },
                { label: "Max Drawdown",   val: `${(stats.maxDrawdown ?? 0).toFixed(1)}%`,            color: "var(--danger)" },
                { label: "Streak",         val: stats.currentStreak ?? 0,                             color: (stats.currentStreak ?? 0) >= 0 ? "var(--success)" : "var(--danger)" },
              ].map(s => (
                <tr key={s.label}>
                  <td style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)", padding: "6px 8px" }}>{s.label}</td>
                  <td style={{ textAlign: "right", padding: "6px 8px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: "var(--fs-sm)", color: s.color || "var(--text)" }}>{s.val}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="stat-card">
          <div className="section-label" style={{ marginBottom: 10 }}>Emotion vs Win Rate</div>
          <EmotionBreakdown emotionStats={emotionStats}/>
        </div>
        <div className="stat-card">
          <SessionChart trades={trades} sym={sym}/>
        </div>
      </div>

      {/* ── Strategy ── */}
      <div className="stat-card">
        <div className="section-label" style={{ marginBottom: 12 }}>Strategy Breakdown</div>
        <StrategyBreakdown strategyStats={strategyStats} sym={sym} isMobile={isMobile}/>
      </div>

      {/* ── Pair matrix ── */}
      <div className="stat-card">
        <div className="section-label" style={{ marginBottom: 12 }}>Pair Performance</div>
        <PairMatrix trades={trades} currencyMeta={currencyMeta}/>
      </div>

      {/* ── Advanced stats ── */}
      <div className="stat-card">
        <div className="section-label" style={{ marginBottom: 12 }}>Advanced Statistics</div>
        <AdvancedStats trades={trades} settings={settings} currencyMeta={currencyMeta}/>
      </div>
    </div>
  );
}