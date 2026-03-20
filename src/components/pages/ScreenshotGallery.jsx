import { useState, useMemo } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { formatCurrency } from "../../utils/formatters";

// ── Lightbox ──────────────────────────────────────────────────────
function Lightbox({ item, onClose, onPrev, onNext, index, total }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.96)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(4px)" }}>
      <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
      <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "DM Mono, monospace" }}>{index + 1} / {total}</div>
        {item.trade && (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", display: "flex", gap: 8 }}>
            <span style={{ color: item.trade.pnl >= 0 ? "#00c896" : "#ef4444", fontWeight: 600 }}>{item.trade.pair}</span>
            <span>·</span>
            <span>{item.trade.date}</span>
            <span>·</span>
            <span style={{ color: item.trade.pnl >= 0 ? "#00c896" : "#ef4444" }}>
              {item.trade.pnl >= 0 ? "+" : ""}{formatCurrency(item.trade.pnl, false, "$")}
            </span>
          </div>
        )}
      </div>
      {total > 1 && <button onClick={onPrev} style={{ position: "absolute", left: 16, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "50%", width: 44, height: 44, cursor: "pointer", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, maxWidth: "88vw" }}>
        <img src={item.url} alt="screenshot" style={{ maxWidth: "84vw", maxHeight: "72vh", objectFit: "contain", borderRadius: 8 }} onError={e => { e.target.style.display = "none"; }} />
        {item.caption && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", textAlign: "center", maxWidth: 480, lineHeight: 1.6, fontStyle: "italic" }}>"{item.caption}"</div>}
      </div>
      {total > 1 && <button onClick={onNext} style={{ position: "absolute", right: 16, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "50%", width: 44, height: 44, cursor: "pointer", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>}
    </div>
  );
}

export default function ScreenshotGallery({ trades, onOpenTrade, theme: t }) {
  const { isMobile } = useBreakpoint();
  const [filterPair,     setFilterPair]     = useState("");
  const [filterStrategy, setFilterStrategy] = useState("");
  const [filterResult,   setFilterResult]   = useState("all");
  const [lightbox,       setLightbox]       = useState(null);

  // Flatten all screenshots from all trades
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

  // Unique pairs and strategies for filter
  const pairs      = useMemo(() => [...new Set(allItems.map(i => i.trade.pair))].sort(), [allItems]);
  const strategies = useMemo(() => [...new Set(allItems.map(i => i.trade.strategy).filter(Boolean))].sort(), [allItems]);

  // Filtered items
  const filtered = useMemo(() => {
    return allItems.filter(item => {
      if (filterPair     && item.trade.pair     !== filterPair)     return false;
      if (filterStrategy && item.trade.strategy !== filterStrategy) return false;
      if (filterResult === "win"  && item.trade.pnl < 0)  return false;
      if (filterResult === "loss" && item.trade.pnl >= 0) return false;
      return true;
    });
  }, [allItems, filterPair, filterStrategy, filterResult]);

  function openLightbox(idx) { setLightbox(idx); }
  function closeLightbox()   { setLightbox(null); }
  function prevImage()       { setLightbox(i => (i - 1 + filtered.length) % filtered.length); }
  function nextImage()       { setLightbox(i => (i + 1) % filtered.length); }

  const cols = isMobile ? "1fr 1fr" : "repeat(4, 1fr)";

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 3, color: t.text, lineHeight: 1 }}>SCREENSHOT GALLERY</div>
          <div style={{ fontSize: 11, color: t.textDim, marginTop: 4 }}>{filtered.length} dari {allItems.length} screenshot</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {/* Result filter */}
        <div style={{ display: "flex", gap: 3, background: t.bgSubtle, border: `1px solid ${t.border}`, borderRadius: 8, padding: 3 }}>
          {[{ v: "all", l: "All" }, { v: "win", l: "✅ Win" }, { v: "loss", l: "❌ Loss" }].map(f => (
            <button key={f.v} onClick={() => setFilterResult(f.v)}
              style={{ padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, background: filterResult === f.v ? t.accent : "transparent", color: filterResult === f.v ? "#090e1a" : t.textDim, fontWeight: filterResult === f.v ? 600 : 400 }}>
              {f.l}
            </button>
          ))}
        </div>

        {/* Pair filter */}
        <select value={filterPair} onChange={e => setFilterPair(e.target.value)}
          style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, padding: "6px 10px", fontSize: 11, height: 34 }}>
          <option value="">Semua Pair</option>
          {pairs.map(p => <option key={p}>{p}</option>)}
        </select>

        {/* Strategy filter */}
        <select value={filterStrategy} onChange={e => setFilterStrategy(e.target.value)}
          style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, padding: "6px 10px", fontSize: 11, height: 34 }}>
          <option value="">Semua Strategy</option>
          {strategies.map(s => <option key={s}>{s}</option>)}
        </select>

        {/* Reset */}
        {(filterPair || filterStrategy || filterResult !== "all") && (
          <button onClick={() => { setFilterPair(""); setFilterStrategy(""); setFilterResult("all"); }}
            className="btn-ghost" style={{ fontSize: 11, padding: "5px 12px" }}>
            ✕ Reset
          </button>
        )}
      </div>

      {/* Gallery grid */}
      {filtered.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 24px", textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, rgba(0,200,150,0.08), rgba(0,200,150,0.04))", border: "1px solid rgba(0,200,150,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, marginBottom: 16 }}>🖼️</div>
          <div style={{ fontSize: 15, color: t.text, marginBottom: 8 }}>
            {allItems.length === 0 ? "Belum ada screenshot" : "Tidak ada yang cocok"}
          </div>
          <div style={{ fontSize: 12, color: t.textDim, maxWidth: 280, lineHeight: 1.8 }}>
            {allItems.length === 0 ? "Upload screenshot saat log trade untuk melihat gallery di sini" : "Coba ganti filter"}
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: cols, gap: 10 }}>
          {filtered.map((item, idx) => (
            <div key={item.id}
              style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${t.border}`, cursor: "pointer", position: "relative", transition: "transform 0.15s, border-color 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = item.trade.pnl >= 0 ? "#00c896" : "#ef4444"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = t.border; }}>

              {/* Image */}
              <img src={item.url} alt="ss"
                onClick={() => openLightbox(idx)}
                style={{ width: "100%", height: isMobile ? 100 : 130, objectFit: "cover", display: "block" }}
                onError={e => { e.target.parentElement.style.display = "none"; }} />

              {/* Trade info overlay */}
              <div style={{ padding: "8px 10px", background: t.bgCard }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: t.text }}>{item.trade.pair}</span>
                  <span style={{ fontSize: 11, color: item.trade.pnl >= 0 ? "#00c896" : "#ef4444", fontFamily: "DM Mono, monospace", fontWeight: 600 }}>
                    {item.trade.pnl >= 0 ? "+" : ""}{formatCurrency(item.trade.pnl, false, "$")}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 3 }}>
                  <span style={{ fontSize: 9, color: t.textDim }}>{item.trade.date}</span>
                  <button onClick={() => onOpenTrade?.(item.trade)}
                    style={{ fontSize: 9, color: t.accent, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    Lihat trade →
                  </button>
                </div>
                {item.caption && (
                  <div style={{ fontSize: 10, color: t.textDim, marginTop: 4, fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    "{item.caption}"
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && (
        <Lightbox
          item={filtered[lightbox]}
          index={lightbox}
          total={filtered.length}
          onClose={closeLightbox}
          onPrev={prevImage}
          onNext={nextImage}
        />
      )}
    </div>
  );
}