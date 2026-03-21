import { useState } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";

const TYPE_COLORS = { premarket: "#f59e0b", postmarket: "#8b5cf6", weekly: "#0ea5e9", custom: "#00c896" };
const TYPE_LABELS = { premarket: "Pre-Market", postmarket: "Post-Market", weekly: "Weekly", custom: "Custom" };

// ── Template card ─────────────────────────────────────────────────
function TemplateCard({ template, isActive, onSelect, onDelete, theme: t }) {
  const color = TYPE_COLORS[template.type] || "#00c896";
  return (
    <div onClick={() => onSelect(template)}
      style={{ background: isActive ? `${color}10` : t.bgSubtle, border: `1px solid ${isActive ? color + "40" : t.borderSubtle}`, borderRadius: 10, padding: "12px 14px", cursor: "pointer", transition: "all 0.15s" }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = color + "30"; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = t.borderSubtle; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 20 }}>{template.icon}</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? color : t.text }}>{template.name}</div>
            <div style={{ fontSize: 9, color, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>{TYPE_LABELS[template.type]}</div>
          </div>
        </div>
        {template.id?.startsWith("custom_") && (
          <button onClick={e => { e.stopPropagation(); onDelete(template.id); }}
            style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 12 }}>🗑</button>
        )}
      </div>
      <div style={{ fontSize: 11, color: t.textDim, marginTop: 6 }}>{template.desc}</div>
      <div style={{ fontSize: 10, color: t.textDim, marginTop: 4 }}>{template.fields?.length} fields</div>
    </div>
  );
}

// ── Form field renderer ───────────────────────────────────────────
function TemplateField({ field, value, onChange, theme: t }) {
  const required = field.required;

  return (
    <div>
      <label style={{ color: t.textDim, display: "flex", alignItems: "center", gap: 4 }}>
        {field.label}
        {required && <span style={{ color: "#ef4444", fontSize: 10 }}>*</span>}
      </label>
      {field.type === "select" ? (
        <select value={value || ""} onChange={e => onChange(field.id, e.target.value)}
          style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8 }}>
          <option value="">— Pilih —</option>
          {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : field.type === "textarea" ? (
        <textarea value={value || ""} onChange={e => onChange(field.id, e.target.value)}
          rows={3} placeholder={field.placeholder || ""}
          style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, resize: "vertical", fontSize: 12, lineHeight: 1.6 }} />
      ) : (
        <input type="text" value={value || ""} onChange={e => onChange(field.id, e.target.value)}
          placeholder={field.placeholder || ""}
          style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8 }} />
      )}
    </div>
  );
}

// ── Custom template builder ───────────────────────────────────────
function CustomTemplateBuilder({ onSave, onClose, theme: t }) {
  const [name, setName]   = useState("");
  const [type, setType]   = useState("premarket");
  const [desc, setDesc]   = useState("");
  const [icon, setIcon]   = useState("📝");
  const [fields, setFields] = useState([{ id: "field_0", label: "", type: "textarea", placeholder: "" }]);

  function addField() {
    setFields(prev => [...prev, { id: `field_${prev.length}`, label: "", type: "textarea", placeholder: "" }]);
  }
  function removeField(idx) { setFields(prev => prev.filter((_, i) => i !== idx)); }
  function updateField(idx, key, val) {
    setFields(prev => prev.map((f, i) => i === idx ? { ...f, [key]: val } : f));
  }

  function handleSave() {
    if (!name.trim() || fields.length === 0) return;
    onSave({ name, type, desc, icon, fields: fields.filter(f => f.label.trim()), id: null });
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(8,12,20,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(6px)", overflowY: "auto" }}>
      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2, color: t.text, marginBottom: 20 }}>CUSTOM TEMPLATE</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 10 }}>
            <div><label>Icon</label><input value={icon} onChange={e => setIcon(e.target.value)} style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, fontSize: 20, textAlign: "center" }} /></div>
            <div><label>Nama Template</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Nama template..." style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8 }} /></div>
          </div>
          <div><label>Tipe</label>
            <div style={{ display: "flex", gap: 6 }}>
              {Object.entries(TYPE_LABELS).filter(([k]) => k !== "custom").map(([k, v]) => (
                <button key={k} onClick={() => setType(k)}
                  style={{ flex: 1, padding: "6px 0", borderRadius: 7, border: `1px solid ${type === k ? TYPE_COLORS[k] : t.border}`, background: type === k ? TYPE_COLORS[k] + "15" : "transparent", color: type === k ? TYPE_COLORS[k] : t.textDim, fontSize: 11, cursor: "pointer" }}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div><label>Deskripsi</label><input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Deskripsi singkat..." style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8 }} /></div>

          <div style={{ fontSize: 9, color: t.accent, textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 8 }}>Fields</div>
          {fields.map((field, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 100px 28px", gap: 6, alignItems: "end" }}>
              <div><label>Label</label><input value={field.label} onChange={e => updateField(idx, "label", e.target.value)} placeholder="Nama field..." style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, fontSize: 12 }} /></div>
              <div><label>Tipe</label>
                <select value={field.type} onChange={e => updateField(idx, "type", e.target.value)} style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, fontSize: 12 }}>
                  <option value="text">Text</option>
                  <option value="textarea">Textarea</option>
                  <option value="select">Dropdown</option>
                </select>
              </div>
              <button onClick={() => removeField(idx)} style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 16, paddingBottom: 2 }}>✕</button>
            </div>
          ))}
          <button onClick={addField} className="btn-ghost" style={{ fontSize: 11 }}>+ Tambah Field</button>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>Batal</button>
          <button onClick={handleSave} className="btn-primary" style={{ flex: 2, justifyContent: "center" }} disabled={!name.trim()}>Simpan Template</button>
        </div>
      </div>
    </div>
  );
}

// ── Entry history ─────────────────────────────────────────────────
function EntryHistory({ entries, theme: t }) {
  const [expand, setExpand] = useState(null);
  if (!entries || entries.length === 0) return <div style={{ fontSize: 12, color: t.textDim, textAlign: "center", padding: "16px 0" }}>Belum ada entry tersimpan</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 400, overflowY: "auto" }}>
      {entries.slice(0, 20).map(e => (
        <div key={e.id} style={{ background: t.bgSubtle, borderRadius: 10, overflow: "hidden" }}>
          <div onClick={() => setExpand(expand === e.id ? null : e.id)}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", cursor: "pointer" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: t.text }}>{e.templateName}</div>
              <div style={{ fontSize: 10, color: t.textDim }}>{e.date} · {TYPE_LABELS[e.type]}</div>
            </div>
            <span style={{ fontSize: 12, color: t.textDim }}>{expand === e.id ? "▲" : "▾"}</span>
          </div>
          {expand === e.id && (
            <div style={{ padding: "0 14px 12px", borderTop: `1px solid ${t.borderSubtle}` }}>
              {Object.entries(e.values || {}).map(([k, v]) => v ? (
                <div key={k} style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>{k.replace(/_/g, " ")}</div>
                  <div style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.6 }}>{v}</div>
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
  const t = theme;
  const { isMobile } = useBreakpoint();
  const [showBuilder,  setShowBuilder]  = useState(false);
  const [activePanel,  setActivePanel]  = useState("templates"); // templates | history
  const { allTemplates, activeTemplate, formValues, editDate, savedMsg, setEditDate, loadTemplate, setField, saveEntry, autoFill, loadExisting, saveCustomTemplate, deleteCustomTemplate, entries } = templateHook;

  const COLOR = activeTemplate ? (TYPE_COLORS[activeTemplate.type] || "#00c896") : "#00c896";

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 3, color: t.text, lineHeight: 1 }}>JOURNAL TEMPLATES</div>
          <div style={{ fontSize: 11, color: t.textDim, marginTop: 4 }}>Template pre-market, post-market, dan weekly review</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ display: "flex", gap: 3, background: t.bgSubtle, border: `1px solid ${t.border}`, borderRadius: 8, padding: 3 }}>
            {[{ v: "templates", l: "📋 Templates" }, { v: "history", l: "📖 History" }].map(p => (
              <button key={p.v} onClick={() => setActivePanel(p.v)}
                style={{ padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, background: activePanel === p.v ? t.accent : "transparent", color: activePanel === p.v ? "#090e1a" : t.textDim, fontWeight: activePanel === p.v ? 600 : 400 }}>
                {p.l}
              </button>
            ))}
          </div>
          <button onClick={() => setShowBuilder(true)} className="btn-ghost" style={{ fontSize: 11 }}>+ Custom</button>
        </div>
      </div>

      {activePanel === "history" ? (
        <EntryHistory entries={entries} theme={t} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "240px 1fr", gap: 20, alignItems: "start" }}>
          {/* Template list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>Pilih Template</div>
            {["premarket", "postmarket", "weekly"].map(type => (
              <div key={type}>
                <div style={{ fontSize: 9, color: TYPE_COLORS[type], textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 6, marginTop: 8 }}>{TYPE_LABELS[type]}</div>
                {allTemplates.filter(t2 => t2.type === type).map(tmpl => (
                  <div key={tmpl.id} style={{ marginBottom: 6 }}>
                    <TemplateCard template={tmpl} isActive={activeTemplate?.id === tmpl.id} onSelect={loadTemplate} onDelete={deleteCustomTemplate} theme={t} />
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Form area */}
          <div>
            {!activeTemplate ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                <div style={{ fontSize: 15, color: t.text, marginBottom: 8 }}>Pilih template di kiri</div>
                <div style={{ fontSize: 12, color: t.textDim, maxWidth: 260, lineHeight: 1.8 }}>Pilih template yang sesuai untuk mulai mengisi journal trading kamu</div>
              </div>
            ) : (
              <div className="stat-card" style={{ border: `1px solid ${COLOR}25` }}>
                {/* Form header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 24 }}>{activeTemplate.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{activeTemplate.name}</div>
                      <div style={{ fontSize: 10, color: COLOR }}>{TYPE_LABELS[activeTemplate.type]}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                      style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 7, padding: "5px 8px", fontSize: 11 }} />
                    <button onClick={() => autoFill(activeTemplate.id)} className="btn-ghost" style={{ fontSize: 11, padding: "5px 10px" }} title="Auto-fill dari trade hari ini">⚡ Auto-fill</button>
                    <button onClick={loadExisting} className="btn-ghost" style={{ fontSize: 11, padding: "5px 10px" }} title="Load entry yang sudah tersimpan">↩ Load</button>
                  </div>
                </div>

                {/* Fields */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {activeTemplate.fields.map(field => (
                    <TemplateField key={field.id} field={field} value={formValues[field.id]} onChange={setField} theme={t} />
                  ))}
                </div>

                {/* Save */}
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 20, paddingTop: 16, borderTop: `1px solid ${t.borderSubtle}` }}>
                  <button onClick={saveEntry} className="btn-primary" style={{ justifyContent: "center", flex: 1 }}>💾 Simpan Entry</button>
                  {savedMsg && <span style={{ fontSize: 12, color: "#00c896" }}>{savedMsg}</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showBuilder && <CustomTemplateBuilder onSave={saveCustomTemplate} onClose={() => setShowBuilder(false)} theme={t} />}
    </div>
  );
}