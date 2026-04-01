import { useState } from "react";
import { getTagColor } from "../constants/tags";

// ── Tag badge ─────────────────────────────────────────────────────
export function TagBadge({ tag, onClick, selected, removable }) {
  const color = getTagColor(tag);
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 9px", borderRadius: 20, cursor: "pointer",
      border: `1px solid ${selected ? color : color + "40"}`,
      background: selected ? color + "18" : "transparent",
      color: selected ? color : "var(--text-dim)",
      fontSize: "var(--fs-xs)", fontFamily: "var(--font-mono)",
      transition: "all var(--t-fast)",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }}/>
      {tag}
      {removable && <span style={{ fontSize: 9, marginLeft: 2, opacity: 0.7 }}>✕</span>}
    </button>
  );
}

// ── Tag analytics ─────────────────────────────────────────────────
function TagAnalytics({ tagStats, onFilterTag, activeTagFilters }) {
  if (!tagStats?.length) return (
    <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-dim)", textAlign: "center", padding: "16px 0" }}>
      Belum ada tag
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {tagStats.slice(0, 10).map(s => {
        const active = activeTagFilters.includes(s.tag);
        return (
          <div key={s.tag} onClick={() => onFilterTag(s.tag)} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "6px 10px", borderRadius: "var(--r-md)", cursor: "pointer",
            background: active ? s.color + "12" : "transparent",
            border: `1px solid ${active ? s.color + "40" : "transparent"}`,
            transition: "all var(--t-fast)",
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, flexShrink: 0 }}/>
            <div style={{ flex: 1, fontSize: "var(--fs-sm)", color: "var(--text)" }}>{s.tag}</div>
            <div style={{ flex: 2, height: 3, background: "var(--bg-subtle)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${s.winRate}%`, background: s.color, borderRadius: 2 }}/>
            </div>
            <span style={{ width: 34, fontSize: "var(--fs-xs)", color: s.winRate >= 50 ? "var(--success)" : "var(--warning)", textAlign: "right", fontFamily: "var(--font-mono)" }}>
              {s.winRate.toFixed(0)}%
            </span>
            <span style={{ width: 22, fontSize: "var(--fs-xs)", color: "var(--text-dim)", textAlign: "right" }}>
              {s.trades}x
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Preset manager ────────────────────────────────────────────────
function PresetManager({ presets, onSave, onLoad, onDelete }) {
  const [name, setName] = useState("");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 6 }}>
        <input value={name} onChange={e => setName(e.target.value)}
          placeholder="Nama preset..."
          style={{ flex: 1, height: 28, fontSize: "var(--fs-xs)" }}
          onKeyDown={e => e.key === "Enter" && name.trim() && (onSave(name.trim()), setName(""))}/>
        <button onClick={() => { if (name.trim()) { onSave(name.trim()); setName(""); } }}
          className="btn-primary" style={{ height: 28, fontSize: "var(--fs-xs)", padding: "0 10px" }}>
          Simpan
        </button>
      </div>
      {presets.length === 0 ? (
        <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", textAlign: "center", padding: "8px 0" }}>
          Belum ada preset
        </div>
      ) : (
        presets.map(p => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", background: "var(--bg-subtle)", borderRadius: "var(--r-md)" }}>
            <span style={{ flex: 1, fontSize: "var(--fs-xs)", color: "var(--text)" }}>{p.name}</span>
            <button onClick={() => onLoad(p)} className="btn-ghost" style={{ height: 24, fontSize: "var(--fs-2xs)", padding: "0 8px" }}>Load</button>
            <button onClick={() => onDelete(p.id)} className="btn-icon" style={{ width: 22, height: 22, color: "var(--danger)" }}>✕</button>
          </div>
        ))
      )}
    </div>
  );
}

// ── Bulk tag manager ──────────────────────────────────────────────
function BulkTagManager({ selected, allTags, onAddTag, onSelectAll, onClearSelect }) {
  const [tagInput, setTagInput] = useState("");
  return (
    <div style={{ background: "var(--success-dim)", border: "1px solid var(--success)", borderRadius: "var(--r-md)", padding: "10px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: "var(--fs-xs)", color: "var(--success)", fontWeight: 500 }}>{selected.size} trade dipilih</span>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={onSelectAll} className="btn-ghost" style={{ height: 22, fontSize: "var(--fs-2xs)", padding: "0 7px" }}>Semua</button>
          <button onClick={onClearSelect} className="btn-ghost" style={{ height: 22, fontSize: "var(--fs-2xs)", padding: "0 7px" }}>Clear</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 5 }}>
        <input value={tagInput} onChange={e => setTagInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && tagInput.trim()) { onAddTag(tagInput.trim()); setTagInput(""); } }}
          placeholder="Tag baru... (Enter)"
          style={{ flex: 1, height: 28, fontSize: "var(--fs-xs)" }}/>
        <button onClick={() => { if (tagInput.trim()) { onAddTag(tagInput.trim()); setTagInput(""); } }}
          className="btn-primary" style={{ height: 28, fontSize: "var(--fs-xs)", padding: "0 10px" }}>
          + Tag
        </button>
      </div>
      {allTags.slice(0, 8).length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
          {allTags.slice(0, 8).map(tag => (
            <button key={tag} onClick={() => onAddTag(tag)} style={{
              fontSize: "var(--fs-2xs)", padding: "2px 8px", borderRadius: 20, cursor: "pointer",
              border: `1px solid ${getTagColor(tag)}40`, color: getTagColor(tag),
              background: getTagColor(tag) + "10",
            }}>+ {tag}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Select row helper ─────────────────────────────────────────────
function SelRow({ label, fieldKey, value, options, setField }) {
  const active = !!value;
  return (
    <div>
      <label>{label}</label>
      <div style={{ position: "relative" }}>
        <select value={value} onChange={e => setField(fieldKey, e.target.value)} style={{
          width: "100%", height: 30, padding: "0 22px 0 8px",
          fontSize: "var(--fs-xs)", borderRadius: "var(--r-sm)",
          border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
          background: active ? "var(--accent-dim)" : "var(--bg-input)",
          color: active ? "var(--accent)" : "var(--text-muted)",
          outline: "none", appearance: "none", WebkitAppearance: "none",
        }}>
          <option value="">Semua</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <span style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", fontSize: 7, pointerEvents: "none", color: "var(--text-dim)" }}>▼</span>
      </div>
    </div>
  );
}

// ── Toggle button group ───────────────────────────────────────────
function ToggleGroup({ label, fieldKey, options, value, setField }) {
  return (
    <div>
      <label>{label}</label>
      <div style={{ display: "flex", gap: 4 }}>
        {options.map(o => {
          const active = value === o.v;
          return (
            <button key={o.v} onClick={() => setField(fieldKey, o.v)} style={{
              flex: 1, height: 28, borderRadius: "var(--r-sm)", cursor: "pointer",
              border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
              background: active ? "var(--accent-dim)" : "transparent",
              color: active ? "var(--accent)" : "var(--text-dim)",
              fontSize: "var(--fs-xs)", fontWeight: active ? 600 : 400,
              transition: "all var(--t-fast)",
            }}>{o.l}</button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main AdvancedFilterPanel ──────────────────────────────────────
export default function AdvancedFilterPanel({ filterHook, onBulkTag, theme }) {
  const {
    filter, setField, toggleTag, clearFilter,
    filtered, options, tagStats, activeFilterCount,
    presets, savePreset, loadPreset, deletePreset,
    selected, selectAll, clearSelect,
    bulkAddTag, bulkRemoveTag,
  } = filterHook;

  const [section, setSection] = useState("filters");

  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: "var(--r-xl)", padding: 16,
      height: "fit-content", display: "flex", flexDirection: "column", gap: 12,
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: "var(--accent)" }}>
            <line x1="4" y1="6" x2="20" y2="6"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
            <line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          Filter
          {activeFilterCount > 0 && (
            <span style={{ fontSize: "var(--fs-2xs)", background: "var(--accent)", color: "var(--text-inverse)", borderRadius: 20, padding: "1px 7px", fontWeight: 700 }}>
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button onClick={clearFilter} style={{ background: "none", border: "none", fontSize: "var(--fs-xs)", color: "var(--danger)", cursor: "pointer", padding: 0 }}>
            ✕ Reset
          </button>
        )}
      </div>

      {/* Section tabs */}
      <div style={{ display: "flex", gap: 2, background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 2 }}>
        {[{ v: "filters", l: "Filter" }, { v: "tags", l: "Tags" }, { v: "presets", l: "Preset" }, { v: "bulk", l: "Bulk" }].map(s => (
          <button key={s.v} onClick={() => setSection(s.v)} style={{
            flex: 1, height: 24, borderRadius: "var(--r-sm)", border: "none", cursor: "pointer",
            fontSize: "var(--fs-xs)",
            background: section === s.v ? "var(--accent)"      : "transparent",
            color:      section === s.v ? "var(--text-inverse)" : "var(--text-dim)",
            fontWeight: section === s.v ? 600 : 400,
          }}>{s.l}</button>
        ))}
      </div>

      {/* ── Filters ── */}
      {section === "filters" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Search */}
          <div>
            <label>Search</label>
            <div style={{ position: "relative" }}>
              <svg style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", opacity: 0.4, pointerEvents: "none" }}
                width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input value={filter.search} onChange={e => setField("search", e.target.value)}
                placeholder="Pair, strategy, notes..."
                style={{ paddingLeft: 26, height: 30, fontSize: "var(--fs-xs)", border: `1px solid ${filter.search ? "var(--accent)" : "var(--border)"}`, background: filter.search ? "var(--accent-dim)" : "var(--bg-input)", color: "var(--text)", borderRadius: "var(--r-sm)", outline: "none", width: "100%" }}/>
            </div>
          </div>

          <SelRow label="Pair"     fieldKey="pair"     value={filter.pair}     options={options.pairs      ?? []} setField={setField}/>
          <SelRow label="Market"   fieldKey="market"   value={filter.market}   options={options.markets    ?? []} setField={setField}/>
          <SelRow label="Strategy" fieldKey="strategy" value={filter.strategy} options={options.strategies ?? []} setField={setField}/>
          <SelRow label="Session"  fieldKey="session"  value={filter.session}  options={options.sessions   ?? []} setField={setField}/>
          <SelRow label="Emotion"  fieldKey="emotion"  value={filter.emotion}  options={options.emotions   ?? []} setField={setField}/>

          <ToggleGroup label="Side"   fieldKey="side"   value={filter.side}
            options={[{ v: "", l: "All" }, { v: "BUY", l: "BUY" }, { v: "SELL", l: "SELL" }]}
            setField={setField}/>
          <ToggleGroup label="Result" fieldKey="result" value={filter.result}
            options={[{ v: "", l: "All" }, { v: "win", l: "Win" }, { v: "loss", l: "Loss" }]}
            setField={setField}/>

          {/* Date range */}
          <div>
            <label>Dari – Sampai</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
              <input type="date" value={filter.dateFrom} onChange={e => setField("dateFrom", e.target.value)}
                style={{ height: 30, padding: "0 6px", fontSize: "var(--fs-xs)", borderRadius: "var(--r-sm)", border: `1px solid ${filter.dateFrom ? "var(--accent)" : "var(--border)"}`, background: "var(--bg-input)", color: "var(--text)", outline: "none" }}/>
              <input type="date" value={filter.dateTo} onChange={e => setField("dateTo", e.target.value)}
                style={{ height: 30, padding: "0 6px", fontSize: "var(--fs-xs)", borderRadius: "var(--r-sm)", border: `1px solid ${filter.dateTo ? "var(--accent)" : "var(--border)"}`, background: "var(--bg-input)", color: "var(--text)", outline: "none" }}/>
            </div>
          </div>

          {/* Result count */}
          <div style={{ textAlign: "center", fontSize: "var(--fs-xs)", color: "var(--text-dim)", paddingTop: 4, borderTop: "1px solid var(--border-subtle)" }}>
            <span style={{ color: "var(--accent)", fontWeight: 600 }}>{filtered.length}</span> trades ditemukan
          </div>
        </div>
      )}

      {/* ── Tags ── */}
      {section === "tags" && (
        <div>
          <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginBottom: 10 }}>
            Klik tag untuk filter. Win rate per tag dari history.
          </p>
          {filter.tags.length > 0 && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
              {filter.tags.map(tag => (
                <TagBadge key={tag} tag={tag} selected onClick={() => toggleTag(tag)} removable/>
              ))}
            </div>
          )}
          <TagAnalytics tagStats={tagStats} onFilterTag={toggleTag} activeTagFilters={filter.tags}/>
        </div>
      )}

      {/* ── Presets ── */}
      {section === "presets" && (
        <PresetManager presets={presets} onSave={savePreset} onLoad={loadPreset} onDelete={deletePreset}/>
      )}

      {/* ── Bulk ── */}
      {section === "bulk" && (
        <div>
          <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginBottom: 8 }}>
            Pilih trade di tabel lalu tambah tag sekaligus.
          </p>
          {selected.size > 0 ? (
            <BulkTagManager
              selected={selected}
              allTags={options.allTags ?? []}
              onAddTag={tag => bulkAddTag(tag, onBulkTag)}
              onSelectAll={selectAll}
              onClearSelect={clearSelect}/>
          ) : (
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-dim)", textAlign: "center", padding: "16px 0" }}>
              Pilih trade dengan checkbox di tabel
            </div>
          )}
        </div>
      )}
    </div>
  );
}