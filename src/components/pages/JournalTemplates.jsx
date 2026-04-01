import { useState } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";

const TYPE_COLORS = { premarket: "var(--warning)", postmarket: "#8b5cf6", weekly: "var(--accent2)", custom: "var(--accent)" };
const TYPE_LABELS = { premarket: "Pre-Market", postmarket: "Post-Market", weekly: "Weekly", custom: "Custom" };

// ── Template card ─────────────────────────────────────────────────
function TemplateCard({ template, isActive, onSelect, onDelete }) {
  const color = TYPE_COLORS[template.type] || "var(--accent)";
  return (
    <div onClick={() => onSelect(template)} style={{
      background: isActive ? "var(--bg-subtle)" : "var(--bg-subtle)",
      borderTop: `1px solid ${isActive ? color : "var(--border)"}`,
      borderRight: `1px solid ${isActive ? color : "var(--border)"}`,
      borderBottom: `1px solid ${isActive ? color : "var(--border)"}`,
      borderLeft: `3px solid ${color}`,
      borderRadius: "var(--r-lg)", padding: "10px 12px",
      cursor: "pointer", transition: "all var(--t-base)",
    }}
      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderTopColor = color; e.currentTarget.style.borderRightColor = color; e.currentTarget.style.borderBottomColor = color; } }}
      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderTopColor = "var(--border)"; e.currentTarget.style.borderRightColor = "var(--border)"; e.currentTarget.style.borderBottomColor = "var(--border)"; } }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 18 }}>{template.icon}</span>
          <div>
            <div style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: isActive ? color : "var(--text)" }}>{template.name}</div>
            <div style={{ fontSize: "var(--fs-2xs)", color, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 1 }}>{TYPE_LABELS[template.type]}</div>
          </div>
        </div>
        {template.id?.startsWith("custom_") && (
          <button onClick={e => { e.stopPropagation(); onDelete(template.id); }}
            className="btn-icon" style={{ width: 22, height: 22, color: "var(--danger)" }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
          </button>
        )}
      </div>
      <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 5 }}>{template.desc}</div>
      <div style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)", marginTop: 3 }}>{template.fields?.length} fields</div>
    </div>
  );
}

// ── Template field ────────────────────────────────────────────────
function TemplateField({ field, value, onChange }) {
  const base = { width: "100%" };
  if (field.type === "select") return (
    <div>
      <label>{field.label}{field.required && <span style={{ color: "var(--danger)", fontSize: 10, marginLeft: 3 }}>*</span>}</label>
      <select value={value || ""} onChange={e => onChange(field.id, e.target.value)}>
        <option value="">— Pilih —</option>
        {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
  if (field.type === "textarea") return (
    <div>
      <label>{field.label}{field.required && <span style={{ color: "var(--danger)", fontSize: 10, marginLeft: 3 }}>*</span>}</label>
      <textarea value={value || ""} onChange={e => onChange(field.id, e.target.value)}
        rows={3} placeholder={field.placeholder || ""} style={{ lineHeight: 1.6 }}/>
    </div>
  );
  return (
    <div>
      <label>{field.label}{field.required && <span style={{ color: "var(--danger)", fontSize: 10, marginLeft: 3 }}>*</span>}</label>
      <input type="text" value={value || ""} onChange={e => onChange(field.id, e.target.value)} placeholder={field.placeholder || ""}/>
    </div>
  );
}

// ── Custom template builder ───────────────────────────────────────
function CustomTemplateBuilder({ onSave, onClose }) {
  const [name,   setName]   = useState("");
  const [type,   setType]   = useState("premarket");
  const [desc,   setDesc]   = useState("");
  const [icon,   setIcon]   = useState("📝");
  const [fields, setFields] = useState([{ id: "field_0", label: "", type: "textarea", placeholder: "" }]);

  function addField() { setFields(p => [...p, { id: `field_${p.length}`, label: "", type: "textarea", placeholder: "" }]); }
  function removeField(idx) { setFields(p => p.filter((_, i) => i !== idx)); }
  function updateField(idx, key, val) { setFields(p => p.map((f, i) => i === idx ? { ...f, [key]: val } : f)); }

  function handleSave() {
    if (!name.trim() || !fields.length) return;
    onSave({ name, type, desc, icon, fields: fields.filter(f => f.label.trim()), id: null });
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "var(--bg-overlay)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, overflowY: "auto" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: 24, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "var(--font-disp)", fontSize: 18, letterSpacing: 2, color: "var(--text)", fontWeight: 400 }}>CUSTOM TEMPLATE</h2>
          <button onClick={onClose} className="btn-icon">✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "56px 1fr", gap: 10 }}>
            <div>
              <label>Icon</label>
              <input value={icon} onChange={e => setIcon(e.target.value)} style={{ fontSize: 18, textAlign: "center" }}/>
            </div>
            <div>
              <label>Nama Template</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Nama template..."/>
            </div>
          </div>

          <div>
            <label>Tipe</label>
            <div style={{ display: "flex", gap: 5, marginTop: 4 }}>
              {Object.entries(TYPE_LABELS).filter(([k]) => k !== "custom").map(([k, v]) => (
                <button key={k} onClick={() => setType(k)} style={{
                  flex: 1, padding: "6px 0", borderRadius: "var(--r-md)", cursor: "pointer",
                  border: `1px solid ${type === k ? TYPE_COLORS[k] : "var(--border)"}`,
                  background: type === k ? `${TYPE_COLORS[k]}15` : "transparent",
                  color: type === k ? TYPE_COLORS[k] : "var(--text-dim)",
                  fontSize: "var(--fs-xs)",
                }}>{v}</button>
              ))}
            </div>
          </div>

          <div>
            <label>Deskripsi</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Deskripsi singkat..."/>
          </div>

          <div className="section-label" style={{ marginTop: 4 }}>Fields</div>
          {fields.map((field, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 90px 26px", gap: 6, alignItems: "end" }}>
              <div>
                <label>Label</label>
                <input value={field.label} onChange={e => updateField(idx, "label", e.target.value)} placeholder="Nama field..."/>
              </div>
              <div>
                <label>Tipe</label>
                <select value={field.type} onChange={e => updateField(idx, "type", e.target.value)}>
                  <option value="text">Text</option>
                  <option value="textarea">Textarea</option>
                  <option value="select">Dropdown</option>
                </select>
              </div>
              <button onClick={() => removeField(idx)} className="btn-icon" style={{ color: "var(--danger)", marginBottom: 1 }}>✕</button>
            </div>
          ))}
          <button onClick={addField} className="btn-ghost" style={{ fontSize: "var(--fs-xs)" }}>+ Tambah Field</button>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>Batal</button>
          <button onClick={handleSave} className="btn-primary" style={{ flex: 2, justifyContent: "center" }} disabled={!name.trim()}>
            Simpan Template
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Entry history ─────────────────────────────────────────────────
function EntryHistory({ entries }) {
  const [expand, setExpand] = useState(null);
  if (!entries?.length) return (
    <div className="stat-card">
      <div className="empty-state">
        <div className="empty-icon">📖</div>
        <div className="empty-desc">Belum ada entry tersimpan</div>
      </div>
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {entries.slice(0, 20).map(e => (
        <div key={e.id} style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
          <div onClick={() => setExpand(expand === e.id ? null : e.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", cursor: "pointer" }}>
            <div>
              <div style={{ fontSize: "var(--fs-sm)", fontWeight: 500, color: "var(--text)" }}>{e.templateName}</div>
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>{e.date} · {TYPE_LABELS[e.type]}</div>
            </div>
            <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>{expand === e.id ? "▲" : "▾"}</span>
          </div>
          {expand === e.id && (
            <div style={{ padding: "0 14px 12px", borderTop: "1px solid var(--border)" }}>
              {Object.entries(e.values || {}).map(([k, v]) => v ? (
                <div key={k} style={{ marginTop: 8 }}>
                  <div style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>{k.replace(/_/g, " ")}</div>
                  <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", lineHeight: 1.6 }}>{v}</div>
                </div>
              ) : null)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main JournalTemplates ─────────────────────────────────────────
export default function JournalTemplates({ templateHook, theme }) {
  const { isMobile } = useBreakpoint();
  const [showBuilder, setShowBuilder] = useState(false);
  const [activePanel, setActivePanel] = useState("templates");
  const {
    allTemplates, activeTemplate, formValues, editDate, savedMsg,
    setEditDate, loadTemplate, setField, saveEntry, autoFill, loadExisting,
    saveCustomTemplate, deleteCustomTemplate, entries,
  } = templateHook;

  const COLOR = activeTemplate ? (TYPE_COLORS[activeTemplate.type] || "var(--accent)") : "var(--accent)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Journal Templates</h1>
          <p className="page-subtitle">Template pre-market, post-market, dan weekly review</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ display: "flex", gap: 2, background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 2 }}>
            {[{ v: "templates", l: "📋 Templates" }, { v: "history", l: "📖 History" }].map(p => (
              <button key={p.v} onClick={() => setActivePanel(p.v)} style={{
                padding: "5px 12px", borderRadius: "var(--r-sm)", border: "none", cursor: "pointer",
                fontSize: "var(--fs-xs)",
                background: activePanel === p.v ? "var(--accent)"      : "transparent",
                color:      activePanel === p.v ? "var(--text-inverse)" : "var(--text-dim)",
                fontWeight: activePanel === p.v ? 600 : 400,
              }}>{p.l}</button>
            ))}
          </div>
          <button onClick={() => setShowBuilder(true)} className="btn-ghost" style={{ height: 30, fontSize: "var(--fs-xs)" }}>
            + Custom
          </button>
        </div>
      </div>

      {/* History panel */}
      {activePanel === "history" && <EntryHistory entries={entries}/>}

      {/* Templates panel */}
      {activePanel === "templates" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "220px 1fr", gap: 14, alignItems: "start" }}>
          {/* Template list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="section-label">Pilih Template</div>
            {["premarket","postmarket","weekly"].map(type => (
              <div key={type}>
                <div style={{ fontSize: "var(--fs-2xs)", color: TYPE_COLORS[type], textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginTop: 10, marginBottom: 5 }}>
                  {TYPE_LABELS[type]}
                </div>
                {(allTemplates || []).filter(t => t.type === type).map(tmpl => (
                  <div key={tmpl.id} style={{ marginBottom: 5 }}>
                    <TemplateCard template={tmpl} isActive={activeTemplate?.id === tmpl.id}
                      onSelect={loadTemplate} onDelete={deleteCustomTemplate}/>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Form */}
          {!activeTemplate ? (
            <div className="stat-card">
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <div className="empty-title">Pilih template di kiri</div>
                <div className="empty-desc">Pilih template yang sesuai untuk mulai mengisi journal trading kamu</div>
              </div>
            </div>
          ) : (
            <div className="stat-card" style={{ border: `1px solid ${COLOR}25` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 22 }}>{activeTemplate.icon}</span>
                  <div>
                    <div style={{ fontSize: "var(--fs-base)", fontWeight: 600, color: "var(--text)" }}>{activeTemplate.name}</div>
                    <div style={{ fontSize: "var(--fs-xs)", color: COLOR }}>{TYPE_LABELS[activeTemplate.type]}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                    style={{ height: 28, fontSize: "var(--fs-xs)", padding: "0 8px" }}/>
                  <button onClick={() => autoFill(activeTemplate.id)} className="btn-ghost" style={{ height: 28, fontSize: "var(--fs-xs)" }} title="Auto-fill dari trade hari ini">⚡ Auto</button>
                  <button onClick={loadExisting} className="btn-ghost" style={{ height: 28, fontSize: "var(--fs-xs)" }} title="Load entry yang tersimpan">↩ Load</button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {activeTemplate.fields.map(field => (
                  <TemplateField key={field.id} field={field} value={formValues[field.id]} onChange={setField}/>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                <button onClick={saveEntry} className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>
                  💾 Simpan Entry
                </button>
                {savedMsg && <span style={{ fontSize: "var(--fs-sm)", color: "var(--accent)" }}>{savedMsg}</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {showBuilder && <CustomTemplateBuilder onSave={saveCustomTemplate} onClose={() => setShowBuilder(false)}/>}
    </div>
  );
}