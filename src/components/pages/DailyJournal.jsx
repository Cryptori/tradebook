import { useState, useMemo } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { MARKET_BIAS, JOURNAL_MOODS } from "../../hooks/useDailyJournal";

// ── Star rating ───────────────────────────────────────────────────
function StarRating({ value, onChange, theme: t }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} onClick={() => onChange(i)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, padding: 2,
            color: i <= value ? "#f59e0b" : t.border, transition: "color 0.15s" }}>
          ★
        </button>
      ))}
    </div>
  );
}

// ── Entry Form ────────────────────────────────────────────────────
function EntryForm({ form, setForm, onSave, onCancel, saving, theme: t }) {
  const { isMobile } = useBreakpoint();
  function set(key, val) { setForm(p => ({ ...p, [key]: val })); }

  const textarea = (key, placeholder, rows = 3) => (
    <textarea value={form[key] ?? ""} rows={rows}
      onChange={e => set(key, e.target.value)}
      placeholder={placeholder}
      style={{ width: "100%", background: t.bgInput, border: `1px solid ${t.border}`,
        color: t.text, borderRadius: 8, padding: "9px 12px", fontSize: 12,
        fontFamily: "DM Mono, monospace", resize: "vertical", outline: "none" }} />
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Date + Mood + Bias row */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 12 }}>
        <div>
          <label style={{ color: t.textDim }}>Tanggal</label>
          <input type="date" value={form.date}
            onChange={e => set("date", e.target.value)}
            style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text }} />
        </div>
        <div>
          <label style={{ color: t.textDim }}>Market Bias</label>
          <select value={form.market_bias ?? "Uncertain"}
            onChange={e => set("market_bias", e.target.value)}
            style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text }}>
            {MARKET_BIAS.map(b => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label style={{ color: t.textDim }}>Mood Hari Ini</label>
          <select value={form.mood ?? ""}
            onChange={e => set("mood", e.target.value)}
            style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text }}>
            <option value="">— Pilih mood —</option>
            {JOURNAL_MOODS.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Day rating */}
      <div>
        <label style={{ color: t.textDim }}>Rating Hari Ini</label>
        <StarRating value={form.rating ?? 3} onChange={v => set("rating", v)} theme={t} />
      </div>

      {/* Watchlist */}
      <div>
        <label style={{ color: t.textDim }}>Watchlist / Pair yang Dipantau</label>
        <input type="text" value={form.watchlist ?? ""}
          onChange={e => set("watchlist", e.target.value)}
          placeholder="EUR/USD, BTC/USDT, BBCA..."
          style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text }} />
      </div>

      {/* Pre/Post market — side by side on desktop */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
        <div>
          <label style={{ color: t.textDim }}>Pre-Market Analysis</label>
          {textarea("pre_market", "Kondisi market, level penting, setup yang dicari, rencana hari ini...", 5)}
        </div>
        <div>
          <label style={{ color: t.textDim }}>Post-Market Review</label>
          {textarea("post_market", "Apa yang terjadi? Apakah sesuai rencana? Eksekusi bagaimana?...", 5)}
        </div>
      </div>

      {/* Lessons + Goals */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
        <div>
          <label style={{ color: t.textDim }}>Lessons Learned</label>
          {textarea("lessons", "Apa yang dipelajari hari ini? Kesalahan yang perlu dihindari?...", 3)}
        </div>
        <div>
          <label style={{ color: t.textDim }}>Goals Besok</label>
          {textarea("goals", "Target besok, setup yang akan dicari, improvement yang mau dicoba...", 3)}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        {onCancel && <button className="btn-ghost" onClick={onCancel}>Batal</button>}
        <button className="btn-primary" onClick={onSave} disabled={saving}>
          {saving ? "Menyimpan..." : "SIMPAN JURNAL"}
        </button>
      </div>
    </div>
  );
}

// ── Entry Card (list item) ────────────────────────────────────────
const BIAS_COLOR = { Bullish: "#00d4aa", Bearish: "#ef4444", Sideways: "#f59e0b", Uncertain: "#64748b" };

function EntryCard({ entry, isSelected, onClick, onDelete, theme: t }) {
  const biasColor = BIAS_COLOR[entry.market_bias] ?? t.textDim;
  return (
    <div onClick={onClick}
      style={{ background: isSelected ? `${biasColor}10` : t.bgCard,
        borderTop: `1px solid ${isSelected ? biasColor : t.border}`,
        borderRight: `1px solid ${isSelected ? biasColor : t.border}`,
        borderBottom: `1px solid ${isSelected ? biasColor : t.border}`,
        borderLeft: `3px solid ${biasColor}`,
        borderRadius: 10, padding: "12px 14px", cursor: "pointer", transition: "all 0.15s" }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = t.bgHover; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isSelected ? `${biasColor}10` : t.bgCard; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: t.text }}>{entry.date}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, color: biasColor, background: `${biasColor}15`,
              border: `1px solid ${biasColor}30`, borderRadius: 4, padding: "2px 7px" }}>
              {entry.market_bias}
            </span>
            {entry.mood && <span style={{ fontSize: 10, color: t.textDim }}>{entry.mood}</span>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: "#f59e0b" }}>{"★".repeat(entry.rating ?? 0)}</span>
          <button onClick={e => { e.stopPropagation(); onDelete(entry.id); }}
            style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 13, padding: "0 2px" }}>🗑️</button>
        </div>
      </div>
      {entry.pre_market && (
        <div style={{ fontSize: 11, color: t.textDim, marginTop: 6, display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.5 }}>
          {entry.pre_market}
        </div>
      )}
    </div>
  );
}

// ── Detail view ───────────────────────────────────────────────────
function EntryDetail({ entry, onEdit, theme: t }) {
  const { isMobile } = useBreakpoint();
  const biasColor = BIAS_COLOR[entry.market_bias] ?? t.textDim;

  const section = (title, content) => content ? (
    <div>
      <div style={{ fontSize: 10, color: t.textDim, textTransform: "uppercase",
        letterSpacing: "0.1em", marginBottom: 8 }}>{title}</div>
      <div style={{ background: t.bgSubtle, border: `1px solid ${t.borderSubtle}`,
        borderRadius: 8, padding: "10px 14px", fontSize: 12, color: t.textMuted,
        lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
        {content}
      </div>
    </div>
  ) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ width: 4, alignSelf: "stretch", background: biasColor, borderRadius: 4 }} />
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22,
              letterSpacing: 2, color: t.text }}>{entry.date}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: biasColor }}>{entry.market_bias}</span>
              {entry.mood && <span style={{ fontSize: 11, color: t.textDim }}>{entry.mood}</span>}
              <span style={{ fontSize: 12, color: "#f59e0b" }}>{"★".repeat(entry.rating ?? 0)}</span>
            </div>
          </div>
        </div>
        <button className="btn-ghost" onClick={onEdit} style={{ fontSize: 12 }}>✏️ Edit</button>
      </div>

      {entry.watchlist && (
        <div>
          <div style={{ fontSize: 10, color: t.textDim, textTransform: "uppercase",
            letterSpacing: "0.1em", marginBottom: 6 }}>Watchlist</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {entry.watchlist.split(/[,\s]+/).filter(Boolean).map(p => (
              <span key={p} style={{ fontSize: 11, background: t.bgSubtle,
                border: `1px solid ${t.borderSubtle}`, borderRadius: 6, padding: "3px 10px", color: t.textMuted }}>
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
        {section("Pre-Market Analysis", entry.pre_market)}
        {section("Post-Market Review", entry.post_market)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
        {section("Lessons Learned", entry.lessons)}
        {section("Goals Besok", entry.goals)}
      </div>

      <div style={{ fontSize: 10, color: t.textDim, borderTop: `1px solid ${t.borderSubtle}`, paddingTop: 8 }}>
        Disimpan: {new Date(entry.updated_at ?? entry.date).toLocaleString("id-ID")}
      </div>
    </div>
  );
}

// ── Main DailyJournal Page ────────────────────────────────────────
const EMPTY_FORM = {
  date:        new Date().toISOString().split("T")[0],
  mood:        "",
  market_bias: "Uncertain",
  watchlist:   "",
  pre_market:  "",
  post_market: "",
  lessons:     "",
  goals:       "",
  rating:      3,
};

export default function DailyJournal({ entries, loading, error, onSave, onDelete, theme }) {
  const t = theme;
  const { isMobile } = useBreakpoint();

  const [mode,     setMode]     = useState("list");   // "list" | "new" | "edit" | "detail"
  const [selected, setSelected] = useState(0);
  const [form,     setForm]     = useState({ ...EMPTY_FORM });
  const [saving,   setSaving]   = useState(false);
  const [search,   setSearch]   = useState("");

  function setSearchSafe(v) { setSearch(v); setSelected(0); }

  const filtered = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(e =>
      e.date.includes(q) ||
      (e.pre_market  ?? "").toLowerCase().includes(q) ||
      (e.post_market ?? "").toLowerCase().includes(q) ||
      (e.lessons     ?? "").toLowerCase().includes(q) ||
      (e.market_bias ?? "").toLowerCase().includes(q)
    );
  }, [entries, search]);

  function openNew() {
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().split("T")[0] });
    setMode("new");
  }

  function openEdit(entry) {
    setForm({ ...entry });
    setMode("edit");
  }

  async function handleSave() {
    if (!form.date) return;
    setSaving(true);
    const result = await onSave(form);
    setSaving(false);
    if (result) {
      setMode("list");
      const idx = filtered.findIndex(e => e.date === form.date);
      setSelected(idx >= 0 ? idx : 0);
    }
  }

  if (loading) return (
    <div style={{ textAlign: "center", padding: 80, color: t.textDim, fontSize: 13 }}>
      Loading journal...
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24,
            letterSpacing: 2, color: t.text }}>DAILY JOURNAL</div>
          <div style={{ fontSize: 11, color: t.textDim }}>{entries.length} entri tersimpan</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {mode === "list" && (
            <input value={search} onChange={e => setSearchSafe(e.target.value)}
              placeholder="Cari jurnal..."
              style={{ width: 160, background: t.bgInput, border: `1px solid ${t.border}`,
                color: t.text, padding: "8px 12px", borderRadius: 8, fontSize: 12, outline: "none" }} />
          )}
          {mode !== "new" && (
            <button className="btn-primary" onClick={openNew}>+ Tulis Jurnal</button>
          )}
          {(mode === "new" || mode === "edit") && (
            <button className="btn-ghost" onClick={() => setMode("list")}>← Kembali</button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.4)",
          borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#ef4444", marginBottom: 16 }}>
          ⚠️ {error}
        </div>
      )}

      {/* New / Edit form */}
      {(mode === "new" || mode === "edit") && (
        <div className="stat-card">
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2,
            color: t.text, marginBottom: 20 }}>
            {mode === "new" ? "JURNAL BARU" : "EDIT JURNAL"}
          </div>
          <EntryForm form={form} setForm={setForm} onSave={handleSave}
            onCancel={() => setMode("list")} saving={saving} theme={t} />
        </div>
      )}

      {/* Mobile detail view */}
      {mode === "detail" && filtered[selected] && (
        <div>
          <button className="btn-ghost" onClick={() => setMode("list")}
            style={{ marginBottom: 16, fontSize: 12 }}>← Kembali ke List</button>
          <div className="stat-card">
            <EntryDetail entry={filtered[selected]}
              onEdit={() => openEdit(filtered[selected])} theme={t} />
          </div>
        </div>
      )}

      {/* List + detail */}
      {mode === "list" && (
        entries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
            <div style={{ fontSize: 16, color: t.text, marginBottom: 8 }}>Belum Ada Jurnal</div>
            <div style={{ fontSize: 13, color: t.textDim, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
              Mulai catat market outlook, pre/post market analysis, dan lessons learned setiap hari.
            </div>
            <button className="btn-primary" onClick={openNew}>+ Tulis Jurnal Pertama</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "280px 1fr",
            gap: 20, alignItems: "start" }}>
            {/* Sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6,
              maxHeight: isMobile ? "45vh" : "80vh", overflowY: "auto", paddingRight: 4 }}>
              {filtered.map((entry, i) => (
                <EntryCard key={entry.id} entry={entry}
                  isSelected={i === selected}
                  onClick={() => { setSelected(i); if (isMobile) setMode("detail"); }}
                  onDelete={onDelete}
                  theme={t} />
              ))}
              {filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: 40, color: t.textDim, fontSize: 12 }}>
                  Tidak ada entri ditemukan.
                </div>
              )}
            </div>

            {/* Detail */}
            {!isMobile && filtered[selected] && (
              <div className="stat-card">
                <EntryDetail entry={filtered[selected]}
                  onEdit={() => openEdit(filtered[selected])} theme={t} />
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}