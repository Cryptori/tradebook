import { useState, useMemo } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { formatCurrency, formatPct } from "../../utils/formatters";

// ── Public performance card (preview) ────────────────────────────
function PublicCard({ stats, trades, settings, currencyMeta, username, theme: t }) {
  const sym      = currencyMeta?.symbol ?? "$";
  const capital  = settings?.capitalInitial ?? 10000;
  const totalRet = capital > 0 ? (stats.totalPnl / capital) * 100 : 0;
  const months   = useMemo(() => {
    const map = {};
    trades.forEach(tr => {
      const m = tr.date?.slice(0, 7);
      if (!m) return;
      if (!map[m]) map[m] = { pnl: 0, count: 0 };
      map[m].pnl   += tr.pnl;
      map[m].count += 1;
    });
    return Object.entries(map).sort().slice(-6).map(([month, d]) => ({ month: month.slice(5), ...d }));
  }, [trades]);

  return (
    <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16,
      padding: 28, maxWidth: 560, width: "100%" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 3, color: "#00d4aa" }}>
            TRADEBOOK
          </div>
          <div style={{ fontSize: 13, color: t.text, marginTop: 2 }}>
            {username || "Trading Performance"}
          </div>
        </div>
        <div style={{ fontSize: 10, color: t.textDim }}>
          {new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long" })}
        </div>
      </div>

      {/* Key stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Return",  value: `${totalRet >= 0 ? "+" : ""}${totalRet.toFixed(1)}%`, color: totalRet >= 0 ? "#00d4aa" : "#ef4444" },
          { label: "Win Rate",      value: `${stats.winRate.toFixed(1)}%`,                        color: stats.winRate >= 50 ? "#00d4aa" : "#f59e0b" },
          { label: "Profit Factor", value: stats.profitFactor >= 999 ? "∞" : stats.profitFactor.toFixed(2), color: "#3b82f6" },
        ].map(s => (
          <div key={s.label} style={{ background: t.bgSubtle, border: `1px solid ${t.borderSubtle}`,
            borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase",
              letterSpacing: "0.1em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Monthly P&L bars */}
      {months.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: t.textDim, textTransform: "uppercase",
            letterSpacing: "0.1em", marginBottom: 10 }}>Monthly P&L (last 6 months)</div>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 60 }}>
            {months.map(m => {
              const max  = Math.max(...months.map(x => Math.abs(x.pnl)), 1);
              const pct  = Math.abs(m.pnl) / max;
              const isPos = m.pnl >= 0;
              return (
                <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 4 }}>
                  <div style={{ width: "100%", height: Math.max(4, pct * 48),
                    background: isPos ? "#00d4aa" : "#ef4444", borderRadius: "3px 3px 0 0",
                    opacity: 0.8 }} />
                  <div style={{ fontSize: 9, color: t.textDim }}>{m.month}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer stats */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11,
        color: t.textDim, borderTop: `1px solid ${t.borderSubtle}`, paddingTop: 12 }}>
        <span>{stats.totalTrades} trades · {stats.wins}W {stats.losses}L</span>
        <span>Avg RR: {(stats.avgRR ?? 0).toFixed(2)}</span>
        <span style={{ color: "#00d4aa" }}>tradebook.app</span>
      </div>
    </div>
  );
}

// ── Main SharePerformance Page ────────────────────────────────────
export default function SharePerformance({ stats, trades, settings, currencyMeta, theme }) {
  const t   = theme;
  const sym = currencyMeta?.symbol ?? "$";
  const { isMobile } = useBreakpoint();

  const [username,  setUsername]  = useState("");
  const [copied,    setCopied]    = useState(false);
  const [period,    setPeriod]    = useState("all");   // "all" | "month" | "year"

  // Filter trades by period
  const periodTrades = useMemo(() => {
    const now  = new Date();
    const yyyy = now.getFullYear();
    const mm   = String(now.getMonth() + 1).padStart(2, "0");
    if (period === "month") return trades.filter(tr => tr.date?.startsWith(`${yyyy}-${mm}`));
    if (period === "year")  return trades.filter(tr => tr.date?.startsWith(`${yyyy}`));
    return trades;
  }, [trades, period]);

  // Recalculate stats for filtered period
  const periodStats = useMemo(() => {
    const wins   = periodTrades.filter(tr => tr.pnl >= 0).length;
    const losses = periodTrades.filter(tr => tr.pnl < 0).length;
    const totalPnl = periodTrades.reduce((s, tr) => s + tr.pnl, 0);
    const grossWin  = periodTrades.filter(tr => tr.pnl > 0).reduce((s, tr) => s + tr.pnl, 0);
    const grossLoss = Math.abs(periodTrades.filter(tr => tr.pnl < 0).reduce((s, tr) => s + tr.pnl, 0));
    const avgRR    = periodTrades.length > 0
      ? periodTrades.reduce((s, tr) => s + (tr.rr ?? 0), 0) / periodTrades.length : 0;
    return {
      totalTrades:  periodTrades.length,
      wins, losses,
      winRate:      periodTrades.length > 0 ? (wins / periodTrades.length) * 100 : 0,
      totalPnl,
      profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 999 : 0,
      avgRR,
    };
  }, [periodTrades]);

  // Generate shareable text
  const capital   = settings?.capitalInitial ?? 10000;
  const totalRet  = capital > 0 ? (periodStats.totalPnl / capital) * 100 : 0;
  const shareText = `📊 ${period === "month" ? "Performa Bulan Ini" : period === "year" ? "Performa Tahun Ini" : "Performa Trading"}${username ? ` - ${username}` : ""}

💰 Total Return: ${totalRet >= 0 ? "+" : ""}${totalRet.toFixed(1)}%
🎯 Win Rate: ${periodStats.winRate.toFixed(1)}% (${periodStats.wins}W/${periodStats.losses}L)
📈 Profit Factor: ${periodStats.profitFactor >= 999 ? "∞" : periodStats.profitFactor.toFixed(2)}
⚖️ Avg R:R: ${(periodStats.avgRR ?? 0).toFixed(2)}
📋 Total Trades: ${periodStats.totalTrades}

Tracked with Tradebook`;

  function copyText() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => fallbackCopy());
    } else {
      fallbackCopy();
    }
  }

  function fallbackCopy() {
    const el = document.createElement("textarea");
    el.value = shareText;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24,
          letterSpacing: 2, color: t.text }}>SHARE PERFORMANCE</div>
        <div style={{ fontSize: 11, color: t.textDim }}>
          Bagikan performa trading kamu ke social media atau komunitas
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: 24, alignItems: "start" }}>

        {/* Left — controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Options */}
          <div className="stat-card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase",
              letterSpacing: "0.1em" }}>Konfigurasi</div>

            <div>
              <label style={{ color: t.textDim }}>Nama / Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)}
                placeholder="@username atau nama kamu"
                style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text }} />
            </div>

            <div>
              <label style={{ color: t.textDim }}>Periode</label>
              <div style={{ display: "flex", gap: 4 }}>
                {[
                  { label: "Semua",  value: "all"   },
                  { label: "Bulan",  value: "month" },
                  { label: "Tahun",  value: "year"  },
                ].map(p => (
                  <button key={p.value} onClick={() => setPeriod(p.value)}
                    style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
                      cursor: "pointer", fontFamily: "DM Mono, monospace", fontSize: 12,
                      background: period === p.value ? t.accent : t.bgSubtle,
                      color: period === p.value ? "#090e1a" : t.textDim }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Share text */}
          <div className="stat-card">
            <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase",
              letterSpacing: "0.1em", marginBottom: 10 }}>Teks untuk di-copy</div>
            <pre style={{ background: t.bgSubtle, border: `1px solid ${t.borderSubtle}`,
              borderRadius: 8, padding: "12px 14px", fontSize: 12, color: t.textMuted,
              lineHeight: 1.8, whiteSpace: "pre-wrap", fontFamily: "DM Mono, monospace",
              margin: 0, overflowX: "auto" }}>
              {shareText}
            </pre>
            <button className="btn-primary" onClick={copyText}
              style={{ width: "100%", marginTop: 12, display: "flex", justifyContent: "center" }}>
              {copied ? "✓ Tersalin!" : "📋 Copy Teks"}
            </button>
          </div>

          {/* Stats breakdown */}
          <div className="stat-card">
            <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase",
              letterSpacing: "0.1em", marginBottom: 12 }}>Detail Statistik</div>
            {[
              ["Total P&L",     formatCurrency(periodStats.totalPnl, false, sym), periodStats.totalPnl >= 0 ? "#00d4aa" : "#ef4444"],
              ["Total Return",  `${totalRet >= 0 ? "+" : ""}${totalRet.toFixed(2)}%`, totalRet >= 0 ? "#00d4aa" : "#ef4444"],
              ["Win Rate",      `${periodStats.winRate.toFixed(1)}%`, periodStats.winRate >= 50 ? "#00d4aa" : "#f59e0b"],
              ["Profit Factor", periodStats.profitFactor >= 999 ? "∞" : periodStats.profitFactor.toFixed(2), "#3b82f6"],
              ["Avg R:R",       (periodStats.avgRR ?? 0).toFixed(2), "#3b82f6"],
              ["Total Trades",  periodStats.totalTrades, t.text],
              ["Wins / Losses", `${periodStats.wins} / ${periodStats.losses}`, t.text],
            ].map(([label, value, color]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between",
                padding: "7px 0", borderBottom: `1px solid ${t.borderSubtle}`,
                fontSize: 12 }}>
                <span style={{ color: t.textDim }}>{label}</span>
                <span style={{ color, fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — card preview */}
        <div>
          <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase",
            letterSpacing: "0.1em", marginBottom: 12 }}>Preview Card</div>
          <PublicCard
            stats={periodStats}
            trades={periodTrades}
            settings={settings}
            currencyMeta={currencyMeta}
            username={username}
            theme={t}
          />
          <div style={{ fontSize: 11, color: t.textDim, marginTop: 10, textAlign: "center" }}>
            Screenshot card ini untuk share ke social media
          </div>
        </div>
      </div>
    </div>
  );
}