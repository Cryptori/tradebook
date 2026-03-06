import { useState, useMemo } from "react";
import { formatCurrency } from "../../utils/formatters";

const DAYS_HEADER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ── TradeCard sub-component ──────────────────────────────────────
function TradeCard({ trade, sym, t }) {
  const [expanded, setExpanded] = useState(false);
  const [imgOpen,  setImgOpen]  = useState(false);
  const isBuy = trade.side === "BUY";

  return (
    <div style={{ background: t.bgSubtle, borderRadius: 8, border: `1px solid ${t.borderSubtle}`, overflow: "hidden" }}>
      <div onClick={() => setExpanded(e => !e)}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4,
            background: isBuy ? "rgba(0,212,170,0.1)" : "rgba(245,158,11,0.1)",
            color: isBuy ? "#00d4aa" : "#f59e0b" }}>{trade.side}</span>
          <span style={{ fontSize: 12, color: t.text, fontWeight: 500 }}>{trade.pair}</span>
          {trade.screenshotUrl && <span style={{ fontSize: 10 }}>📷</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: trade.pnl >= 0 ? "#00d4aa" : "#ef4444", fontWeight: 500 }}>
            {formatCurrency(trade.pnl, false, sym)}
          </span>
          <span style={{ fontSize: 10, color: t.textDim }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "10px 12px 12px", borderTop: `1px solid ${t.borderSubtle}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
            {[
              { label: "Strategy", value: trade.strategy },
              { label: "Session",  value: trade.session  },
              { label: "Entry",    value: trade.entry    },
              { label: "Exit",     value: trade.exit     },
              { label: "R:R",      value: `${(trade.rr ?? 0) >= 0 ? "+" : ""}${trade.rr}R` },
              { label: "Emotion",  value: trade.emotion  },
            ].map(f => (
              <div key={f.label}>
                <div style={{ fontSize: 9,  color: t.textDim }}>{f.label}</div>
                <div style={{ fontSize: 11, color: t.text    }}>{f.value}</div>
              </div>
            ))}
          </div>
          {trade.notes && (
            <div style={{ fontSize: 10, color: t.textDim, fontStyle: "italic", marginBottom: 8, padding: "6px 8px", background: t.bgCard, borderRadius: 6 }}>
              "{trade.notes}"
            </div>
          )}
          {trade.screenshotUrl && (
            <>
              <img src={trade.screenshotUrl} alt="Screenshot"
                onClick={() => setImgOpen(true)}
                style={{ width: "100%", borderRadius: 6, cursor: "zoom-in", maxHeight: 120, objectFit: "cover", border: `1px solid ${t.border}` }}
                onError={e => { e.target.style.display = "none"; }} />
              <div style={{ fontSize: 9, color: t.textDim, marginTop: 4 }}>Klik untuk perbesar</div>
            </>
          )}
        </div>
      )}

      {imgOpen && trade.screenshotUrl && (
        <div onClick={() => setImgOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, cursor: "zoom-out" }}>
          <img src={trade.screenshotUrl} alt="Screenshot"
            style={{ maxWidth: "100%", maxHeight: "90vh", borderRadius: 8, objectFit: "contain" }} />
          <button onClick={e => { e.stopPropagation(); setImgOpen(false); }}
            style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────
export default function TradingCalendar({ trades, currencyMeta, theme }) {
  const t   = theme;
  const sym = currencyMeta?.symbol ?? "$";
  const now = new Date();

  const [year,     setYear]     = useState(now.getFullYear());
  const [month,    setMonth]    = useState(now.getMonth());
  const [selected, setSelected] = useState(null);

  const dayMap = useMemo(() => {
    const map = {};
    trades.forEach(trade => {
      const d = new Date(trade.date + "T00:00:00"); // force local parse
      if (d.getFullYear() === year && d.getMonth() === month) {
        const key = d.getDate();
        if (!map[key]) map[key] = { trades: [], pnl: 0 };
        map[key].trades.push(trade);
        map[key].pnl += trade.pnl;
      }
    });
    return map;
  }, [trades, year, month]);

  const monthStats = useMemo(() => {
    const allTrades = Object.values(dayMap).flatMap(d => d.trades);
    const pnl  = allTrades.reduce((s, tr) => s + tr.pnl, 0);
    const wins = allTrades.filter(tr => tr.pnl > 0).length;
    return { pnl, wins, losses: allTrades.length - wins, total: allTrades.length, tradingDays: Object.keys(dayMap).length };
  }, [dayMap]);

  // Calendar grid
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const cells = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function prevMonth() { month === 0 ? (setMonth(11), setYear(y => y - 1)) : setMonth(m => m - 1); setSelected(null); }
  function nextMonth() { month === 11 ? (setMonth(0),  setYear(y => y + 1)) : setMonth(m => m + 1); setSelected(null); }

  const selectedDay = selected ? dayMap[selected] : null;

  const sortedDays = Object.entries(dayMap).sort((a, b) => b[1].pnl - a[1].pnl);
  const bestDay    = sortedDays[0];
  const worstDay   = sortedDays[sortedDays.length - 1];

  return (
    <div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2, color: t.text, marginBottom: 4 }}>TRADING CALENDAR</div>
      <div style={{ fontSize: 11, color: t.textDim, marginBottom: 20 }}>Visualisasi trading harian per bulan</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>

        {/* ── Calendar grid ── */}
        <div className="stat-card" style={{ background: `linear-gradient(135deg, ${t.bgCard}, ${t.bgCard2})`, borderColor: t.border }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <button onClick={prevMonth} style={{ background: "none", border: `1px solid ${t.border}`, color: t.textMuted, borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 16 }}>‹</button>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 2, color: t.text }}>{MONTHS[month]} {year}</div>
              <div style={{ fontSize: 10, color: t.textDim }}>{monthStats.total} trades · {monthStats.tradingDays} trading days</div>
            </div>
            <button onClick={nextMonth} style={{ background: "none", border: `1px solid ${t.border}`, color: t.textMuted, borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 16 }}>›</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
            {DAYS_HEADER.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 10, color: t.textDim, padding: "4px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>{d}</div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />;
              const data       = dayMap[day];
              const isToday    = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
              const isSelected = selected === day;
              const pnl        = data?.pnl ?? 0;
              const hasTrades  = !!data;
              return (
                <div key={day} onClick={() => setSelected(isSelected ? null : day)}
                  style={{
                    borderRadius: 8, padding: "8px 6px", minHeight: 60,
                    cursor: hasTrades ? "pointer" : "default",
                    position: "relative",
                    border: isSelected
                      ? `1px solid ${t.accent}`
                      : `1px solid ${hasTrades ? (pnl >= 0 ? "rgba(0,212,170,0.3)" : "rgba(239,68,68,0.3)") : t.borderSubtle}`,
                    background: isSelected
                      ? `${t.accent}15`
                      : hasTrades ? (pnl >= 0 ? "rgba(0,212,170,0.06)" : "rgba(239,68,68,0.06)") : t.bgSubtle,
                    transition: "all 0.15s",
                  }}>
                  <div style={{ fontSize: 11, color: isToday ? t.accent : t.textMuted, fontWeight: isToday ? 600 : 400, marginBottom: 4 }}>{day}</div>
                  {hasTrades && (
                    <>
                      <div style={{ fontSize: 10, color: pnl >= 0 ? "#00d4aa" : "#ef4444", fontWeight: 500, lineHeight: 1.2 }}>{formatCurrency(pnl, true, sym)}</div>
                      <div style={{ fontSize: 9, color: t.textDim, marginTop: 2 }}>{data.trades.length}t</div>
                    </>
                  )}
                  {isToday && <div style={{ position: "absolute", top: 4, right: 4, width: 5, height: 5, borderRadius: "50%", background: t.accent }} />}
                </div>
              );
            })}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${t.border}` }}>
            {[
              { label: "Month P&L", value: formatCurrency(monthStats.pnl, false, sym), color: monthStats.pnl >= 0 ? "#00d4aa" : "#ef4444" },
              { label: "Trades",    value: monthStats.total,   color: t.text       },
              { label: "Wins",      value: monthStats.wins,    color: "#00d4aa"    },
              { label: "Losses",    value: monthStats.losses,  color: "#ef4444"    },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: t.textDim, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Side panel ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {selectedDay ? (
            <div className="stat-card" style={{ background: `linear-gradient(135deg, ${t.bgCard}, ${t.bgCard2})`, borderColor: t.border }}>
              <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{MONTHS[month]} {selected}</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: selectedDay.pnl >= 0 ? "#00d4aa" : "#ef4444", marginBottom: 14 }}>
                {formatCurrency(selectedDay.pnl, false, sym)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {selectedDay.trades.map(trade => (
                  <TradeCard key={trade.id} trade={trade} sym={sym} t={t} />
                ))}
              </div>
            </div>
          ) : (
            <div className="stat-card" style={{ background: `linear-gradient(135deg, ${t.bgCard}, ${t.bgCard2})`, borderColor: t.border, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
              <div style={{ textAlign: "center", color: t.textDim }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📅</div>
                <div style={{ fontSize: 12 }}>Klik tanggal</div>
                <div style={{ fontSize: 11, marginTop: 2 }}>untuk lihat detail trades</div>
              </div>
            </div>
          )}

          <div className="stat-card" style={{ background: `linear-gradient(135deg, ${t.bgCard}, ${t.bgCard2})`, borderColor: t.border }}>
            <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Hari Terbaik / Terburuk</div>
            {!sortedDays.length ? (
              <div style={{ fontSize: 11, color: t.textDim }}>Belum ada data</div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${t.borderSubtle}` }}>
                  <div>
                    <div style={{ fontSize: 10, color: t.textDim }}>Best Day</div>
                    <div style={{ fontSize: 12, color: t.text }}>{MONTHS[month].slice(0, 3)} {bestDay[0]}</div>
                  </div>
                  <div style={{ fontSize: 14, color: "#00d4aa", fontWeight: 500 }}>{formatCurrency(bestDay[1].pnl, false, sym)}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, color: t.textDim }}>Worst Day</div>
                    <div style={{ fontSize: 12, color: t.text }}>{MONTHS[month].slice(0, 3)} {worstDay[0]}</div>
                  </div>
                  <div style={{ fontSize: 14, color: "#ef4444", fontWeight: 500 }}>{formatCurrency(worstDay[1].pnl, false, sym)}</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}