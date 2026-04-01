import { useState, useMemo } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { formatCurrency } from "../../utils/formatters";

// ── Lightbox ──────────────────────────────────────────────────────
function Lightbox({ item, onClose, onPrev, onNext, index, total }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.96)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>

      {/* Close */}
      <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>

      {/* Counter + trade info */}
      <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", textAlign: "center" }}>
        <div style={{ fontSize: "var(--fs-xs)", color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-mono)" }}>{index + 1} / {total}</div>
        {item.trade && (
          <div style={{ fontSize: "var(--fs-xs)", color: "rgba(255,255,255,0.7)", display: "flex", gap: 8, marginTop: 3 }}>
            <span style={{ color: (item.trade.pnl ?? 0) >= 0 ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>{item.trade.pair}</span>
            <span>·</span>
            <span>{item.trade.date}</span>
            <span>·</span>
            <span style={{ color: (item.trade.pnl ?? 0) >= 0 ? "var(--success)" : "var(--danger)" }}>
              {(item.trade.pnl ?? 0) >= 0 ? "+" : ""}{formatCurrency(item.trade.pnl ?? 0, false, "$")}
            </span>
          </div>
        )}
      </div>

      {/* Prev */}
      {total > 1 && (
        <button onClick={onPrev} style={{ position: "absolute", left: 14, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "50%", width: 44, height: 44, cursor: "pointer", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
      )}

      {/* Image + caption */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, maxWidth: "88vw" }}>
        <img src={item.url} alt="screenshot"
          style={{ maxWidth: "84vw", maxHeight: "72vh", objectFit: "contain", borderRadius: "var(--r-lg)" }}
          onError={e => { e.target.style.display = "none"; }}/>
        {item.caption && (
          <div style={{ fontSize: "var(--fs-sm)", color: "rgba(255,255,255,0.7)", textAlign: "center", maxWidth: 480, lineHeight: 1.6, fontStyle: "italic" }}>
            "{item.caption}"
          </div>
        )}
      </div>

      {/* Next */}
      {total > 1 && (
        <button onClick={onNext} style={{ position: "absolute", right: 14, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "50%", width: 44, height: 44, cursor: "pointer", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
      )}
    </div>
  );
}

// ── Main ScreenshotGallery ────────────────────────────────────────
export default function ScreenshotGallery({ trades, onOpenTrade, theme }) {
  const { isMobile } = useBreakpoint();
  const [filterPair,     setFilterPair]     = useState("");
  const [filterStrategy, setFilterStrategy] = useState("");
  const [filterResult,   setFilterResult]   = useState("all");
  const [lightbox,       setLightbox]       = useState(null);

  const allItems = useMemo(() => {
    const items = [];
    (trades || []).forEach(trade => {
      const screenshots = Array.isArray(trade.screenshots)
        ? trade.screenshots
        : trade.screenshotUrl ? [trade.screenshotUrl] : [];
      const captions = trade.screenshotCaptions || {};
      screenshots.forEach((url, idx) => {
        if (!url) return;
        items.push({ url, caption: captions[idx] || "", trade, ssIndex: idx, id: `${trade.id}_${idx}` });
      });
    });
    return items.sort((a, b) => new Date(b.trade.date) - new Date(a.trade.date));
  }, [trades]);

  const pairs      = useMemo(() => [...new Set(allItems.map(i => i.trade.pair))].sort(), [allItems]);
  const strategies = useMemo(() => [...new Set(allItems.map(i => i.trade.strategy).filter(Boolean))].sort(), [allItems]);

  const filtered = useMemo(() => allItems.filter(item => {
    if (filterPair     && item.trade.pair     !== filterPair)     return false;
    if (filterStrategy && item.trade.strategy !== filterStrategy) return false;
    if (filterResult === "win"  && (item.trade.pnl ?? 0) <  0) return false;
    if (filterResult === "loss" && (item.trade.pnl ?? 0) >= 0) return false;
    return true;
  }), [allItems, filterPair, filterStrategy, filterResult]);

  const hasFilters = filterPair || filterStrategy || filterResult !== "all";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div>
        <h1 className="page-title">Screenshot Gallery</h1>
        <p className="page-subtitle">{filtered.length} dari {allItems.length} screenshot</p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 2, background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 2 }}>
          {[{ v: "all", l: "All" }, { v: "win", l: "✅ Win" }, { v: "loss", l: "❌ Loss" }].map(f => (
            <button key={f.v} onClick={() => setFilterResult(f.v)} style={{
              padding: "5px 12px", borderRadius: "var(--r-sm)", border: "none", cursor: "pointer",
              fontSize: "var(--fs-xs)",
              background: filterResult === f.v ? "var(--accent)"      : "transparent",
              color:      filterResult === f.v ? "var(--text-inverse)" : "var(--text-dim)",
              fontWeight: filterResult === f.v ? 600 : 400,
            }}>{f.l}</button>
          ))}
        </div>

        <select value={filterPair} onChange={e => setFilterPair(e.target.value)}
          style={{ width: "auto", height: 30, fontSize: "var(--fs-xs)" }}>
          <option value="">Semua Pair</option>
          {pairs.map(p => <option key={p}>{p}</option>)}
        </select>

        <select value={filterStrategy} onChange={e => setFilterStrategy(e.target.value)}
          style={{ width: "auto", height: 30, fontSize: "var(--fs-xs)" }}>
          <option value="">Semua Strategy</option>
          {strategies.map(s => <option key={s}>{s}</option>)}
        </select>

        {hasFilters && (
          <button onClick={() => { setFilterPair(""); setFilterStrategy(""); setFilterResult("all"); }}
            className="btn-ghost" style={{ height: 30, fontSize: "var(--fs-xs)" }}>
            ✕ Reset
          </button>
        )}
      </div>

      {/* Gallery */}
      {filtered.length === 0 ? (
        <div className="stat-card">
          <div className="empty-state">
            <div className="empty-icon">🖼️</div>
            <div className="empty-title">{allItems.length === 0 ? "Belum ada screenshot" : "Tidak ada yang cocok"}</div>
            <div className="empty-desc">
              {allItems.length === 0 ? "Upload screenshot saat log trade untuk melihat gallery di sini" : "Coba ganti filter"}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10 }}>
          {filtered.map((item, idx) => {
            const positive = (item.trade.pnl ?? 0) >= 0;
            return (
              <div key={item.id} style={{
                borderRadius: "var(--r-lg)", overflow: "hidden",
                border: "1px solid var(--border)", cursor: "pointer",
                position: "relative", transition: "transform var(--t-base), border-color var(--t-base)",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = positive ? "var(--success)" : "var(--danger)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "var(--border)"; }}>
                <img src={item.url} alt="ss"
                  onClick={() => setLightbox(idx)}
                  style={{ width: "100%", height: isMobile ? 96 : 120, objectFit: "cover", display: "block" }}
                  onError={e => { e.target.parentElement.style.display = "none"; }}/>
                <div style={{ padding: "8px 10px", background: "var(--bg-card)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text)", fontFamily: "var(--font-mono)" }}>{item.trade.pair}</span>
                    <span style={{ fontSize: "var(--fs-sm)", color: positive ? "var(--success)" : "var(--danger)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                      {positive ? "+" : ""}{formatCurrency(item.trade.pnl ?? 0, false, "$")}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 3 }}>
                    <span style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)" }}>{item.trade.date}</span>
                    <button onClick={() => onOpenTrade?.(item.trade)}
                      style={{ fontSize: "var(--fs-2xs)", color: "var(--accent)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      Lihat →
                    </button>
                  </div>
                  {item.caption && (
                    <div style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)", marginTop: 4, fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      "{item.caption}"
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {lightbox !== null && (
        <Lightbox item={filtered[lightbox]} index={lightbox} total={filtered.length}
          onClose={() => setLightbox(null)}
          onPrev={() => setLightbox(i => (i - 1 + filtered.length) % filtered.length)}
          onNext={() => setLightbox(i => (i + 1) % filtered.length)}/>
      )}
    </div>
  );
}