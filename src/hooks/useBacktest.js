import { useState, useCallback, useMemo } from "react";

const STORAGE_KEY = "tb_backtests";

function load() {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

export const EMPTY_SESSION = {
  id:          "",
  name:        "",
  strategy:    "",
  market:      "Forex",
  pair:        "",
  timeframe:   "H1",
  dateFrom:    "",
  dateTo:      "",
  totalTrades: "",
  wins:        "",
  losses:      "",
  totalPnl:    "",
  grossWin:    "",
  grossLoss:   "",
  avgRR:       "",
  maxDrawdown: "",
  notes:       "",
  conclusion:  "",
  verdict:     "Promising", // "Promising" | "Needs Work" | "Rejected"
  trades:      [], // array of individual backtest trades
  createdAt:   "",
};

export const TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1"];
export const VERDICTS   = [
  { value: "Promising",  color: "#00d4aa", icon: "✅" },
  { value: "Needs Work", color: "#f59e0b", icon: "⚠️" },
  { value: "Rejected",   color: "#ef4444", icon: "❌" },
];

function calcSessionStats(session) {
  const wins    = parseFloat(session.wins)        || 0;
  const losses  = parseFloat(session.losses)      || 0;
  const total   = wins + losses;
  const pnl     = parseFloat(session.totalPnl)    || 0;
  const gw      = parseFloat(session.grossWin)    || 0;
  const gl      = parseFloat(session.grossLoss)   || 0;
  const avgRR   = parseFloat(session.avgRR)       || 0;
  const maxDD   = parseFloat(session.maxDrawdown) || 0;

  return {
    totalTrades:  total || parseFloat(session.totalTrades) || 0,
    wins, losses,
    winRate:      total > 0 ? (wins / total) * 100 : 0,
    totalPnl:     pnl,
    profitFactor: gl > 0 ? gw / gl : gw > 0 ? 999 : 0,
    avgRR, maxDD,
  };
}

export function useBacktest(trades, playbookSetups) {
  const [sessions,  setSessions]  = useState(load);
  const [showForm,  setShowForm]  = useState(false);
  const [showTrade, setShowTrade] = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [form,      setForm]      = useState(EMPTY_SESSION);
  const [selected,  setSelected]  = useState(null);

  // Enrich sessions with computed stats
  const enriched = useMemo(() => {
    return sessions.map(s => ({
      ...s,
      stats: calcSessionStats(s),
    }));
  }, [sessions]);

  // Compare backtest vs live per strategy
  const comparison = useMemo(() => {
    const strategies = {};

    // Live stats from trades
    (trades || []).forEach(tr => {
      const s = tr.strategy || "Unknown";
      if (!strategies[s]) strategies[s] = { strategy: s, live: null, backtest: null };
      if (!strategies[s].live) strategies[s].live = { trades: 0, wins: 0, pnl: 0, rrs: [] };
      strategies[s].live.trades++;
      strategies[s].live.pnl += tr.pnl || 0;
      if (tr.pnl > 0) strategies[s].live.wins++;
      if (tr.rr) strategies[s].live.rrs.push(tr.rr);
    });

    // Backtest stats
    sessions.forEach(s => {
      const strat = s.strategy || "Unknown";
      if (!strategies[strat]) strategies[strat] = { strategy: strat, live: null, backtest: null };
      const stats = calcSessionStats(s);
      if (!strategies[strat].backtest) {
        strategies[strat].backtest = { trades: 0, wins: 0, pnl: 0, winRate: 0, profitFactor: 0, avgRR: 0 };
      }
      const b = strategies[strat].backtest;
      b.trades      += stats.totalTrades;
      b.wins        += stats.wins;
      b.pnl         += stats.totalPnl;
      b.winRate      = b.trades > 0 ? (b.wins / b.trades) * 100 : 0;
      b.profitFactor = Math.max(b.profitFactor, stats.profitFactor);
      b.avgRR        = Math.max(b.avgRR, stats.avgRR);
    });

    // Compute live winRate and avgRR
    Object.values(strategies).forEach(s => {
      if (s.live) {
        s.live.winRate = s.live.trades > 0 ? (s.live.wins / s.live.trades) * 100 : 0;
        s.live.avgRR   = s.live.rrs.length > 0 ? s.live.rrs.reduce((a, b) => a + b, 0) / s.live.rrs.length : 0;
      }
    });

    return Object.values(strategies).filter(s => s.live || s.backtest);
  }, [trades, sessions]);

  const openAdd = useCallback((prefill) => {
    setForm({ ...EMPTY_SESSION, id: Date.now().toString(), createdAt: new Date().toISOString(), ...prefill });
    setEditId(null);
    setShowForm(true);
  }, []);

  const openEdit = useCallback((session) => {
    setForm({ ...session });
    setEditId(session.id);
    setShowForm(true);
  }, []);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_SESSION);
  }, []);

  const saveSession = useCallback(() => {
    if (!form.name.trim()) return;
    setSessions(prev => {
      const updated = editId
        ? prev.map(s => s.id === editId ? { ...form } : s)
        : [...prev, { ...form }];
      save(updated);
      return updated;
    });
    closeForm();
  }, [form, editId, closeForm]);

  const deleteSession = useCallback((id) => {
    if (!window.confirm("Hapus backtest session ini?")) return;
    setSessions(prev => { const u = prev.filter(s => s.id !== id); save(u); return u; });
    if (selected?.id === id) setSelected(null);
  }, [selected]);

  const setField = useCallback((key, val) => {
    setForm(p => ({ ...p, [key]: val }));
  }, []);

  const selectedEnriched = useMemo(() => {
    if (!selected) return null;
    return enriched.find(s => s.id === selected.id) || null;
  }, [selected, enriched]);

  return {
    sessions: enriched,
    comparison,
    showForm, form, setField, editId,
    selected, setSelected, selectedEnriched,
    openAdd, openEdit, closeForm, saveSession, deleteSession,
    playbookSetups,
  };
}