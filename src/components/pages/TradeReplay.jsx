import { useState, useMemo } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { formatCurrency } from "../../utils/formatters";

// ── TradingView symbol map ────────────────────────────────────────
function toTVSymbol(pair, market) {
  const clean = pair.replaceAll("/", "").replaceAll("-", "").replaceAll(" ", "").toUpperCase();
  if (!clean) return null;

  if (market === "Forex")        return `FX:${clean}`;
  if (market === "Crypto")       return `BINANCE:${clean}`;
  if (market === "Saham IDX")    return `IDX:${clean}`;
  if (market === "Saham Global") return `NASDAQ:${clean}`;
  return clean;
}

const TIMEFRAMES = [
  { label: "1m",  value: "1"   },
  { label: "5m",  value: "5"   },
  { label: "15m", value: "15"  },
  { label: "1H",  value: "60"  },
  { label: "4H",  value: "240" },
  { label: "D",   value: "D"   },
  { label: "W",   value: "W"   },
];

// ── TradingView Widget ────────────────────────────────────────────
function TVChart({ symbol, interval, theme, height = 500 }) {
  if (!symbol) return (
    <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center",
      color: theme.textDim, fontSize: 13, background: theme.bgSubtle, borderRadius: 10 }}>
      Pilih trade untuk melihat chart
    </div>
  );

  const src = `https://www.tradingview.com/widgetembed/?symbol=${encodeURIComponent(symbol)}&interval=${interval}&theme=${theme.name === "light" ? "light" : "dark"}&style=1&locale=id&toolbar_bg=%23090e1a&enable_publishing=false&hide_side_toolbar=false&allow_symbol_change=false&save_image=false&hideideas=1&hide_top_toolbar=0`;

  return (
    <iframe
      key={`${symbol}-${interval}-${theme.name}`}
      src={src}
      style={{ width: "100%", height, borderRadius: 10, border: `1px solid ${theme.border}`, display: "block" }}
      allowtransparency="true"
      scrolling="no"
      title={`TradingView - ${symbol}`}
    />
  );
}

// ── Trade Info Panel ──────────────────────────────────────────────
function TradeInfoPanel({ trade, sym, theme: t }) {
  const isWin   = trade.pnl >= 0;
  const accent  = isWin ? "#00d4aa" : "#ef4444";

  const screenshots = Array.isArray(trade.screenshots)
    ? trade.screenshots
    : (trade.screenshotUrl ? [trade.screenshotUrl] : []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div style={{ background: `${accent}10`, border: `1px solid ${accent}30`,
        borderRadius: 10, padding: "12px 16px" }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20,
          letterSpacing: 2, color: t.text }}>{trade.pair}</div>
        <div style={{ fontSize: 11, color: t.textDim, marginTop: 2 }}>
          {trade.date} · {trade.market} · {trade.session}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <span className={`badge badge-${(trade.side ?? "").toLowerCase()}`}>{trade.side}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: accent }}>
            {formatCurrency(trade.pnl, false, sym)}
          </span>
          <span style={{ fontSize: 12, color: t.textDim }}>
            {(trade.rr ?? 0) >= 0 ? "+" : ""}{(trade.rr ?? 0).toFixed(1)}R
          </span>
        </div>
      </div>

      {/* Levels */}
      {[
        ["Entry",  trade.entry],
        ["Exit",   trade.exit],
        ["SL",     trade.stopLoss],
        ["TP",     trade.takeProfit],
        ["Size",   trade.size],
      ].filter(([, v]) => v).map(([label, value]) => (
        <div key={label} style={{ display: "flex", justifyContent: "space-between",
          fontSize: 12, padding: "4px 0", borderBottom: `1px solid ${t.borderSubtle}` }}>
          <span style={{ color: t.textDim }}>{label}</span>
          <span style={{ color: t.text, fontWeight: 500 }}>{value}</span>
        </div>
      ))}

      {/* Strategy + Emotion */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {[trade.strategy, trade.emotion].filter(Boolean).map(tag => (
          <span key={tag} style={{ fontSize: 10, background: t.bgSubtle,
            border: `1px solid ${t.borderSubtle}`, borderRadius: 6, padding: "3px 9px", color: t.textMuted }}>
            {tag}
          </span>
        ))}
      </div>

      {/* Notes */}
      {trade.notes && (
        <div style={{ fontSize: 11, color: t.textMuted, background: t.bgSubtle,
          border: `1px solid ${t.borderSubtle}`, borderRadius: 8, padding: "8px 12px",
          lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
          {trade.notes}
        </div>
      )}

      {/* Screenshots */}
      {screenshots.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: t.textDim, marginBottom: 6,
            textTransform: "uppercase", letterSpacing: "0.08em" }}>Screenshots</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {screenshots.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer">
                <img src={url} alt={`ss-${i}`}
                  style={{ width: "100%", borderRadius: 8, border: `1px solid ${t.border}`,
                    maxHeight: 160, objectFit: "cover", display: "block" }}
                  onError={e => { e.target.style.display = "none"; }} />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main TradeReplay Page ─────────────────────────────────────────
export default function TradeReplay({ trades, currencyMeta, theme }) {
  const t   = theme;
  const sym = currencyMeta?.symbol ?? "$";
  const { isMobile, md } = useBreakpoint();

  const [selectedId, setSelectedId] = useState(null);
  const [interval,   setInterval]   = useState("60");
  const [search,     setSearch]     = useState("");
  const [filterSide, setFilterSide] = useState("All");

  const filtered = useMemo(() => {
    let s = [...trades].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (filterSide !== "All") s = s.filter(tr => tr.side === filterSide);
    if (search.trim()) {
      const q = search.toLowerCase();
      s = s.filter(tr => tr.pair.toLowerCase().includes(q) || (tr.strategy ?? "").toLowerCase().includes(q));
    }
    return s;
  }, [trades, filterSide, search]);

  const selected = trades.find(t => t.id === selectedId) ?? filtered[0] ?? null;
  const tvSymbol = selected ? toTVSymbol(selected.pair, selected.market) : null;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24,
            letterSpacing: 2, color: t.text }}>TRADE REPLAY</div>
          <div style={{ fontSize: 11, color: t.textDim }}>
            Review trade langsung di chart TradingView
          </div>
        </div>
        {/* Timeframe picker */}
        <div style={{ display: "flex", gap: 4, background: t.bgSubtle,
          border: `1px solid ${t.border}`, borderRadius: 10, padding: 3 }}>
          {TIMEFRAMES.map(tf => (
            <button key={tf.value} onClick={() => setInterval(tf.value)}
              style={{ padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer",
                fontFamily: "DM Mono, monospace", fontSize: 11,
                background: interval === tf.value ? t.accent : "transparent",
                color: interval === tf.value ? "#090e1a" : t.textDim,
                fontWeight: interval === tf.value ? 600 : 400,
                transition: "all 0.15s" }}>
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {trades.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📺</div>
          <div style={{ fontSize: 16, color: t.text, marginBottom: 8 }}>Belum Ada Trade</div>
          <div style={{ fontSize: 13, color: t.textDim }}>
            Log trade dulu di Journal untuk bisa replay di sini.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: isMobile ? "column-reverse" : "row",
          gap: 16, alignItems: "start" }}>

          {/* Trade list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, width: isMobile ? "100%" : 220, flexShrink: 0 }}>
            {/* Filters */}
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari pair / strategy..."
              style={{ background: t.bgInput, border: `1px solid ${t.border}`,
                color: t.text, padding: "8px 10px", borderRadius: 8, fontSize: 11, outline: "none" }} />
            <div style={{ display: "flex", gap: 4 }}>
              {["All", "BUY", "SELL"].map(s => (
                <button key={s} onClick={() => setFilterSide(s)}
                  style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: "none",
                    cursor: "pointer", fontSize: 11, fontFamily: "DM Mono, monospace",
                    background: filterSide === s ? t.accent : t.bgSubtle,
                    color: filterSide === s ? "#090e1a" : t.textDim }}>
                  {s}
                </button>
              ))}
            </div>

            {/* Trade items */}
            <div style={{ maxHeight: isMobile ? "30vh" : "70vh", overflowY: "auto",
              display: "flex", flexDirection: "column", gap: 4 }}>
              {filtered.map(trade => {
                const isWin = trade.pnl >= 0;
                const isSel = trade.id === (selected?.id);
                return (
                  <div key={trade.id} onClick={() => setSelectedId(trade.id)}
                    style={{ padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                      background: isSel ? `${isWin ? "#00d4aa" : "#ef4444"}15` : t.bgCard,
                      borderTop: `1px solid ${isSel ? (isWin ? "#00d4aa" : "#ef4444") : t.borderSubtle}`,
                      borderRight: `1px solid ${isSel ? (isWin ? "#00d4aa" : "#ef4444") : t.borderSubtle}`,
                      borderBottom: `1px solid ${isSel ? (isWin ? "#00d4aa" : "#ef4444") : t.borderSubtle}`,
                      borderLeft: `3px solid ${isWin ? "#00d4aa" : "#ef4444"}`,
                      transition: "all 0.15s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: t.text }}>{trade.pair}</span>
                      <span style={{ fontSize: 11, color: isWin ? "#00d4aa" : "#ef4444", fontWeight: 500 }}>
                        {formatCurrency(trade.pnl, true, sym)}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: t.textDim, marginTop: 2 }}>
                      {trade.date} · {trade.strategy}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart + info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, minWidth: 0 }}>
            {/* TradingView */}
            <TVChart symbol={tvSymbol} interval={interval} theme={t}
              height={isMobile ? 300 : 520} />

            {/* Trade info */}
            {selected && (
              <div className="stat-card">
                <TradeInfoPanel trade={selected} sym={sym} theme={t} />
              </div>
            )}

            {/* TradingView attribution */}
            <div style={{ fontSize: 10, color: t.textDim, textAlign: "center" }}>
              Chart powered by{" "}
              <a href="https://www.tradingview.com" target="_blank" rel="noreferrer"
                style={{ color: t.accent }}>TradingView</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}