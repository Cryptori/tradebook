import { useState } from "react";
import { formatCurrency } from "../utils/formatters";

// ── Lightbox ──────────────────────────────────────────────────────
function Lightbox({ url, caption, onClose, onPrev, onNext, index, total }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.96)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
      <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", fontSize: "var(--fs-xs)", color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-mono)" }}>
        {index + 1} / {total}
      </div>
      {total > 1 && <button onClick={onPrev} style={{ position: "absolute", left: 14, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "50%", width: 44, height: 44, cursor: "pointer", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, maxWidth: "90vw" }}>
        <img src={url} alt={`screenshot-${index}`}
          style={{ maxWidth: "85vw", maxHeight: "75vh", objectFit: "contain", borderRadius: "var(--r-lg)", border: "1px solid rgba(255,255,255,0.08)" }}
          onError={e => { e.target.src = ""; }}/>
        {caption && <div style={{ fontSize: "var(--fs-sm)", color: "rgba(255,255,255,0.65)", textAlign: "center", maxWidth: 480, lineHeight: 1.6, fontStyle: "italic" }}>"{caption}"</div>}
      </div>
      {total > 1 && <button onClick={onNext} style={{ position: "absolute", right: 14, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "50%", width: 44, height: 44, cursor: "pointer", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>}
    </div>
  );
}

// ── Screenshot gallery ────────────────────────────────────────────
function Screenshots({ screenshots, captions, onCaptionChange }) {
  const [lightbox,       setLightbox]       = useState(null);
  const [editingCaption, setEditingCaption] = useState(null);
  const [captionInput,   setCaptionInput]   = useState("");

  if (!screenshots?.length) return null;

  const cols = screenshots.length === 1 ? "1fr" : screenshots.length === 2 ? "1fr 1fr" : "1fr 1fr 1fr";

  return (
    <>
      <div style={{ marginBottom: 18 }}>
        <div className="section-label" style={{ marginBottom: 10 }}>Screenshots ({screenshots.length})</div>
        <div style={{ display: "grid", gridTemplateColumns: cols, gap: 8 }}>
          {screenshots.map((url, i) => (
            <div key={i} style={{ borderRadius: "var(--r-lg)", overflow: "hidden", border: "1px solid var(--border)", position: "relative" }}>
              <div style={{ position: "relative" }}>
                <img src={url} alt={`ss-${i}`} onClick={() => setLightbox(i)}
                  style={{ width: "100%", height: screenshots.length === 1 ? 220 : 130, objectFit: "cover", display: "block", cursor: "zoom-in" }}
                  onError={e => { e.target.parentElement.parentElement.style.display = "none"; }}/>
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", opacity: 0, transition: "opacity var(--t-base)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                  <button onClick={() => setLightbox(i)} style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", borderRadius: "var(--r-sm)", padding: "5px 10px", cursor: "pointer", fontSize: "var(--fs-xs)" }}>🔍 Zoom</button>
                  <button onClick={() => { setEditingCaption(i); setCaptionInput(captions?.[i] || ""); }} style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", borderRadius: "var(--r-sm)", padding: "5px 10px", cursor: "pointer", fontSize: "var(--fs-xs)" }}>✏️</button>
                </div>
              </div>
              {editingCaption === i ? (
                <div style={{ padding: "8px 10px", background: "var(--bg-card)", borderTop: "1px solid var(--border)" }}>
                  <input autoFocus value={captionInput} onChange={e => setCaptionInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { onCaptionChange?.(i, captionInput); setEditingCaption(null); } if (e.key === "Escape") setEditingCaption(null); }}
                    placeholder="Tulis caption..." style={{ height: 28, fontSize: "var(--fs-xs)", width: "100%" }}/>
                  <div style={{ display: "flex", gap: 4, marginTop: 5 }}>
                    <button onClick={() => { onCaptionChange?.(i, captionInput); setEditingCaption(null); }} className="btn-primary" style={{ height: 24, fontSize: "var(--fs-2xs)", padding: "0 10px" }}>Simpan</button>
                    <button onClick={() => setEditingCaption(null)} className="btn-ghost" style={{ height: 24, fontSize: "var(--fs-2xs)" }}>Batal</button>
                  </div>
                </div>
              ) : captions?.[i] ? (
                <div onClick={() => { setEditingCaption(i); setCaptionInput(captions[i]); }}
                  style={{ padding: "5px 10px", background: "rgba(0,0,0,0.65)", fontSize: "var(--fs-xs)", color: "rgba(255,255,255,0.75)", lineHeight: 1.5, cursor: "pointer", fontStyle: "italic" }}>
                  "{captions[i]}"
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {lightbox !== null && (
        <Lightbox url={screenshots[lightbox]} caption={captions?.[lightbox]}
          index={lightbox} total={screenshots.length}
          onClose={() => setLightbox(null)}
          onPrev={() => setLightbox(i => (i - 1 + screenshots.length) % screenshots.length)}
          onNext={() => setLightbox(i => (i + 1) % screenshots.length)}/>
      )}
    </>
  );
}

// ── Detail row ────────────────────────────────────────────────────
function Row({ label, value, color, mono = true }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid var(--border-subtle)" }}>
      <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
      <span style={{ fontSize: "var(--fs-sm)", color: color ?? "var(--text)", fontWeight: 500, fontFamily: mono ? "var(--font-mono)" : "inherit" }}>{value}</span>
    </div>
  );
}

// ── Main TradeDetailModal ─────────────────────────────────────────
export default function TradeDetailModal({ trade, onClose, onEdit, onDelete, onUpdateCaptions, currencyMeta, theme }) {
  if (!trade) return null;

  const sym         = currencyMeta?.symbol ?? "$";
  const win         = (trade.pnl ?? 0) >= 0;
  const accent      = win ? "var(--success)" : "var(--danger)";
  const accentDim   = win ? "var(--success-dim)" : "var(--danger-dim)";
  const screenshots = Array.isArray(trade.screenshots) ? trade.screenshots : trade.screenshotUrl ? [trade.screenshotUrl] : [];
  const [captions,  setCaptions] = useState(trade.screenshotCaptions || {});

  function handleDelete() {
    if (!window.confirm(`Hapus trade ${trade.pair} pada ${trade.date}?`)) return;
    onDelete?.(trade.id); onClose();
  }

  function handleCaptionChange(idx, val) {
    const updated = { ...captions, [idx]: val };
    setCaptions(updated);
    onUpdateCaptions?.(trade.id, updated);
  }

  const rr = parseFloat(trade.rr) || 0;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "var(--bg-overlay)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "20px 16px", overflowY: "auto" }}
      onClick={e => e.target === e.currentTarget && onClose()}>

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", width: "100%", maxWidth: 600, margin: "auto", boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>

        {/* ── Color accent top bar ── */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${accent}, ${accentDim})` }}/>

        {/* ── Header ── */}
        <div style={{ padding: "20px 24px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 3, height: 40, background: accent, borderRadius: 4 }}/>
              <div>
                <div style={{ fontFamily: "var(--font-disp)", fontSize: 28, letterSpacing: 3, color: "var(--text)", lineHeight: 1 }}>
                  {trade.pair}
                </div>
                <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 4 }}>
                  {trade.date} · {trade.market} · {trade.session}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span className={`badge ${trade.side === "BUY" ? "badge-green" : "badge-yellow"}`}>{trade.side}</span>
              <span className={`badge ${win ? "badge-green" : "badge-red"}`}>{win ? "WIN" : "LOSS"}</span>
              <button onClick={onClose} className="btn-icon" style={{ width: 30, height: 30, marginLeft: 4 }}>✕</button>
            </div>
          </div>

          {/* ── P&L hero ── */}
          <div style={{ background: accentDim, border: `1px solid ${accent}`, borderRadius: "var(--r-lg)", padding: "14px 20px", marginBottom: 20, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, textAlign: "center" }}>
            {[
              { label: "P&L",      val: `${win ? "+" : ""}${formatCurrency(trade.pnl ?? 0, false, sym)}`, color: accent },
              { label: "R:R",      val: rr ? `${rr >= 0 ? "+" : ""}${rr.toFixed(2)}R` : "—",             color: rr >= 1.5 ? "var(--success)" : rr >= 1 ? "var(--warning)" : "var(--danger)" },
              { label: "Strategy", val: trade.strategy || "—",                                             color: "var(--text)" },
            ].map(s => (
              <div key={s.label}>
                <div className="kpi-label" style={{ marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: "var(--fs-lg)", fontWeight: 700, color: s.color, fontFamily: "var(--font-mono)" }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "0 24px 24px" }}>

          {/* Price details grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, marginBottom: 18 }}>
            <div style={{ paddingRight: 16 }}>
              <Row label="Entry"    value={trade.entry}               />
              <Row label="Exit"     value={trade.exit}                />
              <Row label="Stop Loss"  value={trade.stopLoss}          />
              <Row label="Take Profit" value={trade.takeProfit}       />
            </div>
            <div style={{ paddingLeft: 16, borderLeft: "1px solid var(--border-subtle)" }}>
              <Row label="Size"     value={trade.size ? `${trade.size} lot` : null}/>
              <Row label="Session"  value={trade.session}  mono={false}/>
              <Row label="Emotion"  value={trade.emotion}  mono={false}/>
              <Row label="Market"   value={trade.market}   mono={false}/>
            </div>
          </div>

          {/* Tags */}
          {(trade.tags ?? []).length > 0 && (
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 16 }}>
              {trade.tags.map(tag => (
                <span key={tag} style={{ fontSize: "var(--fs-xs)", background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: 100, padding: "2px 9px", color: "var(--text-muted)" }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Notes */}
          {trade.notes && (
            <div style={{ marginBottom: 18 }}>
              <div className="section-label" style={{ marginBottom: 8 }}>Notes</div>
              <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", borderRadius: "var(--r-md)", padding: "10px 14px", fontSize: "var(--fs-sm)", color: "var(--text-muted)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                {trade.notes}
              </div>
            </div>
          )}

          {/* Screenshots */}
          <Screenshots screenshots={screenshots} captions={captions} onCaptionChange={handleCaptionChange}/>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
            <button className="btn-ghost" style={{ color: "var(--danger)", borderColor: "var(--danger)" }} onClick={handleDelete}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
              Hapus
            </button>
            <button className="btn-ghost" onClick={onClose}>Tutup</button>
            <button className="btn-primary" onClick={() => { onEdit?.(trade); onClose(); }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit Trade
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}