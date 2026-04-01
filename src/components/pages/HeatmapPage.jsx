import { useState, useMemo } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { formatCurrency } from "../../utils/formatters";

const DAYS   = ["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu","Minggu"];
const DAYS_S = ["Sen","Sel","Rab","Kam","Jum","Sab","Min"];
const SESSIONS_META = [
  { name: "Asian",    color: "#8b5cf6" },
  { name: "London",   color: "var(--accent2)" },
  { name: "New York", color: "#f97316" },
];

function getDay(dateStr) { return (new Date(dateStr + "T00:00:00").getDay() + 6) % 7; }

function heatColor(value, min, max, type = "winrate") {
  if (value === null || value === undefined) return "transparent";
  const pct = max > min ? (value - min) / (max - min) : 0.5;
  if (type === "pnl") {
    if (value >= 0) return `rgba(0,200,150,${Math.min(0.85, 0.2 + pct * 0.65)})`;
    return `rgba(239,68,68,${Math.min(0.85, 0.2 + (1 - pct) * 0.65)})`;
  }
  if (pct < 0.5) {
    return `rgba(239,${Math.round(68 + 46 * pct * 2)},68,0.75)`;
  }
  return `rgba(${Math.round(239 - 239 * (pct - 0.5) * 2)},${Math.round(68 + 132 * (pct - 0.5) * 2)},0,0.75)`;
}

// ── Day stats ─────────────────────────────────────────────────────
function DayStats({ trades, currencyMeta }) {
  const sym = currencyMeta?.symbol ?? "$";
  const { isMobile } = useBreakpoint();

  const dayData = useMemo(() => {
    const map = Array.from({ length: 7 }, (_, i) => ({ day: i, trades: 0, wins: 0, pnl: 0 }));
    (trades || []).forEach(tr => {
      if (!tr.date) return;
      const d = getDay(tr.date);
      map[d].trades++;
      if ((tr.pnl ?? 0) >= 0) map[d].wins++;
      map[d].pnl += tr.pnl || 0;
    });
    return map.map(d => ({ ...d, winRate: d.trades > 0 ? (d.wins / d.trades) * 100 : null }));
  }, [trades]);

  const maxTrades = Math.max(...dayData.map(d => d.trades), 1);
  const eligible  = dayData.filter(d => d.trades >= 3);
  const best  = [...eligible].sort((a, b) => b.winRate - a.winRate)[0];
  const worst = [...eligible].sort((a, b) => a.winRate - b.winRate)[0];

  return (
    <div className="stat-card">
      <div className="section-label" style={{ marginBottom: 14 }}>Win Rate per Hari</div>
      <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 90, marginBottom: 8 }}>
        {dayData.map(d => {
          const h     = d.trades > 0 ? Math.max(6, (d.trades / maxTrades) * 80) : 3;
          const color = d.winRate === null ? "var(--bg-subtle)" : d.winRate >= 60 ? "var(--success)" : d.winRate >= 40 ? "var(--warning)" : "var(--danger)";
          return (
            <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              {d.winRate !== null && (
                <div style={{ fontSize: "var(--fs-2xs)", color, fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                  {d.winRate.toFixed(0)}%
                </div>
              )}
              <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                <div style={{ width: "100%", height: h, background: color, borderRadius: "3px 3px 0 0", opacity: d.trades === 0 ? 0.2 : 0.85, transition: "height 0.4s" }}/>
              </div>
              <div style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)" }}>{isMobile ? DAYS_S[d.day].slice(0,2) : DAYS_S[d.day]}</div>
              <div style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)" }}>{d.trades}x</div>
            </div>
          );
        })}
      </div>
      {(best || worst) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 6 }}>
          {best && (
            <div style={{ background: "var(--success-dim)", border: "1px solid var(--success)", borderRadius: "var(--r-md)", padding: "8px 10px" }}>
              <div className="kpi-label">Best Day</div>
              <div style={{ fontSize: "var(--fs-base)", color: "var(--success)", fontWeight: 600 }}>{DAYS[best.day]}</div>
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>{best.winRate?.toFixed(0)}% WR · {best.trades}x</div>
            </div>
          )}
          {worst && (
            <div style={{ background: "var(--danger-dim)", border: "1px solid var(--danger)", borderRadius: "var(--r-md)", padding: "8px 10px" }}>
              <div className="kpi-label">Worst Day</div>
              <div style={{ fontSize: "var(--fs-base)", color: "var(--danger)", fontWeight: 600 }}>{DAYS[worst.day]}</div>
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>{worst.winRate?.toFixed(0)}% WR · {worst.trades}x</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Session stats ─────────────────────────────────────────────────
function SessionStats({ trades, currencyMeta }) {
  const sym = currencyMeta?.symbol ?? "$";

  const sessionData = useMemo(() => {
    const map = {};
    SESSIONS_META.forEach(s => { map[s.name] = { trades: 0, wins: 0, pnl: 0, color: s.color }; });
    map["Other"] = { trades: 0, wins: 0, pnl: 0, color: "var(--text-dim)" };
    (trades || []).forEach(tr => {
      const s = tr.session || "Other";
      if (!map[s]) map[s] = { trades: 0, wins: 0, pnl: 0, color: "var(--text-dim)" };
      map[s].trades++;
      if ((tr.pnl ?? 0) >= 0) map[s].wins++;
      map[s].pnl += tr.pnl || 0;
    });
    return Object.entries(map)
      .filter(([, d]) => d.trades > 0)
      .map(([name, d]) => ({ name, ...d, winRate: d.trades > 0 ? (d.wins / d.trades) * 100 : 0 }))
      .sort((a, b) => b.trades - a.trades);
  }, [trades]);

  const best = [...sessionData].sort((a, b) => b.winRate - a.winRate)[0];

  return (
    <div className="stat-card">
      <div className="section-label" style={{ marginBottom: 14 }}>Win Rate per Session</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sessionData.map(s => (
          <div key={s.name}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.color }}/>
                <span style={{ fontSize: "var(--fs-sm)", color: "var(--text)" }}>{s.name}</span>
              </div>
              <div style={{ display: "flex", gap: 10, fontSize: "var(--fs-xs)", fontFamily: "var(--font-mono)" }}>
                <span style={{ color: s.winRate >= 50 ? "var(--success)" : "var(--warning)" }}>{s.winRate.toFixed(0)}%</span>
                <span style={{ color: s.pnl >= 0 ? "var(--success)" : "var(--danger)" }}>
                  {s.pnl >= 0 ? "+" : ""}{sym}{s.pnl.toFixed(0)}
                </span>
                <span style={{ color: "var(--text-dim)" }}>{s.trades}x</span>
              </div>
            </div>
            <div style={{ height: 4, background: "var(--bg-subtle)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${s.winRate}%`, background: s.color, borderRadius: 2, opacity: 0.8 }}/>
            </div>
          </div>
        ))}
      </div>
      {best && (
        <div style={{ marginTop: 12, fontSize: "var(--fs-sm)", color: "var(--text-dim)", textAlign: "center" }}>
          🏆 Best: <span style={{ color: best.color, fontWeight: 500 }}>{best.name}</span> ({best.winRate.toFixed(0)}% WR)
        </div>
      )}
    </div>
  );
}

// ── Day × Session heatmap ─────────────────────────────────────────
function DaySessionHeatmap({ trades, currencyMeta }) {
  const sym = currencyMeta?.symbol ?? "$";
  const { isMobile } = useBreakpoint();
  const [metric, setMetric] = useState("winRate");
  const sessions = SESSIONS_META.map(s => s.name);

  const data = useMemo(() => {
    const grid = {};
    DAYS.forEach((_, di) => {
      grid[di] = {};
      sessions.forEach(s => { grid[di][s] = { trades: 0, wins: 0, pnl: 0 }; });
    });
    (trades || []).forEach(tr => {
      if (!tr.date || !tr.session) return;
      const d = getDay(tr.date);
      if (!grid[d]?.[tr.session]) return;
      grid[d][tr.session].trades++;
      if ((tr.pnl ?? 0) >= 0) grid[d][tr.session].wins++;
      grid[d][tr.session].pnl += tr.pnl || 0;
    });
    return grid;
  }, [trades]);

  function getCellValue(di, s) {
    const c = data[di]?.[s];
    if (!c || c.trades === 0) return null;
    if (metric === "winRate") return (c.wins / c.trades) * 100;
    if (metric === "pnl")     return c.pnl;
    return c.trades;
  }

  function getCellLabel(di, s) {
    const c = data[di]?.[s];
    if (!c || c.trades === 0) return "";
    if (metric === "winRate") return `${((c.wins / c.trades) * 100).toFixed(0)}%`;
    if (metric === "pnl")     return `${c.pnl >= 0 ? "+" : ""}${c.pnl.toFixed(0)}`;
    return `${c.trades}x`;
  }

  const allVals = DAYS.flatMap((_, di) => sessions.map(s => getCellValue(di, s))).filter(v => v !== null);
  const minVal  = allVals.length ? Math.min(...allVals) : 0;
  const maxVal  = allVals.length ? Math.max(...allVals) : 100;

  return (
    <div className="stat-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div className="section-label">Day × Session Heatmap</div>
        <div style={{ display: "flex", gap: 2, background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 2 }}>
          {[{ v: "winRate", l: "WR%" }, { v: "pnl", l: "P&L" }, { v: "count", l: "Trades" }].map(m => (
            <button key={m.v} onClick={() => setMetric(m.v)} style={{
              padding: "3px 9px", borderRadius: "var(--r-sm)", border: "none", cursor: "pointer",
              fontSize: "var(--fs-xs)",
              background: metric === m.v ? "var(--accent)"      : "transparent",
              color:      metric === m.v ? "var(--text-inverse)" : "var(--text-dim)",
              fontWeight: metric === m.v ? 600 : 400,
            }}>{m.l}</button>
          ))}
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 3 }}>
          <thead>
            <tr>
              <th style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", textAlign: "left", padding: "3px 6px", width: 56 }}/>
              {sessions.map(s => {
                const meta = SESSIONS_META.find(ss => ss.name === s);
                return (
                  <th key={s} style={{ fontSize: "var(--fs-xs)", color: meta?.color || "var(--text-dim)", textAlign: "center", padding: "3px 4px", fontWeight: 600 }}>
                    {isMobile ? s.slice(0,3) : s}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, di) => (
              <tr key={di}>
                <td style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", padding: "2px 6px", whiteSpace: "nowrap" }}>
                  {isMobile ? DAYS_S[di] : day}
                </td>
                {sessions.map(s => {
                  const val   = getCellValue(di, s);
                  const label = getCellLabel(di, s);
                  const cell  = data[di]?.[s];
                  const bg    = val !== null ? heatColor(val, minVal, maxVal, metric === "pnl" ? "pnl" : "winrate") : "var(--bg-subtle)";
                  return (
                    <td key={s} title={cell?.trades ? `${day} ${s}: ${label} (${cell.trades} trades)` : ""}
                      style={{ background: bg, borderRadius: "var(--r-sm)", padding: isMobile ? "8px 2px" : "10px 6px", textAlign: "center", minWidth: isMobile ? 56 : 80 }}>
                      {val !== null ? (
                        <>
                          <div style={{ fontSize: isMobile ? 10 : "var(--fs-sm)", color: "#fff", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{label}</div>
                          <div style={{ fontSize: "var(--fs-2xs)", color: "rgba(255,255,255,0.7)", marginTop: 1 }}>{cell?.trades}x</div>
                        </>
                      ) : (
                        <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>—</div>
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
function Recommendations({ trades }) {
  const recs = useMemo(() => {
    const result = [];
    const sm = {}, dm = {};
    (trades || []).forEach(tr => {
      if (!tr.date) return;
      const s = tr.session || "Unknown";
      const d = getDay(tr.date);
      if (!sm[s]) sm[s] = { wins: 0, total: 0, pnl: 0 };
      if (!dm[d]) dm[d] = { wins: 0, total: 0, pnl: 0 };
      sm[s].total++; dm[d].total++;
      if ((tr.pnl ?? 0) >= 0) { sm[s].wins++; dm[d].wins++; }
      sm[s].pnl += tr.pnl || 0; dm[d].pnl += tr.pnl || 0;
    });

    const bestS  = Object.entries(sm).filter(([,d])=>d.total>=5).map(([s,d])=>({s, wr:(d.wins/d.total)*100, total:d.total})).sort((a,b)=>b.wr-a.wr)[0];
    const worstS = Object.entries(sm).filter(([,d])=>d.total>=5).map(([s,d])=>({s, wr:(d.wins/d.total)*100, total:d.total})).sort((a,b)=>a.wr-b.wr)[0];
    const bestD  = Object.entries(dm).filter(([,d])=>d.total>=5).map(([di,d])=>({day:DAYS[parseInt(di)], wr:(d.wins/d.total)*100, total:d.total})).sort((a,b)=>b.wr-a.wr)[0];
    const worstD = Object.entries(dm).filter(([,d])=>d.total>=5).map(([di,d])=>({day:DAYS[parseInt(di)], wr:(d.wins/d.total)*100, total:d.total})).sort((a,b)=>a.wr-b.wr)[0];

    if (bestS)  result.push({ icon: "🎯", type: "success", text: `Trading terbaik di sesi ${bestS.s} — win rate ${bestS.wr.toFixed(0)}% dari ${bestS.total} trade` });
    if (worstS && worstS.wr < 40) result.push({ icon: "⚠️", type: "warning", text: `Hindari sesi ${worstS.s} — win rate hanya ${worstS.wr.toFixed(0)}%` });
    if (bestD)  result.push({ icon: "📅", type: "success", text: `${bestD.day} adalah hari terbaikmu — win rate ${bestD.wr.toFixed(0)}% dari ${bestD.total} trade` });
    if (worstD && worstD.wr < 40) result.push({ icon: "🛑", type: "danger",  text: `${worstD.day} paling buruk — pertimbangkan untuk tidak trading hari itu` });
    if (!result.length) result.push({ icon: "📊", type: "info", text: "Log lebih banyak trade untuk rekomendasi waktu terbaik (min. 5 per session/hari)" });

    return result;
  }, [trades]);

  const colorMap = { success: "var(--success)", warning: "var(--warning)", danger: "var(--danger)", info: "var(--text-dim)" };

  return (
    <div style={{ background: "var(--success-dim)", border: "1px solid var(--success)", borderRadius: "var(--r-lg)", padding: "14px 16px" }}>
      <div style={{ fontSize: "var(--fs-sm)", color: "var(--success)", fontWeight: 500, marginBottom: 10 }}>💡 Rekomendasi Waktu Trading</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {recs.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 8, fontSize: "var(--fs-sm)", color: colorMap[r.type] }}>
            <span style={{ flexShrink: 0 }}>{r.icon}</span>{r.text}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main HeatmapPage ──────────────────────────────────────────────
export default function HeatmapPage({ trades, currencyMeta, theme }) {
  const { isMobile } = useBreakpoint();

  if (!trades?.length) return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 20 }}>Performance Heatmap</h1>
      <div className="stat-card">
        <div className="empty-state">
          <div className="empty-icon">🗓️</div>
          <div className="empty-title">Belum ada data trading</div>
          <div className="empty-desc">Log beberapa trade untuk melihat heatmap performa</div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 className="page-title">Performance Heatmap</h1>
        <p className="page-subtitle">Temukan waktu & hari terbaik untuk trading kamu</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
        <DayStats     trades={trades} currencyMeta={currencyMeta}/>
        <SessionStats trades={trades} currencyMeta={currencyMeta}/>
      </div>

      <DaySessionHeatmap trades={trades} currencyMeta={currencyMeta}/>
      <Recommendations   trades={trades}/>
    </div>
  );
}