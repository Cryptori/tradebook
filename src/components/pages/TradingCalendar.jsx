import { useState, useMemo } from "react";
import { formatCurrency } from "../../utils/formatters";
import { useBreakpoint } from "../../hooks/useBreakpoint";

const DAY_HDRS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MONTHS   = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ── Expandable trade card ─────────────────────────────────────────
function TradeCard({ trade, sym }) {
  const [expanded, setExpanded] = useState(false);
  const [imgOpen,  setImgOpen]  = useState(false);
  const isBuy = trade.side === "BUY";
  const pnl   = trade.pnl ?? 0;

  return (
    <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
      <div onClick={() => setExpanded(e => !e)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className={`badge ${isBuy ? "badge-green" : "badge-yellow"}`} style={{ fontSize: 8 }}>{trade.side}</span>
          <span style={{ fontSize: "var(--fs-sm)", color: "var(--text)", fontWeight: 500, fontFamily: "var(--font-mono)" }}>{trade.pair}</span>
          {(trade.screenshots?.[0] || trade.screenshotUrl) && <span style={{ fontSize: 10 }}>📷</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: "var(--fs-sm)", color: pnl >= 0 ? "var(--success)" : "var(--danger)", fontWeight: 500, fontFamily: "var(--font-mono)" }}>
            {formatCurrency(pnl, false, sym)}
          </span>
          <span style={{ fontSize: 9, color: "var(--text-dim)" }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "8px 10px 10px", borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
            {[
              { label: "Strategy", val: trade.strategy },
              { label: "Session",  val: trade.session  },
              { label: "Entry",    val: trade.entry    },
              { label: "Exit",     val: trade.exit     },
              { label: "R:R",      val: `${(trade.rr ?? 0) >= 0 ? "+" : ""}${trade.rr}R` },
              { label: "Emotion",  val: trade.emotion  },
            ].map(f => (
              <div key={f.label}>
                <div style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)" }}>{f.label}</div>
                <div style={{ fontSize: "var(--fs-xs)", color: "var(--text)" }}>{f.val || "—"}</div>
              </div>
            ))}
          </div>
          {trade.notes && (
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", fontStyle: "italic", marginBottom: 8, padding: "5px 8px", background: "var(--bg-card)", borderRadius: "var(--r-sm)" }}>
              "{trade.notes}"
            </div>
          )}
          {(trade.screenshots?.[0] || trade.screenshotUrl) && (
            <>
              <img src={trade.screenshots?.[0] || trade.screenshotUrl} alt="Screenshot"
                onClick={() => setImgOpen(true)}
                style={{ width: "100%", borderRadius: "var(--r-sm)", cursor: "zoom-in", maxHeight: 110, objectFit: "cover", border: "1px solid var(--border)" }}
                onError={e => { e.target.style.display = "none"; }}/>
              <div style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)", marginTop: 3 }}>Klik untuk perbesar</div>
            </>
          )}
        </div>
      )}

      {imgOpen && (trade.screenshots?.[0] || trade.screenshotUrl) && (
        <div onClick={() => setImgOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, cursor: "zoom-out" }}>
          <img src={trade.screenshots?.[0] || trade.screenshotUrl} alt="Screenshot"
            style={{ maxWidth: "100%", maxHeight: "90vh", borderRadius: "var(--r-lg)", objectFit: "contain" }}/>
          <button onClick={e => { e.stopPropagation(); setImgOpen(false); }}
            style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>
      )}
    </div>
  );
}

// ── Main TradingCalendar ──────────────────────────────────────────
export default function TradingCalendar({ trades, currencyMeta, theme }) {
  const sym = currencyMeta?.symbol ?? "$";
  const now = new Date();
  const { isMobile } = useBreakpoint();

  const [year,     setYear]     = useState(now.getFullYear());
  const [month,    setMonth]    = useState(now.getMonth());
  const [selected, setSelected] = useState(null);

  const dayMap = useMemo(() => {
    const map = {};
    (trades || []).forEach(tr => {
      const d = new Date(tr.date + "T00:00:00");
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      const key = d.getDate();
      if (!map[key]) map[key] = { trades: [], pnl: 0 };
      map[key].trades.push(tr);
      map[key].pnl += tr.pnl || 0;
    });
    return map;
  }, [trades, year, month]);

  const monthStats = useMemo(() => {
    const all  = Object.values(dayMap).flatMap(d => d.trades);
    const pnl  = all.reduce((s, tr) => s + (tr.pnl || 0), 0);
    const wins = all.filter(tr => (tr.pnl ?? 0) > 0).length;
    return { pnl, wins, losses: all.length - wins, total: all.length, tradingDays: Object.keys(dayMap).length };
  }, [dayMap]);

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const cells = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); setSelected(null); }
  function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); setSelected(null); }

  const sortedDays = Object.entries(dayMap).sort((a, b) => b[1].pnl - a[1].pnl);
  const selectedDay = selected ? dayMap[selected] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 className="page-title">Trading Calendar</h1>
        <p className="page-subtitle">Visualisasi trading harian per bulan</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 300px", gap: 14, alignItems: "start" }}>
        {/* Calendar */}
        <div className="stat-card">
          {/* Nav */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <button onClick={prevMonth} className="btn-icon" style={{ width: 32, height: 32, fontSize: 16 }}>‹</button>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-disp)", fontSize: 20, letterSpacing: 2, color: "var(--text)" }}>{MONTHS[month]} {year}</div>
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>{monthStats.total} trades · {monthStats.tradingDays} trading days</div>
            </div>
            <button onClick={nextMonth} className="btn-icon" style={{ width: 32, height: 32, fontSize: 16 }}>›</button>
          </div>

          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 3 }}>
            {DAY_HDRS.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: "var(--fs-2xs)", color: "var(--text-dim)", padding: "3px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`}/>;
              const data       = dayMap[day];
              const isToday    = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
              const isSelected = selected === day;
              const pnl        = data?.pnl ?? 0;
              const hasTrades  = !!data;
              return (
                <div key={day} onClick={() => setSelected(isSelected ? null : day)} style={{
                  borderRadius: "var(--r-md)", padding: "6px 5px", minHeight: 56,
                  cursor: hasTrades ? "pointer" : "default", position: "relative",
                  border: isSelected ? "1px solid var(--accent)" : `1px solid ${hasTrades ? (pnl >= 0 ? "rgba(0,212,170,0.3)" : "rgba(239,68,68,0.3)") : "var(--border-subtle)"}`,
                  background: isSelected ? "var(--accent-dim)" : hasTrades ? (pnl >= 0 ? "rgba(0,212,170,0.06)" : "rgba(239,68,68,0.06)") : "var(--bg-subtle)",
                  transition: "all var(--t-base)",
                }}>
                  <div style={{ fontSize: "var(--fs-xs)", color: isToday ? "var(--accent)" : "var(--text-muted)", fontWeight: isToday ? 700 : 400, marginBottom: 3 }}>{day}</div>
                  {hasTrades && (
                    <>
                      <div style={{ fontSize: "var(--fs-2xs)", color: pnl >= 0 ? "var(--success)" : "var(--danger)", fontWeight: 600, lineHeight: 1.2 }}>
                        {formatCurrency(pnl, true, sym)}
                      </div>
                      <div style={{ fontSize: 8, color: "var(--text-dim)", marginTop: 1 }}>{data.trades.length}t</div>
                    </>
                  )}
                  {isToday && <div style={{ position: "absolute", top: 4, right: 4, width: 4, height: 4, borderRadius: "50%", background: "var(--accent)" }}/>}
                </div>
              );
            })}
          </div>

          {/* Month summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
            {[
              { label: "P&L",    val: formatCurrency(monthStats.pnl, false, sym), color: monthStats.pnl >= 0 ? "var(--success)" : "var(--danger)" },
              { label: "Trades", val: monthStats.total,   color: "var(--text)"    },
              { label: "Wins",   val: monthStats.wins,    color: "var(--success)" },
              { label: "Losses", val: monthStats.losses,  color: "var(--danger)"  },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div className="kpi-label">{s.label}</div>
                <div style={{ fontFamily: "var(--font-disp)", fontSize: 20, color: s.color, lineHeight: 1, marginTop: 4 }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Side panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {selectedDay ? (
            <div className="stat-card">
              <div className="section-label" style={{ marginBottom: 8 }}>{MONTHS[month]} {selected}</div>
              <div style={{ fontFamily: "var(--font-disp)", fontSize: 26, color: selectedDay.pnl >= 0 ? "var(--success)" : "var(--danger)", marginBottom: 12 }}>
                {formatCurrency(selectedDay.pnl, false, sym)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {selectedDay.trades.map(tr => <TradeCard key={tr.id} trade={tr} sym={sym}/>)}
              </div>
            </div>
          ) : (
            <div className="stat-card">
              <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-dim)" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📅</div>
                <div style={{ fontSize: "var(--fs-sm)" }}>Klik tanggal untuk lihat detail trades</div>
              </div>
            </div>
          )}

          {/* Best / worst */}
          {sortedDays.length > 0 && (
            <div className="stat-card">
              <div className="section-label" style={{ marginBottom: 10 }}>Hari Terbaik / Terburuk</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
                <div>
                  <div className="kpi-label">Best Day</div>
                  <div style={{ fontSize: "var(--fs-sm)", color: "var(--text)" }}>{MONTHS[month].slice(0,3)} {sortedDays[0][0]}</div>
                </div>
                <div style={{ fontSize: "var(--fs-base)", color: "var(--success)", fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                  {formatCurrency(sortedDays[0][1].pnl, false, sym)}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10 }}>
                <div>
                  <div className="kpi-label">Worst Day</div>
                  <div style={{ fontSize: "var(--fs-sm)", color: "var(--text)" }}>{MONTHS[month].slice(0,3)} {sortedDays.at(-1)[0]}</div>
                </div>
                <div style={{ fontSize: "var(--fs-base)", color: "var(--danger)", fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                  {formatCurrency(sortedDays.at(-1)[1].pnl, false, sym)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}