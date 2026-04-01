import { useState } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { formatCurrency } from "../../utils/formatters";
import { MARKETS } from "../../constants";

// ── Position form modal ───────────────────────────────────────────
function PositionForm({ form, setField, onSave, onClose, editId }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "var(--bg-overlay)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: "var(--r-xl)", padding: 24, width: "100%", maxWidth: 460,
        maxHeight: "90vh", overflowY: "auto", boxShadow: "var(--shadow-lg)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "var(--font-disp)", fontSize: 18, letterSpacing: 2, color: "var(--text)", fontWeight: 400 }}>
            {editId ? "EDIT POSISI" : "TAMBAH POSISI"}
          </h2>
          <button onClick={onClose} className="btn-icon">✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label>Pair</label>
              <input value={form.pair} onChange={e => setField("pair", e.target.value.toUpperCase())}
                placeholder="EUR/USD" style={{ fontFamily: "var(--font-mono)" }}/>
            </div>
            <div>
              <label>Market</label>
              <select value={form.market} onChange={e => setField("market", e.target.value)}>
                {MARKETS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Side */}
          <div>
            <label>Side</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["BUY","SELL"].map(s => {
                const active = form.side === s;
                const color  = s === "BUY" ? "var(--success)" : "var(--warning)";
                return (
                  <button key={s} onClick={() => setField("side", s)} style={{
                    flex: 1, padding: "8px 0", borderRadius: "var(--r-md)", cursor: "pointer",
                    fontFamily: "var(--font-mono)", fontSize: "var(--fs-sm)", fontWeight: 700,
                    border: `1px solid ${active ? color : "var(--border)"}`,
                    background: active ? (s === "BUY" ? "var(--success-dim)" : "var(--warning-dim)") : "transparent",
                    color: active ? color : "var(--text-muted)",
                  }}>{s}</button>
                );
              })}
            </div>
          </div>

          {/* Price fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { k: "entry",        label: "Entry Price" },
              { k: "currentPrice", label: "Current Price" },
              { k: "sl",           label: "Stop Loss" },
              { k: "tp",           label: "Take Profit" },
              { k: "size",         label: "Lot Size", span: true },
            ].map(f => (
              <div key={f.k} style={f.span ? { gridColumn: "span 2" } : {}}>
                <label>{f.label}</label>
                <input type="number" step="any" value={form[f.k]}
                  onChange={e => setField(f.k, e.target.value)}
                  placeholder="0" style={{ fontFamily: "var(--font-mono)" }}/>
              </div>
            ))}
          </div>

          <div>
            <label>Open Date</label>
            <input type="date" value={form.openDate} onChange={e => setField("openDate", e.target.value)}/>
          </div>
          <div>
            <label>Notes</label>
            <textarea value={form.notes} onChange={e => setField("notes", e.target.value)}
              rows={2} placeholder="Alasan buka posisi ini..."/>
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

// ── Position card ─────────────────────────────────────────────────
function PositionCard({ pos, onEdit, onDelete, onUpdatePrice, sym }) {
  const [editingPrice, setEditingPrice] = useState(false);
  const [tempPrice,    setTempPrice]    = useState(pos.currentPrice || "");
  const pnlColor = (pos.unrealizedPnl ?? 0) >= 0 ? "var(--success)" : "var(--danger)";
  const isBuy    = pos.side === "BUY";

  return (
    <div className="stat-card">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className={`badge ${isBuy ? "badge-green" : "badge-yellow"}`}>{pos.side}</span>
          <span style={{ fontSize: "var(--fs-base)", fontWeight: 600, color: "var(--text)", fontFamily: "var(--font-mono)" }}>{pos.pair}</span>
          <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>{pos.market}</span>
          {pos.fromJournal && <span className="badge badge-blue">JOURNAL</span>}
        </div>
        {!pos.fromJournal && (
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={() => onEdit(pos)} className="btn-icon" style={{ width: 26, height: 26 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button onClick={() => onDelete(pos.id)} className="btn-icon" style={{ width: 26, height: 26, color: "var(--danger)" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
            </button>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 10 }}>
        {[
          { label: "Entry", value: pos.entry     || "—" },
          { label: "SL",    value: pos.sl        || "—" },
          { label: "TP",    value: pos.tp        || "—" },
          { label: "Size",  value: pos.size ? `${pos.size} lot` : "—" },
          { label: "R:R",   value: pos.rr  ? `1:${pos.rr}`  : "—" },
          { label: "SL %",  value: pos.slPct ? `${pos.slPct}%` : "—" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--bg-subtle)", borderRadius: "var(--r-md)", padding: "6px 8px" }}>
            <div style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)", marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--text)", fontFamily: "var(--font-mono)" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Current price + PnL */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-subtle)", borderRadius: "var(--r-md)", padding: "10px 12px" }}>
        <div>
          <div style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)", marginBottom: 2 }}>CURRENT PRICE</div>
          {editingPrice ? (
            <input type="number" step="any" value={tempPrice}
              onChange={e => setTempPrice(e.target.value)}
              autoFocus
              onBlur={() => { onUpdatePrice(pos.id, tempPrice); setEditingPrice(false); }}
              onKeyDown={e => { if (e.key === "Enter") { onUpdatePrice(pos.id, tempPrice); setEditingPrice(false); }}}
              style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "var(--r-sm)", padding: "4px 8px", fontFamily: "var(--font-mono)", fontSize: "var(--fs-sm)", width: 100 }}/>
          ) : (
            <div onClick={() => setEditingPrice(true)} style={{ fontSize: "var(--fs-sm)", color: pos.currentPrice ? "var(--text)" : "var(--text-dim)", cursor: "pointer", fontFamily: "var(--font-mono)" }}>
              {pos.currentPrice || "Klik untuk isi"}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)", marginBottom: 2 }}>UNREALIZED P&L</div>
          <div style={{ fontSize: "var(--fs-lg)", fontWeight: 600, color: pnlColor, fontFamily: "var(--font-mono)" }}>
            {pos.currentPrice ? ((pos.unrealizedPnl ?? 0) >= 0 ? "+" : "") + formatCurrency(pos.unrealizedPnl ?? 0, false, sym) : "—"}
          </div>
        </div>
      </div>

      {pos.openDate && (
        <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 8 }}>
          Open: {pos.openDate}{pos.notes ? ` · ${pos.notes}` : ""}
        </div>
      )}
    </div>
  );
}

// ── Main Portfolio ────────────────────────────────────────────────
export default function Portfolio({ portfolioHook, settings, currencyMeta, theme }) {
  const sym = currencyMeta?.symbol ?? "$";
  const { isMobile } = useBreakpoint();
  const {
    positions, stats, form, setField,
    showForm, editId, openAdd, openEdit,
    closeForm, savePosition, deletePosition, updatePrice,
  } = portfolioHook;

  const capital     = settings?.capitalInitial ?? 10000;
  const totalPnlPct = capital > 0 ? ((stats.totalUnrealized ?? 0) / capital) * 100 : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Portfolio Tracker</h1>
          <p className="page-subtitle">Monitor posisi open dan exposure market</p>
        </div>
        <button onClick={openAdd} className="btn-primary" style={{ height: 30, fontSize: "var(--fs-sm)" }}>
          + Tambah Posisi
        </button>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10 }}>
        {[
          { label: "Total Posisi",   val: stats.totalPositions ?? 0, color: "var(--text)",    fmt: false },
          { label: "Unrealized P&L", val: stats.totalUnrealized ?? 0, color: (stats.totalUnrealized ?? 0) >= 0 ? "var(--success)" : "var(--danger)", fmt: true },
          { label: "Long",           val: stats.longCount  ?? 0, color: "var(--success)", fmt: false },
          { label: "Short",          val: stats.shortCount ?? 0, color: "var(--warning)", fmt: false },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ textAlign: "center" }}>
            <div className="kpi-label">{s.label}</div>
            <div style={{ fontFamily: "var(--font-disp)", fontSize: 28, color: s.color, lineHeight: 1, marginTop: 4 }}>
              {s.fmt ? `${s.val >= 0 ? "+" : ""}${formatCurrency(s.val, false, sym)}` : s.val}
            </div>
            {s.label === "Unrealized P&L" && capital > 0 && (
              <div style={{ fontSize: "var(--fs-xs)", color: s.color, marginTop: 3 }}>
                {totalPnlPct >= 0 ? "+" : ""}{totalPnlPct.toFixed(2)}%
              </div>
            )}
          </div>
        ))}
      </div>

      {/* By market */}
      {(stats.byMarket?.length ?? 0) > 0 && (
        <div className="stat-card">
          <div className="section-label" style={{ marginBottom: 12 }}>Allocation by Market</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {stats.byMarket.map(m => (
              <div key={m.market} style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "8px 14px", display: "flex", gap: 14, alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "var(--fs-sm)", color: "var(--text)", fontWeight: 500 }}>{m.market}</div>
                  <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>{m.count} posisi</div>
                </div>
                <div style={{ fontSize: "var(--fs-base)", color: (m.pnl ?? 0) >= 0 ? "var(--success)" : "var(--danger)", fontFamily: "var(--font-mono)", fontWeight: 500 }}>
                  {(m.pnl ?? 0) >= 0 ? "+" : ""}{formatCurrency(m.pnl ?? 0, false, sym)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Positions list */}
      {positions.length === 0 ? (
        <div className="stat-card">
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <div className="empty-title">Belum ada posisi open</div>
            <div className="empty-desc">Tambah posisi manual atau buka trade di Journal tanpa mengisi exit price</div>
            <button onClick={openAdd} className="btn-primary" style={{ marginTop: 16 }}>+ Tambah Posisi</button>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
          {positions.map(pos => (
            <PositionCard key={pos.id} pos={pos} sym={sym}
              onEdit={openEdit} onDelete={deletePosition} onUpdatePrice={updatePrice}/>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <PositionForm form={form} setField={setField}
          onSave={savePosition} onClose={closeForm} editId={editId}/>
      )}
    </div>
  );
}