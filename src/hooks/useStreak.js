import { useState, useEffect, useMemo, useCallback } from "react";

const STORAGE_KEY = "tb_streak";

function loadState() {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}

function saveState(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function getToday() { return new Date().toISOString().slice(0, 10); }

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

function getLast365Days() {
  const days = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export function useStreak({ trades, journalEntries, settings }) {
  const [state, setState] = useState(loadState);
  const today = getToday();

  // Active trading days (has at least 1 trade)
  const tradingDays = useMemo(() => {
    return new Set((trades || []).map(t => t.date));
  }, [trades]);

  // Active journal days
  const journalDays = useMemo(() => {
    return new Set((journalEntries || []).map(e => e.date));
  }, [journalEntries]);

  // Combined active days (trading OR journal)
  const activeDays = useMemo(() => {
    const combined = new Set([...tradingDays, ...journalDays]);
    return combined;
  }, [tradingDays, journalDays]);

  // Calculate current streak (with optional freeze)
  const streakData = useMemo(() => {
    const freezesUsed = state.freezesUsed || 0;
    const maxFreezes  = settings?.streakFreezes ?? 1;

    let streak = 0;
    let d = new Date(today);
    let freezesLeft = maxFreezes - freezesUsed;
    let usedFreezeToday = false;

    // Count back from today
    for (let i = 0; i < 365; i++) {
      const dateStr = d.toISOString().slice(0, 10);
      if (activeDays.has(dateStr)) {
        streak++;
      } else if (i > 0 && freezesLeft > 0) {
        // Can use freeze for this missed day
        freezesLeft--;
        streak++;
        if (i === 1) usedFreezeToday = true;
      } else {
        break;
      }
      d.setDate(d.getDate() - 1);
    }

    // Best streak ever
    let bestStreak = state.bestStreak || 0;
    if (streak > bestStreak) {
      bestStreak = streak;
    }

    // Weekly goal
    const weeklyGoal = settings?.weeklyStreakGoal ?? 5;
    const thisWeekStart = (() => {
      const now = new Date(today);
      const day = now.getDay();
      now.setDate(now.getDate() - ((day + 6) % 7));
      return now.toISOString().slice(0, 10);
    })();
    const thisWeekEnd = (() => {
      const d2 = new Date(thisWeekStart);
      d2.setDate(d2.getDate() + 6);
      return d2.toISOString().slice(0, 10);
    })();
    const weeklyActiveDays = [...activeDays].filter(d3 => d3 >= thisWeekStart && d3 <= thisWeekEnd).length;

    // Is streak at risk? (today not active yet and it's after noon)
    const hour = new Date().getHours();
    const todayActive = activeDays.has(today);
    const streakAtRisk = !todayActive && hour >= 12 && streak > 0;

    return {
      currentStreak: streak,
      bestStreak,
      todayActive,
      streakAtRisk,
      freezesLeft,
      maxFreezes,
      weeklyActiveDays,
      weeklyGoal,
      weeklyProgress: Math.min(100, (weeklyActiveDays / weeklyGoal) * 100),
    };
  }, [activeDays, today, state, settings]);

  // Calendar data — last 52 weeks
  const calendarData = useMemo(() => {
    const days = getLast365Days();
    return days.map(date => ({
      date,
      hasTrading: tradingDays.has(date),
      hasJournal: journalDays.has(date),
      isActive:   activeDays.has(date),
      isToday:    date === today,
      isFuture:   date > today,
    }));
  }, [tradingDays, journalDays, activeDays, today]);

  // Monthly breakdown — last 12 months
  const monthlyData = useMemo(() => {
    const months = {};
    calendarData.forEach(d => {
      const m = d.date.slice(0, 7);
      if (!months[m]) months[m] = { month: m, active: 0, total: 0, trading: 0, journal: 0 };
      months[m].total++;
      if (d.isActive)   months[m].active++;
      if (d.hasTrading) months[m].trading++;
      if (d.hasJournal) months[m].journal++;
    });
    return Object.values(months).sort().slice(-12);
  }, [calendarData]);

  // Personal records
  const records = useMemo(() => {
    // Find longest streak historically
    let maxStreak = 0, cur = 0;
    const sorted = [...activeDays].sort();
    let prev = null;
    sorted.forEach(date => {
      if (prev && daysBetween(prev, date) === 1) {
        cur++;
      } else {
        cur = 1;
      }
      if (cur > maxStreak) maxStreak = cur;
      prev = date;
    });

    return {
      longestStreak:    maxStreak,
      totalActiveDays:  activeDays.size,
      totalTradingDays: tradingDays.size,
      totalJournalDays: journalDays.size,
      mostActiveMonth:  monthlyData.length > 0
        ? monthlyData.reduce((best, m) => m.active > best.active ? m : best, monthlyData[0])
        : null,
    };
  }, [activeDays, tradingDays, journalDays, monthlyData]);

  // Use a freeze
  const useFreeze = useCallback(() => {
    if (streakData.freezesLeft <= 0) return;
    setState(prev => {
      const updated = { ...prev, freezesUsed: (prev.freezesUsed || 0) + 1 };
      saveState(updated);
      return updated;
    });
  }, [streakData.freezesLeft]);

  // Save best streak
  useEffect(() => {
    if (streakData.currentStreak > (state.bestStreak || 0)) {
      setState(prev => {
        const updated = { ...prev, bestStreak: streakData.currentStreak };
        saveState(updated);
        return updated;
      });
    }
  }, [streakData.currentStreak, state.bestStreak]);

  return {
    streakData,
    calendarData,
    monthlyData,
    records,
    useFreeze,
    activeDays,
  };
}