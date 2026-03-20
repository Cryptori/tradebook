import { useState, useMemo, useCallback } from "react";

const STORAGE_KEY = "tb_filter_presets";

function loadPresets() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function savePresets(p) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
}

// TAG_COLORS kept for reference
const TAG_COLORS = {
  "setup":      "#3b82f6",
  "news":       "#f59e0b",
  "breakout":   "#00c896",
  "reversal":   "#8b5cf6",
  "trend":      "#06b6d4",
  "scalp":      "#f97316",
  "swing":      "#10b981",
  "mistake":    "#ef4444",
  "imported":   "#6b7280",
  "best":       "#c9a84c",
};

export function getTagColor(tag) {
  const lower = tag.toLowerCase();
  for (const [key, color] of Object.entries(TAG_COLORS)) {
    if (lower.includes(key)) return color;
  }
  // Generate consistent color from string
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ["#3b82f6","#8b5cf6","#06b6d4","#10b981","#f97316","#ec4899","#00c896","#f59e0b"];
  return colors[Math.abs(hash) % colors.length];
}

export const EMPTY_FILTER = {
  search: "", pair: "", strategy: "", session: "", emotion: "", market: "",
  side: "", result: "", tags: [], dateFrom: "", dateTo: "",
};

export function useAdvancedFilter(trades) {
  const [filter,  setFilter]  = useState(EMPTY_FILTER);
  const [presets, setPresets] = useState(loadPresets);
  const [selected, setSelected] = useState(new Set()); // bulk select

  // All available options from trades
  const options = useMemo(() => {
    const pairs      = [...new Set((trades || []).map(t => t.pair).filter(Boolean))].sort();
    const strategies = [...new Set((trades || []).map(t => t.strategy).filter(Boolean))].sort();
    const sessions   = [...new Set((trades || []).map(t => t.session).filter(Boolean))].sort();
    const emotions   = [...new Set((trades || []).map(t => t.emotion).filter(Boolean))].sort();
    const markets    = [...new Set((trades || []).map(t => t.market).filter(Boolean))].sort();
    const allTags    = [...new Set((trades || []).flatMap(t => t.tags || []))].sort();
    return { pairs, strategies, sessions, emotions, markets, allTags };
  }, [trades]);

  // Tag analytics
  const tagStats = useMemo(() => {
    const map = {};
    (trades || []).forEach(tr => {
      (tr.tags || []).forEach(tag => {
        if (!map[tag]) map[tag] = { trades: 0, wins: 0, pnl: 0 };
        map[tag].trades++;
        if (tr.pnl >= 0) map[tag].wins++;
        map[tag].pnl += tr.pnl || 0;
      });
    });
    return Object.entries(map).map(([tag, s]) => ({
      tag, ...s,
      winRate: s.trades > 0 ? (s.wins / s.trades) * 100 : 0,
      color: getTagColor(tag),
    })).sort((a, b) => b.trades - a.trades);
  }, [trades]);

  // Filtered trades
  const filtered = useMemo(() => {
    return (trades || []).filter(tr => {
      if (filter.search && !`${tr.pair} ${tr.strategy} ${tr.notes} ${(tr.tags||[]).join(" ")}`.toLowerCase().includes(filter.search.toLowerCase())) return false;
      if (filter.pair     && tr.pair     !== filter.pair)     return false;
      if (filter.strategy && tr.strategy !== filter.strategy) return false;
      if (filter.session  && tr.session  !== filter.session)  return false;
      if (filter.emotion  && tr.emotion  !== filter.emotion)  return false;
      if (filter.market   && tr.market   !== filter.market)   return false;
      if (filter.side     && tr.side     !== filter.side)     return false;
      if (filter.result === "win"  && tr.pnl < 0)  return false;
      if (filter.result === "loss" && tr.pnl >= 0) return false;
      if (filter.dateFrom && tr.date < filter.dateFrom) return false;
      if (filter.dateTo   && tr.date > filter.dateTo)   return false;
      if (filter.tags.length > 0 && !filter.tags.every(tag => (tr.tags || []).includes(tag))) return false;
      return true;
    });
  }, [trades, filter]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filter.search)    count++;
    if (filter.pair)      count++;
    if (filter.strategy)  count++;
    if (filter.session)   count++;
    if (filter.emotion)   count++;
    if (filter.market)    count++;
    if (filter.side)      count++;
    if (filter.result)    count++;
    if (filter.dateFrom || filter.dateTo) count++;
    count += filter.tags.length;
    return count;
  }, [filter]);

  const setField = useCallback((key, val) => setFilter(p => ({ ...p, [key]: val })), []);
  const toggleTag = useCallback((tag) => {
    setFilter(p => ({
      ...p,
      tags: p.tags.includes(tag) ? p.tags.filter(t => t !== tag) : [...p.tags, tag],
    }));
  }, []);
  const clearFilter = useCallback(() => setFilter(EMPTY_FILTER), []);

  // Presets
  const savePreset = useCallback((name) => {
    const preset = { id: Date.now().toString(), name, filter };
    const updated = [...presets, preset];
    setPresets(updated);
    savePresets(updated);
  }, [filter, presets]);

  const loadPreset = useCallback((preset) => { setFilter(preset.filter); }, []);
  const deletePreset = useCallback((id) => {
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    savePresets(updated);
  }, [presets]);

  // Bulk select
  const toggleSelect = useCallback((id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelected(new Set(filtered.map(t => t.id)));
  }, [filtered]);

  const clearSelect = useCallback(() => setSelected(new Set()), []);

  const bulkAddTag = useCallback((tag, updateTrade) => {
    filtered.filter(t => selected.has(t.id)).forEach(tr => {
      const tags = [...new Set([...(tr.tags || []), tag])];
      updateTrade(tr.id, { tags });
    });
    clearSelect();
  }, [filtered, selected, clearSelect]);

  const bulkRemoveTag = useCallback((tag, updateTrade) => {
    filtered.filter(t => selected.has(t.id)).forEach(tr => {
      const tags = (tr.tags || []).filter(t => t !== tag);
      updateTrade(tr.id, { tags });
    });
    clearSelect();
  }, [filtered, selected, clearSelect]);

  return {
    filter, setField, toggleTag, clearFilter,
    filtered, options, tagStats, activeFilterCount,
    presets, savePreset, loadPreset, deletePreset,
    selected, toggleSelect, selectAll, clearSelect,
    bulkAddTag, bulkRemoveTag,
  };
}