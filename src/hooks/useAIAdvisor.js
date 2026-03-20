import { useState, useCallback, useRef } from "react";

// ── Build AI context dari semua data user ─────────────────────────
export function buildAIContext({ trades, stats, settings, currencyMeta, journal, playbook }) {
  const sym     = currencyMeta?.symbol ?? "$";
  const capital = settings?.capitalInitial ?? 10000;

  // Ringkas trade history — max 50 terbaru
  const recentTrades = [...(trades ?? [])]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 50)
    .map(tr => ({
      date:      tr.date,
      pair:      tr.pair,
      market:    tr.market,
      side:      tr.side,
      entry:     tr.entry,
      exit:      tr.exit,
      sl:        tr.stopLoss,
      tp:        tr.takeProfit,
      size:      tr.size,
      pnl:       tr.pnl,
      rr:        tr.rr,
      strategy:  tr.strategy,
      emotion:   tr.emotion,
      session:   tr.session,
      notes:     tr.notes,
      tags:      tr.tags,
    }));

  // Ringkas journal — max 14 entri terbaru
  const recentJournal = [...(journal ?? [])]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 14)
    .map(j => ({
      date:        j.date,
      bias:        j.market_bias,
      mood:        j.mood,
      rating:      j.rating,
      pre_market:  j.pre_market,
      post_market: j.post_market,
      lessons:     j.lessons,
      goals:       j.goals,
    }));

  return {
    account: {
      capital,
      currency:             settings?.currency ?? "USD",
      symbol:               sym,
      targetProfitPct:      settings?.targetProfitPct ?? 20,
      maxDrawdownPct:       settings?.maxDrawdownPct  ?? 10,
      targetTradesPerMonth: settings?.targetTradesPerMonth ?? 20,
    },
    stats: {
      totalTrades:  stats?.totalTrades  ?? 0,
      wins:         stats?.wins         ?? 0,
      losses:       stats?.losses       ?? 0,
      winRate:      stats?.winRate      ?? 0,
      totalPnl:     stats?.totalPnl     ?? 0,
      profitFactor: stats?.profitFactor ?? 0,
      avgRR:        stats?.avgRR        ?? 0,
      bestTrade:    stats?.bestTrade    ?? 0,
      worstTrade:   stats?.worstTrade   ?? 0,
      currentStreak:   stats?.currentStreak  ?? 0,
      streakType:      stats?.streakType     ?? "none",
    },
    recentTrades,
    recentJournal,
    playbook: (playbook ?? []).map(p => ({
      title:       p.title,
      market:      p.market,
      direction:   p.direction,
      timeframe:   p.timeframe,
      description: p.description,
      entry_rules: p.entry_rules,
      sl_rules:    p.sl_rules,
      tp_rules:    p.tp_rules,
    })),
  };
}

// ── System prompt untuk AI advisor ───────────────────────────────
function buildSystemPrompt(context) {
  return `Kamu adalah AI Trading Advisor untuk aplikasi Tradebook. Kamu memiliki akses ke data trading lengkap user dan bertugas memberikan analisis, coaching, dan saran yang actionable.

PROFIL TRADER:
- Modal: ${context.account.symbol}${context.account.capital.toLocaleString()} (${context.account.currency})
- Target profit: ${context.account.targetProfitPct}% | Max drawdown: ${context.account.maxDrawdownPct}%
- Target trades/bulan: ${context.account.targetTradesPerMonth}

PERFORMA SAAT INI:
- Total trades: ${context.stats.totalTrades} (${context.stats.wins}W / ${context.stats.losses}L)
- Win rate: ${context.stats.winRate.toFixed(1)}%
- Total P&L: ${context.account.symbol}${context.stats.totalPnl.toFixed(2)}
- Profit factor: ${context.stats.profitFactor.toFixed(2)}
- Avg R:R: ${context.stats.avgRR.toFixed(2)}
- Current streak: ${context.stats.currentStreak} ${context.stats.streakType}

DATA TERSEDIA:
${JSON.stringify(context, null, 2)}

INSTRUKSI:
- Gunakan bahasa Indonesia yang natural dan friendly
- Selalu base analisis pada data nyata user, bukan asumsi umum
- Berikan saran yang spesifik dan actionable
- Jika ada pattern negatif, sampaikan dengan konstruktif
- Format response dengan jelas — gunakan emoji dan section yang readable
- Maksimal 500 kata per response kecuali diminta lebih detail`;
}

// ── Weekly analysis prompt ────────────────────────────────────────
export function buildWeeklyPrompt(context) {
  const now      = new Date();
  const weekAgo  = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const weekStr  = weekAgo.toISOString().split("T")[0];

  const weekTrades = context.recentTrades.filter(tr => tr.date >= weekStr);
  const weekPnl    = weekTrades.reduce((s, t) => s + tr.pnl, 0);
  const weekWins   = weekTrades.filter(tr => tr.pnl >= 0).length;

  return `Buatkan laporan analisis mingguan trading saya untuk periode 7 hari terakhir.

Data minggu ini:
- Total trades: ${weekTrades.length}
- Wins: ${weekWins} | Losses: ${weekTrades.length - weekWins}
- P&L minggu ini: ${context.account.symbol}${weekPnl.toFixed(2)}

Analisis mencakup:
1. 📊 Ringkasan Performa Minggu Ini
2. 💪 Apa yang berjalan baik
3. ⚠️ Area yang perlu diperbaiki
4. 🔍 Pattern yang terdeteksi (dari trade history dan journal)
5. 🎯 Rekomendasi untuk minggu depan
6. 📈 Progress vs target bulanan`;
}

// ── Main hook ─────────────────────────────────────────────────────
export function useAIAdvisor() {
  const [messages,    setMessages]    = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [error,       setError]       = useState("");
  const contextRef = useRef(null);

  const setContext = useCallback((ctx) => {
    contextRef.current = ctx;
  }, []);

  // ── Send chat message ───────────────────────────────────────────
  const sendMessage = useCallback(async (userMessage) => {
    if (!userMessage.trim() || loading) return;
    const ctx = contextRef.current;
    if (!ctx) { setError("Context belum siap"); return; }

    const newMsg = { role: "user", content: userMessage, ts: Date.now() };
    setMessages(prev => [...prev, newMsg]);
    setLoading(true);
    setError("");

    try {
      const history = messages.slice(-10).map(m => ({
        role: m.role, content: m.content,
      }));

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model:      "claude-sonnet-4-20250514",
          max_tokens: 1024,
          system:     buildSystemPrompt(ctx),
          messages:   [...history, { role: "user", content: userMessage }],
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const reply = data.content?.[0]?.text ?? "Tidak ada response.";
      setMessages(prev => [...prev, { role: "assistant", content: reply, ts: Date.now() }]);
    } catch (err) {
      setError("Gagal menghubungi AI: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [messages, loading]);

  // ── Generate weekly report ──────────────────────────────────────
  const generateWeeklyReport = useCallback(async () => {
    const ctx = contextRef.current;
    if (!ctx) return;

    setWeeklyLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model:      "claude-sonnet-4-20250514",
          max_tokens: 2048,
          system:     buildSystemPrompt(ctx),
          messages:   [{ role: "user", content: buildWeeklyPrompt(ctx) }],
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const report = data.content?.[0]?.text ?? "";
      setWeeklyReport({
        content:   report,
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError("Gagal generate laporan: " + err.message);
    } finally {
      setWeeklyLoading(false);
    }
  }, []);

  const clearChat = useCallback(() => setMessages([]), []);

  return {
    messages, loading, error,
    weeklyReport, weeklyLoading,
    sendMessage, generateWeeklyReport,
    clearChat, setContext,
  };
}