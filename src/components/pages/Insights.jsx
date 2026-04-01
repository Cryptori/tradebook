import { useMemo } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { formatCurrency } from "../../utils/formatters";
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// ── Streak calc ───────────────────────────────────────────────────
function calcStreaks(trades) {
  const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  let curWin = 0, curLoss = 0, maxWin = 0, maxLoss = 0;
  let bestStreak = { count: 0, pnl: 0 }, worstStreak = { count: 0, pnl: 0 };
  let tmpWin = { count: 0, pnl: 0 }, tmpLoss = { count: 0, pnl: 0 };

  sorted.forEach(tr => {
    if (tr.pnl > 0) {
      curWin++; curLoss = 0;
      tmpWin.count++; tmpWin.pnl += tr.pnl;
      if (tmpLoss.count > 0) { if (tmpLoss.count > worstStreak.count) worstStreak = { ...tmpLoss }; tmpLoss = { count: 0, pnl: 0 }; }
      if (curWin > maxWin) { maxWin = curWin; bestStreak = { ...tmpWin }; }
    } else {
      curLoss++; curWin = 0;
      tmpLoss.count++; tmpLoss.pnl += tr.pnl;
      if (tmpWin.count > 0) { if (tmpWin.count > bestStreak.count) bestStreak = { ...tmpWin }; tmpWin = { count: 0, pnl: 0 }; }
      if (curLoss > maxLoss) { maxLoss = curLoss; worstStreak = { ...tmpLoss }; }
    }
  });

  return { curWin, curLoss, maxWin, maxLoss, bestStreak, worstStreak };
}

function buildWeeklyData(trades) {
  const weeks = {};
  trades.forEach(tr => {
    const d   = new Date(tr.date);
    const day = d.getDay();
    const mon = new Date(d);
    mon.setDate(d.getDate() - ((day + 6) % 7));
    const key = mon.toISOString().slice(0, 10);
    if (!weeks[key]) weeks[key] = { week: key, pnl: 0, trades: 0, wins: 0 };
    weeks[key].pnl += tr.pnl;
    weeks[key].trades++;
    if (tr.pnl > 0) weeks[key].wins++;
  });
  return Object.values(weeks)
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-12)
    .map(w => ({ ...w, label: w.week.slice(5), winRate: w.trades ? Math.round((w.wins / w.trades) * 100) : 0 }));
}

// ── Main Insights ─────────────────────────────────────────────────
export default function Insights({ trades, currencyMeta, theme }) {
  const sym = currencyMeta?.symbol ?? "$";
  const { isMobile } = useBreakpoint();

  const streaks    = useMemo(() => calcStreaks(trades), [trades]);
  const weeklyData = useMemo(() => buildWeeklyData(trades), [trades]);

  const tagStats = useMemo(() => {
    const map = {};
    trades.forEach(tr => {
      (tr.tags ?? []).forEach(tag => {
        if (!map[tag]) map[tag] = { tag, count: 0, pnl: 0, wins: 0 };
        map[tag].count++;
        map[tag].pnl += tr.pnl;
        if (tr.pnl > 0) map[tag].wins++;
      });
    });
    return Object.values(map).sort((a, b) => b.pnl - a.pnl);
  }, [trades]);

  const dowStats = useMemo(() => {
    const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const map  = Object.fromEntries(days.map(d => [d, { day: d, pnl: 0, trades: 0, wins: 0 }]));
    trades.forEach(tr => {
      const idx = new Date(tr.date).getDay();
      const key = days[idx === 0 ? 6 : idx - 1];
      map[key].pnl += tr.pnl;
      map[key].trades++;
      if (tr.pnl > 0) map[key].wins++;
    });
    return Object.values(map);
  }, [trades]);

  const curStreak = streaks.curWin > 0
    ? { count: streaks.curWin,  type: "win",  color: "var(--success)" }
    : { count: streaks.curLoss, type: "loss", color: "var(--danger)"  };

  const maxDow    = Math.max(...dowStats.map(x => Math.abs(x.pnl)), 1);
  const wins      = trades.filter(tr => tr.pnl > 0).length;
  const losses    = trades.filter(tr => tr.pnl < 0).length;

  const chartTip = {
    contentStyle: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", fontSize: 11, color: "var(--text)" },
    cursor: { stroke: "var(--border)", strokeWidth: 1 },
  };

  function WeekTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "10px 14px", fontSize: 11 }}>
        <div style={{ color: "var(--text-dim)", marginBottom: 4 }}>Week of {d?.week}</div>
        <div style={{ color: d?.pnl >= 0 ? "var(--success)" : "var(--danger)" }}>P&L: {formatCurrency(d?.pnl, false, sym)}</div>
        <div style={{ color: "var(--text)" }}>Trades: {d?.trades} · WR: {d?.winRate}%</div>
      </div>
    );
  }

  if (!trades.length) return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 20 }}>Insights</h1>
      <div className="stat-card">
        <div className="empty-state">
          <div className="empty-icon">💡</div>
          <div className="empty-title">No data yet</div>
          <div className="empty-desc">Log some trades to see your insights</div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header */}
      <div>
        <h1 className="page-title">Insights</h1>
        <p className="page-subtitle">Streak tracker, weekly review, dan analisis mendalam</p>
      </div>

      {/* Current streak banner */}
      <div className="stat-card" style={{
        background: `linear-gradient(135deg, ${curStreak.color === "var(--success)" ? "rgba(0,200,150,0.06)" : "rgba(239,68,68,0.06)"}, var(--bg-card))`,
        border: `1px solid ${curStreak.color}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          {/* Current streak */}
          <div style={{ textAlign: "center", minWidth: 100 }}>
            <div className="kpi-label" style={{ marginBottom: 4 }}>Current Streak</div>
            <div style={{ fontFamily: "var(--font-disp)", fontSize: 56, color: curStreak.color, lineHeight: 1 }}>
              {curStreak.count}
            </div>
            <div style={{ fontSize: "var(--fs-xs)", color: curStreak.color, marginTop: 2 }}>
              {curStreak.type === "win" ? "🔥" : "❄️"} {curStreak.type} streak
            </div>
          </div>
          {/* Stats */}
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, minWidth: 220 }}>
            {[
              { label: "Best Win Streak",   val: streaks.maxWin,  color: "var(--success)", sub: streaks.bestStreak.count  > 0 ? formatCurrency(streaks.bestStreak.pnl,  false, sym) : "—" },
              { label: "Worst Loss Streak", val: streaks.maxLoss, color: "var(--danger)",  sub: streaks.worstStreak.count > 0 ? formatCurrency(streaks.worstStreak.pnl, false, sym) : "—" },
              { label: "Total Trades",      val: trades.length,   color: "var(--text)",    sub: `${wins}W / ${losses}L` },
            ].map(s => (
              <div key={s.label} style={{ background: "var(--bg-subtle)", borderRadius: "var(--r-md)", padding: "10px 12px", textAlign: "center" }}>
                <div className="kpi-label" style={{ marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontFamily: "var(--font-disp)", fontSize: 28, color: s.color, lineHeight: 1 }}>{s.val}</div>
                {s.sub && <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 2 }}>{s.sub}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly P&L chart */}
      <div className="stat-card">
        <div className="section-label" style={{ marginBottom: 14 }}>Weekly P&L — Last 12 Weeks</div>
        {weeklyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false}/>
              <XAxis dataKey="label" tick={{ fill: "var(--text-dim)", fontSize: 9 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: "var(--text-dim)", fontSize: 9 }} axisLine={false} tickLine={false} width={44}
                tickFormatter={v => `${v >= 0 ? "+" : ""}${v}`}/>
              <Tooltip content={<WeekTooltip/>}/>
              <Bar dataKey="pnl" radius={[3,3,0,0]}>
                {weeklyData.map((d, i) => (
                  <Cell key={i} fill={d.pnl >= 0 ? "var(--success)" : "var(--danger)"} fillOpacity={0.85}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)" }}>
            Belum ada data
          </div>
        )}
      </div>

      {/* DoW + Tags */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
        {/* Day of week */}
        <div className="stat-card">
          <div className="section-label" style={{ marginBottom: 12 }}>P&L by Day of Week</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {dowStats.map(d => {
              const pct = (Math.abs(d.pnl) / maxDow) * 100;
              return (
                <div key={d.day}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", width: 32 }}>{d.day}</span>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>{d.trades}t</span>
                      <span style={{ fontSize: "var(--fs-sm)", fontFamily: "var(--font-mono)", fontWeight: 500, color: d.pnl >= 0 ? "var(--success)" : "var(--danger)" }}>
                        {formatCurrency(d.pnl, true, sym)}
                      </span>
                    </div>
                  </div>
                  <div style={{ height: 3, background: "var(--bg-subtle)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: d.pnl >= 0 ? "var(--success)" : "var(--danger)", borderRadius: 2, transition: "width 0.3s" }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tag performance */}
        <div className="stat-card">
          <div className="section-label" style={{ marginBottom: 12 }}>Tag Performance</div>
          {tagStats.length === 0 ? (
            <div style={{ color: "var(--text-dim)", fontSize: "var(--fs-sm)", textAlign: "center", padding: "32px 0" }}>
              Belum ada tag — tambahkan tag saat log trade
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {tagStats.slice(0, 8).map(s => (
                <div key={s.tag} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px", background: "var(--bg-subtle)", borderRadius: "var(--r-md)" }}>
                  <div>
                    <div style={{ fontSize: "var(--fs-sm)", color: "var(--text)" }}>{s.tag}</div>
                    <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>
                      {s.count} trades · {Math.round((s.wins / s.count) * 100)}% WR
                    </div>
                  </div>
                  <span style={{ fontSize: "var(--fs-base)", fontFamily: "var(--font-mono)", fontWeight: 500, color: s.pnl >= 0 ? "var(--success)" : "var(--danger)" }}>
                    {formatCurrency(s.pnl, true, sym)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Weekly summary table */}
      <div className="stat-card">
        <div className="section-label" style={{ marginBottom: 12 }}>Weekly Summary</div>
        {weeklyData.length === 0 ? (
          <div style={{ color: "var(--text-dim)", fontSize: "var(--fs-sm)", textAlign: "center", padding: "20px 0" }}>Belum ada data</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Week</th>
                  <th className="text-right">Trades</th>
                  <th className="text-right">Wins</th>
                  <th className="text-right">Win Rate</th>
                  <th className="text-right">P&L</th>
                </tr>
              </thead>
              <tbody>
                {[...weeklyData].reverse().map(w => (
                  <tr key={w.week}>
                    <td style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{w.week}</td>
                    <td className="text-right mono">{w.trades}</td>
                    <td className="text-right mono" style={{ color: "var(--success)" }}>{w.wins}</td>
                    <td className="text-right">
                      <span style={{ fontFamily: "var(--font-mono)", color: w.winRate >= 50 ? "var(--success)" : "var(--danger)" }}>
                        {w.winRate}%
                      </span>
                    </td>
                    <td className="text-right">
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: w.pnl >= 0 ? "var(--success)" : "var(--danger)" }}>
                        {formatCurrency(w.pnl, false, sym)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}