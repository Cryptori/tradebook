import { useState, useMemo, useRef, useEffect } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { formatCurrency } from "../../utils/formatters";

// ── TradingView symbol map ────────────────────────────────────────
function toTVSymbol(pair, market) {
  const clean = (pair || "").replaceAll("/","").replaceAll("-","").replaceAll(" ","").toUpperCase();
  if (!clean) return null;
  if (market === "Forex")        return `FX:${clean}`;
  if (market === "Crypto")       return `BINANCE:${clean}T`;
  if (market === "Gold")         return `TVC:XAUUSD`;
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

// ── TradingView Chart ─────────────────────────────────────────────
function TVChart({ symbol, interval, theme: t, height = 460 }) {
  if (!symbol) return (
    <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: t.textDim, fontSize: 13, background: t.bgSubtle, borderRadius: 10 }}>
      Pilih trade untuk melihat chart
    </div>
  );

  const src = `https://www.tradingview.com/widgetembed/?symbol=${encodeURIComponent(symbol)}&interval=${interval}&theme=${t.name === "light" ? "light" : "dark"}&style=1&locale=id&toolbar_bg=%23090e1a&enable_publishing=false&hide_side_toolbar=false&allow_symbol_change=false&save_image=false&hideideas=1&hide_top_toolbar=0`;

  return (
    <iframe
      key={`${symbol}-${interval}-${t.name}`}
      src={src}
      style={{ width: "100%", height, border: "none", borderRadius: 10 }}
      title="TradingView Chart"
      allowFullScreen
    />
  );
}

// ── Entry/SL/TP overlay info ──────────────────────────────────────
function LevelBadges({ trade, theme: t }) {
  if (!trade) return null;
  const levels = [
    { label: "Entry", value: trade.entry, color: "#0ea5e9" },
    { label: "SL",    value: trade.stopLoss,   color: "#ef4444" },
    { label: "TP",    value: trade.takeProfit, color: "#00c896" },
    { label: "Exit",  value: trade.exit,       color: trade.pnl >= 0 ? "#00c896" : "#ef4444" },
  ].filter(l => l.value && parseFloat(l.value) > 0);

  if (!levels.length) return null;

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {levels.map(l => (
        <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 100, background: l.color + "15", border: `1px solid ${l.color}30` }}>
          <span style={{ fontSize: 9, color: l.color, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>{l.label}</span>
          <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: l.color }}>{parseFloat(l.value).toFixed(5)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Annotation panel ──────────────────────────────────────────────
function AnnotationPanel({ trade, annotations, onSave, theme: t }) {
  const [text, setText] = useState(annotations[trade?.id] || "");
  const saved = annotations[trade?.id];

  useEffect(() => { setText(annotations[trade?.id] || ""); }, [trade?.id, annotations]);

  if (!trade) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600 }}>
        Catatan Replay
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={4}
        placeholder="Tulis observasi, apa yang bisa diperbaiki, lesson learned..."
        style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, resize: "vertical", fontSize: 12, lineHeight: 1.6 }}
      />
      <button onClick={() => onSave(trade.id, text)} className="btn-primary" style={{ fontSize: 11, justifyContent: "center" }}>
        💾 Simpan Catatan
      </button>
      {saved && <div style={{ fontSize: 10, color: "#00c896" }}>✓ Catatan tersimpan</div>}
    </div>
  );
}

// ── Trade detail side panel ───────────────────────────────────────
function TradeDetail({ trade, sym, theme: t }) {
  if (!trade) return (
    <div style={{ textAlign: "center", padding: "32px 16px", color: t.textDim, fontSize: 12 }}>
      Pilih trade untuk lihat detail
    </div>
  );

  const isWin  = trade.pnl >= 0;
  const accent = isWin ? "#00c896" : "#ef4444";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 4, height: 36, background: accent, borderRadius: 4 }} />
        <div>
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: 16, fontWeight: 700, color: t.text }}>{trade.pair}</div>
          <div style={{ fontSize: 10, color: t.textDim }}>{trade.date} · {trade.session}</div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: 18, color: accent, fontWeight: 700 }}>
            {isWin ? "+" : ""}{sym}{trade.pnl?.toFixed(0)}
          </div>
          <div style={{ fontSize: 10, color: t.textDim }}>{(trade.rr || 0).toFixed(2)}R</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {[
          { label: "Side",     value: trade.side,     color: trade.side === "BUY" ? "#00c896" : "#f59e0b" },
          { label: "Strategy", value: trade.strategy, color: t.text },
          { label: "Market",   value: trade.market,   color: t.textMuted },
          { label: "Emotion",  value: trade.emotion,  color: t.textMuted },
          { label: "Size",     value: trade.size ? trade.size + " lot" : "—", color: t.text },
        ].map(s => (
          <div key={s.label} style={{ background: t.bgSubtle, borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ fontSize: 9, color: t.textDim, marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 12, color: s.color, fontWeight: 500 }}>{s.value || "—"}</div>
          </div>
        ))}
      </div>

      {/* Level badges */}
      <LevelBadges trade={trade} theme={t} />

      {/* Notes */}
      {trade.notes && (
        <div style={{ background: t.bgSubtle, borderRadius: 8, padding: "10px 12px", fontSize: 12, color: t.textMuted, lineHeight: 1.6, fontStyle: "italic" }}>
          "{trade.notes}"
        </div>
      )}
    </div>
  );
}

// ── Trade picker ──────────────────────────────────────────────────
function TradePicker({ trades, selected, onSelect, filterPair, setFilterPair, sym, theme: t }) {
  const pairs = [...new Set(trades.map(tr => tr.pair).filter(Boolean))].sort();
  const filtered = filterPair ? trades.filter(tr => tr.pair === filterPair) : trades;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 6 }}>
        <select value={filterPair} onChange={e => setFilterPair(e.target.value)}
          style={{ flex: 1, background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 7, padding: "6px 8px", fontSize: 11 }}>
          <option value="">Semua Pair</option>
          {pairs.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>
      <div style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
        {filtered.slice(0, 30).map(tr => (
          <div key={tr.id} onClick={() => onSelect(tr)}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 8, cursor: "pointer", background: selected?.id === tr.id ? "rgba(0,200,150,0.08)" : "transparent", border: `1px solid ${selected?.id === tr.id ? "rgba(0,200,150,0.3)" : "transparent"}`, transition: "all 0.15s" }}
            onMouseEnter={e => { if (selected?.id !== tr.id) e.currentTarget.style.background = t.bgSubtle; }}
            onMouseLeave={e => { if (selected?.id !== tr.id) e.currentTarget.style.background = "transparent"; }}>
            <div>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, fontWeight: 600, color: t.text }}>{tr.pair}</div>
              <div style={{ fontSize: 10, color: t.textDim }}>{tr.date?.slice(5)} · {tr.side}</div>
            </div>
            <div style={{ fontSize: 12, color: tr.pnl >= 0 ? "#00c896" : "#ef4444", fontFamily: "DM Mono, monospace", fontWeight: 600 }}>
              {tr.pnl >= 0 ? "+" : ""}{sym}{tr.pnl?.toFixed(0)}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ fontSize: 12, color: t.textDim, textAlign: "center", padding: "16px 0" }}>Tidak ada trade</div>}
      </div>
    </div>
  );
}

// ── Main TradeReplay ──────────────────────────────────────────────
export default function TradeReplay({ trades, currencyMeta, theme, initialTrade }) {
  const t   = theme;
  const sym = currencyMeta?.symbol ?? "$";
  const { isMobile } = useBreakpoint();

  const [selected,    setSelected]   = useState(initialTrade || null);
  const [interval,    setInterval]   = useState("60");
  const [filterPair,  setFilterPair] = useState("");
  const [annotations, setAnnotations] = useState(() => {
    try { return JSON.parse(localStorage.getItem("tb_replay_notes") || "{}"); } catch { return {}; }
  });

  // If initialTrade passed (from Journal), select it
  useEffect(() => { if (initialTrade) setSelected(initialTrade); }, [initialTrade?.id]);

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
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 3, color: t.text, marginBottom: 20 }}>TRADE REPLAY</div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 24px", textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, rgba(0,200,150,0.08), rgba(0,200,150,0.04))", border: "1px solid rgba(0,200,150,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, marginBottom: 20 }}>▶️</div>
        <div style={{ fontSize: 15, color: t.text, marginBottom: 8 }}>Belum ada trade</div>
        <div style={{ fontSize: 12, color: t.textDim, maxWidth: 280, lineHeight: 1.8 }}>Log beberapa trade terlebih dahulu untuk mulai replay</div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 3, color: t.text, lineHeight: 1 }}>TRADE REPLAY</div>
          <div style={{ fontSize: 11, color: t.textDim, marginTop: 4 }}>Analisis ulang trade dengan TradingView chart</div>
        </div>
        {/* Timeframe */}
        <div style={{ display: "flex", gap: 4, background: t.bgSubtle, border: `1px solid ${t.border}`, borderRadius: 8, padding: 3 }}>
          {TIMEFRAMES.map(tf => (
            <button key={tf.value} onClick={() => setInterval(tf.value)}
              style={{ padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, fontFamily: "DM Mono, monospace", background: interval === tf.value ? t.accent : "transparent", color: interval === tf.value ? "#090e1a" : t.textDim, fontWeight: interval === tf.value ? 600 : 400 }}>
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 280px", gap: 16, alignItems: "start" }}>
        {/* Chart area */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Level badges above chart */}
          {selected && <LevelBadges trade={selected} theme={t} />}
          <TVChart symbol={tvSymbol} interval={interval} theme={t} height={isMobile ? 320 : 480} />
        </div>

        {/* Right panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Trade picker */}
          <div className="stat-card">
            <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600, marginBottom: 10 }}>Pilih Trade</div>
            <TradePicker trades={sortedTrades} selected={selected} onSelect={setSelected} filterPair={filterPair} setFilterPair={setFilterPair} sym={sym} theme={t} />
          </div>

          {/* Trade detail */}
          {selected && (
            <div className="stat-card">
              <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600, marginBottom: 12 }}>Detail Trade</div>
              <TradeDetail trade={selected} sym={sym} theme={t} />
            </div>
          )}

          {/* Annotation */}
          {selected && (
            <div className="stat-card">
              <AnnotationPanel trade={selected} annotations={annotations} onSave={saveAnnotation} theme={t} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}