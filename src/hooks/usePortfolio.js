import { useState, useCallback, useMemo } from "react";

const STORAGE_KEY = "tb_portfolio_positions";

function loadPositions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function savePositions(positions) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(positions)); } catch {}
}

export const EMPTY_POSITION = {
  id:          "",
  pair:        "",
  market:      "Forex",
  side:        "BUY",
  entry:       "",
  currentPrice:"",
  sl:          "",
  tp:          "",
  size:        "",
  openDate:    new Date().toISOString().split("T")[0],
  notes:       "",
};

function calcUnrealizedPnl(pos) {
  const entry   = parseFloat(pos.entry)        || 0;
  const current = parseFloat(pos.currentPrice) || 0;
  const size    = parseFloat(pos.size)         || 0;
  if (!entry || !current || !size) return 0;
  const diff = pos.side === "BUY" ? current - entry : entry - current;
  return diff * size;
}

function calcRiskReward(pos) {
  const entry = parseFloat(pos.entry) || 0;
  const sl    = parseFloat(pos.sl)    || 0;
  const tp    = parseFloat(pos.tp)    || 0;
  if (!entry || !sl || !tp) return null;
  const risk   = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);
  return risk > 0 ? (reward / risk).toFixed(2) : null;
}

function calcSlPct(pos) {
  const entry = parseFloat(pos.entry) || 0;
  const sl    = parseFloat(pos.sl)    || 0;
  if (!entry || !sl) return null;
  return ((Math.abs(entry - sl) / entry) * 100).toFixed(2);
}

export function usePortfolio(trades) {
  const [positions, setPositions] = useState(loadPositions);
  const [form,      setForm]      = useState(EMPTY_POSITION);
  const [showForm,  setShowForm]  = useState(false);
  const [editId,    setEditId]    = useState(null);

  // Posisi open dari trade journal (exit === 0 atau kosong)
  const journalOpenPositions = useMemo(() => {
    return (trades || [])
      .filter(t => !t.exit || parseFloat(t.exit) === 0)
      .map(t => ({
        id:          "journal_" + t.id,
        pair:        t.pair,
        market:      t.market,
        side:        t.side,
        entry:       String(t.entry),
        currentPrice:"",
        sl:          String(t.stopLoss || ""),
        tp:          String(t.takeProfit || ""),
        size:        String(t.size || ""),
        openDate:    t.date,
        notes:       t.notes || "",
        fromJournal: true,
        journalId:   t.id,
      }));
  }, [trades]);

  // Semua posisi — manual + dari journal
  const allPositions = useMemo(() => {
    return [...journalOpenPositions, ...positions];
  }, [journalOpenPositions, positions]);

  // Posisi dengan kalkulasi
  const enrichedPositions = useMemo(() => {
    return allPositions.map(pos => ({
      ...pos,
      unrealizedPnl: calcUnrealizedPnl(pos),
      rr:            calcRiskReward(pos),
      slPct:         calcSlPct(pos),
    }));
  }, [allPositions]);

  // Stats
  const stats = useMemo(() => {
    const totalUnrealized = enrichedPositions.reduce((s, p) => s + p.unrealizedPnl, 0);
    const byMarket = {};
    enrichedPositions.forEach(p => {
      if (!byMarket[p.market]) byMarket[p.market] = { market: p.market, count: 0, pnl: 0 };
      byMarket[p.market].count++;
      byMarket[p.market].pnl += p.unrealizedPnl;
    });
    const longCount  = enrichedPositions.filter(p => p.side === "BUY").length;
    const shortCount = enrichedPositions.filter(p => p.side === "SELL").length;
    return {
      totalPositions:   enrichedPositions.length,
      totalUnrealized,
      longCount,
      shortCount,
      byMarket: Object.values(byMarket),
    };
  }, [enrichedPositions]);

  const openAdd = useCallback(() => {
    setForm({ ...EMPTY_POSITION, id: Date.now().toString() });
    setEditId(null);
    setShowForm(true);
  }, []);

  const openEdit = useCallback((pos) => {
    setForm({ ...pos });
    setEditId(pos.id);
    setShowForm(true);
  }, []);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_POSITION);
  }, []);

  const savePosition = useCallback(() => {
    if (!form.pair.trim() || !form.entry) return;
    setPositions(prev => {
      const updated = editId
        ? prev.map(p => p.id === editId ? { ...form } : p)
        : [...prev, { ...form, id: form.id || Date.now().toString() }];
      savePositions(updated);
      return updated;
    });
    closeForm();
  }, [form, editId, closeForm]);

  const deletePosition = useCallback((id) => {
    if (!window.confirm("Hapus posisi ini?")) return;
    setPositions(prev => {
      const updated = prev.filter(p => p.id !== id);
      savePositions(updated);
      return updated;
    });
  }, []);

  const updatePrice = useCallback((id, price) => {
    setPositions(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, currentPrice: price } : p);
      savePositions(updated);
      return updated;
    });
  }, []);

  const setField = useCallback((key, val) => {
    setForm(p => ({ ...p, [key]: val }));
  }, []);

  return {
    positions: enrichedPositions,
    stats,
    form, setField,
    showForm, editId,
    openAdd, openEdit, closeForm,
    savePosition, deletePosition, updatePrice,
  };
}