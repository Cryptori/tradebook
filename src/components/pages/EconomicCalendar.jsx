import { useState, useEffect } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { IMPACT_COLORS, CURRENCIES } from "../../hooks/useEconomicCalendar";

// ── Countdown ─────────────────────────────────────────────────────
function Countdown({ event }) {
  const [diff, setDiff] = useState(0);

  useEffect(() => {
    function calc() {
      const t = new Date(event.date + "T" + (event.time || "00:00"));
      setDiff(Math.max(0, t - new Date()));
    }
    calc();
    const iv = setInterval(calc, 1000);
    return () => clearInterval(iv);
  }, [event]);

  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);

  return (
    <div style={{ background: "var(--danger-dim)", border: "1px solid var(--danger)", borderRadius: "var(--r-lg)", padding: "14px 16px", marginBottom: 14 }}>
      <div style={{ fontSize: "var(--fs-2xs)", color: "var(--danger)", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600, marginBottom: 8 }}>
        ⚡ High Impact Event Berikutnya
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: "var(--fs-base)", fontWeight: 500, color: "var(--text)" }}>{event.title}</div>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 2 }}>
            {event.currency || event.country} · {event.date} {event.time}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[{ v: h, l: "JAM" }, { v: m, l: "MENIT" }, { v: s, l: "DETIK" }].map(({ v, l }) => (
            <div key={l} style={{ textAlign: "center", background: "var(--bg-subtle)", border: "1px solid var(--danger)", borderRadius: "var(--r-md)", padding: "6px 10px", minWidth: 48 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-2xl)", color: "var(--danger)", lineHeight: 1 }}>
                {String(v).padStart(2, "0")}
              </div>
              <div style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)", marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      {(event.forecast || event.previous) && (
        <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>
          {event.forecast && <span>Forecast: <span style={{ color: "var(--text)" }}>{event.forecast}</span></span>}
          {event.previous && <span>Previous: <span style={{ color: "var(--text)" }}>{event.previous}</span></span>}
        </div>
      )}
    </div>
  );
}

// ── Event form ────────────────────────────────────────────────────
function EventForm({ form, setField, onSave, onClose, editId }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "var(--bg-overlay)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: "var(--r-xl)", padding: 24, width: "100%", maxWidth: 420,
        maxHeight: "90vh", overflowY: "auto", boxShadow: "var(--shadow-lg)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "var(--font-disp)", fontSize: 18, letterSpacing: 2, color: "var(--text)", fontWeight: 400 }}>
            {editId ? "EDIT EVENT" : "TAMBAH EVENT"}
          </h2>
          <button onClick={onClose} className="btn-icon">✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label>Nama Event</label>
            <input value={form.title} onChange={e => setField("title", e.target.value)}
              placeholder="NFP, CPI, Fed Rate Decision..."/>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label>Currency</label>
              <select value={form.currency} onChange={e => setField("currency", e.target.value)}>
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label>Impact</label>
              <select value={form.impact} onChange={e => setField("impact", e.target.value)}>
                {["High","Medium","Low"].map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label>Tanggal</label>
              <input type="date" value={form.date} onChange={e => setField("date", e.target.value)}/>
            </div>
            <div>
              <label>Waktu</label>
              <input type="time" value={form.time} onChange={e => setField("time", e.target.value)}/>
            </div>
            <div>
              <label>Forecast</label>
              <input value={form.forecast} onChange={e => setField("forecast", e.target.value)} placeholder="200K"/>
            </div>
            <div>
              <label>Previous</label>
              <input value={form.previous} onChange={e => setField("previous", e.target.value)} placeholder="180K"/>
            </div>
          </div>
          <div>
            <label>Notes</label>
            <textarea value={form.notes} onChange={e => setField("notes", e.target.value)}
              rows={2} placeholder="Catatan tentang event ini..."/>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>Batal</button>
          <button onClick={onSave} className="btn-primary" style={{ flex: 2, justifyContent: "center" }}>
            {editId ? "Update" : "Tambah Event"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Event row ─────────────────────────────────────────────────────
function EventRow({ event, isAffected, onEdit, onDelete }) {
  const impactColor = IMPACT_COLORS[event.impact] || "var(--text-dim)";
  const isPast      = new Date(event.date + "T" + (event.time || "23:59")) < new Date();

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 16px", borderBottom: "1px solid var(--border-subtle)",
      opacity: isPast ? 0.6 : 1,
      background: isAffected ? "var(--danger-dim)" : "transparent",
    }}>
      {/* Impact dot */}
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: impactColor, flexShrink: 0 }}/>

      {/* Time */}
      <div style={{ width: 42, fontSize: "var(--fs-xs)", color: "var(--text-dim)", fontFamily: "var(--font-mono)", flexShrink: 0 }}>
        {event.time || "--:--"}
      </div>

      {/* Currency */}
      <div style={{ width: 34, fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text)", flexShrink: 0, fontFamily: "var(--font-mono)" }}>
        {event.currency || event.country}
      </div>

      {/* Title */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
          {event.title}
          {isAffected  && <span className="badge badge-red"   style={{ fontSize: 8 }}>TRADE</span>}
          {event.isCustom && <span className="badge badge-blue" style={{ fontSize: 8 }}>CUSTOM</span>}
        </div>
        {(event.forecast || event.previous || event.actual) && (
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 2, display: "flex", gap: 10 }}>
            {event.forecast && <span>F: {event.forecast}</span>}
            {event.previous && <span>P: {event.previous}</span>}
            {event.actual   && (
              <span style={{ color: parseFloat(event.actual) >= parseFloat(event.forecast || 0) ? "var(--success)" : "var(--danger)" }}>
                A: {event.actual}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Impact badge */}
      <span style={{ fontSize: "var(--fs-2xs)", padding: "2px 7px", borderRadius: 3, background: `${impactColor}20`, color: impactColor, border: `1px solid ${impactColor}40`, flexShrink: 0 }}>
        {event.impact}
      </span>

      {/* Actions — custom only */}
      {event.isCustom && (
        <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
          <button onClick={() => onEdit(event)} className="btn-icon" style={{ width: 24, height: 24 }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button onClick={() => onDelete(event.id)} className="btn-icon" style={{ width: 24, height: 24, color: "var(--danger)" }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main EconomicCalendar ─────────────────────────────────────────
export default function EconomicCalendar({ calendarHook, theme }) {
  const {
    events, loading, error, lastFetched, nextHighImpact, taggedTrades,
    filterCurrency, setFilterCurrency,
    filterImpact,   setFilterImpact,
    filterDate,     setFilterDate,
    showForm, form, setField, editId,
    openAdd, openEdit, closeForm, saveEvent, deleteEvent, refetch,
  } = calendarHook;

  const grouped = events.reduce((acc, e) => {
    if (!acc[e.date]) acc[e.date] = [];
    acc[e.date].push(e);
    return acc;
  }, {});

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Economic Calendar</h1>
          <p className="page-subtitle">
            High impact events & news
            {lastFetched && ` · Updated ${lastFetched.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={refetch} disabled={loading} className="btn-ghost" style={{ height: 30, fontSize: "var(--fs-sm)" }}>
            {loading ? "Loading..." : "↺ Refresh"}
          </button>
          <button onClick={openAdd} className="btn-primary" style={{ height: 30, fontSize: "var(--fs-sm)" }}>
            + Tambah Event
          </button>
        </div>
      </div>

      {/* Countdown */}
      {nextHighImpact && <Countdown event={nextHighImpact}/>}

      {/* Error */}
      {error && (
        <div style={{ background: "var(--warning-dim)", border: "1px solid var(--warning)", borderRadius: "var(--r-md)", padding: "10px 14px", fontSize: "var(--fs-sm)", color: "var(--warning)" }}>
          ⚠️ {error} — Menampilkan event custom saja.
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {/* Date filter */}
        <div style={{ display: "flex", gap: 2, background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 2 }}>
          {[{ v: "today", l: "Hari Ini" }, { v: "week", l: "Minggu" }, { v: "month", l: "Bulan" }, { v: "all", l: "Semua" }].map(opt => (
            <button key={opt.v} onClick={() => setFilterDate(opt.v)} style={{
              padding: "5px 10px", borderRadius: "var(--r-sm)", border: "none", cursor: "pointer",
              fontSize: "var(--fs-xs)", fontFamily: "var(--font-mono)",
              background: filterDate === opt.v ? "var(--accent)"      : "transparent",
              color:      filterDate === opt.v ? "var(--text-inverse)" : "var(--text-dim)",
              fontWeight: filterDate === opt.v ? 600 : 400,
            }}>{opt.l}</button>
          ))}
        </div>

        {/* Impact filter */}
        <div style={{ display: "flex", gap: 2, background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 2 }}>
          {["ALL","High","Medium","Low"].map(imp => {
            const active = filterImpact === imp;
            const color  = IMPACT_COLORS[imp];
            return (
              <button key={imp} onClick={() => setFilterImpact(imp)} style={{
                padding: "5px 10px", borderRadius: "var(--r-sm)", border: "none", cursor: "pointer",
                fontSize: "var(--fs-xs)",
                background: active ? (color || "var(--accent)") : "transparent",
                color:      active ? "#fff" : "var(--text-dim)",
                fontWeight: active ? 600 : 400,
              }}>{imp}</button>
            );
          })}
        </div>

        {/* Currency filter */}
        <select value={filterCurrency} onChange={e => setFilterCurrency(e.target.value)}
          style={{ height: 30, width: "auto", fontSize: "var(--fs-xs)", fontFamily: "var(--font-mono)" }}>
          <option value="ALL">Semua Currency</option>
          {["USD","EUR","GBP","JPY","AUD","CAD","CHF","NZD"].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          { label: "Total",      val: events.length,                                     color: "var(--text)"    },
          { label: "High Impact",val: events.filter(e => e.impact === "High").length,    color: "var(--danger)"  },
          { label: "Custom",     val: events.filter(e => e.isCustom).length,             color: "var(--accent2)" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "6px 12px", display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: "var(--fs-xl)", fontWeight: 600, color: s.color, fontFamily: "var(--font-mono)" }}>{s.val}</span>
            <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Events */}
      {Object.keys(grouped).length === 0 ? (
        <div className="stat-card">
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <div className="empty-title">Tidak ada event</div>
            <div className="empty-desc">
              {loading ? "Sedang mengambil data..." : "Coba ganti filter atau tambah event manual"}
            </div>
            <button onClick={openAdd} className="btn-primary" style={{ marginTop: 16 }}>+ Tambah Event Manual</button>
          </div>
        </div>
      ) : (
        <div className="stat-card" style={{ padding: 0, overflow: "hidden" }}>
          {Object.entries(grouped).sort().map(([date, dayEvents]) => (
            <div key={date}>
              <div style={{
                padding: "8px 16px",
                background: date === today ? "var(--accent-dim)" : "var(--bg-subtle)",
                borderBottom: "1px solid var(--border)",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ fontSize: "var(--fs-sm)", fontWeight: 500, color: date === today ? "var(--accent)" : "var(--text)", fontFamily: "var(--font-mono)" }}>
                  {date === today ? "📌 Hari Ini — " : ""}
                  {new Date(date + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
                </span>
                <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>{dayEvents.length} event</span>
              </div>
              {dayEvents.map(event => (
                <EventRow key={event.id} event={event}
                  isAffected={taggedTrades.size > 0 && event.impact === "High"}
                  onEdit={openEdit} onDelete={deleteEvent}/>
              ))}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <EventForm form={form} setField={setField}
          onSave={saveEvent} onClose={closeForm} editId={editId}/>
      )}
    </div>
  );
}