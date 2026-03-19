import { useState, useEffect, useMemo, useCallback } from "react";

const STORAGE_KEY = "tb_gamification";

function load() {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}

function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

// ── XP per action ─────────────────────────────────────────────────
const XP_TABLE = {
  trade_logged:     10,
  trade_win:        15,
  journal_entry:    20,
  streak_3:         50,
  streak_7:        100,
  streak_14:       200,
  streak_30:       500,
  win_streak_3:     75,
  win_streak_5:    150,
  profit_positive:  25,
};

// ── Level thresholds ──────────────────────────────────────────────
const LEVELS = [
  { level: 1,  name: "Rookie",       xp: 0,     icon: "🌱" },
  { level: 2,  name: "Apprentice",   xp: 100,   icon: "📈" },
  { level: 3,  name: "Trader",       xp: 300,   icon: "💹" },
  { level: 4,  name: "Pro Trader",   xp: 600,   icon: "🎯" },
  { level: 5,  name: "Expert",       xp: 1000,  icon: "⚡" },
  { level: 6,  name: "Master",       xp: 1500,  icon: "🔥" },
  { level: 7,  name: "Elite",        xp: 2500,  icon: "💎" },
  { level: 8,  name: "Legend",       xp: 4000,  icon: "👑" },
];

// ── Badges ────────────────────────────────────────────────────────
const BADGES = [
  // Trading milestones
  { id: "first_trade",    icon: "🎯", name: "First Blood",       desc: "Log trade pertama",              check: (s) => s.totalTrades >= 1 },
  { id: "trades_10",      icon: "📊", name: "10 Trades",         desc: "Log 10 trades",                  check: (s) => s.totalTrades >= 10 },
  { id: "trades_50",      icon: "📈", name: "50 Trades",         desc: "Log 50 trades",                  check: (s) => s.totalTrades >= 50 },
  { id: "trades_100",     icon: "💯", name: "Century",           desc: "Log 100 trades",                 check: (s) => s.totalTrades >= 100 },
  // Win rate
  { id: "wr_50",          icon: "✅", name: "Breakeven",         desc: "Win rate 50%+",                  check: (s) => s.totalTrades >= 10 && s.winRate >= 50 },
  { id: "wr_60",          icon: "🎯", name: "Sharp Shooter",     desc: "Win rate 60%+",                  check: (s) => s.totalTrades >= 20 && s.winRate >= 60 },
  { id: "wr_70",          icon: "🏹", name: "Sniper",            desc: "Win rate 70%+",                  check: (s) => s.totalTrades >= 30 && s.winRate >= 70 },
  // Profit factor
  { id: "pf_2",           icon: "💰", name: "Profitable",        desc: "Profit factor 2.0+",             check: (s) => s.profitFactor >= 2 },
  { id: "pf_3",           icon: "💎", name: "Edge Master",       desc: "Profit factor 3.0+",             check: (s) => s.profitFactor >= 3 },
  // Win streaks
  { id: "win_streak_3",   icon: "🔥", name: "On Fire",           desc: "3 win berturut-turut",           check: (s) => s.maxWinStreak >= 3 },
  { id: "win_streak_5",   icon: "⚡", name: "Lightning",         desc: "5 win berturut-turut",           check: (s) => s.maxWinStreak >= 5 },
  { id: "win_streak_10",  icon: "🌪️", name: "Unstoppable",       desc: "10 win berturut-turut",          check: (s) => s.maxWinStreak >= 10 },
  // Journal streaks
  { id: "journal_3",      icon: "📝", name: "Consistent",        desc: "Journal 3 hari berturut-turut",  check: (s) => s.journalStreak >= 3 },
  { id: "journal_7",      icon: "📚", name: "Journaler",         desc: "Journal 7 hari berturut-turut",  check: (s) => s.journalStreak >= 7 },
  { id: "journal_30",     icon: "🏆", name: "Dedicated",         desc: "Journal 30 hari berturut-turut", check: (s) => s.journalStreak >= 30 },
  // Trading streaks
  { id: "trade_streak_5", icon: "📅", name: "Active Trader",     desc: "Trading 5 hari berturut-turut",  check: (s) => s.tradingStreak >= 5 },
  { id: "trade_streak_14",icon: "🗓️", name: "Dedicated Trader",  desc: "Trading 14 hari berturut-turut", check: (s) => s.tradingStreak >= 14 },
  // Special
  { id: "risk_master",    icon: "🛡️", name: "Risk Master",       desc: "Max drawdown < 5%",              check: (s) => s.totalTrades >= 20 && s.maxDrawdownPct < 5 },
  { id: "rr_master",      icon: "⚖️", name: "RR Master",         desc: "Avg R:R 2.0+",                   check: (s) => s.totalTrades >= 20 && s.avgRR >= 2 },
];

// ── Calculate streaks ─────────────────────────────────────────────
function calcJournalStreak(journalEntries) {
  if (!journalEntries || !journalEntries.length) return 0;
  const dates = new Set(journalEntries.map(e => e.date));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (dates.has(key)) { streak++; } else { break; }
  }
  return streak;
}

function calcTradingStreak(trades) {
  if (!trades || trades.length === 0) return 0;
  const dates = new Set(trades.map(tr => tr.date));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (dates.has(key)) { streak++; } else { break; }
  }
  return streak;
}

function calcMaxWinStreak(trades) {
  if (!trades || trades.length === 0) return 0;
  const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  let max = 0, cur = 0;
  sorted.forEach(tr => {
    if (tr.pnl > 0) { cur++; max = Math.max(max, cur); } else { cur = 0; }
  });
  return max;
}

function getLevel(xp) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.xp) current = lvl;
    else break;
  }
  const nextIdx = LEVELS.findIndex(l => l.level === current.level) + 1;
  const next = nextIdx < LEVELS.length ? LEVELS[nextIdx] : null;
  const progress = next ? ((xp - current.xp) / (next.xp - current.xp)) * 100 : 100;
  return { current, next, progress: Math.min(100, Math.max(0, progress)) };
}

function calcXP(stats) {
  let xp = 0;
  xp += (stats.totalTrades    || 0) * XP_TABLE.trade_logged;
  xp += (stats.wins           || 0) * XP_TABLE.trade_win;
  xp += (stats.journalEntries || 0) * XP_TABLE.journal_entry;
  xp += stats.journalStreak  >= 30 ? XP_TABLE.streak_30  : 0;
  xp += stats.journalStreak  >= 14 ? XP_TABLE.streak_14  : 0;
  xp += stats.journalStreak  >=  7 ? XP_TABLE.streak_7   : 0;
  xp += stats.journalStreak  >=  3 ? XP_TABLE.streak_3   : 0;
  xp += stats.maxWinStreak   >=  5 ? XP_TABLE.win_streak_5 : 0;
  xp += stats.maxWinStreak   >=  3 ? XP_TABLE.win_streak_3 : 0;
  if ((stats.totalPnl || 0) > 0) xp += XP_TABLE.profit_positive;
  return xp;
}

export { BADGES, LEVELS, XP_TABLE };

export function useGamification({ trades, stats, journalEntries, settings }) {
  const journalStreak  = useMemo(() => calcJournalStreak(journalEntries || []), [journalEntries]);
  const tradingStreak  = useMemo(() => calcTradingStreak(trades),         [trades]);
  const maxWinStreak   = useMemo(() => calcMaxWinStreak(trades),          [trades]);

  const capital       = settings?.capitalInitial || 10000;
  const maxDrawdownPct = stats?.worstTrade ? (Math.abs(stats.worstTrade) / capital) * 100 : 0;

  const enrichedStats = useMemo(() => ({
    totalTrades:    stats?.totalTrades    || 0,
    wins:           stats?.wins           || 0,
    winRate:        stats?.winRate        || 0,
    profitFactor:   stats?.profitFactor   || 0,
    avgRR:          stats?.avgRR          || 0,
    totalPnl:       stats?.totalPnl       || 0,
    journalEntries: (journalEntries || []).length,
    journalStreak,
    tradingStreak,
    maxWinStreak,
    maxDrawdownPct,
  }), [stats, journalEntries, journalStreak, tradingStreak, maxWinStreak, maxDrawdownPct]);

  const xp      = useMemo(() => calcXP(enrichedStats), [enrichedStats]);
  const level   = useMemo(() => getLevel(xp),          [xp]);

  const earnedBadges = useMemo(() => {
    return BADGES.map(b => ({
      ...b,
      earned: b.check(enrichedStats),
    }));
  }, [enrichedStats]);

  // Monthly progress
  const monthProgress = useMemo(() => {
    const targetT = settings?.targetTradesPerMonth || 20;
    const now     = new Date();
    const mm      = now.toISOString().slice(0, 7);
    const monthTrades = (trades || []).filter(tr => tr.date?.startsWith(mm));
    return {
      trades:    monthTrades.length,
      target:    targetT,
      pct:       Math.min(100, (monthTrades.length / targetT) * 100),
      wins:      monthTrades.filter(tr => tr.pnl > 0).length,
      pnl:       monthTrades.reduce((s, tr) => s + tr.pnl, 0),
    };
  }, [trades, settings]);

  return {
    xp, level,
    journalStreak, tradingStreak, maxWinStreak,
    earnedBadges,
    monthProgress,
    enrichedStats,
  };
}