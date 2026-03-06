import { useState, useMemo } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { MARKETS } from "../../constants";
import { EMPTY_SETUP, TIMEFRAMES, DIRECTIONS, SETUP_COLORS } from "../../hooks/usePlaybook";

// ── Checklist editor ─────────────────────────────────────────────
function ChecklistEditor({ items, onChange, theme: t }) {
  const [input, setInput] = useState("");

  function add() {
    const v = input.trim();
    if (!v) return;
    onChange([...items, v]);
    setInput("");
  }

  function remove(i) { onChange(items.filter((_, idx) => idx !== i)); }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="Tambah kriteria entry... (Enter)"
          style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, padding: "8px 12px", fontSize: 12, flex: 1, outline: "none" }}
        />
        <button onClick={add} className="btn-ghost" style={{ padding: "8px 14px", fontSize: 12 }}>+</button>
      </div>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${t.borderSubtle}` }}>
          <span style={{ color: "#00d4aa", fontSize: 12 }}>✓</span>
          <span style={{ flex: 1, fontSize: 12, color: t.textMuted }}>{item}</span>
          <button onClick={() => remove(i)} style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 14, padding: "0 4px" }}>✕</button>
        </div>
      ))}
    </div>
  );
}

// ── Setup Form Modal ─────────────────────────────────────────────
function SetupForm({ form, setForm, onSubmit, onClose, isEditing, theme: t }) {
  const { isMobile } = useBreakpoint();
  function set(key, val) { setForm(p => ({ ...p, [key]: val })); }

  const textarea = (key, placeholder, rows = 3) => (
    <textarea
      value={form[key]} rows={rows}
      onChange={e => set(key, e.target.value)}
      placeholder={placeholder}
      style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text,
        borderRadius: 8, padding: "9px 12px", fontSize: 12, resize: "vertical",
        width: "100%", fontFamily: "DM Mono, monospace", outline: "none" }}
    />
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(9,14,26,0.85)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 20, overflowY: "auto" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 700, margin: "auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 2, color: t.text }}>
              {isEditing ? "EDIT SETUP" : "SETUP BARU"}
            </div>
            <div style={{ fontSize: 11, color: t.textDim }}>Dokumentasikan setup trading kamu</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>

        {/* Color picker */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ color: t.textDim }}>Warna Label</label>
          <div style={{ display: "flex", gap: 8 }}>
            {SETUP_COLORS.map(c => (
              <button key={c} onClick={() => set("color", c)} style={{
                width: 28, height: 28, borderRadius: "50%", background: c, border: form.color === c ? `3px solid ${t.text}` : "3px solid transparent", cursor: "pointer", flexShrink: 0,
              }} />
            ))}
          </div>
        </div>

        {/* Basic info grid */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div style={{ gridColumn: isMobile ? "1" : "span 3" }}>
            <label style={{ color: t.textDim }}>Nama Setup *</label>
            <input value={form.title} onChange={e => set("title", e.target.value)}
              placeholder="e.g. London Breakout, ICT OB Reversal"
              style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text }} />
          </div>
          <div>
            <label style={{ color: t.textDim }}>Market</label>
            <select value={form.market} onChange={e => set("market", e.target.value)}
              style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text }}>
              {MARKETS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={{ color: t.textDim }}>Arah</label>
            <select value={form.direction} onChange={e => set("direction", e.target.value)}
              style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text }}>
              {DIRECTIONS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={{ color: t.textDim }}>Timeframe</label>
            <select value={form.timeframe} onChange={e => set("timeframe", e.target.value)}
              style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text }}>
              {TIMEFRAMES.map(tf => <option key={tf}>{tf}</option>)}
            </select>
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ color: t.textDim }}>Deskripsi Setup</label>
          {textarea("description", "Jelaskan setup ini secara singkat — kondisi market, logika, konteks...")}
        </div>

        {/* Rules */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ color: t.textDim }}>Entry Rules</label>
            {textarea("entry_rules", "Kapan masuk?\n- Kondisi A\n- Kondisi B", 4)}
          </div>
          <div>
            <label style={{ color: t.textDim }}>Stop Loss Rules</label>
            {textarea("sl_rules", "Di mana SL?\n- Di bawah swing low\n- ATR x1.5", 4)}
          </div>
          <div>
            <label style={{ color: t.textDim }}>Take Profit Rules</label>
            {textarea("tp_rules", "Target TP?\n- Resistance terdekat\n- Minimal 2R", 4)}
          </div>
        </div>

        {/* Checklist */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: t.textDim }}>Pre-Trade Checklist</label>
          <ChecklistEditor items={form.checklist ?? []} onChange={v => set("checklist", v)} theme={t} />
        </div>

        {/* Screenshot URL */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ color: t.textDim }}>Screenshot Contoh Setup (URL)</label>
          <input value={form.screenshotUrl ?? ""} onChange={e => set("screenshotUrl", e.target.value)}
            placeholder="https://... (TradingView screenshot)"
            style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text }} />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn-ghost" onClick={onClose}>Batal</button>
          <button className="btn-primary" onClick={onSubmit} disabled={!form.title.trim()}>
            {isEditing ? "SIMPAN PERUBAHAN" : "TAMBAH KE PLAYBOOK"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Setup Card ───────────────────────────────────────────────────
function SetupCard({ setup, onEdit, onDelete, onClick, isSelected, theme: t }) {
  return (
    <div onClick={onClick} style={{
      background: isSelected ? `${setup.color}10` : t.bgCard,
      borderTop: `1px solid ${isSelected ? setup.color : t.border}`,
      borderRight: `1px solid ${isSelected ? setup.color : t.border}`,
      borderBottom: `1px solid ${isSelected ? setup.color : t.border}`,
      borderLeft: `3px solid ${setup.color}`,
      borderRadius: 10, padding: "14px 16px",
      cursor: "pointer", transition: "all 0.15s",
    }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = t.bgHover; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = t.bgCard; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: t.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {setup.title}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
            {[setup.market, setup.timeframe, setup.direction].map(tag => (
              <span key={tag} style={{ fontSize: 9, background: t.bgSubtle, border: `1px solid ${t.borderSubtle}`, borderRadius: 4, padding: "2px 6px", color: t.textDim }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
          <button onClick={e => { e.stopPropagation(); onEdit(); }}
            style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 12, padding: "2px 6px" }}>✏️</button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }}
            style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 12, padding: "2px 6px" }}>🗑️</button>
        </div>
      </div>
      {setup.description && (
        <div style={{ fontSize: 11, color: t.textDim, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {setup.description}
        </div>
      )}
      {(setup.checklist?.length ?? 0) > 0 && (
        <div style={{ marginTop: 8, fontSize: 10, color: t.textDim }}>
          ✓ {setup.checklist.length} checklist items
        </div>
      )}
    </div>
  );
}

// ── Detail Panel ─────────────────────────────────────────────────
function SetupDetail({ setup, theme: t }) {
  const { isMobile } = useBreakpoint();
  const section = (title, content) => content ? (
    <div>
      <div style={{ fontSize: 10, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.8, whiteSpace: "pre-wrap", background: t.bgSubtle, border: `1px solid ${t.borderSubtle}`, borderRadius: 8, padding: "10px 14px" }}>
        {content}
      </div>
    </div>
  ) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 4, alignSelf: "stretch", background: setup.color, borderRadius: 4, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 2, color: t.text }}>{setup.title}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
            {[
              { label: setup.market },
              { label: setup.timeframe },
              { label: setup.direction },
            ].map(tag => (
              <span key={tag.label} style={{ fontSize: 10, background: `${setup.color}15`, border: `1px solid ${setup.color}40`, borderRadius: 6, padding: "3px 10px", color: setup.color }}>
                {tag.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Screenshot */}
      {setup.screenshotUrl && (
        <img src={setup.screenshotUrl} alt={setup.title}
          style={{ width: "100%", maxHeight: 260, objectFit: "cover", borderRadius: 10, border: `1px solid ${t.border}` }}
          onError={e => { e.target.style.display = "none"; }} />
      )}

      {/* Description */}
      {section("Deskripsi", setup.description)}

      {/* Rules — 3 col */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 12 }}>
        {[
          ["Entry Rules", setup.entry_rules],
          ["Stop Loss", setup.sl_rules],
          ["Take Profit", setup.tp_rules],
        ].map(([title, content]) => content ? (
          <div key={title}>
            <div style={{ fontSize: 10, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{title}</div>
            <div style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.8, whiteSpace: "pre-wrap", background: t.bgSubtle, border: `1px solid ${t.borderSubtle}`, borderRadius: 8, padding: "10px 14px", minHeight: 80 }}>
              {content}
            </div>
          </div>
        ) : null)}
      </div>

      {/* Checklist */}
      {(setup.checklist?.length ?? 0) > 0 && (
        <div>
          <div style={{ fontSize: 10, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
            Pre-Trade Checklist ({setup.checklist.length} items)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {setup.checklist.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 12px", background: t.bgSubtle, border: `1px solid ${t.borderSubtle}`, borderRadius: 8 }}>
                <div style={{ width: 18, height: 18, border: `2px solid ${setup.color}`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 10, color: setup.color }}>✓</span>
                </div>
                <span style={{ fontSize: 12, color: t.textMuted }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div style={{ fontSize: 10, color: t.textDim, paddingTop: 8, borderTop: `1px solid ${t.borderSubtle}` }}>
        Dibuat: {new Date(setup.created_at).toLocaleDateString("id-ID")}
        {setup.updated_at !== setup.created_at && ` · Diupdate: ${new Date(setup.updated_at).toLocaleDateString("id-ID")}`}
      </div>
    </div>
  );
}

// ── Main Playbook Page ───────────────────────────────────────────
export default function Playbook({ setups, loading, error, onAdd, onUpdate, onDelete, theme }) {
  const t = theme;
  const { isMobile } = useBreakpoint();
  const [showForm,   setShowForm]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [selected,   setSelected]   = useState(0);
  const [filterMkt,  setFilterMkt]  = useState("All");
  const [search,     setSearch]     = useState("");

  const [form,       setForm]       = useState({ ...EMPTY_SETUP });

  // Reset selected when filter changes
  const setFilterMktSafe = v => { setFilterMkt(v); setSelected(0); };
  const setSearchSafe    = v => { setSearch(v);    setSelected(0); };

  const filtered = useMemo(() => {
    let s = setups;
    if (filterMkt !== "All") s = s.filter(x => x.market === filterMkt);
    if (search.trim())       s = s.filter(x => x.title.toLowerCase().includes(search.toLowerCase()) || (x.description ?? "").toLowerCase().includes(search.toLowerCase()));
    return s;
  }, [setups, filterMkt, search]);

  function openAdd() {
    setForm({ ...EMPTY_SETUP });
    setEditTarget(null);
    setShowForm(true);
  }

  function openEdit(setup) {
    setForm({ ...setup });
    setEditTarget(setup);
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!form.title.trim()) return;
    if (editTarget) {
      await onUpdate(editTarget.id, form);
    } else {
      await onAdd(form);
    }
    setShowForm(false);
  }

  if (loading) {
    return <div style={{ textAlign: "center", padding: 80, color: t.textDim, fontSize: 13 }}>Loading playbook...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2, color: t.text }}>PLAYBOOK</div>
          <div style={{ fontSize: 11, color: t.textDim }}>{setups.length} setup tersimpan</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {/* Search */}
          <input value={search} onChange={e => setSearchSafe(e.target.value)}
            placeholder="Cari setup..."
            style={{ width: 160, background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, padding: "8px 12px", borderRadius: 8, fontSize: 12, outline: "none" }} />
          {/* Market filter */}
          <select value={filterMkt} onChange={e => setFilterMktSafe(e.target.value)}
            style={{ width: "auto", background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, padding: "8px 12px", borderRadius: 8, fontSize: 12, outline: "none" }}>
            <option value="All">All Markets</option>
            {MARKETS.map(m => <option key={m}>{m}</option>)}
          </select>
          <button className="btn-primary" onClick={openAdd}>+ Setup Baru</button>
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#ef4444", marginBottom: 16 }}>
          ⚠️ {error}
        </div>
      )}

      {setups.length === 0 ? (
        /* Empty state */
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
          <div style={{ fontSize: 16, color: t.text, marginBottom: 8 }}>Playbook Kosong</div>
          <div style={{ fontSize: 13, color: t.textDim, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
            Dokumentasikan setup-setup trading yang sudah terbukti profitable. Entry rules, SL/TP, dan pre-trade checklist.
          </div>
          <button className="btn-primary" onClick={openAdd}>+ Buat Setup Pertama</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "300px 1fr", gap: 20, alignItems: "start" }}>
          {/* Left — setup list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: isMobile ? "50vh" : "80vh", overflowY: "auto", paddingRight: 4 }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: t.textDim, fontSize: 12 }}>Tidak ada setup ditemukan.</div>
            ) : filtered.map((setup, i) => (
              <SetupCard
                key={setup.id}
                setup={setup}
                isSelected={i === selected}
                onClick={() => setSelected(i)}
                onEdit={() => openEdit(setup)}
                onDelete={() => { if (window.confirm(`Hapus setup "${setup.title}"?`)) onDelete(setup.id); }}
                theme={t}
              />
            ))}
          </div>

          {/* Right — detail */}
          <div>
            {filtered[selected]
              ? <SetupDetail setup={filtered[selected]} theme={t} />
              : <div style={{ textAlign: "center", padding: 60, color: t.textDim }}>Pilih setup di kiri.</div>
            }
          </div>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <SetupForm
          form={form} setForm={setForm}
          onSubmit={handleSubmit}
          onClose={() => setShowForm(false)}
          isEditing={!!editTarget}
          theme={t}
        />
      )}
    </div>
  );
}