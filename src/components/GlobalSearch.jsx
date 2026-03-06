import { useState, useEffect, useRef, useMemo } from "react";
import { formatCurrency } from "../utils/formatters";

export default function GlobalSearch({ trades, onNavigate, currencyMeta, theme: t }) {
  const [open,  setOpen]  = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const sym = currencyMeta?.symbol ?? "$";

  // Open with Ctrl+K or Cmd+K
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) { setQuery(""); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return trades
      .filter(t =>
        t.pair?.toLowerCase().includes(q) ||
        t.strategy?.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q) ||
        t.market?.toLowerCase().includes(q) ||
        t.emotion?.toLowerCase().includes(q) ||
        t.date?.includes(q)
      )
      .slice(0, 8);
  }, [query, trades]);

  if (!open) return (
    <button onClick={() => setOpen(true)}
      style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px",
        background: t.bgSubtle, border: `1px solid ${t.border}`, borderRadius: 8,
        color: t.textDim, fontFamily: "DM Mono, monospace", fontSize: 11, cursor: "pointer" }}>
      <span>🔍</span>
      <span style={{ display: "none" }} className="search-label">Cari trade...</span>
      <kbd style={{ fontSize: 9, background: t.bgCard, border: `1px solid ${t.border}`,
        borderRadius: 4, padding: "1px 5px", color: t.textDim }}>
        ⌘K
      </kbd>
    </button>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 80, background: "rgba(9,14,26,0.8)" }}
      onClick={e => e.target === e.currentTarget && setOpen(false)}>
      <div style={{ width: "100%", maxWidth: 560, background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>

        {/* Input */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: `1px solid ${t.border}` }}>
          <span style={{ fontSize: 16 }}>🔍</span>
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Cari pair, strategy, notes, tanggal..."
            style={{ flex: 1, background: "transparent", border: "none", color: t.text,
              fontFamily: "DM Mono, monospace", fontSize: 14, outline: "none" }} />
          <kbd onClick={() => setOpen(false)}
            style={{ fontSize: 10, background: t.bgSubtle, border: `1px solid ${t.border}`,
              borderRadius: 4, padding: "2px 7px", color: t.textDim, cursor: "pointer" }}>
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {query && results.length === 0 && (
            <div style={{ padding: "24px 16px", textAlign: "center", color: t.textDim, fontSize: 12 }}>
              Tidak ada trade ditemukan untuk "{query}"
            </div>
          )}
          {!query && (
            <div style={{ padding: "16px", color: t.textDim, fontSize: 11 }}>
              Ketik untuk mencari trade by pair, strategy, notes, atau tanggal...
            </div>
          )}
          {results.map(trade => (
            <div key={trade.id}
              onClick={() => { onNavigate("journal"); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                borderBottom: `1px solid ${t.borderSubtle}`, cursor: "pointer",
                transition: "background 0.1s" }}
              onMouseEnter={e => e.currentTarget.style.background = t.bgHover}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <span className={`badge badge-${(trade.side ?? "").toLowerCase()}`}>
                {trade.side}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, color: t.text, fontSize: 13 }}>{trade.pair}</div>
                <div style={{ fontSize: 10, color: t.textDim, marginTop: 2 }}>
                  {trade.date} · {trade.strategy} · {trade.market}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: trade.pnl >= 0 ? "#00d4aa" : "#ef4444" }}>
                  {formatCurrency(trade.pnl, false, sym)}
                </div>
                <div style={{ fontSize: 10, color: t.textDim }}>
                  {(trade.rr ?? 0) >= 0 ? "+" : ""}{(trade.rr ?? 0).toFixed(1)}R
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div style={{ padding: "8px 16px", borderTop: `1px solid ${t.border}`,
          display: "flex", gap: 16, fontSize: 10, color: t.textDim }}>
          <span>↵ ke Journal</span>
          <span>Esc tutup</span>
          <span style={{ marginLeft: "auto" }}>{trades.length} trades</span>
        </div>
      </div>
    </div>
  );
}