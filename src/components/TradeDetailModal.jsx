import { formatCurrency, formatRR, formatDate } from "../utils/formatters";

export default function TradeDetailModal({ trade, onClose, onEdit, onDelete, currencyMeta, theme: t }) {
  if (!trade) return null;
  const sym       = currencyMeta?.symbol ?? "$";
  const isWin     = trade.pnl >= 0;
  const accent    = isWin ? "#00d4aa" : "#ef4444";
  const screenshots = Array.isArray(trade.screenshots)
    ? trade.screenshots
    : (trade.screenshotUrl ? [trade.screenshotUrl] : []);

  function handleDelete() {
    if (!window.confirm(`Hapus trade ${trade.pair} pada ${trade.date}? Aksi ini tidak bisa dibatalkan.`)) return;
    onDelete(trade.id);
    onClose();
  }

  const row = (label, value, color) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${t.borderSubtle}` }}>
      <span style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
      <span style={{ fontSize: 13, color: color ?? t.text, fontWeight: 500 }}>{value ?? "—"}</span>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(9,14,26,0.85)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 20, overflowY: "auto" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 640, margin: "auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 4, height: 40, background: accent, borderRadius: 4 }} />
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
            <button onClick={onClose} style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 18, lineHeight: 1 }}>✕</button>
          </div>
        </div>

        {/* P&L hero */}
        <div style={{ background: `${accent}10`, border: `1px solid ${accent}30`, borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, textAlign: "center" }}>
          {[
            { label: "P&L",       value: formatCurrency(trade.pnl, false, sym), color: accent },
            { label: "R:R",       value: formatRR(trade.rr ?? 0),               color: accent },
            { label: "Strategy",  value: trade.strategy,                        color: t.text  },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Price details */}
        <div style={{ marginBottom: 16 }}>
          {row("Entry",       trade.entry)}
          {row("Exit",        trade.exit)}
          {row("Stop Loss",   trade.stopLoss)}
          {row("Take Profit", trade.takeProfit)}
          {row("Size",        trade.size)}
          {row("Emotion",     trade.emotion)}
        </div>

        {/* Notes */}
        {trade.notes && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Notes</div>
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

        {/* Screenshots */}
        {screenshots.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
              Screenshots ({screenshots.length})
            </div>
            <div style={{ display: "grid", gridTemplateColumns: screenshots.length === 1 ? "1fr" : "1fr 1fr", gap: 8 }}>
              {screenshots.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer">
                  <img src={url} alt={`screenshot-${i}`}
                    style={{ width: "100%", maxHeight: screenshots.length === 1 ? 280 : 160, objectFit: "cover", borderRadius: 8, border: `1px solid ${t.border}`, display: "block" }}
                    onError={e => { e.target.style.display = "none"; }} />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
          <button className="btn-danger" onClick={handleDelete}>Hapus</button>
          <button className="btn-ghost"  onClick={onClose}>Tutup</button>
          <button className="btn-primary" onClick={() => { onEdit(trade); onClose(); }}>Edit Trade</button>
        </div>
      </div>
    </div>
  );
}