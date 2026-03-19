import { useState } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { formatCurrency } from "../../utils/formatters";
import { MARKETS } from "../../constants";

// ── Position Form ────────────────────────────────────────────────
function PositionForm({ form, setField, onSave, onClose, editId, theme: t }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2, color: t.text }}>
            {editId ? "EDIT POSISI" : "TAMBAH POSISI"}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Pair & Market */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ color: t.textDim }}>Pair</label>
              <input value={form.pair} onChange={e => setField("pair", e.target.value.toUpperCase())}
                placeholder="EUR/USD" style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "9px 12px", fontFamily: "DM Mono, monospace", fontSize: 13 }} />
            </div>
            <div>
              <label style={{ color: t.textDim }}>Market</label>
              <select value={form.market} onChange={e => setField("market", e.target.value)}
                style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "9px 12px", fontFamily: "DM Mono, monospace", fontSize: 13 }}>
                {MARKETS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Side */}
          <div>
            <label style={{ color: t.textDim }}>Side</label>
            <div style={{ display: "flex", gap: 6 }}>
              {["BUY", "SELL"].map(s => (
                <button key={s} onClick={() => setField("side", s)}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer", border: `1px solid ${form.side === s ? (s === "BUY" ? "#00d4aa" : "#f59e0b") : t.border}`, background: form.side === s ? (s === "BUY" ? "rgba(0,212,170,0.1)" : "rgba(245,158,11,0.1)") : "transparent", color: form.side === s ? (s === "BUY" ? "#00d4aa" : "#f59e0b") : t.textMuted, fontFamily: "DM Mono, monospace", fontSize: 13 }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Prices */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { key: "entry",        label: "Entry Price" },
              { key: "currentPrice", label: "Current Price" },
              { key: "sl",           label: "Stop Loss" },
              { key: "tp",           label: "Take Profit" },
              { key: "size",         label: "Lot Size" },
            ].map(f => (
              <div key={f.key} style={f.key === "size" ? { gridColumn: "span 2" } : {}}>
                <label style={{ color: t.textDim }}>{f.label}</label>
                <input type="number" step="any" value={form[f.key]} onChange={e => setField(f.key, e.target.value)}
                  placeholder="0" style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "9px 12px", fontFamily: "DM Mono, monospace", fontSize: 13 }} />
              </div>
            ))}
          </div>

          {/* Open Date */}
          <div>
            <label style={{ color: t.textDim }}>Open Date</label>
            <input type="date" value={form.openDate} onChange={e => setField("openDate", e.target.value)}
              style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "9px 12px", fontSize: 13 }} />
          </div>

          {/* Notes */}
          <div>
            <label style={{ color: t.textDim }}>Notes</label>
            <textarea value={form.notes} onChange={e => setField("notes", e.target.value)}
              rows={2} placeholder="Alasan buka posisi ini..."
              style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "9px 12px", fontSize: 12, resize: "vertical" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>Batal</button>
          <button onClick={onSave} className="btn-primary" style={{ flex: 2, justifyContent: "center" }}>
            {editId ? "Update" : "Tambah Posisi"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Position Card ────────────────────────────────────────────────
function PositionCard({ pos, onEdit, onDelete, onUpdatePrice, sym, theme: t }) {
  const [editingPrice, setEditingPrice] = useState(false);
  const [tempPrice,    setTempPrice]    = useState(pos.currentPrice || "");
  const pnlColor = pos.unrealizedPnl >= 0 ? "#00d4aa" : "#ef4444";
  const isBuy    = pos.side === "BUY";

  return (
    <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "16px 18px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: isBuy ? "rgba(0,212,170,0.12)" : "rgba(245,158,11,0.12)", color: isBuy ? "#00d4aa" : "#f59e0b", border: `1px solid ${isBuy ? "#00d4aa40" : "#f59e0b40"}` }}>
            {pos.side}
          </span>
          <span style={{ fontSize: 14, fontWeight: 500, color: t.text }}>{pos.pair}</span>
          <span style={{ fontSize: 10, color: t.textDim }}>{pos.market}</span>
          {pos.fromJournal && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid #3b82f640" }}>JOURNAL</span>}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {!pos.fromJournal && (
            <>
              <button onClick={() => onEdit(pos)} style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 13 }}>✏️</button>
              <button onClick={() => onDelete(pos.id)} style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 13 }}>🗑️</button>
            </>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
        {[
          { label: "Entry",    value: pos.entry        || "—" },
          { label: "SL",       value: pos.sl           || "—" },
          { label: "TP",       value: pos.tp           || "—" },
          { label: "Size",     value: pos.size ? pos.size + " lot" : "—" },
          { label: "R:R",      value: pos.rr ? "1:" + pos.rr : "—" },
          { label: "SL %",     value: pos.slPct ? pos.slPct + "%" : "—" },
        ].map(s => (
          <div key={s.label} style={{ background: t.bgSubtle, borderRadius: 7, padding: "8px 10px" }}>
            <div style={{ fontSize: 9, color: t.textDim, marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 12, color: t.text, fontFamily: "DM Mono, monospace" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Current price + Unrealized PnL */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: t.bgSubtle, borderRadius: 8, padding: "10px 12px" }}>
        <div>
          <div style={{ fontSize: 9, color: t.textDim, marginBottom: 2 }}>CURRENT PRICE</div>
          {editingPrice ? (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input type="number" step="any" value={tempPrice} onChange={e => setTempPrice(e.target.value)}
                autoFocus onBlur={() => { onUpdatePrice(pos.id, tempPrice); setEditingPrice(false); }}
                onKeyDown={e => { if (e.key === "Enter") { onUpdatePrice(pos.id, tempPrice); setEditingPrice(false); } }}
                style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 6, padding: "4px 8px", fontFamily: "DM Mono, monospace", fontSize: 13, width: 100 }} />
            </div>
          ) : (
            <div onClick={() => setEditingPrice(true)} style={{ fontSize: 13, color: pos.currentPrice ? t.text : t.textDim, cursor: "pointer", fontFamily: "DM Mono, monospace" }}>
              {pos.currentPrice || "Klik untuk isi"}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 9, color: t.textDim, marginBottom: 2 }}>UNREALIZED P&L</div>
          <div style={{ fontSize: 16, fontWeight: 500, color: pnlColor, fontFamily: "DM Mono, monospace" }}>
            {pos.currentPrice ? (pos.unrealizedPnl >= 0 ? "+" : "") + formatCurrency(pos.unrealizedPnl, false, sym) : "—"}
          </div>
        </div>
      </div>

      {pos.openDate && (
        <div style={{ fontSize: 10, color: t.textDim, marginTop: 8 }}>
          Open: {pos.openDate} {pos.notes && `· ${pos.notes}`}
        </div>
      )}
    </div>
  );
}

// ── Main Portfolio Page ──────────────────────────────────────────
export default function Portfolio({ portfolioHook, settings, currencyMeta, theme }) {
  const t   = theme;
  const sym = currencyMeta?.symbol ?? "$";
  const { isMobile } = useBreakpoint();
  const { positions, stats, form, setField, showForm, editId, openAdd, openEdit, closeForm, savePosition, deletePosition, updatePrice } = portfolioHook;

  const capital    = settings?.capitalInitial ?? 10000;
  const totalPnlPct = capital > 0 ? (stats.totalUnrealized / capital) * 100 : 0;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2, color: t.text }}>PORTFOLIO TRACKER</div>
          <div style={{ fontSize: 11, color: t.textDim }}>Monitor semua posisi open dan exposure market kamu</div>
        </div>
        <button onClick={openAdd} className="btn-primary">+ Tambah Posisi</button>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Posisi",     value: stats.totalPositions,   color: t.text,    format: false },
          { label: "Unrealized P&L",   value: stats.totalUnrealized,  color: stats.totalUnrealized >= 0 ? "#00d4aa" : "#ef4444", format: true },
          { label: "Long",             value: stats.longCount,        color: "#00d4aa", format: false },
          { label: "Short",            value: stats.shortCount,       color: "#f59e0b", format: false },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 10, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: s.color }}>
              {s.format ? (s.value >= 0 ? "+" : "") + formatCurrency(s.value, false, sym) : s.value}
            </div>
            {s.label === "Unrealized P&L" && capital > 0 && (
              <div style={{ fontSize: 10, color: s.color, marginTop: 2 }}>
                {totalPnlPct >= 0 ? "+" : ""}{totalPnlPct.toFixed(2)}%
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Allocation by market */}
      {stats.byMarket.length > 0 && (
        <div className="stat-card" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Allocation by Market</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {stats.byMarket.map(m => (
              <div key={m.market} style={{ background: t.bgSubtle, border: `1px solid ${t.borderSubtle}`, borderRadius: 8, padding: "10px 16px", display: "flex", gap: 16, alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 12, color: t.text, fontWeight: 500 }}>{m.market}</div>
                  <div style={{ fontSize: 10, color: t.textDim }}>{m.count} posisi</div>
                </div>
                <div style={{ fontSize: 13, color: m.pnl >= 0 ? "#00d4aa" : "#ef4444", fontFamily: "DM Mono, monospace" }}>
                  {m.pnl >= 0 ? "+" : ""}{formatCurrency(m.pnl, false, sym)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Positions list */}
      {positions.length === 0 ? (
        <div className="stat-card">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 24px", textAlign: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, rgba(0,200,150,0.08), rgba(0,200,150,0.04))", border: "1px solid rgba(0,200,150,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, marginBottom: 20 }}>📊</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: t.text, marginBottom: 8 }}>Belum ada posisi open</div>
            <div style={{ fontSize: 12, color: t.textDim, maxWidth: 280, lineHeight: 1.8, marginBottom: 20 }}>Tambah posisi manual atau buka trade di Journal tanpa mengisi exit price</div>
            <button onClick={openAdd} className="btn-primary" style={{ fontSize: 12 }}>+ Tambah Posisi</button>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
          {positions.map(pos => (
            <PositionCard
              key={pos.id} pos={pos} sym={sym} theme={t}
              onEdit={openEdit} onDelete={deletePosition} onUpdatePrice={updatePrice}
            />
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <PositionForm
          form={form} setField={setField}
          onSave={savePosition} onClose={closeForm}
          editId={editId} theme={t}
        />
      )}
    </div>
  );
}