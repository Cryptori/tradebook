import { useState } from "react";
import { formatCurrency, formatRR, formatDate } from "../utils/formatters";

// ── Lightbox ──────────────────────────────────────────────────────
function Lightbox({ url, caption, onClose, onPrev, onNext, index, total }) {
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.95)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>

      {/* Close */}
      <button onClick={onClose}
        style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
        ✕
      </button>

      {/* Counter */}
      <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "DM Mono, monospace" }}>
        {index + 1} / {total}
      </div>

      {/* Prev */}
      {total > 1 && (
        <button onClick={onPrev}
          style={{ position: "absolute", left: 16, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "50%", width: 44, height: 44, cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
          ‹
        </button>
      )}

      {/* Image */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, maxWidth: "90vw" }}>
        <img src={url} alt={`screenshot-${index}`}
          style={{ maxWidth: "85vw", maxHeight: "75vh", objectFit: "contain", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)" }}
          onError={e => { e.target.src = ""; }} />
        {caption && (
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", textAlign: "center", maxWidth: 480, lineHeight: 1.6, fontStyle: "italic" }}>
            "{caption}"
          </div>
        )}
      </div>

      {/* Next */}
      {total > 1 && (
        <button onClick={onNext}
          style={{ position: "absolute", right: 16, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "50%", width: 44, height: 44, cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
          ›
        </button>
      )}
    </div>
  );
}

// ── Screenshot Gallery ────────────────────────────────────────────
function ScreenshotGallery({ screenshots, captions, onCaptionChange, theme: t }) {
  const [lightbox, setLightbox] = useState(null);
  const [editingCaption, setEditingCaption] = useState(null);
  const [captionInput, setCaptionInput] = useState("");

  if (!screenshots || screenshots.length === 0) return null;

  function openLightbox(idx) { setLightbox(idx); }
  function closeLightbox()   { setLightbox(null); }
  function prevImage()       { setLightbox(i => (i - 1 + screenshots.length) % screenshots.length); }
  function nextImage()       { setLightbox(i => (i + 1) % screenshots.length); }

  function startEditCaption(idx) {
    setEditingCaption(idx);
    setCaptionInput(captions?.[idx] || "");
  }

  function saveCaption(idx) {
    onCaptionChange?.(idx, captionInput);
    setEditingCaption(null);
  }

  const cols = screenshots.length === 1 ? "1fr" : screenshots.length === 2 ? "1fr 1fr" : "1fr 1fr 1fr";

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 12 }}>
          Screenshots ({screenshots.length})
        </div>
        <div style={{ display: "grid", gridTemplateColumns: cols, gap: 8 }}>
          {screenshots.map((url, i) => (
            <div key={i} style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: `1px solid ${t.border}`, cursor: "pointer" }}>
              {/* Image */}
              <img src={url} alt={`ss-${i}`}
                onClick={() => openLightbox(i)}
                style={{ width: "100%", height: screenshots.length === 1 ? 240 : 140, objectFit: "cover", display: "block" }}
                onError={e => { e.target.style.display = "none"; }} />

              {/* Overlay on hover */}
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", opacity: 0, transition: "opacity 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                <button onClick={() => openLightbox(i)}
                  style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11 }}>
                  🔍 Zoom
                </button>
                <button onClick={() => startEditCaption(i)}
                  style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11 }}>
                  ✏️ Caption
                </button>
              </div>

              {/* Caption */}
              {editingCaption === i ? (
                <div style={{ padding: "8px 10px", background: t.bgCard, borderTop: `1px solid ${t.border}` }}>
                  <input
                    autoFocus
                    value={captionInput}
                    onChange={e => setCaptionInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") saveCaption(i); if (e.key === "Escape") setEditingCaption(null); }}
                    placeholder="Tulis caption..."
                    style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 6, width: "100%", padding: "5px 8px", fontSize: 11 }} />
                  <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                    <button onClick={() => saveCaption(i)} className="btn-primary" style={{ fontSize: 10, padding: "3px 10px" }}>Simpan</button>
                    <button onClick={() => setEditingCaption(null)} className="btn-ghost" style={{ fontSize: 10, padding: "3px 8px" }}>Batal</button>
                  </div>
                </div>
              ) : captions?.[i] ? (
                <div onClick={() => startEditCaption(i)}
                  style={{ padding: "6px 10px", background: "rgba(0,0,0,0.7)", fontSize: 11, color: "rgba(255,255,255,0.8)", lineHeight: 1.5, cursor: "pointer", fontStyle: "italic" }}>
                  "{captions[i]}"
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {lightbox !== null && (
        <Lightbox
          url={screenshots[lightbox]}
          caption={captions?.[lightbox]}
          index={lightbox}
          total={screenshots.length}
          onClose={closeLightbox}
          onPrev={prevImage}
          onNext={nextImage}
        />
      )}
    </>
  );
}

// ── Main TradeDetailModal ─────────────────────────────────────────
export default function TradeDetailModal({ trade, onClose, onEdit, onDelete, onUpdateCaptions, currencyMeta, theme: t }) {
  if (!trade) return null;

  const sym         = currencyMeta?.symbol ?? "$";
  const isWin       = trade.pnl >= 0;
  const accent      = isWin ? "#00c896" : "#ef4444";
  const screenshots = Array.isArray(trade.screenshots) ? trade.screenshots : (trade.screenshotUrl ? [trade.screenshotUrl] : []);
  const [captions,  setCaptions]  = useState(trade.screenshotCaptions || {});

  function handleDelete() {
    if (!window.confirm(`Hapus trade ${trade.pair} pada ${trade.date}?`)) return;
    onDelete(trade.id);
    onClose();
  }

  function handleCaptionChange(idx, value) {
    const updated = { ...captions, [idx]: value };
    setCaptions(updated);
    onUpdateCaptions?.(trade.id, updated);
  }

  const row = (label, value, color) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${t.borderSubtle}` }}>
      <span style={{ fontSize: 10, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
      <span style={{ fontSize: 13, color: color ?? t.text, fontWeight: 500, fontFamily: "DM Mono, monospace" }}>{value ?? "—"}</span>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(8,12,20,0.88)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 20, overflowY: "auto", backdropFilter: "blur(6px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 640, margin: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 4, height: 44, background: accent, borderRadius: 4 }} />
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 3, color: t.text, lineHeight: 1 }}>
                {trade.pair}
              </div>
              <div style={{ fontSize: 11, color: t.textDim, marginTop: 3 }}>
                {formatDate(trade.date)} · {trade.market} · {trade.session}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className={`badge badge-${(trade.side ?? "").toLowerCase()}`} style={{ fontSize: 11 }}>{trade.side}</span>
            <button onClick={onClose} style={{ background: t.bgSubtle, border: `1px solid ${t.border}`, color: t.textDim, cursor: "pointer", borderRadius: 7, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✕</button>
          </div>
        </div>

        {/* P&L hero */}
        <div style={{ background: `${accent}10`, border: `1px solid ${accent}25`, borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, textAlign: "center" }}>
          {[
            { label: "P&L",      value: formatCurrency(trade.pnl, false, sym), color: accent },
            { label: "R:R",      value: formatRR(trade.rr ?? 0),               color: accent },
            { label: "Strategy", value: trade.strategy,                        color: t.text  },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: s.color, fontFamily: "DM Mono, monospace" }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Price details */}
        <div style={{ marginBottom: 16 }}>
          {row("Entry",       trade.entry)}
          {row("Exit",        trade.exit)}
          {row("Stop Loss",   trade.stopLoss)}
          {row("Take Profit", trade.takeProfit)}
          {row("Size",        trade.size ? trade.size + " lot" : null)}
          {row("Emotion",     trade.emotion)}
        </div>

        {/* Notes */}
        {trade.notes && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>Notes</div>
            <div style={{ background: t.bgSubtle, border: `1px solid ${t.borderSubtle}`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: t.textMuted, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {trade.notes}
            </div>
          </div>
        )}

        {/* Tags */}
        {(trade.tags ?? []).length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {trade.tags.map(tag => (
              <span key={tag} style={{ fontSize: 10, background: t.bgSubtle, border: `1px solid ${t.borderSubtle}`, borderRadius: 20, padding: "3px 10px", color: t.textMuted }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Screenshot Gallery */}
        <ScreenshotGallery
          screenshots={screenshots}
          captions={captions}
          onCaptionChange={handleCaptionChange}
          theme={t}
        />

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 16, borderTop: `1px solid ${t.borderSubtle}` }}>
          <button className="btn-danger"   onClick={handleDelete}>Hapus</button>
          <button className="btn-ghost"    onClick={onClose}>Tutup</button>
          <button className="btn-primary"  onClick={() => { onEdit(trade); onClose(); }}>Edit Trade</button>
        </div>
      </div>
    </div>
  );
}