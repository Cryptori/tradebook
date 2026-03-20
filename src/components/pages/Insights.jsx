import { useMemo } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { formatCurrency } from "../../utils/formatters";
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

// ── Sub-components ───────────────────────────────────────────────
function StreakBadge({ count, type, color }) {
  if (count === 0) return <div style={{ fontSize: 12, color: "#64748b" }}>—</div>;
  return (
    <div style={{ fontSize: 12, color, fontWeight: 500 }}>
      {type === "win" ? "🔥" : "❄️"} {type} streak
    </div>
  );
}

function MiniStat({ label, value, sub, color }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
      <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ── Streak logic ─────────────────────────────────────────────────
function calcStreaks(trades) {
  const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  let currentWin = 0, currentLoss = 0;
  let maxWin = 0, maxLoss = 0;
  let bestStreak  = { count: 0, pnl: 0 };
  let worstStreak = { count: 0, pnl: 0 };
  let tempWin  = { count: 0, pnl: 0 };
  let tempLoss = { count: 0, pnl: 0 };

  sorted.forEach(tr => {
    if (tr.pnl > 0) {
      currentWin++;
      tempWin.count++;
      tempWin.pnl += tr.pnl;
      currentLoss = 0;
      if (tempLoss.count > 0) {
        if (tempLoss.count > worstStreak.count) worstStreak = { ...tempLoss };
        tempLoss = { count: 0, pnl: 0 };
      }
      if (currentWin > maxWin) { maxWin = currentWin; bestStreak = { ...tempWin }; }
    } else {
      currentLoss++;
      tempLoss.count++;
      tempLoss.pnl += tr.pnl;
      currentWin = 0;
      if (tempWin.count > 0) {
        if (tempWin.count > bestStreak.count) bestStreak = { ...tempWin };
        tempWin = { count: 0, pnl: 0 };
      }
      if (currentLoss > maxLoss) { maxLoss = currentLoss; worstStreak = { ...tempLoss }; }
    }
  });

  return { currentWin, currentLoss, maxWin, maxLoss, bestStreak, worstStreak };
}

// ── Weekly data ──────────────────────────────────────────────────
function buildWeeklyData(trades) {
  const weeks = {};
  trades.forEach(tr => {
    const d = new Date(tr.date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(new Date(tr.date).setDate(diff)); // avoid mutation
    const key = monday.toISOString().split("T")[0];
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

// ── Main component ───────────────────────────────────────────────
export default function Insights({ trades, currencyMeta, theme }) {
  const t = theme;
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
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const map = Object.fromEntries(days.map(d => [d, { day: d, pnl: 0, trades: 0, wins: 0 }]));
    trades.forEach(tr => {
      const idx = new Date(tr.date).getDay();
      const key = days[idx === 0 ? 6 : idx - 1];
      map[key].pnl += tr.pnl;
      map[key].trades++;
      if (tr.pnl > 0) map[key].wins++;
    });
    return Object.values(map);
  }, [trades]);

  const currentStreak = streaks.currentWin > 0
    ? { count: streaks.currentWin,  type: "win",  color: "#00d4aa" }
    : { count: streaks.currentLoss, type: "loss", color: "#ef4444" };

  const WeekTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 11 }}>
        <div style={{ color: t.textDim, marginBottom: 4 }}>Week of {label}</div>
        <div style={{ color: d?.pnl >= 0 ? "#00d4aa" : "#ef4444" }}>P&L: {formatCurrency(d?.pnl, false, sym)}</div>
        <div style={{ color: t.text }}>Trades: {d?.trades} · WR: {d?.winRate}%</div>
      </div>
    );
  };

  const maxDow = dowStats.length > 0 ? Math.max(...dowStats.map(x => Math.abs(x.pnl)), 1) : 1;

  return (
    <div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2, color: t.text, marginBottom: 4 }}>INSIGHTS</div>
      <div style={{ fontSize: 11, color: t.textDim, marginBottom: 24 }}>Streak tracker, weekly review, dan analisis mendalam</div>

      {/* Current streak banner */}
      <div className="stat-card" style={{ background: `linear-gradient(135deg, ${currentStreak.color}10, ${t.bgCard})`, border: `1px solid ${currentStreak.color}40`, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{ textAlign: "center", minWidth: 100 }}>
            <div style={{ fontSize: 10, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Current Streak</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, color: currentStreak.color, lineHeight: 1 }}>{currentStreak.count}</div>
            <StreakBadge count={currentStreak.count} type={currentStreak.type} color={currentStreak.color} />
          </div>
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, minWidth: 240 }}>
            <MiniStat label="Best Win Streak"   value={streaks.maxWin}  color="#00d4aa"
              sub={streaks.bestStreak.count  > 0 ? formatCurrency(streaks.bestStreak.pnl,  false, sym) : "—"} />
            <MiniStat label="Worst Loss Streak" value={streaks.maxLoss} color="#ef4444"
              sub={streaks.worstStreak.count > 0 ? formatCurrency(streaks.worstStreak.pnl, false, sym) : "—"} />
            <MiniStat label="Total Trades" value={trades.length} color={t.text}
              sub={`${trades.filter(tr => tr.pnl > 0).length}W / ${trades.filter(tr => tr.pnl < 0).length}L`} />
          </div>
        </div>
      </div>

      {/* Weekly P&L chart */}
      <div className="stat-card" style={{ background: `linear-gradient(135deg, ${t.bgCard}, ${t.bgCard2})`, borderColor: t.border, marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Weekly P&L — Last 12 Weeks</div>
        {weeklyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: t.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: t.textDim, fontSize: 10 }} axisLine={false} tickLine={false} width={52}
                tickFormatter={v => `${v >= 0 ? "+" : ""}${v}`} />
              <Tooltip content={<WeekTooltip />} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {weeklyData.map((d, i) => (
                  <Cell key={i} fill={d.pnl >= 0 ? "#00d4aa" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: t.textDim, fontSize: 12 }}>Belum ada data</div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Day of week */}
        <div className="stat-card" style={{ background: `linear-gradient(135deg, ${t.bgCard}, ${t.bgCard2})`, borderColor: t.border }}>
          <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>P&L by Day of Week</div>
          {dowStats.map(d => {
            const pct = (Math.abs(d.pnl) / maxDow) * 100;
            return (
              <div key={d.day} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: t.textMuted }}>{d.day}</span>
                  <div style={{ display: "flex", gap: 10 }}>
                    <span style={{ fontSize: 10, color: t.textDim }}>{d.trades}t</span>
                    <span style={{ fontSize: 11, color: d.pnl >= 0 ? "#00d4aa" : "#ef4444", fontWeight: 500 }}>{formatCurrency(d.pnl, true, sym)}</span>
                  </div>
                </div>
                <div style={{ height: 4, background: t.bgSubtle, borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: d.pnl >= 0 ? "#00d4aa" : "#ef4444", borderRadius: 2, transition: "width 0.3s" }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Tag performance */}
        <div className="stat-card" style={{ background: `linear-gradient(135deg, ${t.bgCard}, ${t.bgCard2})`, borderColor: t.border }}>
          <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Tag Performance</div>
          {tagStats.length === 0 ? (
            <div style={{ color: t.textDim, fontSize: 12, textAlign: "center", paddingTop: 40 }}>Belum ada tag — tambahkan tag saat log trade</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {tagStats.slice(0, 8).map(s => (
                <div key={s.tag} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px", background: t.bgSubtle, borderRadius: 7 }}>
                  <div>
                    <div style={{ fontSize: 11, color: t.text }}>{s.tag}</div>
                    <div style={{ fontSize: 9, color: t.textDim }}>{s.count} trades · {Math.round((s.wins / s.count) * 100)}% WR</div>
                  </div>
                  <div style={{ fontSize: 13, color: s.pnl >= 0 ? "#00d4aa" : "#ef4444", fontWeight: 500 }}>{formatCurrency(s.pnl, true, sym)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Weekly summary table */}
      <div className="stat-card" style={{ background: `linear-gradient(135deg, ${t.bgCard}, ${t.bgCard2})`, borderColor: t.border }}>
        <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Weekly Summary</div>
        {weeklyData.length === 0 ? (
          <div style={{ color: t.textDim, fontSize: 12, textAlign: "center", padding: "20px 0" }}>Belum ada data</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="trade-table">
              <thead>
                <tr>{["Week", "Trades", "Wins", "Win Rate", "P&L"].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {[...weeklyData].reverse().map(w => (
                  <tr key={w.week}>
                    <td style={{ color: t.textMuted }}>{w.week}</td>
                    <td style={{ color: t.text }}>{w.trades}</td>
                    <td style={{ color: "#00d4aa" }}>{w.wins}</td>
                    <td style={{ color: w.winRate >= 50 ? "#00d4aa" : "#ef4444" }}>{w.winRate}%</td>
                    <td style={{ color: w.pnl >= 0 ? "#00d4aa" : "#ef4444", fontWeight: 500 }}>{formatCurrency(w.pnl, false, sym)}</td>
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