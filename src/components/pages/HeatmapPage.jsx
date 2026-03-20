import { useMemo } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { formatCurrency } from "../../utils/formatters";

const DAYS    = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const DAYS_S  = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const HOURS   = Array.from({ length: 24 }, (_, i) => i);
const SESSIONS = [
  { name: "Asian",    start: 0,  end: 7,  color: "#8b5cf6" },
  { name: "London",   start: 7,  end: 16, color: "#0ea5e9" },
  { name: "New York", start: 13, end: 22, color: "#f97316" },
];

function getDay(dateStr) {
  // Returns 0=Mon ... 6=Sun
  const d = new Date(dateStr + "T00:00:00");
  return (d.getDay() + 6) % 7;
}

function getHour(timeStr) {
  if (!timeStr) return null;
  const m = timeStr.match(/(\d{1,2}):(\d{2})/);
  return m ? parseInt(m[1]) : null;
}

function getSession(hour) {
  if (hour === null) return null;
  if (hour >= 0  && hour < 7)  return "Asian";
  if (hour >= 7  && hour < 13) return "London";
  if (hour >= 13 && hour < 16) return "Both";
  if (hour >= 16 && hour < 22) return "New York";
  return "Asian";
}

function heatColor(value, min, max, type = "winrate") {
  if (value === null || value === undefined) return "transparent";
  const pct = max > min ? (value - min) / (max - min) : 0.5;
  if (type === "winrate") {
    // Red (0%) → Yellow (50%) → Green (100%)
    if (pct < 0.5) {
      const r = 239, g = Math.round(68 + (91 - 68) * pct * 2), b = 68;
      return `rgba(${r},${g},${b},0.7)`;
    } else {
      const r = Math.round(239 - (239 - 0) * (pct - 0.5) * 2);
      const g = Math.round(68 + (200 - 68) * (pct - 0.5) * 2);
      return `rgba(${r},${g},0,0.7)`;
    }
  }
  if (type === "pnl") {
    if (value >= 0) return `rgba(0,200,150,${Math.min(0.8, 0.2 + pct * 0.6)})`;
    return `rgba(239,68,68,${Math.min(0.8, 0.2 + (1 - pct) * 0.6)})`;
  }
  return `rgba(0,200,150,${pct * 0.8})`;
}

// ── Day of week stats ─────────────────────────────────────────────
function DayStats({ trades, currencyMeta, theme: t }) {
  const sym = currencyMeta?.symbol ?? "$";
  const { isMobile } = useBreakpoint();

  const dayData = useMemo(() => {
    const map = Array.from({ length: 7 }, (_, i) => ({ day: i, trades: 0, wins: 0, pnl: 0 }));
    (trades || []).forEach(tr => {
      if (!tr.date) return;
      const d = getDay(tr.date);
      map[d].trades++;
      if (tr.pnl >= 0) map[d].wins++;
      map[d].pnl += tr.pnl || 0;
    });
    return map.map(d => ({ ...d, winRate: d.trades > 0 ? (d.wins / d.trades) * 100 : null }));
  }, [trades]);

  const maxTrades = Math.max(...dayData.map(d => d.trades), 1);
  const best  = dayData.filter(d => d.trades >= 3).sort((a, b) => b.winRate - a.winRate)[0];
  const worst = dayData.filter(d => d.trades >= 3).sort((a, b) => a.winRate - b.winRate)[0];

  return (
    <div className="stat-card">
      <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 16 }}>Win Rate per Hari</div>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 100, marginBottom: 10 }}>
        {dayData.map(d => {
          const h     = d.trades > 0 ? Math.max(8, (d.trades / maxTrades) * 88) : 4;
          const color = d.winRate === null ? t.bgSubtle : d.winRate >= 60 ? "#00c896" : d.winRate >= 40 ? "#f59e0b" : "#ef4444";
          return (
            <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              {d.winRate !== null && (
                <div style={{ fontSize: 9, color, fontFamily: "DM Mono, monospace", fontWeight: 600 }}>{d.winRate.toFixed(0)}%</div>
              )}
              <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                <div style={{ width: "100%", height: h, background: color, borderRadius: "3px 3px 0 0", opacity: d.trades === 0 ? 0.2 : 0.85, transition: "height 0.5s" }} />
              </div>
              <div style={{ fontSize: 9, color: t.textDim, textAlign: "center" }}>{isMobile ? DAYS_S[d.day].slice(0,2) : DAYS_S[d.day]}</div>
              <div style={{ fontSize: 8, color: t.textDim }}>{d.trades}x</div>
            </div>
          );
        })}
      </div>
      {(best || worst) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
          {best  && <div style={{ background: "rgba(0,200,150,0.08)", border: "1px solid rgba(0,200,150,0.2)", borderRadius: 8, padding: "8px 12px" }}>
            <div style={{ fontSize: 9, color: t.textDim }}>Best Day</div>
            <div style={{ fontSize: 13, color: "#00c896", fontWeight: 600 }}>{DAYS[best.day]}</div>
            <div style={{ fontSize: 10, color: t.textDim }}>{best.winRate?.toFixed(0)}% WR · {best.trades}x</div>
          </div>}
          {worst && <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 12px" }}>
            <div style={{ fontSize: 9, color: t.textDim }}>Worst Day</div>
            <div style={{ fontSize: 13, color: "#ef4444", fontWeight: 600 }}>{DAYS[worst.day]}</div>
            <div style={{ fontSize: 10, color: t.textDim }}>{worst.winRate?.toFixed(0)}% WR · {worst.trades}x</div>
          </div>}
        </div>
      )}
    </div>
  );
}

// ── Session stats ─────────────────────────────────────────────────
function SessionStats({ trades, currencyMeta, theme: t }) {
  const sym = currencyMeta?.symbol ?? "$";

  const sessionData = useMemo(() => {
    const map = {};
    SESSIONS.forEach(s => { map[s.name] = { trades: 0, wins: 0, pnl: 0, color: s.color }; });
    map["Other"] = { trades: 0, wins: 0, pnl: 0, color: t.textDim };

    (trades || []).forEach(tr => {
      const session = tr.session || "Other";
      if (!map[session]) map[session] = { trades: 0, wins: 0, pnl: 0, color: t.textDim };
      map[session].trades++;
      if (tr.pnl >= 0) map[session].wins++;
      map[session].pnl += tr.pnl || 0;
    });

    return Object.entries(map)
      .filter(([, d]) => d.trades > 0)
      .map(([name, d]) => ({ name, ...d, winRate: d.trades > 0 ? (d.wins / d.trades) * 100 : 0 }))
      .sort((a, b) => b.trades - a.trades);
  }, [trades]);

  const best  = [...sessionData].sort((a, b) => b.winRate - a.winRate)[0];

  return (
    <div className="stat-card">
      <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 16 }}>Win Rate per Session</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sessionData.map(s => (
          <div key={s.name}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                <span style={{ fontSize: 12, color: t.text }}>{s.name}</span>
              </div>
              <div style={{ display: "flex", gap: 12, fontSize: 11, fontFamily: "DM Mono, monospace" }}>
                <span style={{ color: s.winRate >= 50 ? "#00c896" : "#f59e0b" }}>{s.winRate.toFixed(0)}%</span>
                <span style={{ color: s.pnl >= 0 ? "#00c896" : "#ef4444" }}>{s.pnl >= 0 ? "+" : ""}{sym}{s.pnl.toFixed(0)}</span>
                <span style={{ color: t.textDim }}>{s.trades}x</span>
              </div>
            </div>
            <div style={{ height: 6, background: t.bgSubtle, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${s.winRate}%`, background: s.color, borderRadius: 3, opacity: 0.8 }} />
            </div>
          </div>
        ))}
      </div>
      {best && (
        <div style={{ marginTop: 12, fontSize: 12, color: t.textDim, textAlign: "center" }}>
          🏆 Best session: <span style={{ color: best.color, fontWeight: 500 }}>{best.name}</span> ({best.winRate.toFixed(0)}% WR)
        </div>
      )}
    </div>
  );
}

// ── Day × Session heatmap ─────────────────────────────────────────
function DaySessionHeatmap({ trades, currencyMeta, theme: t }) {
  const sym = currencyMeta?.symbol ?? "$";
  const { isMobile } = useBreakpoint();
  const [metric, setMetric] = useState("winRate");

  const sessions = ["Asian", "London", "New York"];

  const data = useMemo(() => {
    const grid = {};
    DAYS.forEach((day, di) => {
      grid[di] = {};
      sessions.forEach(s => { grid[di][s] = { trades: 0, wins: 0, pnl: 0 }; });
    });

    (trades || []).forEach(tr => {
      if (!tr.date) return;
      const d = getDay(tr.date);
      const s = tr.session;
      if (!s || !grid[d]?.[s]) return;
      grid[d][s].trades++;
      if (tr.pnl >= 0) grid[d][s].wins++;
      grid[d][s].pnl += tr.pnl || 0;
    });

    return grid;
  }, [trades]);

  function getCellValue(di, session) {
    const cell = data[di]?.[session];
    if (!cell || cell.trades === 0) return null;
    if (metric === "winRate") return (cell.wins / cell.trades) * 100;
    if (metric === "pnl")     return cell.pnl;
    return cell.trades;
  }

  function getCellLabel(di, session) {
    const cell = data[di]?.[session];
    if (!cell || cell.trades === 0) return "";
    if (metric === "winRate") return ((cell.wins / cell.trades) * 100).toFixed(0) + "%";
    if (metric === "pnl")     return (cell.pnl >= 0 ? "+" : "") + cell.pnl.toFixed(0);
    return cell.trades + "x";
  }

  // Get min/max for color scaling
  const allValues = Object.values(data).flatMap(d => sessions.map(s => getCellValue(Object.keys(data).indexOf(Object.keys(data).find(k => data[k] === d)), s))).filter(v => v !== null);
  const minVal = allValues.length > 0 ? Math.min(...allValues) : 0;
  const maxVal = allValues.length > 0 ? Math.max(...allValues) : 100;

  return (
    <div className="stat-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600 }}>Day × Session Heatmap</div>
        <div style={{ display: "flex", gap: 3, background: t.bgSubtle, borderRadius: 7, padding: 2 }}>
          {[{ v: "winRate", l: "WR%" }, { v: "pnl", l: "P&L" }, { v: "count", l: "Trades" }].map(m => (
            <button key={m.v} onClick={() => setMetric(m.v)}
              style={{ padding: "3px 10px", borderRadius: 5, border: "none", cursor: "pointer", fontSize: 10, background: metric === m.v ? t.accent : "transparent", color: metric === m.v ? "#090e1a" : t.textDim, fontWeight: metric === m.v ? 600 : 400 }}>
              {m.l}
            </button>
          ))}
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 3 }}>
          <thead>
            <tr>
              <th style={{ fontSize: 9, color: t.textDim, textAlign: "left", padding: "4px 8px", width: 60 }}></th>
              {sessions.map(s => {
                const sData = SESSIONS.find(ss => ss.name === s);
                return (
                  <th key={s} style={{ fontSize: 10, color: sData?.color || t.textDim, textAlign: "center", padding: "4px 6px", fontWeight: 600 }}>
                    {isMobile ? s.slice(0, 3) : s}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, di) => (
              <tr key={di}>
                <td style={{ fontSize: 10, color: t.textDim, padding: "3px 8px", whiteSpace: "nowrap" }}>
                  {isMobile ? DAYS_S[di] : day}
                </td>
                {sessions.map(s => {
                  const val   = getCellValue(di, s);
                  const label = getCellLabel(di, s);
                  const cell  = data[di]?.[s];
                  const bg    = val !== null ? heatColor(val, minVal, maxVal, metric === "pnl" ? "pnl" : "winrate") : t.bgSubtle + "40";
                  return (
                    <td key={s} title={cell?.trades ? `${day} ${s}: ${label} (${cell.trades} trades)` : ""}
                      style={{ background: bg, borderRadius: 6, padding: isMobile ? "10px 4px" : "12px 8px", textAlign: "center", minWidth: isMobile ? 60 : 90 }}>
                      {val !== null ? (
                        <>
                          <div style={{ fontSize: isMobile ? 11 : 13, color: "#fff", fontFamily: "DM Mono, monospace", fontWeight: 600 }}>{label}</div>
                          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{cell?.trades}x</div>
                        </>
                      ) : (
                        <div style={{ fontSize: 11, color: t.textDim }}>—</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Recommendations ───────────────────────────────────────────────
function Recommendations({ trades, theme: t }) {
  const recs = useMemo(() => {
    const result = [];
    const sessionMap = {};
    const dayMap     = {};

    (trades || []).forEach(tr => {
      if (!tr.date) return;
      const s = tr.session || "Unknown";
      const d = getDay(tr.date);
      if (!sessionMap[s]) sessionMap[s] = { wins: 0, total: 0, pnl: 0 };
      if (!dayMap[d])     dayMap[d]     = { wins: 0, total: 0, pnl: 0 };
      sessionMap[s].total++;
      dayMap[d].total++;
      if (tr.pnl >= 0) { sessionMap[s].wins++; dayMap[d].wins++; }
      sessionMap[s].pnl += tr.pnl || 0;
      dayMap[d].pnl     += tr.pnl || 0;
    });

    // Best session
    const bestSession = Object.entries(sessionMap)
      .filter(([, d]) => d.total >= 5)
      .map(([s, d]) => ({ s, wr: (d.wins / d.total) * 100, total: d.total }))
      .sort((a, b) => b.wr - a.wr)[0];
    if (bestSession) result.push({ icon: "🎯", type: "success", text: `Trading terbaik di sesi ${bestSession.s} — win rate ${bestSession.wr.toFixed(0)}% dari ${bestSession.total} trade` });

    // Worst session
    const worstSession = Object.entries(sessionMap)
      .filter(([, d]) => d.total >= 5)
      .map(([s, d]) => ({ s, wr: (d.wins / d.total) * 100, total: d.total }))
      .sort((a, b) => a.wr - b.wr)[0];
    if (worstSession && worstSession.wr < 40) result.push({ icon: "⚠️", type: "warning", text: `Hindari trading di sesi ${worstSession.s} — win rate hanya ${worstSession.wr.toFixed(0)}%` });

    // Best day
    const bestDay = Object.entries(dayMap)
      .filter(([, d]) => d.total >= 5)
      .map(([di, d]) => ({ day: DAYS[parseInt(di)], wr: (d.wins / d.total) * 100, total: d.total }))
      .sort((a, b) => b.wr - a.wr)[0];
    if (bestDay) result.push({ icon: "📅", type: "success", text: `${bestDay.day} adalah hari terbaikmu — win rate ${bestDay.wr.toFixed(0)}% dari ${bestDay.total} trade` });

    // Worst day
    const worstDay = Object.entries(dayMap)
      .filter(([, d]) => d.total >= 5)
      .map(([di, d]) => ({ day: DAYS[parseInt(di)], wr: (d.wins / d.total) * 100, total: d.total }))
      .sort((a, b) => a.wr - b.wr)[0];
    if (worstDay && worstDay.wr < 40) result.push({ icon: "🛑", type: "danger", text: `${worstDay.day} adalah hari terburukmu — pertimbangkan untuk tidak trading hari itu` });

    if (result.length === 0) result.push({ icon: "📊", type: "info", text: "Log lebih banyak trade untuk mendapat rekomendasi waktu trading terbaik (minimal 5 per session/hari)" });

    return result;
  }, [trades]);

  const colorMap = { success: "#00c896", warning: "#f59e0b", danger: "#ef4444", info: t.textDim };

  return (
    <div style={{ background: "rgba(0,200,150,0.04)", border: "1px solid rgba(0,200,150,0.15)", borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ fontSize: 11, color: t.accent, fontWeight: 500, marginBottom: 12 }}>💡 Rekomendasi Waktu Trading</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {recs.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 10, fontSize: 12, color: colorMap[r.type] }}>
            <span style={{ flexShrink: 0 }}>{r.icon}</span>{r.text}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main HeatmapPage ──────────────────────────────────────────────
import { useState } from "react";

export default function HeatmapPage({ trades, currencyMeta, theme }) {
  const t   = theme;
  const { isMobile } = useBreakpoint();
  const cols2 = isMobile ? "1fr" : "1fr 1fr";

  if (!trades || trades.length === 0) {
    return (
      <div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 3, color: t.text, marginBottom: 20 }}>PERFORMANCE HEATMAP</div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 24px", textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, rgba(0,200,150,0.08), rgba(0,200,150,0.04))", border: "1px solid rgba(0,200,150,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, marginBottom: 20 }}>🗓️</div>
          <div style={{ fontSize: 15, color: t.text, marginBottom: 8 }}>Belum ada data trading</div>
          <div style={{ fontSize: 12, color: t.textDim, maxWidth: 280, lineHeight: 1.8 }}>Log beberapa trade terlebih dahulu untuk melihat heatmap performa</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 3, color: t.text, lineHeight: 1 }}>PERFORMANCE HEATMAP</div>
        <div style={{ fontSize: 11, color: t.textDim, marginTop: 4 }}>Temukan waktu & hari terbaik untuk trading kamu</div>
      </div>

      {/* Day + Session side by side */}
      <div style={{ display: "grid", gridTemplateColumns: cols2, gap: 16 }}>
        <DayStats     trades={trades} currencyMeta={currencyMeta} theme={t} />
        <SessionStats trades={trades} currencyMeta={currencyMeta} theme={t} />
      </div>

      {/* Day × Session heatmap */}
      <DaySessionHeatmap trades={trades} currencyMeta={currencyMeta} theme={t} />

      {/* Recommendations */}
      <Recommendations trades={trades} theme={t} />
    </div>
  );
}