import { useState, useMemo } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { formatCurrency } from "../../utils/formatters";

// ── Clipboard ─────────────────────────────────────────────────────
function copyText(text, setCopied) {
  const done = () => { setCopied(true); setTimeout(() => setCopied(false), 2000); };
  if (navigator.clipboard) { navigator.clipboard.writeText(text).then(done).catch(() => fallback(text, done)); }
  else fallback(text, done);
}
function fallback(text, done) {
  const el = document.createElement("textarea");
  el.value = text; document.body.appendChild(el); el.select();
  document.execCommand("copy"); document.body.removeChild(el); done();
}

// ── Share cards (dark, standalone aesthetic) ──────────────────────
function TradeCard({ trade, sym }) {
  const win   = (trade.pnl ?? 0) >= 0;
  const color = win ? "#00c896" : "#ef4444";
  return (
    <div style={{ background: "linear-gradient(135deg, #080c14, #0c1220)", border: `1px solid ${color}30`, borderRadius: 16, padding: "24px 28px", maxWidth: 400, width: "100%", boxShadow: `0 0 40px ${color}15` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, letterSpacing: "0.15em", color: "#00c896" }}>TRADEBOOK</span>
        <span style={{ fontSize: 10, color: "#4a5568" }}>{trade.date}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: "#dde4ef" }}>{trade.pair}</span>
        <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 100, background: trade.side === "BUY" ? "rgba(0,200,150,0.1)" : "rgba(245,158,11,0.1)", color: trade.side === "BUY" ? "#00c896" : "#f59e0b", border: `1px solid ${trade.side === "BUY" ? "#00c89630" : "#f59e0b30"}`, fontWeight: 600 }}>
          {trade.side}
        </span>
        <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 100, background: win ? "rgba(0,200,150,0.1)" : "rgba(239,68,68,0.1)", color, border: `1px solid ${color}30`, fontWeight: 600 }}>
          {win ? "WIN" : "LOSS"}
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
        {[
          { label: "P&L",      val: `${win ? "+" : ""}${formatCurrency(trade.pnl ?? 0, false, sym)}`, color },
          { label: "R:R",      val: trade.rr ? `${parseFloat(trade.rr) >= 0 ? "+" : ""}${trade.rr}R` : "—", color: "#3b82f6" },
          { label: "Strategy", val: trade.strategy || "—", color: "#8a96aa" },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 10px" }}>
            <div style={{ fontSize: 9, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: s.color, fontWeight: 600 }}>{s.val}</div>
          </div>
        ))}
      </div>
      {trade.notes && (
        <div style={{ fontSize: 12, color: "#4a5568", fontStyle: "italic", padding: "10px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, lineHeight: 1.6 }}>
          "{trade.notes}"
        </div>
      )}
      <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", fontSize: 10, color: "#4a5568" }}>
        <span>{trade.market} · {trade.session}</span>
        <span>tradebook.app</span>
      </div>
    </div>
  );
}

function PerformanceCard({ stats, trades, settings, currencyMeta, username, period }) {
  const sym     = currencyMeta?.symbol ?? "$";
  const capital = settings?.capitalInitial ?? 10000;
  const ret     = capital > 0 ? ((stats.totalPnl ?? 0) / capital) * 100 : 0;

  const months = useMemo(() => {
    const map = {};
    trades.forEach(tr => {
      const m = tr.date?.slice(0,7);
      if (!m) return;
      if (!map[m]) map[m] = { pnl: 0 };
      map[m].pnl += tr.pnl || 0;
    });
    return Object.entries(map).sort().slice(-6).map(([month, d]) => ({ month: month.slice(5), ...d }));
  }, [trades]);

  const periodLabel = period === "month" ? "Bulan Ini" : period === "year" ? "Tahun Ini" : "All Time";
  const maxBar = months.length ? Math.max(...months.map(x => Math.abs(x.pnl)), 1) : 1;

  return (
    <div style={{ background: "linear-gradient(135deg, #080c14, #0c1220)", border: "1px solid rgba(0,200,150,0.2)", borderRadius: 16, padding: "24px 28px", maxWidth: 480, width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, letterSpacing: "0.15em", color: "#00c896" }}>TRADEBOOK</div>
          {username && <div style={{ fontSize: 12, color: "#8a96aa", marginTop: 2 }}>{username}</div>}
        </div>
        <span style={{ fontSize: 10, color: "#4a5568" }}>{periodLabel}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
        {[
          { label: "Return",        val: `${ret >= 0 ? "+" : ""}${ret.toFixed(1)}%`,                       color: ret >= 0 ? "#00c896" : "#ef4444" },
          { label: "Win Rate",      val: `${(stats.winRate ?? 0).toFixed(1)}%`,                             color: (stats.winRate ?? 0) >= 50 ? "#00c896" : "#f59e0b" },
          { label: "Profit Factor", val: (stats.profitFactor ?? 0) >= 999 ? "∞" : (stats.profitFactor ?? 0).toFixed(2), color: "#3b82f6" },
          { label: "Total P&L",     val: `${(stats.totalPnl ?? 0) >= 0 ? "+" : ""}${formatCurrency(stats.totalPnl ?? 0, false, sym)}`, color: (stats.totalPnl ?? 0) >= 0 ? "#00c896" : "#ef4444" },
          { label: "Trades",        val: `${stats.totalTrades ?? 0}x`,                                     color: "#8a96aa" },
          { label: "Avg R:R",       val: (stats.avgRR ?? 0).toFixed(2),                                    color: "#8a96aa" },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: s.color, fontWeight: 600 }}>{s.val}</div>
          </div>
        ))}
      </div>
      {months.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 9, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Monthly P&L</div>
          <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 44 }}>
            {months.map(m => {
              const h = Math.max(4, (Math.abs(m.pnl) / maxBar) * 40);
              return (
                <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <div style={{ width: "100%", height: h, background: m.pnl >= 0 ? "#00c896" : "#ef4444", borderRadius: "2px 2px 0 0", opacity: 0.8 }}/>
                  <div style={{ fontSize: 8, color: "#4a5568" }}>{m.month}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div style={{ paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", fontSize: 10, color: "#4a5568" }}>
        <span>{stats.wins ?? 0}W {stats.losses ?? 0}L · Avg RR {(stats.avgRR ?? 0).toFixed(2)}</span>
        <span>tradebook.app</span>
      </div>
    </div>
  );
}

function AchievementCard({ badge, username }) {
  return (
    <div style={{ background: "linear-gradient(135deg, #0c1220, #111a2e)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 16, padding: "28px 32px", maxWidth: 360, width: "100%", textAlign: "center", boxShadow: "0 0 40px rgba(201,168,76,0.1)" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.15em", color: "#00c896", marginBottom: 20 }}>TRADEBOOK</div>
      <div style={{ fontSize: 56, marginBottom: 14 }}>{badge.icon}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, color: "#c9a84c", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 8 }}>{badge.name}</div>
      <div style={{ fontSize: 13, color: "#8a96aa", marginBottom: 14 }}>{badge.desc}</div>
      {username && <div style={{ fontSize: 12, color: "#4a5568" }}>{username}</div>}
      <div style={{ marginTop: 18, fontSize: 10, color: "#4a5568" }}>tradebook.app</div>
    </div>
  );
}

// ── Share text ────────────────────────────────────────────────────
function buildShareText(type, { trade, stats, period, username, sym, capital, badge }) {
  if (type === "trade" && trade) {
    const win = (trade.pnl ?? 0) >= 0;
    return `${win ? "✅" : "❌"} Trade ${win ? "WIN" : "LOSS"}${username ? ` — ${username}` : ""}\n\n📊 ${trade.pair} ${trade.side}\n💰 P&L: ${win ? "+" : ""}${formatCurrency(trade.pnl ?? 0, false, sym)}\n⚖️ R:R: ${trade.rr ? `${trade.rr}R` : "—"}\n🎯 Strategy: ${trade.strategy || "—"}${trade.notes ? `\n\n📝 ${trade.notes}` : ""}\n\nTracked with Tradebook`;
  }
  if (type === "performance") {
    const ret = capital > 0 ? (((stats.totalPnl ?? 0) / capital) * 100).toFixed(1) : "0";
    const pLabel = period === "month" ? "Bulan Ini" : period === "year" ? "Tahun Ini" : "All Time";
    return `📊 Performa ${pLabel}${username ? ` — ${username}` : ""}\n\n💰 Return: ${ret >= 0 ? "+" : ""}${ret}%\n🎯 Win Rate: ${(stats.winRate ?? 0).toFixed(1)}% (${stats.wins ?? 0}W/${stats.losses ?? 0}L)\n📈 Profit Factor: ${(stats.profitFactor ?? 0) >= 999 ? "∞" : (stats.profitFactor ?? 0).toFixed(2)}\n⚖️ Avg R:R: ${(stats.avgRR ?? 0).toFixed(2)}\n📋 Total: ${stats.totalTrades ?? 0} trades\n\nTracked with Tradebook`;
  }
  if (type === "badge" && badge) {
    return `${badge.icon} Achievement Unlocked!${username ? ` — ${username}` : ""}\n\n"${badge.name}"\n${badge.desc}\n\nTracked with Tradebook`;
  }
  return "";
}

// ── Main ──────────────────────────────────────────────────────────
export default function SharePerformance({ stats, trades, settings, currencyMeta, gamificationHook, theme }) {
  const sym = currencyMeta?.symbol ?? "$";
  const { isMobile } = useBreakpoint();
  const [activeTab,     setActiveTab]     = useState("performance");
  const [username,      setUsername]      = useState("");
  const [period,        setPeriod]        = useState("all");
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [copied,        setCopied]        = useState(false);

  const periodTrades = useMemo(() => {
    const now = new Date();
    const yy  = now.getFullYear();
    const mm  = String(now.getMonth() + 1).padStart(2, "0");
    if (period === "month") return trades.filter(tr => tr.date?.startsWith(`${yy}-${mm}`));
    if (period === "year")  return trades.filter(tr => tr.date?.startsWith(`${yy}`));
    return trades;
  }, [trades, period]);

  const periodStats = useMemo(() => {
    const wins     = periodTrades.filter(tr => (tr.pnl ?? 0) >= 0).length;
    const losses   = periodTrades.filter(tr => (tr.pnl ?? 0) < 0).length;
    const totalPnl = periodTrades.reduce((s, tr) => s + (tr.pnl || 0), 0);
    const grossWin = periodTrades.filter(tr => (tr.pnl ?? 0) > 0).reduce((s, tr) => s + tr.pnl, 0);
    const grossLoss= Math.abs(periodTrades.filter(tr => (tr.pnl ?? 0) < 0).reduce((s, tr) => s + tr.pnl, 0));
    const avgRR    = periodTrades.length > 0 ? periodTrades.reduce((s, tr) => s + (tr.rr ?? 0), 0) / periodTrades.length : 0;
    return {
      totalTrades: periodTrades.length, wins, losses,
      winRate: periodTrades.length > 0 ? (wins / periodTrades.length) * 100 : 0,
      totalPnl, profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 999 : 0, avgRR,
    };
  }, [periodTrades]);

  const earnedBadges = gamificationHook?.earnedBadges?.filter(b => b.earned) || [];
  const capital      = settings?.capitalInitial ?? 10000;
  const shareText    = buildShareText(activeTab, { trade: selectedTrade, stats: periodStats, period, username, sym, capital, badge: selectedBadge });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 className="page-title">Share</h1>
        <p className="page-subtitle">Bagikan performa trading kamu ke komunitas</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 2, width: "fit-content" }}>
        {[{ v: "performance", l: "📊 Performance" }, { v: "trade", l: "📈 Trade" }, { v: "badge", l: "🏆 Badge" }].map(t => (
          <button key={t.v} onClick={() => setActiveTab(t.v)} style={{
            padding: "6px 14px", borderRadius: "var(--r-sm)", border: "none", cursor: "pointer",
            fontSize: "var(--fs-sm)",
            background: activeTab === t.v ? "var(--accent)"      : "transparent",
            color:      activeTab === t.v ? "var(--text-inverse)" : "var(--text-dim)",
            fontWeight: activeTab === t.v ? 600 : 400,
          }}>{t.l}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, alignItems: "start" }}>
        {/* Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="stat-card">
            <label>Username / Nama</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="@username atau nama kamu"/>
          </div>

          {activeTab === "performance" && (
            <div className="stat-card">
              <label>Periode</label>
              <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                {[{ v: "all", l: "All Time" }, { v: "month", l: "Bulan Ini" }, { v: "year", l: "Tahun Ini" }].map(p => (
                  <button key={p.v} onClick={() => setPeriod(p.v)} style={{
                    flex: 1, padding: "7px 0", borderRadius: "var(--r-md)", border: "none", cursor: "pointer",
                    fontSize: "var(--fs-xs)",
                    background: period === p.v ? "var(--accent)"      : "var(--bg-subtle)",
                    color:      period === p.v ? "var(--text-inverse)" : "var(--text-dim)",
                    fontWeight: period === p.v ? 600 : 400,
                  }}>{p.l}</button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "trade" && (
            <div className="stat-card">
              <label>Pilih Trade</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 240, overflowY: "auto", marginTop: 8 }}>
                {[...trades].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20).map(tr => (
                  <div key={tr.id} onClick={() => setSelectedTrade(tr)} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 10px", borderRadius: "var(--r-md)", cursor: "pointer",
                    background: selectedTrade?.id === tr.id ? "var(--accent-dim)" : "var(--bg-subtle)",
                    border: `1px solid ${selectedTrade?.id === tr.id ? "var(--accent)" : "var(--border)"}`,
                  }}>
                    <div>
                      <span style={{ fontSize: "var(--fs-sm)", fontWeight: 500, color: "var(--text)", fontFamily: "var(--font-mono)" }}>{tr.pair}</span>
                      <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginLeft: 8 }}>{tr.date?.slice(5)}</span>
                    </div>
                    <span style={{ fontSize: "var(--fs-sm)", color: (tr.pnl ?? 0) >= 0 ? "var(--success)" : "var(--danger)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                      {(tr.pnl ?? 0) >= 0 ? "+" : ""}{formatCurrency(tr.pnl ?? 0, false, sym)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "badge" && (
            <div className="stat-card">
              <label>Pilih Badge</label>
              {earnedBadges.length === 0 ? (
                <div style={{ color: "var(--text-dim)", fontSize: "var(--fs-sm)", textAlign: "center", padding: "20px 0" }}>
                  Belum ada badge. Terus trading!
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8 }}>
                  {earnedBadges.map(b => (
                    <div key={b.id} onClick={() => setSelectedBadge(b)} style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
                      borderRadius: "var(--r-md)", cursor: "pointer",
                      background: selectedBadge?.id === b.id ? "var(--gold-dim)" : "var(--bg-subtle)",
                      border: `1px solid ${selectedBadge?.id === b.id ? "var(--gold)" : "var(--border)"}`,
                    }}>
                      <span style={{ fontSize: 18 }}>{b.icon}</span>
                      <div>
                        <div style={{ fontSize: "var(--fs-xs)", color: "var(--text)", fontWeight: 500 }}>{b.name}</div>
                        <div style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)" }}>{b.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {shareText && (
            <div className="stat-card">
              <div className="section-label" style={{ marginBottom: 8 }}>Teks untuk di-copy</div>
              <pre style={{ background: "var(--bg-subtle)", borderRadius: "var(--r-md)", padding: "10px 12px", fontSize: "var(--fs-xs)", color: "var(--text-muted)", lineHeight: 1.8, whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)", margin: 0, overflowX: "auto" }}>
                {shareText}
              </pre>
              <button className="btn-primary" onClick={() => copyText(shareText, setCopied)}
                style={{ width: "100%", marginTop: 10, justifyContent: "center", display: "flex" }}>
                {copied ? "✓ Tersalin!" : "📋 Copy Teks"}
              </button>
            </div>
          )}
        </div>

        {/* Preview */}
        <div>
          <div className="section-label" style={{ marginBottom: 10 }}>Preview Card</div>
          {activeTab === "performance" && (
            <PerformanceCard stats={periodStats} trades={periodTrades} settings={settings} currencyMeta={currencyMeta} username={username} period={period}/>
          )}
          {activeTab === "trade" && (selectedTrade
            ? <TradeCard trade={selectedTrade} sym={sym}/>
            : <div style={{ background: "var(--bg-subtle)", borderRadius: "var(--r-lg)", padding: "40px 24px", textAlign: "center", color: "var(--text-dim)", fontSize: "var(--fs-sm)" }}>Pilih trade di kiri untuk preview</div>
          )}
          {activeTab === "badge" && (selectedBadge
            ? <AchievementCard badge={selectedBadge} username={username}/>
            : <div style={{ background: "var(--bg-subtle)", borderRadius: "var(--r-lg)", padding: "40px 24px", textAlign: "center", color: "var(--text-dim)", fontSize: "var(--fs-sm)" }}>Pilih badge di kiri untuk preview</div>
          )}
          <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 10, textAlign: "center" }}>
            Screenshot card ini untuk share ke social media
          </p>
        </div>
      </div>
    </div>
  );
}