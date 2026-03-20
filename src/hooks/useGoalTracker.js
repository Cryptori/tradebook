import { useState, useMemo, useEffect, useCallback } from "react";

const STORAGE_KEY = "tb_goals";

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}
function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

export const GOAL_PERIODS = ["monthly", "yearly"];

export const DEFAULT_GOALS = {
  monthly: {
    pnl:        { target: 500,  enabled: true },
    winRate:    { target: 60,   enabled: true },
    trades:     { target: 20,   enabled: true },
    maxDrawdown:{ target: 5,    enabled: true },
  },
  yearly: {
    pnl:        { target: 6000, enabled: true },
    winRate:    { target: 60,   enabled: true },
    trades:     { target: 240,  enabled: true },
    maxDrawdown:{ target: 10,   enabled: true },
  },
};

export function useGoalTracker(trades, stats, settings) {
  const [goals,    setGoals]    = useState(() => {
    const saved = load();
    return {
      monthly: { ...DEFAULT_GOALS.monthly, ...saved.monthly },
      yearly:  { ...DEFAULT_GOALS.yearly,  ...saved.yearly  },
      history: saved.history || [],
    };
  });

  const sym     = settings?.currency || "USD";
  const capital = settings?.capitalInitial ?? 10000;

  // Current month/year trades
  const now       = new Date();
  const thisMonth = now.toISOString().slice(0, 7);
  const thisYear  = now.getFullYear().toString();

  const monthTrades = useMemo(() => (trades || []).filter(tr => tr.date?.startsWith(thisMonth)), [trades, thisMonth]);
  const yearTrades  = useMemo(() => (trades || []).filter(tr => tr.date?.startsWith(thisYear)),  [trades, thisYear]);

  function calcStats(trds) {
    if (!trds.length) return { pnl: 0, winRate: 0, trades: 0, maxDrawdown: 0 };
    const wins     = trds.filter(tr => tr.pnl >= 0).length;
    const pnl      = trds.reduce((s, tr) => s + (tr.pnl || 0), 0);
    const winRate  = (wins / trds.length) * 100;

    // Max drawdown
    let peak = 0, maxDD = 0, equity = 0;
    [...trds].sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(tr => {
      equity += tr.pnl || 0;
      if (equity > peak) peak = equity;
      const dd = peak > 0 ? ((peak - equity) / capital) * 100 : 0;
      if (dd > maxDD) maxDD = dd;
    });

    return { pnl, winRate, trades: trds.length, maxDrawdown: maxDD };
  }

  const monthStats = useMemo(() => calcStats(monthTrades), [monthTrades]);
  const yearStats  = useMemo(() => calcStats(yearTrades),  [yearTrades]);

  // Evaluate goals
  function evalGoals(period, trStats) {
    const periodGoals = goals[period] || {};
    return [
      {
        id: "pnl", label: "Target P&L",
        target: periodGoals.pnl?.target || 0,
        current: trStats.pnl,
        enabled: periodGoals.pnl?.enabled ?? true,
        pct: periodGoals.pnl?.target > 0 ? Math.min(100, (trStats.pnl / periodGoals.pnl.target) * 100) : 0,
        format: v => `$${v.toFixed(0)}`,
        color: trStats.pnl >= (periodGoals.pnl?.target || 0) ? "#00c896" : "#0ea5e9",
        achieved: trStats.pnl >= (periodGoals.pnl?.target || 0),
      },
      {
        id: "winRate", label: "Win Rate",
        target: periodGoals.winRate?.target || 60,
        current: trStats.winRate,
        enabled: periodGoals.winRate?.enabled ?? true,
        pct: Math.min(100, (trStats.winRate / (periodGoals.winRate?.target || 60)) * 100),
        format: v => `${v.toFixed(1)}%`,
        color: trStats.winRate >= (periodGoals.winRate?.target || 60) ? "#00c896" : "#f59e0b",
        achieved: trStats.winRate >= (periodGoals.winRate?.target || 60),
      },
      {
        id: "trades", label: "Jumlah Trade",
        target: periodGoals.trades?.target || 20,
        current: trStats.trades,
        enabled: periodGoals.trades?.enabled ?? true,
        pct: Math.min(100, (trStats.trades / (periodGoals.trades?.target || 20)) * 100),
        format: v => `${Math.round(v)}x`,
        color: trStats.trades >= (periodGoals.trades?.target || 20) ? "#00c896" : "#8b5cf6",
        achieved: trStats.trades >= (periodGoals.trades?.target || 20),
      },
      {
        id: "maxDrawdown", label: "Max Drawdown",
        target: periodGoals.maxDrawdown?.target || 5,
        current: trStats.maxDrawdown,
        enabled: periodGoals.maxDrawdown?.enabled ?? true,
        pct: Math.min(100, (trStats.maxDrawdown / (periodGoals.maxDrawdown?.target || 5)) * 100),
        format: v => `${v.toFixed(1)}%`,
        color: trStats.maxDrawdown <= (periodGoals.maxDrawdown?.target || 5) ? "#00c896" : "#ef4444",
        achieved: trStats.maxDrawdown <= (periodGoals.maxDrawdown?.target || 5),
        inverted: true, // Lower is better
      },
    ].filter(g => g.enabled);
  }

  const monthGoals = useMemo(() => evalGoals("monthly", monthStats), [goals, monthStats]);
  const yearGoals  = useMemo(() => evalGoals("yearly",  yearStats),  [goals, yearStats]);

  // Check for newly achieved goals + notify
  useEffect(() => {
    const allGoals = [
      ...monthGoals.filter(g => g.achieved).map(g => ({ ...g, period: "monthly", month: thisMonth })),
      ...yearGoals.filter(g => g.achieved).map(g => ({ ...g, period: "yearly",   year:  thisYear  })),
    ];

    allGoals.forEach(g => {
      const key = `${g.period}_${g.id}_${g.period === "monthly" ? thisMonth : thisYear}`;
      const alreadyRecorded = goals.history?.some(h => h.key === key);
      if (!alreadyRecorded) {
        const entry = { key, id: g.id, label: g.label, period: g.period, achievedAt: new Date().toISOString(), value: g.current };
        setGoals(prev => {
          const updated = { ...prev, history: [...(prev.history || []).slice(-19), entry] };
          save(updated);
          return updated;
        });
        // Notify
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("🎯 Goal Tercapai!", { body: `${g.period === "monthly" ? "Bulanan" : "Tahunan"}: ${g.label} — ${g.format(g.current)}` });
        }
      }
    });
  }, [monthGoals, yearGoals]);

  const setGoalTarget = useCallback((period, id, value) => {
    setGoals(prev => {
      const updated = { ...prev, [period]: { ...prev[period], [id]: { ...prev[period][id], target: parseFloat(value) || 0 } } };
      save(updated);
      return updated;
    });
  }, []);

  const toggleGoal = useCallback((period, id) => {
    setGoals(prev => {
      const updated = { ...prev, [period]: { ...prev[period], [id]: { ...prev[period][id], enabled: !prev[period][id]?.enabled } } };
      save(updated);
      return updated;
    });
  }, []);

  return {
    goals, monthGoals, yearGoals,
    monthStats, yearStats,
    thisMonth, thisYear,
    setGoalTarget, toggleGoal,
  };
}