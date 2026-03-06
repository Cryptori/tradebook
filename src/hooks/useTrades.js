import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { EMPTY_FORM } from "../constants";

export function useTrades(capital = 10000, accountId = "default") {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMarket, setFilterMarket] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [editingTrade, setEditingTrade] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // Load trades — runs on mount and when accountId/auth changes
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        if (!cancelled) { setTrades([]); setLoading(false); }
        return;
      }

      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("account_id", accountId)
        .order("date", { ascending: false });

      if (!cancelled) {
        if (!error && data) setTrades(data);
        setLoading(false);
      }
    }

    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      if (!cancelled) load();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [accountId]);

  // ── Derived data ────────────────────────────────────────────
  const filteredTrades = useMemo(() => {
    let result = [...trades].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (filterMarket !== "All") result = result.filter(t => t.market === filterMarket);
    if (dateFrom) result = result.filter(t => t.date >= dateFrom);
    if (dateTo) result = result.filter(t => t.date <= dateTo);
    return result;
  }, [trades, filterMarket, dateFrom, dateTo]);

  const stats = useMemo(() => {
    if (!trades.length) return {
      totalPnl: 0, winRate: 0, wins: 0, losses: 0,
      avgWin: 0, avgLoss: 0, profitFactor: 0, avgRR: 0,
      totalTrades: 0, bestTrade: 0, worstTrade: 0,
      currentStreak: 0, streakType: "win",
      monthTrades: 0, monthPnl: 0, monthWins: 0,
    };
    const wins   = trades.filter(t => t.pnl > 0);
    const losses = trades.filter(t => t.pnl < 0);
    const totalWin  = wins.reduce((s, t) => s + t.pnl, 0);
    const totalLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
    // Current streak — based on most recent trades sorted by date
    const sorted = [...trades].sort((a, b) => new Date(b.date) - new Date(a.date));
    let currentStreak = 0;
    let streakType = sorted[0]?.pnl > 0 ? "win" : "loss";
    for (const t of sorted) {
      const type = t.pnl > 0 ? "win" : "loss";
      if (type !== streakType) break;
      currentStreak++;
    }

    // This month trades
    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthTrades = trades.filter(t => t.date.startsWith(thisMonth));

    return {
      totalPnl:      trades.reduce((s, t) => s + t.pnl, 0),
      winRate:       (wins.length / trades.length) * 100,
      wins:          wins.length,
      losses:        losses.length,
      avgWin:        wins.length   ? totalWin  / wins.length   : 0,
      avgLoss:       losses.length ? totalLoss / losses.length : 0,
      profitFactor:  totalLoss ? totalWin / totalLoss : totalWin > 0 ? 999 : 0,
      avgRR:         trades.reduce((s, t) => s + (t.rr || 0), 0) / trades.length,
      totalTrades:   trades.length,
      bestTrade:     Math.max(...trades.map(t => t.pnl)),
      worstTrade:    Math.min(...trades.map(t => t.pnl)),
      currentStreak,
      streakType,
      monthTrades:   monthTrades.length,
      monthPnl:      monthTrades.reduce((s, t) => s + t.pnl, 0),
      monthWins:     monthTrades.filter(t => t.pnl > 0).length,
    };
  }, [trades]);

  const equityCurve = useMemo(() => {
    const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
    return sorted.reduce(
      (acc, t) => {
        const prev = acc[acc.length - 1].equity;
        return [...acc, { date: t.date.slice(5), equity: +(prev + t.pnl).toFixed(2), pnl: t.pnl }];
      },
      [{ date: "Start", equity: capital, pnl: 0 }]
    );
  }, [trades, capital]);

  const marketBreakdown = useMemo(() => {
    const map = {};
    trades.forEach(t => {
      if (!map[t.market]) map[t.market] = { market: t.market, count: 0, pnl: 0 };
      map[t.market].count++;
      map[t.market].pnl += t.pnl;
    });
    return Object.values(map);
  }, [trades]);

  const strategyStats = useMemo(() => {
    const map = {};
    trades.forEach(t => {
      if (!map[t.strategy]) map[t.strategy] = { strategy: t.strategy, count: 0, pnl: 0, wins: 0 };
      map[t.strategy].count++;
      map[t.strategy].pnl += t.pnl;
      if (t.pnl > 0) map[t.strategy].wins++;
    });
    return Object.values(map).sort((a, b) => b.pnl - a.pnl);
  }, [trades]);

  const monthlyPnl = useMemo(() => {
    const map = {};
    trades.forEach(t => {
      const m = t.date.slice(0, 7);
      if (!map[m]) map[m] = { month: m, pnl: 0 };
      map[m].pnl += t.pnl;
    });
    return Object.values(map)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(m => ({ ...m, month: m.month.replace("-", "/") }));
  }, [trades]);

  const emotionStats = useMemo(() => {
    const map = {};
    trades.forEach(t => {
      if (!map[t.emotion]) map[t.emotion] = { emotion: t.emotion, count: 0, pnl: 0 };
      map[t.emotion].count++;
      map[t.emotion].pnl += t.pnl;
    });
    return Object.values(map);
  }, [trades]);

  // ── Form actions ─────────────────────────────────────────────
  const openAddForm = useCallback(() => {
    setForm(EMPTY_FORM);
    setEditingTrade(null);
    setShowAddForm(true);
  }, []);

  const openEditForm = useCallback((trade) => {
    setForm({
      ...trade,
      pnl:         String(trade.pnl),
      entry:       String(trade.entry),
      exit:        String(trade.exit),
      size:        String(trade.size),
      rr:          String(trade.rr),
      stopLoss:    String(trade.stopLoss    ?? ""),
      takeProfit:  String(trade.takeProfit  ?? ""),
      screenshotUrl: trade.screenshotUrl    ?? "",
      screenshots:   Array.isArray(trade.screenshots) ? trade.screenshots : (trade.screenshotUrl ? [trade.screenshotUrl] : []),
      tags:        trade.tags               ?? [],
    });
    setEditingTrade(trade);
    setShowAddForm(true);
  }, []);

  const closeForm = useCallback(() => {
    setShowAddForm(false);
    setEditingTrade(null);
    setForm(EMPTY_FORM);
  }, []);

  // ── CRUD ─────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const trade = {
      ...form,
      id:           editingTrade ? editingTrade.id : Date.now(),
      account_id:   accountId,
      pnl:          parseFloat(form.pnl)         || 0,
      entry:        parseFloat(form.entry)        || 0,
      exit:         parseFloat(form.exit)         || 0,
      stopLoss:     parseFloat(form.stopLoss)     || 0,
      takeProfit:   parseFloat(form.takeProfit)   || 0,
      size:         parseFloat(form.size)         || 0,
      rr:           parseFloat(form.rr)           || 0,
      screenshotUrl: form.screenshotUrl           ?? "",
      screenshots:   Array.isArray(form.screenshots) ? form.screenshots : [],
      tags:         form.tags                     ?? [],
    };

    if (!trade.pair?.trim()) return; // pair wajib

    // Save to Supabase
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const tradeWithUser = { ...trade, user_id: session.user.id };
      const { error } = await supabase.from("trades").upsert(tradeWithUser, { onConflict: "id" });
      if (error) {
        console.error("Save trade error:", error.message);
        return; // Jangan update UI kalau Supabase gagal
      }
    }

    // Update local state
    setTrades(prev =>
      editingTrade
        ? prev.map(t => t.id === trade.id ? trade : t)
        : [...prev, trade]
    );
    closeForm();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, editingTrade, accountId]);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm("Hapus trade ini?")) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { error } = await supabase.from("trades").delete().eq("id", id).eq("user_id", session.user.id);
      if (error) { console.error("Delete error:", error.message); return; }
    }
    setTrades(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleImport = useCallback(async (newTrades) => {
    const enriched = newTrades.map(t => ({
      screenshotUrl: "",
      screenshots:   [],
      stopLoss: 0,
      takeProfit: 0,
      tags: [],
      ...t,
      account_id: accountId,
    }));
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const enrichedWithUser = enriched.map(t => ({ ...t, user_id: session.user.id }));
      const { error } = await supabase.from("trades").upsert(enrichedWithUser, { onConflict: "id" });
      if (error) { console.error("Import error:", error.message); return; }
    }
    setTrades(prev => {
      const existingIds = new Set(prev.map(t => t.id));
      return [...prev, ...enriched.filter(t => !existingIds.has(t.id))];
    });
  }, [accountId]);

  return {
    trades, loading,
    form, setForm,
    filterMarket, setFilterMarket,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    editingTrade, showAddForm,
    filteredTrades,
    stats, equityCurve,
    marketBreakdown, strategyStats, monthlyPnl, emotionStats,
    openAddForm, openEditForm, closeForm,
    handleSubmit, handleDelete, handleImport,
  };
}