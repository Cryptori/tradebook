import { useState, useEffect } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { IMPACT_COLORS, CURRENCIES } from "../../hooks/useEconomicCalendar";

// ── Countdown component ──────────────────────────────────────────
function Countdown({ event, theme: t }) {
  const [diff, setDiff] = useState(0);

  useEffect(() => {
    function calc() {
      const eventTime = new Date(event.date + "T" + (event.time || "00:00"));
      setDiff(Math.max(0, eventTime - new Date()));
    }
    calc();
    const iv = setInterval(calc, 1000);
    return () => clearInterval(iv);
  }, [event]);

  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);

  return (
    <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
      <div style={{ fontSize: 10, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
        ⚡ High Impact Event Berikutnya
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: t.text }}>{event.title}</div>
          <div style={{ fontSize: 11, color: t.textDim, marginTop: 2 }}>
            {event.currency || event.country} · {event.date} {event.time}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[{ v: h, l: "JAM" }, { v: m, l: "MENIT" }, { v: s, l: "DETIK" }].map(({ v, l }) => (
            <div key={l} style={{ textAlign: "center", background: t.bgSubtle, border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 12px", minWidth: 52 }}>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: 20, color: "#ef4444", lineHeight: 1 }}>
                {String(v).padStart(2, "0")}
              </div>
              <div style={{ fontSize: 8, color: t.textDim, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      {(event.forecast || event.previous) && (
        <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 11, color: t.textDim }}>
          {event.forecast && <span>Forecast: <span style={{ color: t.text }}>{event.forecast}</span></span>}
          {event.previous && <span>Previous: <span style={{ color: t.text }}>{event.previous}</span></span>}
        </div>
      )}
    </div>
  );
}

// ── Event Form ───────────────────────────────────────────────────
function EventForm({ form, setField, onSave, onClose, editId, theme: t }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 440, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2, color: t.text }}>
            {editId ? "EDIT EVENT" : "TAMBAH EVENT"}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ color: t.textDim }}>Nama Event</label>
            <input value={form.title} onChange={e => setField("title", e.target.value)}
              placeholder="NFP, CPI, Fed Rate Decision..."
              style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "9px 12px", fontSize: 13 }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ color: t.textDim }}>Currency</label>
              <select value={form.currency} onChange={e => setField("currency", e.target.value)}
                style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "9px 12px", fontSize: 13 }}>
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: t.textDim }}>Impact</label>
              <select value={form.impact} onChange={e => setField("impact", e.target.value)}
                style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "9px 12px", fontSize: 13 }}>
                {["High", "Medium", "Low"].map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ color: t.textDim }}>Tanggal</label>
              <input type="date" value={form.date} onChange={e => setField("date", e.target.value)}
                style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "9px 12px", fontSize: 13 }} />
            </div>
            <div>
              <label style={{ color: t.textDim }}>Waktu</label>
              <input type="time" value={form.time} onChange={e => setField("time", e.target.value)}
                style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "9px 12px", fontSize: 13 }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ color: t.textDim }}>Forecast</label>
              <input value={form.forecast} onChange={e => setField("forecast", e.target.value)}
                placeholder="200K"
                style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "9px 12px", fontSize: 13 }} />
            </div>
            <div>
              <label style={{ color: t.textDim }}>Previous</label>
              <input value={form.previous} onChange={e => setField("previous", e.target.value)}
                placeholder="180K"
                style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "9px 12px", fontSize: 13 }} />
            </div>
          </div>

          <div>
            <label style={{ color: t.textDim }}>Notes</label>
            <textarea value={form.notes} onChange={e => setField("notes", e.target.value)}
              rows={2} placeholder="Catatan tentang event ini..."
              style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "9px 12px", fontSize: 12, resize: "vertical" }} />
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

// ── Event Row ────────────────────────────────────────────────────
function EventRow({ event, isAffected, onEdit, onDelete, theme: t }) {
  const impactColor = IMPACT_COLORS[event.impact] || "#6b7280";
  const isPast      = new Date(event.date + "T" + (event.time || "23:59")) < new Date();
  const hasActual   = !!event.actual;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 16px", borderBottom: `1px solid ${t.borderSubtle}`,
      opacity: isPast ? 0.6 : 1,
      background: isAffected ? "rgba(239,68,68,0.04)" : "transparent",
    }}>
      {/* Impact dot */}
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: impactColor, flexShrink: 0 }} />

      {/* Time */}
      <div style={{ width: 44, fontSize: 11, color: t.textDim, fontFamily: "DM Mono, monospace", flexShrink: 0 }}>
        {event.time || "--:--"}
      </div>

      {/* Currency */}
      <div style={{ width: 36, fontSize: 11, fontWeight: 500, color: t.text, flexShrink: 0 }}>
        {event.currency || event.country}
      </div>

      {/* Title */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: t.text, fontWeight: isPast && hasActual ? 400 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {event.title}
          {isAffected && <span style={{ marginLeft: 6, fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>TRADE</span>}
          {event.isCustom && <span style={{ marginLeft: 6, fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)" }}>CUSTOM</span>}
        </div>
        {(event.forecast || event.previous || event.actual) && (
          <div style={{ fontSize: 10, color: t.textDim, marginTop: 2, display: "flex", gap: 10 }}>
            {event.forecast && <span>F: {event.forecast}</span>}
            {event.previous && <span>P: {event.previous}</span>}
            {event.actual   && <span style={{ color: parseFloat(event.actual) >= parseFloat(event.forecast || 0) ? "#00d4aa" : "#ef4444" }}>A: {event.actual}</span>}
          </div>
        )}
      </div>

      {/* Impact badge */}
      <div style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: impactColor + "20", color: impactColor, border: `1px solid ${impactColor}40`, flexShrink: 0 }}>
        {event.impact}
      </div>

      {/* Actions — custom events only */}
      {event.isCustom && (
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button onClick={() => onEdit(event)} style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 12 }}>✏️</button>
          <button onClick={() => onDelete(event.id)} style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 12 }}>🗑️</button>
        </div>
      )}
    </div>
  );
}

// ── Main EconomicCalendar Page ───────────────────────────────────
export default function EconomicCalendar({ calendarHook, theme }) {
  const t = theme;
  const { isMobile } = useBreakpoint();
  const {
    events, loading, error, lastFetched, nextHighImpact, taggedTrades,
    filterCurrency, setFilterCurrency,
    filterImpact,   setFilterImpact,
    filterDate,     setFilterDate,
    showForm, form, setField, editId,
    openAdd, openEdit, closeForm, saveEvent, deleteEvent, refetch,
  } = calendarHook;

  // Group events by date
  const grouped = events.reduce((acc, e) => {
    if (!acc[e.date]) acc[e.date] = [];
    acc[e.date].push(e);
    return acc;
  }, {});

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2, color: t.text }}>ECONOMIC CALENDAR</div>
          <div style={{ fontSize: 11, color: t.textDim }}>
            High impact events & news yang mempengaruhi trading kamu
            {lastFetched && <span style={{ marginLeft: 8 }}>· Diupdate {lastFetched.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={refetch} disabled={loading} className="btn-ghost" style={{ fontSize: 12, padding: "8px 14px" }}>
            {loading ? "Loading..." : "↺ Refresh"}
          </button>
          <button onClick={openAdd} className="btn-primary" style={{ fontSize: 12 }}>+ Tambah Event</button>
        </div>
      </div>

      {/* Countdown */}
      {nextHighImpact && <Countdown event={nextHighImpact} theme={t} />}

      {/* Error */}
      {error && (
        <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#f59e0b", marginBottom: 16 }}>
          ⚠️ {error} — Menampilkan event custom saja.
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {/* Date filter */}
        <div style={{ display: "flex", gap: 4, background: t.bgSubtle, border: `1px solid ${t.border}`, borderRadius: 8, padding: 3 }}>
          {[
            { v: "today", l: "Hari Ini" },
            { v: "week",  l: "Minggu Ini" },
            { v: "month", l: "Bulan Ini" },
            { v: "all",   l: "Semua" },
          ].map(opt => (
            <button key={opt.v} onClick={() => setFilterDate(opt.v)}
              style={{ padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, fontFamily: "DM Mono, monospace", background: filterDate === opt.v ? t.accent : "transparent", color: filterDate === opt.v ? "#090e1a" : t.textDim }}>
              {opt.l}
            </button>
          ))}
        </div>

        {/* Impact filter */}
        <div style={{ display: "flex", gap: 4, background: t.bgSubtle, border: `1px solid ${t.border}`, borderRadius: 8, padding: 3 }}>
          {["ALL", "High", "Medium", "Low"].map(imp => (
            <button key={imp} onClick={() => setFilterImpact(imp)}
              style={{ padding: "5px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, background: filterImpact === imp ? (IMPACT_COLORS[imp] || t.accent) : "transparent", color: filterImpact === imp ? "#fff" : t.textDim }}>
              {imp}
            </button>
          ))}
        </div>

        {/* Currency filter */}
        <select value={filterCurrency} onChange={e => setFilterCurrency(e.target.value)}
          style={{ background: t.bgSubtle, border: `1px solid ${t.border}`, color: t.textMuted, borderRadius: 8, padding: "6px 12px", fontSize: 11, fontFamily: "DM Mono, monospace" }}>
          <option value="ALL">Semua Currency</option>
          {["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "NZD"].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Stats bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { label: "Total Event",  value: events.length,                                          color: t.text    },
          { label: "High Impact",  value: events.filter(e => e.impact === "High").length,          color: "#ef4444" },
          { label: "Kena Trade",   value: events.filter(e => taggedTrades.size > 0).length,        color: "#f59e0b" },
          { label: "Custom",       value: events.filter(e => e.isCustom).length,                   color: "#3b82f6" },
        ].map(s => (
          <div key={s.label} style={{ background: t.bgSubtle, border: `1px solid ${t.borderSubtle}`, borderRadius: 8, padding: "8px 14px", display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: s.color, fontFamily: "DM Mono, monospace" }}>{s.value}</span>
            <span style={{ fontSize: 11, color: t.textDim }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Events grouped by date */}
      {Object.keys(grouped).length === 0 ? (
        <div className="stat-card">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 24px", textAlign: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, rgba(0,200,150,0.08), rgba(0,200,150,0.04))", border: "1px solid rgba(0,200,150,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, marginBottom: 20 }}>📅</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: t.text, marginBottom: 8 }}>Tidak ada event</div>
            <div style={{ fontSize: 12, color: t.textDim, maxWidth: 280, lineHeight: 1.8, marginBottom: 20 }}>
              {loading ? "Sedang mengambil data dari Forex Factory..." : "Coba ganti filter atau tambah event manual"}
            </div>
            <button onClick={openAdd} className="btn-primary" style={{ fontSize: 12 }}>+ Tambah Event Manual</button>
          </div>
        </div>
      ) : (
        <div className="stat-card" style={{ padding: 0, overflow: "hidden" }}>
          {Object.entries(grouped).sort().map(([date, dayEvents]) => (
            <div key={date}>
              {/* Date header */}
              <div style={{ padding: "10px 16px", background: date === today ? "rgba(0,212,170,0.06)" : t.bgSubtle, borderBottom: `1px solid ${t.borderSubtle}`, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: date === today ? "#00d4aa" : t.text, fontFamily: "DM Mono, monospace" }}>
                  {date === today ? "📌 Hari Ini — " : ""}{new Date(date + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
                </span>
                <span style={{ fontSize: 10, color: t.textDim }}>{dayEvents.length} event</span>
              </div>
              {/* Events */}
              {dayEvents.map(event => (
                <EventRow
                  key={event.id} event={event} theme={t}
                  isAffected={taggedTrades.size > 0 && event.impact === "High"}
                  onEdit={openEdit} onDelete={deleteEvent}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <EventForm
          form={form} setField={setField}
          onSave={saveEvent} onClose={closeForm}
          editId={editId} theme={t}
        />
      )}
    </div>
  );
}