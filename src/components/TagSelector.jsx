import { useState } from "react";
import { PRESET_TAGS, getTagColor } from "../constants/tags";

const VISIBLE_COUNT = 8;

export default function TagSelector({ tags = [], onChange, theme }) {
  const t = theme;
  const [custom,  setCustom]  = useState("");
  const [showAll, setShowAll] = useState(false);

  function toggleTag(label) {
    onChange(tags.includes(label)
      ? tags.filter(tg => tg !== label)
      : [...tags, label]);
  }

  function addCustom() {
    const val = custom.trim();
    if (!val || tags.includes(val)) return;
    onChange([...tags, val]);
    setCustom("");
  }

  const visible = showAll ? PRESET_TAGS : PRESET_TAGS.slice(0, VISIBLE_COUNT);

  return (
    <div>
      <label style={{ color: t.textDim }}>Tags</label>

      {/* Selected tags */}
      {tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
          {tags.map(tag => {
            const color = getTagColor(tag);
            return (
              <span key={tag} onClick={() => toggleTag(tag)}
                style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 20, fontSize: 11, cursor: "pointer",
                  background: `${color}20`, border: `1px solid ${color}60`, color }}>
                {tag} <span style={{ fontSize: 10, opacity: 0.7 }}>✕</span>
              </span>
            );
          })}
        </div>
      )}

      {/* Preset tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
        {visible.map(tag => {
          const active = tags.includes(tag.label);
          return (
            <span key={tag.label} onClick={() => toggleTag(tag.label)}
              style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, cursor: "pointer", transition: "all 0.15s",
                background: active ? `${tag.color}20` : t.bgSubtle,
                border: `1px solid ${active ? tag.color : t.border}`,
                color: active ? tag.color : t.textDim,
              }}>
              {tag.label}
            </span>
          );
        })}
        {PRESET_TAGS.length > VISIBLE_COUNT && (
          <span onClick={() => setShowAll(s => !s)}
            style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, cursor: "pointer", background: t.bgSubtle, border: `1px solid ${t.border}`, color: t.textDim }}>
            {showAll ? "less ▲" : `+${PRESET_TAGS.length - VISIBLE_COUNT} more`}
          </span>
        )}
      </div>

      {/* Custom tag */}
      <div style={{ display: "flex", gap: 6 }}>
        <input type="text" value={custom}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustom())}
          placeholder="Tag custom..."
          style={{ flex: 1, background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, padding: "7px 10px", fontFamily: "DM Mono, monospace", fontSize: 12, outline: "none" }}
        />
        <button onClick={addCustom}
          style={{ padding: "7px 12px", background: t.bgSubtle, border: `1px solid ${t.border}`, color: t.textMuted, borderRadius: 8, cursor: "pointer", fontSize: 12, fontFamily: "DM Mono, monospace" }}>
          + Add
        </button>
      </div>
    </div>
  );
}