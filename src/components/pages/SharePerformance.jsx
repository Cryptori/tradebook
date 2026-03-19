import { useState, useMemo, useRef } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { formatCurrency } from "../../utils/formatters";

// ── Copy to clipboard helper ──────────────────────────────────────
function copyToClipboard(text, setCopied) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => fallback(text, setCopied));
  } else { fallback(text, setCopied); }
}
function fallback(text, setCopied) {
  const el = document.createElement("textarea");
  el.value = text;
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
}

// ── Trade Share Card ──────────────────────────────────────────────
function TradeCard({ trade, sym, theme: t }) {
  const isWin = trade.pnl >= 0;
  const color = isWin ? "#00c896" : "#ef4444";
  return (
    <div style={{
      background: "linear-gradient(135deg, #080c14, #0c1220)",
      border: `1px solid ${color}30`,
      borderRadius: 16, padding: "24px 28px",
      maxWidth: 400, width: "100%",
      boxShadow: `0 0 40px ${color}15`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontFamily: "DM Mono, monospace", fontSize: 13, letterSpacing: "0.15em", color: "#00c896" }}>TRADEBOOK</div>
        <div style={{ fontSize: 10, color: "#4a5568" }}>{trade.date}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ fontFamily: "DM Mono, monospace", fontSize: 22, fontWeight: 700, color: "#dde4ef" }}>{trade.pair}</div>
        <div style={{ fontSize: 11, padding: "3px 10px", borderRadius: 100, background: trade.side === "BUY" ? "rgba(0,200,150,0.1)" : "rgba(245,158,11,0.1)", color: trade.side === "BUY" ? "#00c896" : "#f59e0b", border: `1px solid ${trade.side === "BUY" ? "#00c89630" : "#f59e0b30"}`, fontWeight: 600, letterSpacing: "0.05em" }}>
          {trade.side}
        </div>
        <div style={{ fontSize: 11, padding: "3px 10px", borderRadius: 100, background: isWin ? "rgba(0,200,150,0.1)" : "rgba(239,68,68,0.1)", color, border: `1px solid ${color}30`, fontWeight: 600 }}>
          {isWin ? "WIN" : "LOSS"}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
        {[
          { label: "P&L",      value: (isWin ? "+" : "") + formatCurrency(trade.pnl, false, sym), color },
          { label: "R:R",      value: trade.rr ? (parseFloat(trade.rr) >= 0 ? "+" : "") + trade.rr + "R" : "—", color: "#3b82f6" },
          { label: "Strategy", value: trade.strategy || "—", color: "#8a96aa" },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontSize: 9, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: 14, color: s.color, fontWeight: 600 }}>{s.value}</div>
          </div>
        ))}
      </div>
      {trade.notes && (
        <div style={{ fontSize: 12, color: "#4a5568", fontStyle: "italic", padding: "10px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, lineHeight: 1.6 }}>
          "{trade.notes}"
        </div>
      )}
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", fontSize: 10, color: "#4a5568" }}>
        <span>{trade.market} · {trade.session}</span>
        <span>tradebook.app</span>
      </div>
    </div>
  );
}

// ── Performance Card ──────────────────────────────────────────────
function PerformanceCard({ stats, trades, settings, currencyMeta, username, period, theme: t }) {
  const sym     = currencyMeta?.symbol ?? "$";
  const capital = settings?.capitalInitial ?? 10000;
  const ret     = capital > 0 ? (stats.totalPnl / capital) * 100 : 0;

  const months = useMemo(() => {
    const map = {};
    trades.forEach(tr => {
      const m = tr.date?.slice(0, 7);
      if (!m) return;
      if (!map[m]) map[m] = { pnl: 0 };
      map[m].pnl += tr.pnl;
    });
    return Object.entries(map).sort().slice(-6).map(([month, d]) => ({ month: month.slice(5), ...d }));
  }, [trades]);

  return (
    <div style={{
      background: "linear-gradient(135deg, #080c14, #0c1220)",
      border: "1px solid rgba(0,200,150,0.2)",
      borderRadius: 16, padding: "24px 28px",
      maxWidth: 480, width: "100%",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: 13, letterSpacing: "0.15em", color: "#00c896" }}>TRADEBOOK</div>
          {username && <div style={{ fontSize: 12, color: "#8a96aa", marginTop: 3 }}>{username}</div>}
        </div>
        <div style={{ fontSize: 10, color: "#4a5568" }}>
          {period === "month" ? "Bulan Ini" : period === "year" ? "Tahun Ini" : "All Time"}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Return",        value: `${ret >= 0 ? "+" : ""}${ret.toFixed(1)}%`,                                           color: ret >= 0 ? "#00c896" : "#ef4444" },
          { label: "Win Rate",      value: `${stats.winRate.toFixed(1)}%`,                                                        color: stats.winRate >= 50 ? "#00c896" : "#f59e0b" },
          { label: "Profit Factor", value: stats.profitFactor >= 999 ? "∞" : stats.profitFactor.toFixed(2),                      color: "#3b82f6" },
          { label: "Total P&L",     value: (stats.totalPnl >= 0 ? "+" : "") + formatCurrency(stats.totalPnl, false, sym),        color: stats.totalPnl >= 0 ? "#00c896" : "#ef4444" },
          { label: "Trades",        value: stats.totalTrades + "x",                                                              color: "#8a96aa" },
          { label: "Avg R:R",       value: (stats.avgRR ?? 0).toFixed(2),                                                        color: "#8a96aa" },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>{s.label}</div>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: 15, color: s.color, fontWeight: 600 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {months.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 9, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Monthly P&L</div>
          <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 48 }}>
            {months.map(m => {
              const max = Math.max(...months.map(x => Math.abs(x.pnl)), 1);
              const h   = Math.max(4, (Math.abs(m.pnl) / max) * 44);
              return (
                <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <div style={{ width: "100%", height: h, background: m.pnl >= 0 ? "#00c896" : "#ef4444", borderRadius: "3px 3px 0 0", opacity: 0.8 }} />
                  <div style={{ fontSize: 8, color: "#4a5568" }}>{m.month}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", fontSize: 10, color: "#4a5568" }}>
        <span>{stats.wins}W {stats.losses}L · Avg RR {(stats.avgRR ?? 0).toFixed(2)}</span>
        <span>tradebook.app</span>
      </div>
    </div>
  );
}

// ── Achievement Card ──────────────────────────────────────────────
function AchievementCard({ badge, username, theme: t }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, #0c1220, #111a2e)",
      border: "1px solid rgba(201,168,76,0.3)",
      borderRadius: 16, padding: "28px 32px",
      maxWidth: 360, width: "100%", textAlign: "center",
      boxShadow: "0 0 40px rgba(201,168,76,0.1)",
    }}>
      <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12, letterSpacing: "0.15em", color: "#00c896", marginBottom: 20 }}>TRADEBOOK</div>
      <div style={{ fontSize: 56, marginBottom: 16 }}>{badge.icon}</div>
      <div style={{ fontFamily: "DM Mono, monospace", fontSize: 18, color: "#c9a84c", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 8 }}>{badge.name}</div>
      <div style={{ fontSize: 13, color: "#8a96aa", marginBottom: 16 }}>{badge.desc}</div>
      {username && <div style={{ fontSize: 12, color: "#4a5568" }}>{username}</div>}
      <div style={{ marginTop: 20, fontSize: 10, color: "#4a5568" }}>tradebook.app</div>
    </div>
  );
}

// ── Share text generator ──────────────────────────────────────────
function buildShareText(type, data) {
  const { trade, stats, period, username, sym, badge } = data;

  if (type === "trade" && trade) {
    const isWin = trade.pnl >= 0;
    return `${isWin ? "✅" : "❌"} Trade ${isWin ? "WIN" : "LOSS"}${username ? ` — ${username}` : ""}\n\n📊 ${trade.pair} ${trade.side}\n💰 P&L: ${isWin ? "+" : ""}${formatCurrency(trade.pnl, false, sym)}\n⚖️ R:R: ${trade.rr ? trade.rr + "R" : "—"}\n🎯 Strategy: ${trade.strategy || "—"}\n${trade.notes ? `\n📝 "${trade.notes}"\n` : ""}\nTracked with Tradebook`;
  }

  if (type === "performance") {
    const capital = data.capital || 10000;
    const ret     = capital > 0 ? ((stats.totalPnl / capital) * 100).toFixed(1) : "0";
    return `📊 ${period === "month" ? "Performa Bulan Ini" : period === "year" ? "Performa Tahun Ini" : "Performa Trading"}${username ? ` — ${username}` : ""}\n\n💰 Return: ${ret >= 0 ? "+" : ""}${ret}%\n🎯 Win Rate: ${stats.winRate.toFixed(1)}% (${stats.wins}W/${stats.losses}L)\n📈 Profit Factor: ${stats.profitFactor >= 999 ? "∞" : stats.profitFactor.toFixed(2)}\n⚖️ Avg R:R: ${(stats.avgRR ?? 0).toFixed(2)}\n📋 Total: ${stats.totalTrades} trades\n\nTracked with Tradebook`;
  }

  if (type === "badge" && badge) {
    return `${badge.icon} Achievement Unlocked!${username ? ` — ${username}` : ""}\n\n"${badge.name}"\n${badge.desc}\n\nTracked with Tradebook`;
  }

  return "";
}

// ── Main SharePerformance Page ────────────────────────────────────
export default function SharePerformance({ stats, trades, settings, currencyMeta, gamificationHook, theme }) {
  const t   = theme;
  const sym = currencyMeta?.symbol ?? "$";
  const { isMobile } = useBreakpoint();

  const [activeTab,  setActiveTab]  = useState("performance"); // "performance" | "trade" | "badge"
  const [username,   setUsername]   = useState("");
  const [period,     setPeriod]     = useState("all");
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [copied,     setCopied]     = useState(false);

  // Filter trades by period
  const periodTrades = useMemo(() => {
    const now  = new Date();
    const yyyy = now.getFullYear();
    const mm   = String(now.getMonth() + 1).padStart(2, "0");
    if (period === "month") return trades.filter(tr => tr.date?.startsWith(`${yyyy}-${mm}`));
    if (period === "year")  return trades.filter(tr => tr.date?.startsWith(`${yyyy}`));
    return trades;
  }, [trades, period]);

  const periodStats = useMemo(() => {
    const wins      = periodTrades.filter(tr => tr.pnl >= 0).length;
    const losses    = periodTrades.filter(tr => tr.pnl < 0).length;
    const totalPnl  = periodTrades.reduce((s, tr) => s + tr.pnl, 0);
    const grossWin  = periodTrades.filter(tr => tr.pnl > 0).reduce((s, tr) => s + tr.pnl, 0);
    const grossLoss = Math.abs(periodTrades.filter(tr => tr.pnl < 0).reduce((s, tr) => s + tr.pnl, 0));
    const avgRR     = periodTrades.length > 0 ? periodTrades.reduce((s, tr) => s + (tr.rr ?? 0), 0) / periodTrades.length : 0;
    return {
      totalTrades: periodTrades.length, wins, losses,
      winRate:      periodTrades.length > 0 ? (wins / periodTrades.length) * 100 : 0,
      totalPnl, profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 999 : 0,
      avgRR,
    };
  }, [periodTrades]);

  const earnedBadges = gamificationHook?.earnedBadges?.filter(b => b.earned) || [];
  const capital      = settings?.capitalInitial ?? 10000;

  const shareText = buildShareText(activeTab, {
    trade: selectedTrade, stats: periodStats, period, username, sym,
    capital, badge: selectedBadge,
  });

  const TAB_LABELS = { performance: "📊 Performance", trade: "📈 Trade", badge: "🏆 Badge" };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2, color: t.text }}>SHARE</div>
        <div style={{ fontSize: 11, color: t.textDim }}>Bagikan performa trading kamu ke komunitas</div>
      </div>

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 4, background: t.bgSubtle, border: `1px solid ${t.border}`, borderRadius: 10, padding: 3, marginBottom: 20, width: "fit-content" }}>
        {Object.entries(TAB_LABELS).map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            style={{ padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontFamily: "DM Sans, sans-serif", background: activeTab === key ? t.accent : "transparent", color: activeTab === key ? "#090e1a" : t.textDim, fontWeight: activeTab === key ? 600 : 400, transition: "all 0.15s" }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24, alignItems: "start" }}>

        {/* Left — controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Username */}
          <div className="stat-card">
            <label>Username / Nama</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="@username atau nama kamu"
              style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text }} />
          </div>

          {/* Performance controls */}
          {activeTab === "performance" && (
            <div className="stat-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label>Periode</label>
              <div style={{ display: "flex", gap: 4 }}>
                {[{ v: "all", l: "All Time" }, { v: "month", l: "Bulan Ini" }, { v: "year", l: "Tahun Ini" }].map(p => (
                  <button key={p.v} onClick={() => setPeriod(p.v)}
                    style={{ flex: 1, padding: "7px 0", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 11, background: period === p.v ? t.accent : t.bgSubtle, color: period === p.v ? "#090e1a" : t.textDim, fontWeight: period === p.v ? 600 : 400 }}>
                    {p.l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trade selector */}
          {activeTab === "trade" && (
            <div className="stat-card">
              <label style={{ marginBottom: 10, display: "block" }}>Pilih Trade</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 240, overflowY: "auto" }}>
                {[...trades].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20).map(tr => (
                  <div key={tr.id} onClick={() => setSelectedTrade(tr)}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", borderRadius: 8, cursor: "pointer", background: selectedTrade?.id === tr.id ? "rgba(0,200,150,0.08)" : t.bgSubtle, border: `1px solid ${selectedTrade?.id === tr.id ? "rgba(0,200,150,0.3)" : t.borderSubtle}`, transition: "all 0.15s" }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 500, color: t.text }}>{tr.pair}</span>
                      <span style={{ fontSize: 10, color: t.textDim, marginLeft: 8 }}>{tr.date?.slice(5)}</span>
                    </div>
                    <span style={{ fontSize: 12, color: tr.pnl >= 0 ? "#00c896" : "#ef4444", fontFamily: "DM Mono, monospace", fontWeight: 600 }}>
                      {tr.pnl >= 0 ? "+" : ""}{formatCurrency(tr.pnl, false, sym)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Badge selector */}
          {activeTab === "badge" && (
            <div className="stat-card">
              <label style={{ marginBottom: 10, display: "block" }}>Pilih Badge</label>
              {earnedBadges.length === 0 ? (
                <div style={{ color: t.textDim, fontSize: 12, textAlign: "center", padding: "20px 0" }}>Belum ada badge. Terus trading!</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {earnedBadges.map(b => (
                    <div key={b.id} onClick={() => setSelectedBadge(b)}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, cursor: "pointer", background: selectedBadge?.id === b.id ? "rgba(201,168,76,0.08)" : t.bgSubtle, border: `1px solid ${selectedBadge?.id === b.id ? "rgba(201,168,76,0.3)" : t.borderSubtle}` }}>
                      <span style={{ fontSize: 18 }}>{b.icon}</span>
                      <div>
                        <div style={{ fontSize: 11, color: t.text, fontWeight: 500 }}>{b.name}</div>
                        <div style={{ fontSize: 9, color: t.textDim }}>{b.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Share text */}
          {shareText && (
            <div className="stat-card">
              <div style={{ fontSize: 10, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Teks untuk di-copy</div>
              <pre style={{ background: t.bgSubtle, borderRadius: 8, padding: "12px 14px", fontSize: 12, color: t.textMuted, lineHeight: 1.8, whiteSpace: "pre-wrap", fontFamily: "DM Mono, monospace", margin: 0, overflowX: "auto" }}>
                {shareText}
              </pre>
              <button className="btn-primary" onClick={() => copyToClipboard(shareText, setCopied)}
                style={{ width: "100%", marginTop: 10, justifyContent: "center", display: "flex" }}>
                {copied ? "✓ Tersalin!" : "📋 Copy Teks"}
              </button>
            </div>
          )}
        </div>

        {/* Right — preview */}
        <div>
          <div style={{ fontSize: 10, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>Preview Card</div>

          {activeTab === "performance" && (
            <PerformanceCard stats={periodStats} trades={periodTrades} settings={settings} currencyMeta={currencyMeta} username={username} period={period} theme={t} />
          )}
          {activeTab === "trade" && selectedTrade && (
            <TradeCard trade={selectedTrade} sym={sym} theme={t} />
          )}
          {activeTab === "trade" && !selectedTrade && (
            <div style={{ background: t.bgSubtle, borderRadius: 14, padding: "40px 24px", textAlign: "center", color: t.textDim, fontSize: 13 }}>
              Pilih trade di kiri untuk preview card
            </div>
          )}
          {activeTab === "badge" && selectedBadge && (
            <AchievementCard badge={selectedBadge} username={username} theme={t} />
          )}
          {activeTab === "badge" && !selectedBadge && (
            <div style={{ background: t.bgSubtle, borderRadius: 14, padding: "40px 24px", textAlign: "center", color: t.textDim, fontSize: 13 }}>
              Pilih badge di kiri untuk preview card
            </div>
          )}

          <div style={{ fontSize: 11, color: t.textDim, marginTop: 10, textAlign: "center" }}>
            Screenshot card ini untuk share ke social media
          </div>
        </div>
      </div>
    </div>
  );
}