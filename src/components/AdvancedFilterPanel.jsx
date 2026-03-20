import { useState } from "react";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { getTagColor } from "../constants/tags";

// ── Color-coded tag badge ─────────────────────────────────────────
export function TagBadge({ tag, onClick, selected, removable, theme: t }) {
  const color = getTagColor(tag);
  return (
    <button onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "2px 9px", borderRadius: 20,
        border: `1px solid ${selected ? color : color + "40"}`,
        background: selected ? color + "18" : "transparent",
        color: selected ? color : t.textDim,
        fontSize: 10, cursor: "pointer", transition: "all 0.15s",
        fontFamily: "DM Mono, monospace",
      }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }} />
      {tag}
      {removable && <span style={{ fontSize: 9, marginLeft: 2 }}>✕</span>}
    </button>
  );
}

// ── Tag Analytics ─────────────────────────────────────────────────
function TagAnalytics({ tagStats, onFilterTag, activeTagFilters, theme: t }) {
  if (!tagStats || tagStats.length === 0) return (
    <div style={{ fontSize: 12, color: t.textDim, textAlign: "center", padding: "16px 0" }}>
      Belum ada tag di trade kamu
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {tagStats.slice(0, 10).map(s => (
        <div key={s.tag} onClick={() => onFilterTag(s.tag)}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, cursor: "pointer", background: activeTagFilters.includes(s.tag) ? s.color + "12" : "transparent", border: `1px solid ${activeTagFilters.includes(s.tag) ? s.color + "40" : "transparent"}`, transition: "all 0.15s" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 11, color: t.text }}>{s.tag}</div>
          <div style={{ flex: 2, height: 4, background: t.bgSubtle, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${s.winRate}%`, background: s.color, borderRadius: 2 }} />
          </div>
          <div style={{ width: 36, fontSize: 11, color: s.winRate >= 50 ? "#00c896" : "#f59e0b", textAlign: "right", fontFamily: "DM Mono, monospace" }}>{s.winRate.toFixed(0)}%</div>
          <div style={{ width: 24, fontSize: 10, color: t.textDim, textAlign: "right" }}>{s.trades}x</div>
        </div>
      ))}
    </div>
  );
}

// ── Filter Presets ────────────────────────────────────────────────
function PresetManager({ presets, onSave, onLoad, onDelete, theme: t }) {
  const [name, setName] = useState("");
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nama preset..."
          style={{ flex: 1, background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 7, padding: "6px 10px", fontSize: 11 }} />
        <button onClick={() => { if (name.trim()) { onSave(name.trim()); setName(""); } }} className="btn-primary" style={{ fontSize: 11, padding: "6px 12px" }}>Simpan</button>
      </div>
      {presets.length === 0 ? (
        <div style={{ fontSize: 11, color: t.textDim }}>Belum ada preset tersimpan</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {presets.map(p => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: t.bgSubtle, borderRadius: 7 }}>
              <span style={{ flex: 1, fontSize: 11, color: t.text }}>{p.name}</span>
              <button onClick={() => onLoad(p)} className="btn-ghost" style={{ fontSize: 10, padding: "3px 8px" }}>Load</button>
              <button onClick={() => onDelete(p.id)} style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 12 }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Bulk Tag Manager ──────────────────────────────────────────────
function BulkTagManager({ selected, allTags, onAddTag, onRemoveTag, onSelectAll, onClearSelect, theme: t }) {
  const [tagInput, setTagInput] = useState("");
  return (
    <div style={{ background: "rgba(0,200,150,0.06)", border: "1px solid rgba(0,200,150,0.2)", borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: "#00c896", fontWeight: 500 }}>{selected.size} trade dipilih</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={onSelectAll} className="btn-ghost" style={{ fontSize: 10, padding: "3px 8px" }}>Pilih Semua</button>
          <button onClick={onClearSelect} className="btn-ghost" style={{ fontSize: 10, padding: "3px 8px" }}>Clear</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <input value={tagInput} onChange={e => setTagInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && tagInput.trim()) { onAddTag(tagInput.trim()); setTagInput(""); } }}
          placeholder="Tag baru... (Enter)"
          style={{ flex: 1, background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 7, padding: "6px 10px", fontSize: 11 }} />
        <button onClick={() => { if (tagInput.trim()) { onAddTag(tagInput.trim()); setTagInput(""); } }} className="btn-primary" style={{ fontSize: 11, padding: "6px 12px" }}>+ Tag</button>
      </div>
      {allTags.slice(0, 8).length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
          {allTags.slice(0, 8).map(tag => (
            <button key={tag} onClick={() => onAddTag(tag)}
              style={{ fontSize: 9, padding: "2px 8px", borderRadius: 20, border: `1px solid ${getTagColor(tag)}40`, color: getTagColor(tag), background: getTagColor(tag) + "10", cursor: "pointer" }}>
              + {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────
export default function AdvancedFilterPanel({
  filterHook, onBulkTag, theme: t,
}) {
  const { isMobile } = useBreakpoint();
  const {
    filter, setField, toggleTag, clearFilter,
    filtered, options, tagStats, activeFilterCount,
    presets, savePreset, loadPreset, deletePreset,
    selected, selectAll, clearSelect,
    bulkAddTag, bulkRemoveTag,
  } = filterHook;

  const [activeSection, setActiveSection] = useState("filters");

  const selInput = (key, opts, label) => (
    <div>
      <label style={{ color: t.textDim }}>{label}</label>
      <select value={filter[key]} onChange={e => setField(key, e.target.value)}
        style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 7, fontSize: 11, padding: "6px 8px" }}>
        <option value="">Semua</option>
        {opts.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: "16px", height: "fit-content" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: t.text, display: "flex", alignItems: "center", gap: 6 }}>
          🔍 Filter
          {activeFilterCount > 0 && (
            <span style={{ fontSize: 9, background: "#00c896", color: "#090e1a", borderRadius: 20, padding: "1px 6px", fontWeight: 700 }}>{activeFilterCount}</span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button onClick={clearFilter} style={{ background: "none", border: "none", fontSize: 10, color: t.textDim, cursor: "pointer" }}>✕ Reset</button>
        )}
      </div>

      {/* Section tabs */}
      <div style={{ display: "flex", gap: 3, background: t.bgSubtle, borderRadius: 7, padding: 2, marginBottom: 14 }}>
        {[{ v: "filters", l: "Filter" }, { v: "tags", l: "Tags" }, { v: "presets", l: "Preset" }, { v: "bulk", l: "Bulk" }].map(s => (
          <button key={s.v} onClick={() => setActiveSection(s.v)}
            style={{ flex: 1, padding: "4px 0", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 10, background: activeSection === s.v ? t.accent : "transparent", color: activeSection === s.v ? "#090e1a" : t.textDim, fontWeight: activeSection === s.v ? 600 : 400 }}>
            {s.l}
          </button>
        ))}
      </div>

      {/* Filter section */}
      {activeSection === "filters" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div>
            <label style={{ color: t.textDim }}>Search</label>
            <input value={filter.search} onChange={e => setField("search", e.target.value)} placeholder="Pair, strategy, notes..."
              style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 7, fontSize: 11, padding: "6px 8px" }} />
          </div>
          {selInput("pair",     options.pairs,      "Pair")}
          {selInput("strategy", options.strategies, "Strategy")}
          {selInput("session",  options.sessions,   "Session")}
          {selInput("emotion",  options.emotions,   "Emotion")}
          {selInput("market",   options.markets,    "Market")}
          <div>
            <label style={{ color: t.textDim }}>Side</label>
            <div style={{ display: "flex", gap: 4 }}>
              {["", "BUY", "SELL"].map(s => (
                <button key={s} onClick={() => setField("side", s)}
                  style={{ flex: 1, padding: "5px 0", borderRadius: 6, border: `1px solid ${filter.side === s ? "#00c896" : t.border}`, background: filter.side === s ? "rgba(0,200,150,0.08)" : "transparent", color: filter.side === s ? "#00c896" : t.textDim, fontSize: 10, cursor: "pointer" }}>
                  {s || "All"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ color: t.textDim }}>Result</label>
            <div style={{ display: "flex", gap: 4 }}>
              {[{ v: "", l: "All" }, { v: "win", l: "Win" }, { v: "loss", l: "Loss" }].map(s => (
                <button key={s.v} onClick={() => setField("result", s.v)}
                  style={{ flex: 1, padding: "5px 0", borderRadius: 6, border: `1px solid ${filter.result === s.v ? "#00c896" : t.border}`, background: filter.result === s.v ? "rgba(0,200,150,0.08)" : "transparent", color: filter.result === s.v ? "#00c896" : t.textDim, fontSize: 10, cursor: "pointer" }}>
                  {s.l}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <div>
              <label style={{ color: t.textDim }}>Dari</label>
              <input type="date" value={filter.dateFrom} onChange={e => setField("dateFrom", e.target.value)}
                style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 7, fontSize: 11, padding: "5px 8px" }} />
            </div>
            <div>
              <label style={{ color: t.textDim }}>Sampai</label>
              <input type="date" value={filter.dateTo} onChange={e => setField("dateTo", e.target.value)}
                style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 7, fontSize: 11, padding: "5px 8px" }} />
            </div>
          </div>
          <div style={{ fontSize: 10, color: t.textDim, marginTop: 4, textAlign: "center" }}>
            {filtered.length} / {filterHook.filtered.length > 0 ? filterHook.filtered.length : "—"} trades
          </div>
        </div>
      )}

      {/* Tags section */}
      {activeSection === "tags" && (
        <div>
          <div style={{ fontSize: 10, color: t.textDim, marginBottom: 10 }}>Klik tag untuk filter. Win rate per tag dari history kamu.</div>
          {filter.tags.length > 0 && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
              {filter.tags.map(tag => (
                <TagBadge key={tag} tag={tag} selected theme={t} onClick={() => toggleTag(tag)} removable />
              ))}
            </div>
          )}
          <TagAnalytics tagStats={tagStats} onFilterTag={toggleTag} activeTagFilters={filter.tags} theme={t} />
        </div>
      )}

      {/* Presets section */}
      {activeSection === "presets" && (
        <PresetManager presets={presets} onSave={savePreset} onLoad={loadPreset} onDelete={deletePreset} theme={t} />
      )}

      {/* Bulk tag section */}
      {activeSection === "bulk" && (
        <div>
          <div style={{ fontSize: 11, color: t.textDim, marginBottom: 10 }}>
            Pilih trade di tabel (klik checkbox) lalu tambah tag sekaligus.
          </div>
          {selected.size > 0 ? (
            <BulkTagManager
              selected={selected}
              allTags={options.allTags}
              onAddTag={tag => bulkAddTag(tag, onBulkTag)}
              onRemoveTag={tag => bulkRemoveTag(tag, onBulkTag)}
              onSelectAll={selectAll}
              onClearSelect={clearSelect}
              theme={t}
            />
          ) : (
            <div style={{ fontSize: 12, color: t.textDim, textAlign: "center", padding: "16px 0" }}>
              Pilih trade dengan checkbox di tabel Journal
            </div>
          )}
        </div>
      )}
    </div>
  );
}