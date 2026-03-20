import { useState } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { formatCurrency } from "../../utils/formatters";

const MARKETS    = ["Forex", "Gold", "Crypto", "Saham IDX", "Saham Global"];
const SESSIONS   = ["Asian", "London", "New York"];
const SESSION_HOURS = { Asian: "00:00–07:00 UTC", London: "07:00–16:00 UTC", "New York": "13:00–22:00 UTC" };

// ── Pair Form Modal ───────────────────────────────────────────────
function PairForm({ form, setForm, onSave, onClose, editId, theme: t }) {
  function toggleSession(s) {
    const arr = form.sessions || [];
    setForm(p => ({ ...p, sessions: arr.includes(s) ? arr.filter(x => x !== s) : [...arr, s] }));
  }
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(8,12,20,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(6px)" }}>
      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24, width: "100%", maxWidth: 420 }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2, color: t.text, marginBottom: 20 }}>
          {editId ? "EDIT PAIR" : "TAMBAH PAIR"}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label>Symbol</label>
            <input value={form.symbol} onChange={e => setForm(p => ({ ...p, symbol: e.target.value.toUpperCase() }))} placeholder="EUR/USD, BTC/USD, BBCA"
              style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, fontFamily: "DM Mono, monospace", textTransform: "uppercase" }} />
          </div>
          <div>
            <label>Market</label>
            <select value={form.market} onChange={e => setForm(p => ({ ...p, market: e.target.value }))}
              style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8 }}>
              {MARKETS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label>Alert HIGH</label>
              <input type="number" step="any" value={form.alertHigh} onChange={e => setForm(p => ({ ...p, alertHigh: e.target.value }))} placeholder="0.00"
                style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, fontFamily: "DM Mono, monospace" }} />
            </div>
            <div>
              <label>Alert LOW</label>
              <input type="number" step="any" value={form.alertLow} onChange={e => setForm(p => ({ ...p, alertLow: e.target.value }))} placeholder="0.00"
                style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, fontFamily: "DM Mono, monospace" }} />
            </div>
          </div>
          <div>
            <label style={{ marginBottom: 6 }}>Session Aktif</label>
            <div style={{ display: "flex", gap: 6 }}>
              {SESSIONS.map(s => (
                <button key={s} onClick={() => toggleSession(s)}
                  style={{ flex: 1, padding: "6px 0", borderRadius: 7, border: `1px solid ${(form.sessions || []).includes(s) ? t.accent : t.border}`, background: (form.sessions || []).includes(s) ? "rgba(0,200,150,0.08)" : "transparent", color: (form.sessions || []).includes(s) ? "#00c896" : t.textDim, fontSize: 11, cursor: "pointer" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label>Notes / Setup</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
              placeholder="Setup favorit, level penting, catatan..."
              style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, resize: "vertical", fontSize: 12 }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>Batal</button>
          <button onClick={onSave} className="btn-primary" style={{ flex: 2, justifyContent: "center" }}>
            {editId ? "Update" : "Tambah"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Watchlist Row ─────────────────────────────────────────────────
function WatchlistRow({ item, price, pairStat, currentSession, onEdit, onRemove, onSaveNotes, theme: t }) {
  const [editNotes,   setEditNotes]   = useState(false);
  const [notesInput,  setNotesInput]  = useState(item.notes || "");

  const isActiveSession = (item.sessions || []).includes(currentSession);
  const hasAlert = item.alertHigh || item.alertLow;
  const sym = item.symbol.replace("/", "").toUpperCase();
  const stat = pairStat?.[sym];
  const winRate = stat ? ((stat.wins / stat.trades) * 100).toFixed(0) : null;
  const change = price?.change24h;

  return (
    <div style={{ background: t.bgCard, border: `1px solid ${isActiveSession ? "rgba(0,200,150,0.2)" : t.border}`, borderRadius: 12, padding: "14px 16px", transition: "border-color 0.2s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Session indicator */}
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: isActiveSession ? "#00c896" : t.bgSubtle, flexShrink: 0, boxShadow: isActiveSession ? "0 0 8px #00c896" : "none" }} />

        {/* Symbol */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "DM Mono, monospace", fontSize: 14, fontWeight: 600, color: t.text }}>{item.symbol}</span>
            <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, background: t.bgSubtle, color: t.textDim }}>{item.market}</span>
            {isActiveSession && <span style={{ fontSize: 9, color: "#00c896" }}>● {currentSession}</span>}
          </div>
        </div>

        {/* Price */}
        <div style={{ textAlign: "right", minWidth: 80 }}>
          {price?.price ? (
            <>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: 14, color: t.text, fontWeight: 600 }}>
                {price.price > 1000 ? price.price.toLocaleString("en", { maximumFractionDigits: 2 }) : price.price.toFixed(5)}
              </div>
              {change !== null && change !== undefined && (
                <div style={{ fontSize: 10, color: change >= 0 ? "#00c896" : "#ef4444" }}>
                  {change >= 0 ? "+" : ""}{change.toFixed(2)}%
                </div>
              )}
              {price.lastUpdated && <div style={{ fontSize: 9, color: t.textDim }}>{price.lastUpdated}</div>}
            </>
          ) : (
            <div style={{ fontSize: 11, color: t.textDim }}>—</div>
          )}
        </div>

        {/* Win rate from history */}
        {winRate && (
          <div style={{ textAlign: "center", minWidth: 56 }}>
            <div style={{ fontSize: 12, color: parseFloat(winRate) >= 50 ? "#00c896" : "#f59e0b", fontFamily: "DM Mono, monospace", fontWeight: 600 }}>{winRate}%</div>
            <div style={{ fontSize: 9, color: t.textDim }}>{stat.trades}x</div>
          </div>
        )}

        {/* Alert indicator */}
        {hasAlert && (
          <div style={{ fontSize: 14 }} title={`Alert: H${item.alertHigh || "-"} L${item.alertLow || "-"}`}>🔔</div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => onEdit(item)} style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 13, padding: "3px 5px" }}>✎</button>
          <button onClick={() => onRemove(item.id)} style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 13, padding: "3px 5px" }}>✕</button>
        </div>
      </div>

      {/* Alert levels */}
      {hasAlert && (
        <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 11, color: t.textDim }}>
          {item.alertHigh && <span>🔺 H: <span style={{ fontFamily: "DM Mono, monospace", color: "#f59e0b" }}>{item.alertHigh}</span></span>}
          {item.alertLow  && <span>🔻 L: <span style={{ fontFamily: "DM Mono, monospace", color: "#ef4444" }}>{item.alertLow}</span></span>}
        </div>
      )}

      {/* Notes */}
      {editNotes ? (
        <div style={{ marginTop: 10 }}>
          <textarea value={notesInput} onChange={e => setNotesInput(e.target.value)} rows={2}
            autoFocus
            style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 7, width: "100%", padding: "7px 10px", fontSize: 11, resize: "vertical" }} />
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <button onClick={() => { onSaveNotes(item.id, notesInput); setEditNotes(false); }} className="btn-primary" style={{ fontSize: 11, padding: "5px 12px" }}>Simpan</button>
            <button onClick={() => setEditNotes(false)} className="btn-ghost" style={{ fontSize: 11, padding: "5px 10px" }}>Batal</button>
          </div>
        </div>
      ) : item.notes ? (
        <div onClick={() => setEditNotes(true)} style={{ marginTop: 8, fontSize: 11, color: t.textDim, fontStyle: "italic", cursor: "pointer", lineHeight: 1.5 }}>
          📝 {item.notes}
        </div>
      ) : (
        <button onClick={() => setEditNotes(true)} style={{ marginTop: 6, background: "none", border: "none", fontSize: 11, color: t.textDim, cursor: "pointer", padding: 0 }}>
          + Tambah notes
        </button>
      )}
    </div>
  );
}

// ── Main MarketScanner ────────────────────────────────────────────
export default function MarketScanner({ scannerHook, theme }) {
  const t = theme;
  const { isMobile } = useBreakpoint();
  const {
    watchlist, prices, loading, pairStats, bestPairs, currentSession,
    showForm, form, setForm, editId,
    openAdd, openEdit, saveItem, removeItem, saveNotes, refreshPrices,
  } = scannerHook;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 3, color: t.text, lineHeight: 1 }}>MARKET SCANNER</div>
          <div style={{ fontSize: 11, color: t.textDim, marginTop: 4 }}>
            Session aktif: <span style={{ color: "#00c896", fontWeight: 500 }}>{currentSession}</span>
            <span style={{ color: t.textDim }}> · {SESSION_HOURS[currentSession]}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={refreshPrices} className="btn-ghost" style={{ fontSize: 11, padding: "6px 12px" }}>
            {loading ? "⟳ Loading..." : "⟳ Refresh"}
          </button>
          <button onClick={openAdd} className="btn-primary" style={{ fontSize: 11 }}>+ Tambah Pair</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 300px", gap: 20, alignItems: "start" }}>

        {/* Watchlist */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600 }}>
            Watchlist ({watchlist.length})
          </div>
          {watchlist.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📡</div>
              <div style={{ fontSize: 14, color: t.text }}>Belum ada pair di watchlist</div>
              <button onClick={openAdd} className="btn-primary" style={{ marginTop: 16, fontSize: 12 }}>+ Tambah Pair</button>
            </div>
          ) : (
            watchlist.map(item => (
              <WatchlistRow key={item.id} item={item} price={prices[item.id]} pairStat={pairStats}
                currentSession={currentSession} onEdit={openEdit} onRemove={removeItem}
                onSaveNotes={saveNotes} theme={t} />
            ))
          )}
        </div>

        {/* Right panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Session info */}
          <div className="stat-card">
            <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 12 }}>Session Jadwal</div>
            {Object.entries(SESSION_HOURS).map(([session, hours]) => {
              const isActive = session === currentSession;
              return (
                <div key={session} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${t.borderSubtle}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: isActive ? "#00c896" : t.bgSubtle }} />
                    <span style={{ fontSize: 12, color: isActive ? "#00c896" : t.textMuted, fontWeight: isActive ? 500 : 400 }}>{session}</span>
                  </div>
                  <span style={{ fontSize: 10, color: t.textDim, fontFamily: "DM Mono, monospace" }}>{hours}</span>
                </div>
              );
            })}
          </div>

          {/* Best pairs from history */}
          {bestPairs.length > 0 && (
            <div className="stat-card">
              <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 12 }}>Best Pairs (dari history)</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {bestPairs.map((bp, i) => (
                  <div key={bp.pair} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize: 12, color: t.textDim, width: 16 }}>{i + 1}</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: t.text, flex: 1 }}>{bp.pair}</div>
                    <div style={{ flex: 2, height: 4, background: t.bgSubtle, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${bp.winRate}%`, background: bp.winRate >= 60 ? "#00c896" : "#f59e0b", borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 12, color: bp.winRate >= 60 ? "#00c896" : "#f59e0b", fontFamily: "DM Mono, monospace", width: 38, textAlign: "right" }}>
                      {bp.winRate.toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <PairForm form={form} setForm={setForm} onSave={saveItem} onClose={() => scannerHook.closeForm?.()} editId={editId} theme={t} />
      )}
    </div>
  );
}