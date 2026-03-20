import { useState, useCallback } from "react";

const STORAGE_KEY = "tb_dashboard_layout";

export const WIDGET_SIZES = { small: 1, medium: 2, large: 4 };

export const DEFAULT_WIDGETS = [
  { id: "kpi",       label: "KPI Cards",        icon: "📊", size: "large",  visible: true,  order: 0  },
  { id: "equity",    label: "Equity Curve",      icon: "📈", size: "medium", visible: true,  order: 1  },
  { id: "monthly",   label: "Monthly P&L",       icon: "📅", size: "medium", visible: true,  order: 2  },
  { id: "progress",  label: "Progress Targets",  icon: "🎯", size: "medium", visible: true,  order: 3  },
  { id: "markets",   label: "Market Breakdown",  icon: "🌍", size: "medium", visible: true,  order: 4  },
  { id: "streak",    label: "Streak",            icon: "🔥", size: "small",  visible: true,  order: 5  },
  { id: "gamif",     label: "Trader Profile",    icon: "🏆", size: "medium", visible: true,  order: 6  },
  { id: "recent",    label: "Recent Trades",     icon: "📋", size: "large",  visible: true,  order: 7  },
  { id: "adv_stats", label: "Advanced Stats",    icon: "🔬", size: "large",  visible: false, order: 8  },
  { id: "scanner",   label: "Watchlist",         icon: "📡", size: "medium", visible: false, order: 9  },
  { id: "calendar",  label: "Eco Calendar",      icon: "📰", size: "medium", visible: false, order: 10 },
];

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved) return DEFAULT_WIDGETS;
    // Merge with defaults to pick up any new widgets
    const savedMap = Object.fromEntries(saved.map(w => [w.id, w]));
    return DEFAULT_WIDGETS.map(def => savedMap[def.id]
      ? { ...def, ...savedMap[def.id] }
      : def
    ).sort((a, b) => a.order - b.order);
  } catch { return DEFAULT_WIDGETS; }
}

function save(widgets) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets)); } catch {}
}

export function useDashboardLayout() {
  const [widgets,   setWidgets]   = useState(load);
  const [editMode,  setEditMode]  = useState(false);
  const [dragging,  setDragging]  = useState(null); // id of dragged widget
  const [dragOver,  setDragOver]  = useState(null); // id of hovered widget

  const update = useCallback((updated) => {
    setWidgets(updated);
    save(updated);
  }, []);

  const toggleVisible = useCallback((id) => {
    const updated = widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w);
    update(updated);
  }, [widgets, update]);

  const setSize = useCallback((id, size) => {
    const updated = widgets.map(w => w.id === id ? { ...w, size } : w);
    update(updated);
  }, [widgets, update]);

  const reorder = useCallback((fromId, toId) => {
    if (fromId === toId) return;
    const fromIdx = widgets.findIndex(w => w.id === fromId);
    const toIdx   = widgets.findIndex(w => w.id === toId);
    if (fromIdx === -1 || toIdx === -1) return;

    const updated = [...widgets];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    const reordered = updated.map((w, i) => ({ ...w, order: i }));
    update(reordered);
  }, [widgets, update]);

  const reset = useCallback(() => {
    update([...DEFAULT_WIDGETS]);
  }, [update]);

  const onDragStart = useCallback((id) => { setDragging(id); }, []);
  const onDragOver  = useCallback((id) => { setDragOver(id); }, []);
  const onDrop      = useCallback((toId) => {
    if (dragging && dragging !== toId) reorder(dragging, toId);
    setDragging(null);
    setDragOver(null);
  }, [dragging, reorder]);
  const onDragEnd   = useCallback(() => { setDragging(null); setDragOver(null); }, []);

  const visibleWidgets = widgets.filter(w => w.visible).sort((a, b) => a.order - b.order);

  return {
    widgets, visibleWidgets, editMode, setEditMode,
    dragging, dragOver,
    toggleVisible, setSize, reorder, reset,
    onDragStart, onDragOver, onDrop, onDragEnd,
  };
}