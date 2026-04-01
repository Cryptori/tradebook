import { useState } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";

const MARKETS  = ["Forex","Gold","Crypto","Saham IDX","Saham Global"];
const SESSIONS = ["Asian","London","New York"];
const SESSION_HOURS = { Asian: "00:00–07:00 UTC", London: "07:00–16:00 UTC", "New York": "13:00–22:00 UTC" };

// ── Pair form ─────────────────────────────────────────────────────
function PairForm({ form, setForm, onSave, onClose, editId }) {
  function toggleSession(s) {
    const arr = form.sessions || [];
    setForm(p => ({ ...p, sessions: arr.includes(s) ? arr.filter(x => x !== s) : [...arr, s] }));
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "var(--bg-overlay)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: "var(--r-xl)", padding: 24, width: "100%", maxWidth: 400,
        boxShadow: "var(--shadow-lg)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "var(--font-disp)", fontSize: 18, letterSpacing: 2, color: "var(--text)", fontWeight: 400 }}>
            {editId ? "EDIT PAIR" : "TAMBAH PAIR"}
          </h2>
          <button onClick={onClose} className="btn-icon">✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label>Symbol</label>
            <input value={form.symbol}
              onChange={e => setForm(p => ({ ...p, symbol: e.target.value.toUpperCase() }))}
              placeholder="EUR/USD, BTC/USD, BBCA"
              style={{ fontFamily: "var(--font-mono)", textTransform: "uppercase" }}/>
          </div>
          <div>
            <label>Market</label>
            <select value={form.market} onChange={e => setForm(p => ({ ...p, market: e.target.value }))}>
              {MARKETS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label>Alert HIGH</label>
              <input type="number" step="any" value={form.alertHigh}
                onChange={e => setForm(p => ({ ...p, alertHigh: e.target.value }))}
                placeholder="0.00" style={{ fontFamily: "var(--font-mono)" }}/>
            </div>
            <div>
              <label>Alert LOW</label>
              <input type="number" step="any" value={form.alertLow}
                onChange={e => setForm(p => ({ ...p, alertLow: e.target.value }))}
                placeholder="0.00" style={{ fontFamily: "var(--font-mono)" }}/>
            </div>
          </div>
          <div>
            <label>Session Aktif</label>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              {SESSIONS.map(s => {
                const active = (form.sessions || []).includes(s);
                return (
                  <button key={s} onClick={() => toggleSession(s)} style={{
                    flex: 1, padding: "6px 0", borderRadius: "var(--r-md)", cursor: "pointer",
                    border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                    background: active ? "var(--accent-dim)" : "transparent",
                    color: active ? "var(--accent)" : "var(--text-dim)",
                    fontSize: "var(--fs-xs)",
                  }}>{s}</button>
                );
              })}
            </div>
          </div>
          <div>
            <label>Notes / Setup</label>
            <textarea value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={2} placeholder="Setup favorit, level penting, catatan..."
              style={{ fontSize: "var(--fs-sm)" }}/>
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

// ── Watchlist row ─────────────────────────────────────────────────
function WatchlistRow({ item, price, pairStat, currentSession, onEdit, onRemove, onSaveNotes }) {
  const [editNotes,  setEditNotes]  = useState(false);
  const [notesInput, setNotesInput] = useState(item.notes || "");

  const isActive = (item.sessions || []).includes(currentSession);
  const sym      = item.symbol.replace("/", "").toUpperCase();
  const stat     = pairStat?.[sym];
  const winRate  = stat ? ((stat.wins / stat.trades) * 100).toFixed(0) : null;
  const change   = price?.change24h;

  return (
    <div style={{
      background: "var(--bg-card)",
      border: `1px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
      borderLeft: `3px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
      borderRadius: "var(--r-lg)", padding: "12px 14px",
      transition: "border-color var(--t-base)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Active dot */}
        <div style={{
          width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
          background: isActive ? "var(--accent)" : "var(--bg-subtle)",
          boxShadow: isActive ? "0 0 6px var(--accent)" : "none",
        }}/>

        {/* Symbol */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-base)", fontWeight: 700, color: "var(--text)" }}>
              {item.symbol}
            </span>
            <span style={{ fontSize: "var(--fs-2xs)", padding: "1px 5px", borderRadius: 3, background: "var(--bg-subtle)", color: "var(--text-dim)" }}>
              {item.market}
            </span>
            {isActive && (
              <span style={{ fontSize: "var(--fs-2xs)", color: "var(--accent)" }}>● {currentSession}</span>
            )}
          </div>
        </div>

        {/* Price */}
        <div style={{ textAlign: "right", minWidth: 80 }}>
          {price?.price ? (
            <>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-base)", color: "var(--text)", fontWeight: 600 }}>
                {price.price > 1000 ? price.price.toLocaleString("en", { maximumFractionDigits: 2 }) : price.price.toFixed(5)}
              </div>
              {change != null && (
                <div style={{ fontSize: "var(--fs-xs)", color: change >= 0 ? "var(--success)" : "var(--danger)" }}>
                  {change >= 0 ? "+" : ""}{change.toFixed(2)}%
                </div>
              )}
              {price.lastUpdated && <div style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)" }}>{price.lastUpdated}</div>}
            </>
          ) : (
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-dim)" }}>—</div>
          )}
        </div>

        {/* Win rate */}
        {winRate && (
          <div style={{ textAlign: "center", minWidth: 48 }}>
            <div style={{ fontSize: "var(--fs-sm)", color: parseFloat(winRate) >= 50 ? "var(--success)" : "var(--warning)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
              {winRate}%
            </div>
            <div style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)" }}>{stat.trades}x</div>
          </div>
        )}

        {/* Alert */}
        {(item.alertHigh || item.alertLow) && (
          <span title={`Alert: H${item.alertHigh || "-"} L${item.alertLow || "-"}`}>🔔</span>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 3 }}>
          <button onClick={() => onEdit(item)} className="btn-icon" style={{ width: 26, height: 26 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button onClick={() => onRemove(item.id)} className="btn-icon" style={{ width: 26, height: 26, color: "var(--danger)" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
          </button>
        </div>
      </div>

      {/* Alert levels */}
      {(item.alertHigh || item.alertLow) && (
        <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>
          {item.alertHigh && <span>🔺 H: <span style={{ fontFamily: "var(--font-mono)", color: "var(--warning)" }}>{item.alertHigh}</span></span>}
          {item.alertLow  && <span>🔻 L: <span style={{ fontFamily: "var(--font-mono)", color: "var(--danger)" }}>{item.alertLow}</span></span>}
        </div>
      )}

      {/* Notes */}
      {editNotes ? (
        <div style={{ marginTop: 10 }}>
          <textarea value={notesInput} onChange={e => setNotesInput(e.target.value)}
            rows={2} autoFocus style={{ fontSize: "var(--fs-xs)" }}/>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <button onClick={() => { onSaveNotes(item.id, notesInput); setEditNotes(false); }}
              className="btn-primary" style={{ fontSize: "var(--fs-xs)", height: 28, padding: "0 12px" }}>Simpan</button>
            <button onClick={() => setEditNotes(false)}
              className="btn-ghost" style={{ fontSize: "var(--fs-xs)", height: 28 }}>Batal</button>
          </div>
        </div>
      ) : item.notes ? (
        <div onClick={() => setEditNotes(true)} style={{ marginTop: 8, fontSize: "var(--fs-xs)", color: "var(--text-dim)", fontStyle: "italic", cursor: "pointer", lineHeight: 1.5 }}>
          📝 {item.notes}
        </div>
      ) : (
        <button onClick={() => setEditNotes(true)} style={{ marginTop: 6, background: "none", border: "none", fontSize: "var(--fs-xs)", color: "var(--text-dim)", cursor: "pointer", padding: 0 }}>
          + Tambah notes
        </button>
      )}
    </div>
  );
}

// ── Main MarketScanner ────────────────────────────────────────────
export default function MarketScanner({ scannerHook, theme }) {
  const { isMobile } = useBreakpoint();
  const {
    watchlist, prices, loading, pairStats, bestPairs, currentSession,
    showForm, form, setForm, editId,
    openAdd, openEdit, saveItem, removeItem, saveNotes, refreshPrices,
  } = scannerHook;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Market Scanner</h1>
          <p className="page-subtitle">
            Session aktif: <span style={{ color: "var(--accent)", fontWeight: 500 }}>{currentSession}</span>
            {" · "}{SESSION_HOURS[currentSession]}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={refreshPrices} className="btn-ghost" style={{ height: 30, fontSize: "var(--fs-sm)" }}>
            {loading ? "⟳ Loading..." : "⟳ Refresh"}
          </button>
          <button onClick={openAdd} className="btn-primary" style={{ height: 30, fontSize: "var(--fs-sm)" }}>
            + Tambah Pair
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 280px", gap: 14, alignItems: "start" }}>
        {/* Watchlist */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="section-label">Watchlist ({watchlist.length})</div>
          {watchlist.length === 0 ? (
            <div className="stat-card">
              <div className="empty-state">
                <div className="empty-icon">📡</div>
                <div className="empty-title">Belum ada pair di watchlist</div>
                <div className="empty-desc">Tambah pair untuk dipantau setiap sesi</div>
                <button onClick={openAdd} className="btn-primary" style={{ marginTop: 14 }}>+ Tambah Pair</button>
              </div>
            </div>
          ) : (
            watchlist.map(item => (
              <WatchlistRow key={item.id} item={item}
                price={prices[item.id]} pairStat={pairStats}
                currentSession={currentSession}
                onEdit={openEdit} onRemove={removeItem} onSaveNotes={saveNotes}/>
            ))
          )}
        </div>

        {/* Right panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Session schedule */}
          <div className="stat-card">
            <div className="section-label" style={{ marginBottom: 10 }}>Session Jadwal</div>
            {Object.entries(SESSION_HOURS).map(([session, hours]) => {
              const isActive = session === currentSession;
              return (
                <div key={session} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: isActive ? "var(--accent)" : "var(--bg-subtle)", boxShadow: isActive ? "0 0 6px var(--accent)" : "none" }}/>
                    <span style={{ fontSize: "var(--fs-sm)", color: isActive ? "var(--accent)" : "var(--text-muted)", fontWeight: isActive ? 600 : 400 }}>
                      {session}
                    </span>
                  </div>
                  <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>{hours}</span>
                </div>
              );
            })}
          </div>

          {/* Best pairs */}
          {(bestPairs?.length ?? 0) > 0 && (
            <div className="stat-card">
              <div className="section-label" style={{ marginBottom: 10 }}>Best Pairs (history)</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {bestPairs.map((bp, i) => (
                  <div key={bp.pair} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", width: 14 }}>{i+1}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-sm)", color: "var(--text)", flex: 1 }}>{bp.pair}</span>
                    <div style={{ flex: 2, height: 3, background: "var(--bg-subtle)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${bp.winRate}%`, background: bp.winRate >= 60 ? "var(--success)" : "var(--warning)", borderRadius: 2 }}/>
                    </div>
                    <span style={{ fontSize: "var(--fs-xs)", color: bp.winRate >= 60 ? "var(--success)" : "var(--warning)", fontFamily: "var(--font-mono)", width: 34, textAlign: "right" }}>
                      {bp.winRate.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <PairForm form={form} setForm={setForm} onSave={saveItem}
          onClose={() => scannerHook.closeForm?.()} editId={editId}/>
      )}
    </div>
  );
}