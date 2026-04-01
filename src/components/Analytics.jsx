import { useMemo, useState } from "react";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { calcAllAdvancedStats } from "../utils/advancedStats";
import { formatCurrency } from "../utils/formatters";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";

// ── Shared tooltip style ──────────────────────────────────────────
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

// ── Stat row ──────────────────────────────────────────────────────
function StatRow({ label, value, color }) {
  return (
    <tr>
      <td style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)", padding: "7px 10px" }}>{label}</td>
      <td style={{ textAlign: "right", padding: "7px 10px" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: "var(--fs-base)", color: color || "var(--text)" }}>
          {value}
        </span>
      </td>
    </tr>
  );
}

// ── Strategy breakdown ────────────────────────────────────────────
function StrategyBreakdown({ strategyStats, sym, isMobile }) {
  if (!strategyStats?.length) return (
    <p style={{ color: "var(--text-dim)", fontSize: "var(--fs-sm)", padding: "16px 0" }}>No strategy data</p>
  );
  const maxPnl = Math.max(...strategyStats.map(s => Math.abs(s.pnl ?? 0)), 1);
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Strategy</th>
            <th className="text-right">Trades</th>
            <th className="text-right">Win Rate</th>
            <th className="text-right">P&L</th>
            {!isMobile && <th style={{ width: 100 }}>Bar</th>}
          </tr>
        </thead>
        <tbody>
          {strategyStats.map(s => {
            const wr  = parseFloat(s.winRate  ?? 0) || 0;
            const pnl = parseFloat(s.pnl      ?? 0) || 0;
            return (
              <tr key={s.strategy}>
                <td style={{ fontWeight: 500, color: "var(--text)" }}>{s.strategy}</td>
                <td className="text-right mono">{s.count}</td>
                <td className="text-right">
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500, color: wr >= 50 ? "var(--success)" : "var(--warning)" }}>
                    {wr.toFixed(0)}%
                  </span>
                </td>
                <td className="text-right">
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: pnl >= 0 ? "var(--success)" : "var(--danger)" }}>
                    {pnl >= 0 ? "+" : ""}{formatCurrency(pnl, true, sym)}
                  </span>
                </td>
                {!isMobile && (
                  <td>
                    <div style={{ height: 3, background: "var(--bg-subtle)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${(Math.abs(pnl) / maxPnl) * 100}%`,
                        background: pnl >= 0 ? "var(--success)" : "var(--danger)",
                        borderRadius: 2,
                      }} />
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

// ── Emotion breakdown ─────────────────────────────────────────────
function EmotionBreakdown({ emotionStats }) {
  if (!emotionStats?.length) return (
    <p style={{ color: "var(--text-dim)", fontSize: "var(--fs-sm)", padding: "16px 0" }}>No emotion data</p>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {emotionStats.map(e => {
        const wr = parseFloat(e.winRate ?? (e.wins && e.count ? (e.wins / e.count) * 100 : 0)) || 0;
        const color = wr >= 50 ? "var(--success)" : "var(--warning)";
        return (
          <div key={e.emotion} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 96, fontSize: "var(--fs-sm)", color: "var(--text-muted)", flexShrink: 0 }}>{e.emotion}</span>
            <div style={{ flex: 1, height: 3, background: "var(--bg-subtle)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${wr}%`, background: color, borderRadius: 2 }} />
            </div>
            <span style={{ width: 40, fontFamily: "var(--font-mono)", fontSize: "var(--fs-sm)", color, textAlign: "right", fontWeight: 500 }}>
              {wr.toFixed(0)}%
            </span>
            <span style={{ width: 32, fontSize: "var(--fs-xs)", color: "var(--text-dim)", textAlign: "right" }}>{e.count}x</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Pair Performance Matrix ───────────────────────────────────────
function PairMatrix({ trades, currencyMeta }) {
  const sym = currencyMeta?.symbol ?? "$";
  const { isMobile } = useBreakpoint();
  const [sortKey, setSortKey] = useState("pnl");
  const [sortDir, setSortDir] = useState("desc");
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
      .map(d => ({
        ...d,
        winRate: (d.wins / d.trades) * 100,
        avgRR: d.rrs.length > 0 ? d.rrs.reduce((s, r) => s + r, 0) / d.rrs.length : 0,
        grossWin:  (trades || []).filter(t => t.pair === d.pair && (t.pnl ?? 0) > 0).reduce((s, t) => s + t.pnl, 0),
        grossLoss: Math.abs((trades || []).filter(t => t.pair === d.pair && (t.pnl ?? 0) < 0).reduce((s, t) => s + t.pnl, 0)),
      }))
      .map(d => ({ ...d, pf: d.grossLoss > 0 ? d.grossWin / d.grossLoss : d.grossWin > 0 ? 999 : 0 }))
      .sort((a, b) => sortDir === "desc" ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]);
  }, [trades, minTrades, sortKey, sortDir]);

  function toggleSort(k) {
    if (sortKey === k) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortKey(k); setSortDir("desc"); }
  }

  function SortTh({ k, label }) {
    const active = sortKey === k;
    return (
      <th
        className="sortable text-right"
        onClick={() => toggleSort(k)}
        style={{ color: active ? "var(--accent)" : undefined }}
      >
        {label}{active && <span style={{ marginLeft: 3, opacity: 0.7 }}>{sortDir === "desc" ? "↓" : "↑"}</span>}
      </th>
    );
  }

  const best  = data.length ? [...data].sort((a, b) => b.winRate - a.winRate)[0] : null;
  const worst = data.filter(d => d.trades >= 5).sort((a, b) => a.winRate - b.winRate)[0] ?? null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {(best || worst) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {best && (
            <div style={{ background: "var(--success-dim)", border: "1px solid var(--success)", borderRadius: "var(--r-md)", padding: "10px 14px" }}>
              <div style={{ fontSize: "var(--fs-2xs)", color: "var(--success)", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600 }}>Best Pair</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-lg)", color: "var(--text)", fontWeight: 600, marginTop: 4 }}>{best.pair}</div>
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>{best.winRate.toFixed(0)}% WR · {best.trades}x</div>
            </div>
          )}
          {worst && (
            <div style={{ background: "var(--danger-dim)", border: "1px solid var(--danger)", borderRadius: "var(--r-md)", padding: "10px 14px" }}>
              <div style={{ fontSize: "var(--fs-2xs)", color: "var(--danger)", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600 }}>Avoid</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-lg)", color: "var(--text)", fontWeight: 600, marginTop: 4 }}>{worst.pair}</div>
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>{worst.winRate.toFixed(0)}% WR · {worst.trades}x</div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>Min trades:</span>
        {[1, 3, 5, 10].map(n => (
          <button key={n} onClick={() => setMinTrades(n)}
            style={{
              height: 26, padding: "0 10px",
              borderRadius: "var(--r-sm)",
              border: `1px solid ${minTrades === n ? "var(--accent)" : "var(--border)"}`,
              background: minTrades === n ? "var(--accent-dim)" : "transparent",
              color: minTrades === n ? "var(--accent)" : "var(--text-dim)",
              fontSize: "var(--fs-xs)", cursor: "pointer",
            }}>
            {n}+
          </button>
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
              <SortTh k="avgRR"   label="R:R"/>
              <SortTh k="pnl"     label="P&L"/>
            </tr>
          </thead>
          <tbody>
            {data.map(d => (
              <tr key={d.pair}>
                <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text)" }}>{d.pair}</td>
                <td className="text-right mono">{d.trades}</td>
                <td className="text-right">
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500, color: d.winRate >= 60 ? "var(--success)" : d.winRate >= 40 ? "var(--warning)" : "var(--danger)" }}>
                    {d.winRate.toFixed(0)}%
                  </span>
                </td>
                <td className="text-right mono" style={{ color: d.pf >= 1.5 ? "var(--success)" : d.pf >= 1 ? "var(--warning)" : "var(--danger)" }}>
                  {d.pf >= 999 ? "∞" : d.pf.toFixed(2)}
                </td>
                <td className="text-right mono">{d.avgRR.toFixed(2)}</td>
                <td className="text-right">
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: d.pnl >= 0 ? "var(--success)" : "var(--danger)" }}>
                    {d.pnl >= 0 ? "+" : ""}{formatCurrency(d.pnl, true, sym)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Advanced Stats ────────────────────────────────────────────────
function AdvancedStatsSection({ trades, settings, currencyMeta }) {
  const sym     = currencyMeta?.symbol ?? "$";
  const capital = settings?.capitalInitial ?? 10000;
  const adv     = useMemo(() => calcAllAdvancedStats(trades, capital), [trades, capital]);

  const metrics = [
    { label: "Sharpe Ratio",    val: adv.sharpe     ?? "—", color: parseFloat(adv.sharpe)    >= 1 ? "var(--success)" : "var(--warning)", desc: ">1 good, >2 excellent" },
    { label: "Sortino Ratio",   val: adv.sortino    ?? "—", color: parseFloat(adv.sortino)   >= 1 ? "var(--success)" : "var(--warning)", desc: "Downside risk-adjusted" },
    { label: "Calmar Ratio",    val: adv.calmar     ?? "—", color: "var(--warning)",                                                      desc: "Return / max drawdown" },
    { label: "Recovery Factor", val: adv.recovery   ?? "—", color: "var(--warning)",                                                      desc: "Net profit / max DD" },
    { label: "Expectancy",      val: adv.expectancy ? `${sym}${adv.expectancy}` : "—", color: parseFloat(adv.expectancy) >= 0 ? "var(--success)" : "var(--danger)", desc: "Avg $ per trade" },
    { label: "Payoff Ratio",    val: adv.payoff     ?? "—", color: "var(--warning)",                                                      desc: "Avg win / avg loss" },
    { label: "Kelly %",         val: adv.kelly      ? `${adv.kelly}%` : "—", color: "var(--accent2)",                                    desc: "Optimal position size" },
    { label: "MFE/MAE",         val: adv.maemfe?.mfeMAERatio ?? "—", color: parseFloat(adv.maemfe?.mfeMAERatio) >= 1 ? "var(--success)" : "var(--warning)", desc: "Max fav / max adverse" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
      {metrics.map(m => (
        <div key={m.label} style={{
          background: "var(--bg-subtle)",
          borderRadius: "var(--r-md)",
          padding: "10px 12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}>
          <div>
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginBottom: 2 }}>{m.label}</div>
            <div style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)" }}>{m.desc}</div>
          </div>
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-xl)",
            fontWeight: 600,
            flexShrink: 0,
            color: m.val === "—" ? "var(--text-dim)" : m.color,
          }}>
            {m.val}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Analytics ────────────────────────────────────────────────
export default function Analytics({ trades, stats, strategyStats, emotionStats, currencyMeta, settings }) {
  const sym = currencyMeta?.symbol ?? "$";
  const { isMobile } = useBreakpoint();

  if (!trades?.length) return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 20 }}>Analytics</h1>
      <div className="stat-card">
        <div className="empty-state">
          <div className="empty-icon">📈</div>
          <div className="empty-title">No data yet</div>
          <div className="empty-desc">Log some trades to see your analytics</div>
        </div>
      </div>
    </div>
  );

  const monthlyPnl = useMemo(() => {
    const map = {};
    (trades || []).forEach(tr => {
      const m = tr.date?.slice(0, 7);
      if (m) { if (!map[m]) map[m] = 0; map[m] += tr.pnl || 0; }
    });
    return Object.entries(map).sort().map(([month, pnl]) => ({ month: month.slice(5), pnl }));
  }, [trades]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div>
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">{trades.length} trades · {monthlyPnl.length} months</p>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12 }}>
        {[
          { label: "Total P&L",     val: formatCurrency(stats.totalPnl ?? 0, false, sym),    color: (stats.totalPnl ?? 0) >= 0 ? "var(--success)" : "var(--danger)" },
          { label: "Win Rate",      val: `${(stats.winRate ?? 0).toFixed(1)}%`,               color: (stats.winRate ?? 0) >= 50 ? "var(--success)" : "var(--warning)" },
          { label: "Profit Factor", val: (stats.profitFactor ?? 0) >= 999 ? "∞" : (stats.profitFactor ?? 0).toFixed(2), color: (stats.profitFactor ?? 0) >= 1.5 ? "var(--success)" : "var(--warning)" },
          { label: "Avg R:R",       val: (stats.avgRR ?? 0).toFixed(2),                       color: (stats.avgRR ?? 0) >= 1.5 ? "var(--success)" : "var(--warning)" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="kpi-label">{s.label}</div>
            <div className="kpi-value" style={{ color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Monthly P&L */}
      <div className="stat-card">
        <div className="section-label" style={{ marginBottom: 16 }}>Monthly P&L</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthlyPnl} barSize={isMobile ? 12 : 20} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false}/>
            <XAxis dataKey="month" tick={{ fill: "var(--text-dim)", fontSize: 9 }} tickLine={false} axisLine={false}/>
            <YAxis tick={{ fill: "var(--text-dim)", fontSize: 9 }} tickLine={false} axisLine={false} width={42}/>
            <Tooltip {...chartTip} formatter={v => [formatCurrency(v, false, sym), "P&L"]}/>
            <Bar dataKey="pnl" radius={[3,3,0,0]}>
              {monthlyPnl.map((d, i) => (
                <Cell key={i} fill={d.pnl >= 0 ? "var(--success)" : "var(--danger)"} fillOpacity={0.85}/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Performance + Emotion */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
        <div className="stat-card">
          <div className="section-label" style={{ marginBottom: 12 }}>Performance</div>
          <table className="data-table">
            <tbody>
              <StatRow label="Total Trades"   value={stats.totalTrades ?? 0} />
              <StatRow label="Wins / Losses"  value={`${stats.wins ?? 0} / ${stats.losses ?? 0}`} />
              <StatRow label="Gross Profit"   value={formatCurrency(stats.grossProfit  ?? 0, false, sym)} color="var(--success)"/>
              <StatRow label="Gross Loss"     value={formatCurrency(stats.grossLoss    ?? 0, false, sym)} color="var(--danger)"/>
              <StatRow label="Avg Win"        value={formatCurrency(stats.avgWin       ?? 0, false, sym)} color="var(--success)"/>
              <StatRow label="Avg Loss"       value={formatCurrency(stats.avgLoss      ?? 0, false, sym)} color="var(--danger)"/>
              <StatRow label="Best Trade"     value={formatCurrency(stats.bestTrade    ?? 0, false, sym)} color="var(--success)"/>
              <StatRow label="Worst Trade"    value={formatCurrency(stats.worstTrade   ?? 0, false, sym)} color="var(--danger)"/>
              <StatRow label="Current Streak" value={stats.currentStreak ?? 0} color={(stats.currentStreak ?? 0) >= 0 ? "var(--success)" : "var(--danger)"}/>
            </tbody>
          </table>
        </div>
        <div className="stat-card">
          <div className="section-label" style={{ marginBottom: 12 }}>Win Rate by Emotion</div>
          <EmotionBreakdown emotionStats={emotionStats}/>
        </div>
      </div>

      {/* Strategy */}
      <div className="stat-card">
        <div className="section-label" style={{ marginBottom: 12 }}>Strategy Breakdown</div>
        <StrategyBreakdown strategyStats={strategyStats} sym={sym} isMobile={isMobile}/>
      </div>

      {/* Pair matrix */}
      <div className="stat-card">
        <div className="section-label" style={{ marginBottom: 12 }}>Pair Performance</div>
        <PairMatrix trades={trades} currencyMeta={currencyMeta}/>
      </div>

      {/* Advanced stats */}
      <div className="stat-card">
        <div className="section-label" style={{ marginBottom: 12 }}>Advanced Statistics</div>
        <AdvancedStatsSection trades={trades} settings={settings} currencyMeta={currencyMeta}/>
      </div>
    </div>
  );
}