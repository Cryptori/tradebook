import { useState, useMemo } from "react";
import PsychologyTracker from "../PsychologyTracker";
import DailyQuote from "../DailyQuote";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { MARKET_BIAS, JOURNAL_MOODS } from "../../hooks/useDailyJournal";

// ── Constants ─────────────────────────────────────────────────────
const BIAS_COLOR = {
  Bullish:   "var(--success)",
  Bearish:   "var(--danger)",
  Sideways:  "var(--warning)",
  Uncertain: "var(--text-dim)",
};

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

// ── Star rating ───────────────────────────────────────────────────
function StarRating({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1,2,3,4,5].map(i => (
        <button key={i} onClick={() => onChange(i)} style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: 22, padding: 2, lineHeight: 1,
          color: i <= value ? "var(--gold)" : "var(--border)",
          transition: "color var(--t-fast)",
        }}>★</button>
      ))}
    </div>
  );
}

// ── Entry form ────────────────────────────────────────────────────
function EntryForm({ form, setForm, onSave, onCancel, saving }) {
  const { isMobile } = useBreakpoint();
  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Date + Bias + Mood */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 10 }}>
        <div>
          <label>Tanggal</label>
          <input type="date" value={form.date} onChange={e => set("date", e.target.value)}/>
        </div>
        <div>
          <label>Market Bias</label>
          <select value={form.market_bias ?? "Uncertain"} onChange={e => set("market_bias", e.target.value)}>
            {MARKET_BIAS.map(b => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label>Mood Hari Ini</label>
          <select value={form.mood ?? ""} onChange={e => set("mood", e.target.value)}>
            <option value="">— Pilih mood —</option>
            {JOURNAL_MOODS.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Rating */}
      <div>
        <label>Rating Hari Ini</label>
        <StarRating value={form.rating ?? 3} onChange={v => set("rating", v)}/>
      </div>

      {/* Watchlist */}
      <div>
        <label>Watchlist / Pair yang Dipantau</label>
        <input type="text" value={form.watchlist ?? ""}
          onChange={e => set("watchlist", e.target.value)}
          placeholder="EUR/USD, BTC/USDT, BBCA..."/>
      </div>

      {/* Pre/Post market */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
        <div>
          <label>Pre-Market Analysis</label>
          <textarea value={form.pre_market ?? ""} rows={5}
            onChange={e => set("pre_market", e.target.value)}
            placeholder="Kondisi market, level penting, setup yang dicari, rencana hari ini..."
            style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)" }}/>
        </div>
        <div>
          <label>Post-Market Review</label>
          <textarea value={form.post_market ?? ""} rows={5}
            onChange={e => set("post_market", e.target.value)}
            placeholder="Apa yang terjadi? Sesuai rencana? Eksekusi bagaimana?..."
            style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)" }}/>
        </div>
      </div>

      {/* Lessons + Goals */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
        <div>
          <label>Lessons Learned</label>
          <textarea value={form.lessons ?? ""} rows={3}
            onChange={e => set("lessons", e.target.value)}
            placeholder="Apa yang dipelajari? Kesalahan yang perlu dihindari?..."/>
        </div>
        <div>
          <label>Goals Besok</label>
          <textarea value={form.goals ?? ""} rows={3}
            onChange={e => set("goals", e.target.value)}
            placeholder="Target besok, setup yang dicari, improvement yang mau dicoba..."/>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        {onCancel && <button className="btn-ghost" onClick={onCancel}>Batal</button>}
        <button className="btn-primary" onClick={onSave} disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan Jurnal"}
        </button>
      </div>
    </div>
  );
}

// ── Entry card ────────────────────────────────────────────────────
function EntryCard({ entry, isSelected, onClick, onDelete }) {
  const biasColor = BIAS_COLOR[entry.market_bias] ?? "var(--text-dim)";
  return (
    <div onClick={onClick} style={{
      background: "var(--bg-card)",
      border:     `1px solid ${isSelected ? biasColor : "var(--border)"}`,
      borderLeft: `3px solid ${biasColor}`,
      borderRadius: "var(--r-lg)",
      padding: "10px 12px",
      cursor: "pointer",
      transition: "all var(--t-base)",
    }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "var(--bg-hover)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-card)"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text)", fontFamily: "var(--font-mono)" }}>
            {entry.date}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: "var(--fs-2xs)", color: biasColor, background: "var(--bg-subtle)", border: `1px solid ${biasColor}`, borderRadius: 3, padding: "1px 6px" }}>
              {entry.market_bias}
            </span>
            {entry.mood && <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>{entry.mood}</span>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: "var(--fs-sm)", color: "var(--gold)" }}>{"★".repeat(entry.rating ?? 0)}</span>
          <button onClick={e => { e.stopPropagation(); onDelete(entry.id); }}
            className="btn-icon" style={{ width: 22, height: 22, color: "var(--danger)" }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            </svg>
          </button>
        </div>
      </div>
      {entry.pre_market && (
        <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 6, lineHeight: 1.5,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {entry.pre_market}
        </div>
      )}
    </div>
  );
}

// ── Entry detail ──────────────────────────────────────────────────
function EntryDetail({ entry, onEdit }) {
  const { isMobile } = useBreakpoint();
  const biasColor = BIAS_COLOR[entry.market_bias] ?? "var(--text-dim)";

  function Section({ title, content }) {
    if (!content) return null;
    return (
      <div>
        <div className="section-label" style={{ marginBottom: 8 }}>{title}</div>
        <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "10px 14px", fontSize: "var(--fs-sm)", color: "var(--text-muted)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ width: 4, alignSelf: "stretch", background: biasColor, borderRadius: 4, flexShrink: 0 }}/>
          <div>
            <h2 style={{ fontFamily: "var(--font-disp)", fontSize: 20, letterSpacing: 2, color: "var(--text)", fontWeight: 400 }}>
              {entry.date}
            </h2>
            <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: "var(--fs-sm)", color: biasColor, fontWeight: 500 }}>{entry.market_bias}</span>
              {entry.mood && <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-dim)" }}>{entry.mood}</span>}
              <span style={{ color: "var(--gold)" }}>{"★".repeat(entry.rating ?? 0)}</span>
            </div>
          </div>
        </div>
        <button className="btn-ghost" onClick={onEdit} style={{ fontSize: "var(--fs-sm)", height: 30 }}>
          Edit
        </button>
      </div>

      {/* Watchlist */}
      {entry.watchlist && (
        <div>
          <div className="section-label" style={{ marginBottom: 6 }}>Watchlist</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {entry.watchlist.split(/[,\s]+/).filter(Boolean).map(p => (
              <span key={p} style={{ fontSize: "var(--fs-xs)", background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: "2px 8px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
        <Section title="Pre-Market Analysis" content={entry.pre_market}/>
        <Section title="Post-Market Review"  content={entry.post_market}/>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
        <Section title="Lessons Learned" content={entry.lessons}/>
        <Section title="Goals Besok"     content={entry.goals}/>
      </div>

      <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", paddingTop: 8, borderTop: "1px solid var(--border)" }}>
        Disimpan: {new Date(entry.updated_at ?? entry.date).toLocaleString("id-ID")}
      </div>
    </div>
  );
}

// ── Main DailyJournal ─────────────────────────────────────────────
export default function DailyJournal({ entries, loading, error, onSave, onDelete, theme, trades }) {
  const { isMobile } = useBreakpoint();
  const [mode,     setMode]     = useState("list");
  const [selected, setSelected] = useState(0);
  const [form,     setForm]     = useState({ ...EMPTY_FORM });
  const [saving,   setSaving]   = useState(false);
  const [search,   setSearch]   = useState("");

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

  function openEdit(entry) { setForm({ ...entry }); setMode("edit"); }

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
    <div style={{ textAlign: "center", padding: 80, color: "var(--text-dim)" }}>Loading journal...</div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Daily Journal</h1>
          <p className="page-subtitle">{entries.length} entri tersimpan</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {mode === "list" && (
            <input value={search} onChange={e => { setSearch(e.target.value); setSelected(0); }}
              placeholder="Cari jurnal..." style={{ width: 150, height: 30, fontSize: "var(--fs-sm)" }}/>
          )}
          {mode !== "new" && (
            <button className="btn-primary" onClick={openNew} style={{ height: 30, fontSize: "var(--fs-sm)" }}>
              + Tulis Jurnal
            </button>
          )}
          {(mode === "new" || mode === "edit") && (
            <button className="btn-ghost" onClick={() => setMode("list")} style={{ height: 30, fontSize: "var(--fs-sm)" }}>
              ← Kembali
            </button>
          )}
        </div>
      </div>

      {/* Daily quote */}
      {mode === "list" && <DailyQuote theme={theme}/>}

      {/* Error */}
      {error && (
        <div style={{ background: "var(--danger-dim)", border: "1px solid var(--danger)", borderRadius: "var(--r-md)", padding: "10px 14px", fontSize: "var(--fs-sm)", color: "var(--danger)" }}>
          ⚠️ {error}
        </div>
      )}

      {/* New / Edit form */}
      {(mode === "new" || mode === "edit") && (
        <div className="stat-card">
          <h2 style={{ fontFamily: "var(--font-disp)", fontSize: 18, letterSpacing: 2, color: "var(--text)", fontWeight: 400, marginBottom: 20 }}>
            {mode === "new" ? "JURNAL BARU" : "EDIT JURNAL"}
          </h2>
          <EntryForm form={form} setForm={setForm} onSave={handleSave}
            onCancel={() => setMode("list")} saving={saving}/>
        </div>
      )}

      {/* Mobile detail */}
      {mode === "detail" && filtered[selected] && (
        <div>
          <button className="btn-ghost" onClick={() => setMode("list")} style={{ marginBottom: 12, fontSize: "var(--fs-sm)" }}>
            ← Kembali
          </button>
          <div className="stat-card">
            <EntryDetail entry={filtered[selected]} onEdit={() => openEdit(filtered[selected])}/>
          </div>
        </div>
      )}

      {/* List + detail */}
      {mode === "list" && (
        entries.length === 0 ? (
          <div className="stat-card">
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <div className="empty-title">Belum Ada Jurnal</div>
              <div className="empty-desc">Catat market outlook, pre/post market analysis, dan lessons learned setiap hari.</div>
              <button className="btn-primary" onClick={openNew} style={{ marginTop: 16 }}>+ Tulis Jurnal Pertama</button>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "260px 1fr", gap: 14, alignItems: "start" }}>
            {/* Sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: isMobile ? "45vh" : "80vh", overflowY: "auto", paddingRight: 2 }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "var(--text-dim)", fontSize: "var(--fs-sm)" }}>
                  Tidak ada entri ditemukan.
                </div>
              ) : filtered.map((entry, i) => (
                <EntryCard key={entry.id} entry={entry}
                  isSelected={i === selected}
                  onClick={() => { setSelected(i); if (isMobile) setMode("detail"); }}
                  onDelete={onDelete}/>
              ))}
            </div>

            {/* Detail */}
            {!isMobile && filtered[selected] && (
              <div className="stat-card">
                <EntryDetail entry={filtered[selected]} onEdit={() => openEdit(filtered[selected])}/>
              </div>
            )}
          </div>
        )
      )}

      {/* Psychology tracker */}
      <PsychologyTracker trades={trades || []} journalEntries={entries || []} theme={theme}/>
    </div>
  );
}