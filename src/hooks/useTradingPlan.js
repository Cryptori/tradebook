import { useState, useCallback, useMemo } from "react";

const STORAGE_KEY = "tb_trading_plans";

function load() {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function getWeekKey(date) {
  const d   = new Date(date + "T00:00:00");
  const day = d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() - ((day + 6) % 7));
  return mon.toISOString().slice(0, 10);
}

function getCurrentWeekKey() {
  return getWeekKey(new Date().toISOString().slice(0, 10));
}

function getWeekEnd(weekStart) {
  const d = new Date(weekStart + "T00:00:00");
  d.setDate(d.getDate() + 6);
  return d.toISOString().slice(0, 10);
}

export const EMPTY_PLAN = {
  id:            "",
  weekStart:     getCurrentWeekKey(),
  // Targets
  targetProfit:  "",
  targetTrades:  "",
  maxLoss:       "",
  maxLossPerDay: "",
  // Focus
  pairs:         "",
  sessions:      [],
  markets:       [],
  // Rules
  entryRules:    "",
  exitRules:     "",
  riskRules:     "",
  mindset:       "",
  avoid:         "",
  // Review
  reviewed:      false,
  reviewNotes:   "",
  reviewRating:  3,
  // Meta
  createdAt:     "",
};

const SESSIONS = ["Asian", "London", "New York", "London/NY Overlap"];
const MARKETS  = ["Forex", "Crypto", "Saham IDX", "Saham Global", "Gold", "Oil"];

export { SESSIONS, MARKETS as PLAN_MARKETS, getWeekKey, getCurrentWeekKey, getWeekEnd };

export function useTradingPlan(trades, stats, settings, currencyMeta) {
  const [plans,    setPlans]    = useState(load);
  const [showForm, setShowForm] = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [form,     setForm]     = useState(EMPTY_PLAN);
  const [activeWeek, setActiveWeek] = useState(getCurrentWeekKey);

  const sym     = currencyMeta?.symbol ?? "$";
  const capital = settings?.capitalInitial ?? 10000;

  // Current week plan
  const currentPlan = useMemo(() => {
    return plans.find(p => p.weekStart === activeWeek) || null;
  }, [plans, activeWeek]);

  // Trades for active week
  const weekTrades = useMemo(() => {
    const weekEnd = getWeekEnd(activeWeek);
    return (trades || []).filter(tr => tr.date >= activeWeek && tr.date <= weekEnd);
  }, [trades, activeWeek]);

  // Week stats vs plan
  const weekReview = useMemo(() => {
    if (!currentPlan) return null;
    const pnl      = weekTrades.reduce((s, tr) => s + tr.pnl, 0);
    const wins     = weekTrades.filter(tr => tr.pnl > 0).length;
    const winRate  = weekTrades.length > 0 ? (wins / weekTrades.length) * 100 : 0;
    const worstDay = {};
    weekTrades.forEach(tr => {
      worstDay[tr.date] = (worstDay[tr.date] || 0) + tr.pnl;
    });
    const maxDailyLoss = Math.min(0, ...Object.values(worstDay), 0);

    const targetProfit  = parseFloat(currentPlan.targetProfit)  || 0;
    const targetTrades  = parseFloat(currentPlan.targetTrades)  || 0;
    const maxLoss       = parseFloat(currentPlan.maxLoss)       || 0;
    const maxLossPerDay = parseFloat(currentPlan.maxLossPerDay) || 0;

    return {
      pnl, wins, winRate,
      trades:       weekTrades.length,
      maxDailyLoss,
      // vs targets
      profitPct:    targetProfit  > 0 ? Math.min(100, (pnl / targetProfit)           * 100) : null,
      tradesPct:    targetTrades  > 0 ? Math.min(100, (weekTrades.length / targetTrades) * 100) : null,
      lossBreached: maxLoss       > 0 && Math.abs(Math.min(pnl, 0)) > maxLoss,
      dayLossBreached: maxLossPerDay > 0 && Math.abs(maxDailyLoss) > maxLossPerDay,
    };
  }, [currentPlan, weekTrades]);

  // All weeks with plans
  const allWeeks = useMemo(() => {
    const planWeeks = new Set(plans.map(p => p.weekStart));
    const tradeWeeks = new Set((trades || []).map(tr => getWeekKey(tr.date)));
    const allW = new Set([...planWeeks, ...tradeWeeks, getCurrentWeekKey()]);
    return [...allW].sort().reverse().slice(0, 12);
  }, [plans, trades]);

  const openAdd = useCallback((weekStart) => {
    const existing = plans.find(p => p.weekStart === (weekStart || activeWeek));
    if (existing) {
      setForm({ ...existing });
      setEditId(existing.id);
    } else {
      setForm({ ...EMPTY_PLAN, id: Date.now().toString(), weekStart: weekStart || activeWeek, createdAt: new Date().toISOString() });
      setEditId(null);
    }
    setShowForm(true);
  }, [plans, activeWeek]);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_PLAN);
  }, []);

  const savePlan = useCallback(() => {
    setPlans(prev => {
      const updated = editId
        ? prev.map(p => p.id === editId ? { ...form } : p)
        : [...prev.filter(p => p.weekStart !== form.weekStart), { ...form }];
      save(updated);
      return updated;
    });
    closeForm();
  }, [form, editId, closeForm]);

  const deletePlan = useCallback((id) => {
    if (!window.confirm("Hapus plan ini?")) return;
    setPlans(prev => { const u = prev.filter(p => p.id !== id); save(u); return u; });
  }, []);

  const saveReview = useCallback((id, reviewData) => {
    setPlans(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, ...reviewData, reviewed: true } : p);
      save(updated);
      return updated;
    });
  }, []);

  const setField = useCallback((key, val) => {
    setForm(p => ({ ...p, [key]: val }));
  }, []);

  return {
    plans, currentPlan, weekTrades, weekReview, allWeeks,
    activeWeek, setActiveWeek,
    showForm, form, setField, editId,
    openAdd, closeForm, savePlan, deletePlan, saveReview,
    sym, capital,
  };
}