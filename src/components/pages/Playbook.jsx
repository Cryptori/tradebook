import { useState, useMemo } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { MARKETS } from "../../constants";
import { EMPTY_SETUP, TIMEFRAMES, DIRECTIONS, SETUP_COLORS } from "../../hooks/usePlaybook";

// ── Checklist editor ──────────────────────────────────────────────
function ChecklistEditor({ items = [], onChange }) {
  const [input, setInput] = useState("");
  function add() {
    const v = input.trim();
    if (!v) return;
    onChange([...items, v]);
    setInput("");
  }
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="Tambah kriteria... (Enter)"
          style={{ flex: 1 }}/>
        <button onClick={add} className="btn-ghost">+</button>
      </div>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border-subtle)" }}>
          <span style={{ color: "var(--accent)", fontSize: "var(--fs-sm)" }}>✓</span>
          <span style={{ flex: 1, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>{item}</span>
          <button onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: 14 }}>✕</button>
        </div>
      ))}
    </div>
  );
}

// ── Setup form modal ──────────────────────────────────────────────
function SetupForm({ form, setForm, onSubmit, onClose, isEditing }) {
  const { isMobile } = useBreakpoint();
  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "var(--bg-overlay)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: 16, overflowY: "auto",
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: "var(--r-xl)", padding: isMobile ? 16 : 24,
        width: "100%", maxWidth: 680, margin: "auto",
        boxShadow: "var(--shadow-lg)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-disp)", fontSize: 20, letterSpacing: 2, color: "var(--text)", fontWeight: 400 }}>
              {isEditing ? "EDIT SETUP" : "SETUP BARU"}
            </h2>
            <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 3 }}>Dokumentasikan setup trading kamu</p>
          </div>
          <button onClick={onClose} className="btn-icon">✕</button>
        </div>

        {/* Color picker */}
        <div style={{ marginBottom: 16 }}>
          <label>Warna Label</label>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            {SETUP_COLORS.map(c => (
              <button key={c} onClick={() => set("color", c)} style={{
                width: 26, height: 26, borderRadius: "50%", background: c,
                border: form.color === c ? "3px solid var(--text)" : "3px solid transparent",
                cursor: "pointer", flexShrink: 0,
              }}/>
            ))}
          </div>
        </div>

        {/* Basic info */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div style={{ gridColumn: isMobile ? "1" : "span 3" }}>
            <label>Nama Setup *</label>
            <input value={form.title} onChange={e => set("title", e.target.value)}
              placeholder="e.g. London Breakout, ICT OB Reversal"/>
          </div>
          <div>
            <label>Market</label>
            <select value={form.market} onChange={e => set("market", e.target.value)}>
              {MARKETS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label>Arah</label>
            <select value={form.direction} onChange={e => set("direction", e.target.value)}>
              {DIRECTIONS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label>Timeframe</label>
            <select value={form.timeframe} onChange={e => set("timeframe", e.target.value)}>
              {TIMEFRAMES.map(tf => <option key={tf}>{tf}</option>)}
            </select>
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 12 }}>
          <label>Deskripsi Setup</label>
          <textarea value={form.description} rows={3}
            onChange={e => set("description", e.target.value)}
            placeholder="Jelaskan setup ini — kondisi market, logika, konteks..."/>
        </div>

        {/* Rules */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
          {[
            { k: "entry_rules", label: "Entry Rules",     ph: "Kapan masuk?\n- Kondisi A\n- Kondisi B" },
            { k: "sl_rules",    label: "Stop Loss Rules", ph: "Di mana SL?\n- Di bawah swing low" },
            { k: "tp_rules",    label: "Take Profit",     ph: "Target TP?\n- Resistance\n- Min 2R" },
          ].map(f => (
            <div key={f.k}>
              <label>{f.label}</label>
              <textarea value={form[f.k]} rows={4}
                onChange={e => set(f.k, e.target.value)}
                placeholder={f.ph}
                style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)" }}/>
            </div>
          ))}
        </div>

        {/* Checklist */}
        <div style={{ marginBottom: 14 }}>
          <label>Pre-Trade Checklist</label>
          <ChecklistEditor items={form.checklist ?? []} onChange={v => set("checklist", v)}/>
        </div>

        {/* Screenshot URL */}
        <div style={{ marginBottom: 20 }}>
          <label>Screenshot Contoh (URL)</label>
          <input value={form.screenshotUrl ?? ""} onChange={e => set("screenshotUrl", e.target.value)}
            placeholder="https://... (TradingView screenshot)"/>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn-ghost" onClick={onClose}>Batal</button>
          <button className="btn-primary" onClick={onSubmit} disabled={!form.title.trim()}>
            {isEditing ? "Simpan Perubahan" : "Tambah ke Playbook"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Setup card ────────────────────────────────────────────────────
function SetupCard({ setup, onEdit, onDelete, onClick, isSelected }) {
  return (
    <div onClick={onClick} style={{
      background: "var(--bg-card)",
      border:      `1px solid ${isSelected ? setup.color : "var(--border)"}`,
      borderLeft:  `3px solid ${setup.color}`,
      borderRadius: "var(--r-lg)",
      padding: "12px 14px",
      cursor: "pointer",
      transition: "all var(--t-base)",
    }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "var(--bg-hover)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = isSelected ? "var(--bg-card)" : "var(--bg-card)"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {setup.title}
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
            {[setup.market, setup.timeframe, setup.direction].map(tag => (
              <span key={tag} style={{
                fontSize: "var(--fs-2xs)", background: "var(--bg-subtle)",
                border: "1px solid var(--border-subtle)", borderRadius: 3,
                padding: "1px 5px", color: "var(--text-dim)",
              }}>{tag}</span>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 2, marginLeft: 8 }}>
          <button onClick={e => { e.stopPropagation(); onEdit(); }} className="btn-icon" style={{ width: 24, height: 24 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} className="btn-icon" style={{ width: 24, height: 24, color: "var(--danger)" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
          </button>
        </div>
      </div>
      {setup.description && (
        <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", lineHeight: 1.5,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {setup.description}
        </div>
      )}
      {(setup.checklist?.length ?? 0) > 0 && (
        <div style={{ marginTop: 6, fontSize: "var(--fs-2xs)", color: "var(--text-dim)" }}>
          ✓ {setup.checklist.length} checklist items
        </div>
      )}
    </div>
  );
}

// ── Setup detail ──────────────────────────────────────────────────
function SetupDetail({ setup }) {
  const { isMobile } = useBreakpoint();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 4, alignSelf: "stretch", background: setup.color, borderRadius: 4, flexShrink: 0 }}/>
        <div>
          <h2 style={{ fontFamily: "var(--font-disp)", fontSize: 22, letterSpacing: 2, color: "var(--text)", fontWeight: 400 }}>
            {setup.title}
          </h2>
          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            {[setup.market, setup.timeframe, setup.direction].map(tag => (
              <span key={tag} style={{
                fontSize: "var(--fs-xs)",
                background: "var(--bg-subtle)",
                border: `1px solid ${setup.color}`,
                borderRadius: "var(--r-sm)",
                padding: "2px 8px",
                color: setup.color,
              }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Screenshot */}
      {setup.screenshotUrl && (
        <img src={setup.screenshotUrl} alt={setup.title}
          style={{ width: "100%", maxHeight: 240, objectFit: "cover", borderRadius: "var(--r-lg)", border: "1px solid var(--border)" }}
          onError={e => { e.target.style.display = "none"; }}/>
      )}

      {/* Description */}
      {setup.description && (
        <div>
          <div className="section-label" style={{ marginBottom: 8 }}>Deskripsi</div>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", lineHeight: 1.8, whiteSpace: "pre-wrap", background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "10px 14px" }}>
            {setup.description}
          </div>
        </div>
      )}

      {/* Rules */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 10 }}>
        {[
          ["Entry Rules", setup.entry_rules],
          ["Stop Loss",   setup.sl_rules],
          ["Take Profit", setup.tp_rules],
        ].filter(([, v]) => v).map(([title, content]) => (
          <div key={title}>
            <div className="section-label" style={{ marginBottom: 8 }}>{title}</div>
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)", lineHeight: 1.8, whiteSpace: "pre-wrap", background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "10px 14px", minHeight: 72, fontFamily: "var(--font-mono)" }}>
              {content}
            </div>
          </div>
        ))}
      </div>

      {/* Checklist */}
      {(setup.checklist?.length ?? 0) > 0 && (
        <div>
          <div className="section-label" style={{ marginBottom: 10 }}>
            Pre-Trade Checklist ({setup.checklist.length} items)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {setup.checklist.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 12px", background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}>
                <div style={{ width: 16, height: 16, border: `2px solid ${setup.color}`, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 9, color: setup.color }}>✓</span>
                </div>
                <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timestamps */}
      {setup.created_at && (
        <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", paddingTop: 8, borderTop: "1px solid var(--border)" }}>
          Dibuat: {new Date(setup.created_at).toLocaleDateString("id-ID")}
          {setup.updated_at && setup.updated_at !== setup.created_at &&
            ` · Diupdate: ${new Date(setup.updated_at).toLocaleDateString("id-ID")}`}
        </div>
      )}
    </div>
  );
}

// ── Main Playbook ─────────────────────────────────────────────────
export default function Playbook({ setups, loading, error, onAdd, onUpdate, onDelete, theme }) {
  const { isMobile } = useBreakpoint();
  const [showForm,   setShowForm]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [selected,   setSelected]   = useState(0);
  const [filterMkt,  setFilterMkt]  = useState("All");
  const [search,     setSearch]     = useState("");
  const [form,       setForm]       = useState({ ...EMPTY_SETUP });

  const filtered = useMemo(() => {
    let s = setups;
    if (filterMkt !== "All") s = s.filter(x => x.market === filterMkt);
    if (search.trim()) s = s.filter(x =>
      x.title.toLowerCase().includes(search.toLowerCase()) ||
      (x.description ?? "").toLowerCase().includes(search.toLowerCase())
    );
    return s;
  }, [setups, filterMkt, search]);

  function openAdd() { setForm({ ...EMPTY_SETUP }); setEditTarget(null); setShowForm(true); }
  function openEdit(setup) { setForm({ ...setup }); setEditTarget(setup); setShowForm(true); }

  async function handleSubmit() {
    if (!form.title.trim()) return;
    try {
      editTarget ? await onUpdate(editTarget.id, form) : await onAdd(form);
      setShowForm(false);
    } catch (err) { console.error("Playbook save:", err); }
  }

  if (loading) return (
    <div style={{ textAlign: "center", padding: 80, color: "var(--text-dim)" }}>Loading playbook...</div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Playbook</h1>
          <p className="page-subtitle">{setups.length} setup tersimpan</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input value={search} onChange={e => { setSearch(e.target.value); setSelected(0); }}
            placeholder="Cari setup..." style={{ width: 150, height: 30, fontSize: "var(--fs-sm)" }}/>
          <select value={filterMkt} onChange={e => { setFilterMkt(e.target.value); setSelected(0); }}
            style={{ width: "auto", height: 30, fontSize: "var(--fs-sm)" }}>
            <option value="All">All Markets</option>
            {MARKETS.map(m => <option key={m}>{m}</option>)}
          </select>
          <button className="btn-primary" onClick={openAdd} style={{ height: 30, fontSize: "var(--fs-sm)" }}>
            + Setup Baru
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "var(--danger-dim)", border: "1px solid var(--danger)", borderRadius: "var(--r-md)", padding: "10px 14px", fontSize: "var(--fs-sm)", color: "var(--danger)", marginBottom: 14 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Empty state */}
      {setups.length === 0 ? (
        <div className="stat-card">
          <div className="empty-state">
            <div className="empty-icon">📖</div>
            <div className="empty-title">Playbook Kosong</div>
            <div className="empty-desc">Dokumentasikan setup-setup trading yang sudah terbukti profitable</div>
            <button className="btn-primary" onClick={openAdd} style={{ marginTop: 16 }}>+ Buat Setup Pertama</button>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "280px 1fr", gap: 14, alignItems: "start" }}>
          {/* Setup list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: isMobile ? "50vh" : "80vh", overflowY: "auto", paddingRight: 2 }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--text-dim)", fontSize: "var(--fs-sm)" }}>
                Tidak ada setup ditemukan.
              </div>
            ) : filtered.map((setup, i) => (
              <SetupCard key={setup.id} setup={setup}
                isSelected={i === selected}
                onClick={() => setSelected(i)}
                onEdit={() => openEdit(setup)}
                onDelete={() => { if (window.confirm(`Hapus setup "${setup.title}"?`)) onDelete(setup.id); }}
              />
            ))}
          </div>

          {/* Detail */}
          {filtered[selected]
            ? <SetupDetail setup={filtered[selected]}/>
            : <div style={{ textAlign: "center", padding: 60, color: "var(--text-dim)" }}>Pilih setup di kiri.</div>
          }
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <SetupForm form={form} setForm={setForm}
          onSubmit={handleSubmit} onClose={() => setShowForm(false)}
          isEditing={!!editTarget}/>
      )}
    </div>
  );
}