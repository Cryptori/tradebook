import { useState, useMemo, useEffect } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { formatCurrency } from "../../utils/formatters";

// ── TradingView symbol ────────────────────────────────────────────
function toTVSymbol(pair, market) {
  const c = (pair || "").replaceAll("/","").replaceAll("-","").replaceAll(" ","").toUpperCase();
  if (!c) return null;
  if (market === "Forex")        return `FX:${c}`;
  if (market === "Crypto")       return `BINANCE:${c}T`;
  if (market === "Gold")         return "TVC:XAUUSD";
  if (market === "Saham IDX")    return `IDX:${c}`;
  if (market === "Saham Global") return `NASDAQ:${c}`;
  return c;
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

// ── TradingView chart ─────────────────────────────────────────────
function TVChart({ symbol, interval, themeName, height = 460 }) {
  if (!symbol) return (
    <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)", fontSize: "var(--fs-sm)", background: "var(--bg-subtle)", borderRadius: "var(--r-lg)" }}>
      Pilih trade untuk melihat chart
    </div>
  );

  const src = `https://www.tradingview.com/widgetembed/?symbol=${encodeURIComponent(symbol)}&interval=${interval}&theme=${themeName === "light" ? "light" : "dark"}&style=1&locale=id&toolbar_bg=%23090e1a&enable_publishing=false&hide_side_toolbar=false&allow_symbol_change=false&save_image=false&hideideas=1&hide_top_toolbar=0`;

  return (
    <iframe key={`${symbol}-${interval}`} src={src}
      style={{ width: "100%", height, border: "none", borderRadius: "var(--r-lg)" }}
      title="TradingView Chart" allowFullScreen/>
  );
}

// ── Level badges ──────────────────────────────────────────────────
function LevelBadges({ trade }) {
  const levels = [
    { label: "Entry", val: trade.entry,      color: "var(--accent2)" },
    { label: "SL",    val: trade.stopLoss,   color: "var(--danger)"  },
    { label: "TP",    val: trade.takeProfit, color: "var(--success)"  },
    { label: "Exit",  val: trade.exit,       color: (trade.pnl ?? 0) >= 0 ? "var(--success)" : "var(--danger)" },
  ].filter(l => l.val && parseFloat(l.val) > 0);

  if (!levels.length) return null;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {levels.map(l => (
        <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 100, background: `${l.color}15`, border: `1px solid ${l.color}30` }}>
          <span style={{ fontSize: "var(--fs-2xs)", color: l.color, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>{l.label}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", color: l.color }}>{parseFloat(l.val).toFixed(5)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Annotation panel ──────────────────────────────────────────────
function AnnotationPanel({ trade, annotations, onSave }) {
  const [text, setText] = useState(annotations[trade?.id] || "");
  useEffect(() => { setText(annotations[trade?.id] || ""); }, [trade?.id, annotations]);
  if (!trade) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div className="section-label">Catatan Replay</div>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={4}
        placeholder="Observasi, apa yang bisa diperbaiki, lesson learned..."
        style={{ lineHeight: 1.6 }}/>
      <button onClick={() => onSave(trade.id, text)} className="btn-primary" style={{ justifyContent: "center" }}>
        💾 Simpan Catatan
      </button>
      {annotations[trade.id] && (
        <div style={{ fontSize: "var(--fs-xs)", color: "var(--accent)" }}>✓ Catatan tersimpan</div>
      )}
    </div>
  );
}

// ── Trade detail ──────────────────────────────────────────────────
function TradeDetail({ trade, sym }) {
  if (!trade) return (
    <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-dim)", fontSize: "var(--fs-sm)" }}>
      Pilih trade untuk lihat detail
    </div>
  );

  const isWin  = (trade.pnl ?? 0) >= 0;
  const accent = isWin ? "var(--success)" : "var(--danger)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 4, height: 36, background: accent, borderRadius: 4 }}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-base)", fontWeight: 700, color: "var(--text)" }}>{trade.pair}</div>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>{trade.date} · {trade.session}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-lg)", color: accent, fontWeight: 700 }}>
            {isWin ? "+" : ""}{sym}{(trade.pnl ?? 0).toFixed(0)}
          </div>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>{(trade.rr || 0).toFixed(2)}R</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {[
          { label: "Side",     val: trade.side,     color: trade.side === "BUY" ? "var(--success)" : "var(--warning)" },
          { label: "Strategy", val: trade.strategy, color: "var(--text)" },
          { label: "Market",   val: trade.market,   color: "var(--text-muted)" },
          { label: "Emotion",  val: trade.emotion,  color: "var(--text-muted)" },
          { label: "Size",     val: trade.size ? `${trade.size} lot` : "—", color: "var(--text)" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--bg-subtle)", borderRadius: "var(--r-md)", padding: "7px 9px" }}>
            <div className="kpi-label">{s.label}</div>
            <div style={{ fontSize: "var(--fs-sm)", color: s.color, fontWeight: 500, marginTop: 2 }}>{s.val || "—"}</div>
          </div>
        ))}
      </div>

      <LevelBadges trade={trade}/>

      {trade.notes && (
        <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "8px 12px", fontSize: "var(--fs-sm)", color: "var(--text-muted)", lineHeight: 1.6, fontStyle: "italic" }}>
          "{trade.notes}"
        </div>
      )}
    </div>
  );
}

// ── Trade picker ──────────────────────────────────────────────────
function TradePicker({ trades, selected, onSelect, filterPair, setFilterPair, sym }) {
  const pairs    = [...new Set(trades.map(tr => tr.pair).filter(Boolean))].sort();
  const filtered = filterPair ? trades.filter(tr => tr.pair === filterPair) : trades;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <select value={filterPair} onChange={e => setFilterPair(e.target.value)}
        style={{ height: 30, fontSize: "var(--fs-xs)" }}>
        <option value="">Semua Pair</option>
        {pairs.map(p => <option key={p}>{p}</option>)}
      </select>
      <div style={{ maxHeight: 240, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
        {filtered.slice(0, 30).map(tr => (
          <div key={tr.id} onClick={() => onSelect(tr)} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "7px 10px", borderRadius: "var(--r-md)", cursor: "pointer",
            background: selected?.id === tr.id ? "var(--accent-dim)" : "transparent",
            border: `1px solid ${selected?.id === tr.id ? "var(--accent)" : "transparent"}`,
            transition: "all var(--t-base)",
          }}
            onMouseEnter={e => { if (selected?.id !== tr.id) e.currentTarget.style.background = "var(--bg-subtle)"; }}
            onMouseLeave={e => { if (selected?.id !== tr.id) e.currentTarget.style.background = "transparent"; }}>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text)" }}>{tr.pair}</div>
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>{tr.date?.slice(5)} · {tr.side}</div>
            </div>
            <span style={{ fontSize: "var(--fs-sm)", color: (tr.pnl ?? 0) >= 0 ? "var(--success)" : "var(--danger)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
              {(tr.pnl ?? 0) >= 0 ? "+" : ""}{sym}{(tr.pnl ?? 0).toFixed(0)}
            </span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-dim)", textAlign: "center", padding: "16px 0" }}>Tidak ada trade</div>
        )}
      </div>
    </div>
  );
}

// ── Main TradeReplay ──────────────────────────────────────────────
export default function TradeReplay({ trades, currencyMeta, theme, initialTrade }) {
  const sym = currencyMeta?.symbol ?? "$";
  const { isMobile } = useBreakpoint();
  const [selected,     setSelected]     = useState(initialTrade || null);
  const [interval,     setInterval]     = useState("60");
  const [filterPair,   setFilterPair]   = useState("");
  const [annotations,  setAnnotations]  = useState(() => {
    try { return JSON.parse(localStorage.getItem("tb_replay_notes") || "{}"); } catch { return {}; }
  });

  useEffect(() => { if (initialTrade) setSelected(initialTrade); }, [initialTrade?.id]); // eslint-disable-line

  const sortedTrades = useMemo(() =>
    [...(trades || [])].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [trades]
  );

  const tvSymbol = selected ? toTVSymbol(selected.pair, selected.market) : null;

  function saveAnnotation(tradeId, text) {
    const updated = { ...annotations, [tradeId]: text };
    setAnnotations(updated);
    try { localStorage.setItem("tb_replay_notes", JSON.stringify(updated)); } catch {}
  }

  if (!trades?.length) return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 20 }}>Trade Replay</h1>
      <div className="stat-card">
        <div className="empty-state">
          <div className="empty-icon">▶️</div>
          <div className="empty-title">Belum ada trade</div>
          <div className="empty-desc">Log beberapa trade terlebih dahulu untuk mulai replay</div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 className="page-title">Trade Replay</h1>
          <p className="page-subtitle">Analisis ulang trade dengan TradingView chart</p>
        </div>
        <div style={{ display: "flex", gap: 2, background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 2 }}>
          {TIMEFRAMES.map(tf => (
            <button key={tf.value} onClick={() => setInterval(tf.value)} style={{
              padding: "4px 9px", borderRadius: "var(--r-sm)", border: "none", cursor: "pointer",
              fontSize: "var(--fs-xs)", fontFamily: "var(--font-mono)",
              background: interval === tf.value ? "var(--accent)"      : "transparent",
              color:      interval === tf.value ? "var(--text-inverse)" : "var(--text-dim)",
              fontWeight: interval === tf.value ? 600 : 400,
            }}>{tf.label}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 260px", gap: 14, alignItems: "start" }}>
        {/* Chart */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {selected && <LevelBadges trade={selected}/>}
          <TVChart symbol={tvSymbol} interval={interval} themeName={theme?.name} height={isMobile ? 300 : 480}/>
        </div>

        {/* Right panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="stat-card">
            <div className="section-label" style={{ marginBottom: 10 }}>Pilih Trade</div>
            <TradePicker trades={sortedTrades} selected={selected} onSelect={setSelected}
              filterPair={filterPair} setFilterPair={setFilterPair} sym={sym}/>
          </div>

          {selected && (
            <div className="stat-card">
              <div className="section-label" style={{ marginBottom: 10 }}>Detail Trade</div>
              <TradeDetail trade={selected} sym={sym}/>
            </div>
          )}

          {selected && (
            <div className="stat-card">
              <AnnotationPanel trade={selected} annotations={annotations} onSave={saveAnnotation}/>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}