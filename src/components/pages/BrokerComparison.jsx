import { useState } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { BROKER_TYPES, BROKER_PLATFORMS, COMMON_PAIRS } from "../../hooks/useBroker";

// ── Broker form ───────────────────────────────────────────────────
function BrokerForm({ form, setField, setSpread, onSave, onClose, editId }) {
  function toggleArr(key, val) {
    const arr = form[key] || [];
    setField(key, arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "var(--bg-overlay)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: "var(--r-xl)", padding: 24, width: "100%", maxWidth: 540,
        maxHeight: "92vh", overflowY: "auto", boxShadow: "var(--shadow-lg)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "var(--font-disp)", fontSize: 18, letterSpacing: 2, color: "var(--text)", fontWeight: 400 }}>
            {editId ? "EDIT BROKER" : "TAMBAH BROKER"}
          </h2>
          <button onClick={onClose} className="btn-icon">✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ gridColumn: "span 2" }}>
              <label>Nama Broker</label>
              <input value={form.name} onChange={e => setField("name", e.target.value)} placeholder="IC Markets"/>
            </div>
            <div>
              <label>Tipe</label>
              <select value={form.type} onChange={e => setField("type", e.target.value)}>
                {BROKER_TYPES.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label>Rating (1-5)</label>
              <input type="number" min="1" max="5" step="0.1" value={form.rating}
                onChange={e => setField("rating", parseFloat(e.target.value) || 0)}
                style={{ fontFamily: "var(--font-mono)" }}/>
            </div>
            <div>
              <label>Min Deposit ($)</label>
              <input type="number" value={form.minDeposit}
                onChange={e => setField("minDeposit", e.target.value)}
                style={{ fontFamily: "var(--font-mono)" }}/>
            </div>
            <div>
              <label>Leverage</label>
              <input value={form.leverage} onChange={e => setField("leverage", e.target.value)}
                placeholder="1:500" style={{ fontFamily: "var(--font-mono)" }}/>
            </div>
            <div>
              <label>Komisi/lot (USD)</label>
              <input type="number" step="0.1" value={form.commission}
                onChange={e => setField("commission", e.target.value)}
                style={{ fontFamily: "var(--font-mono)" }}/>
            </div>
            <div>
              <label>Negara / Regulasi</label>
              <input value={form.country} onChange={e => setField("country", e.target.value)} placeholder="Australia"/>
            </div>
          </div>

          {/* Platforms */}
          <div>
            <label>Platform</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
              {BROKER_PLATFORMS.map(p => {
                const active = (form.platforms || []).includes(p);
                return (
                  <button key={p} onClick={() => toggleArr("platforms", p)} style={{
                    padding: "4px 12px", borderRadius: "var(--r-sm)", cursor: "pointer",
                    border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                    background: active ? "var(--accent-dim)" : "transparent",
                    color: active ? "var(--accent)" : "var(--text-dim)",
                    fontSize: "var(--fs-xs)",
                  }}>{p}</button>
                );
              })}
            </div>
          </div>

          {/* Spreads */}
          <div>
            <div className="section-label" style={{ marginBottom: 8 }}>Spread (pips)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {COMMON_PAIRS.map(pair => (
                <div key={pair} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", width: 68, flexShrink: 0 }}>{pair}</span>
                  <input type="number" step="0.01" value={form.spreads?.[pair] || ""}
                    onChange={e => setSpread(pair, e.target.value)}
                    placeholder="0.0"
                    style={{ flex: 1, fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", padding: "5px 8px" }}/>
                </div>
              ))}
            </div>
          </div>

          {/* Swap free toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className={`toggle ${form.swapFree ? "on" : ""}`}
              onClick={() => setField("swapFree", !form.swapFree)} role="button"/>
            <span style={{ fontSize: "var(--fs-sm)", color: "var(--text)" }}>Islamic / Swap Free</span>
          </div>

          {/* Notes */}
          <div>
            <label>Catatan Pribadi</label>
            <textarea value={form.notes} onChange={e => setField("notes", e.target.value)}
              rows={3} placeholder="Pengalaman pakai broker ini..." style={{ lineHeight: 1.6 }}/>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>Batal</button>
          <button onClick={onSave} className="btn-primary" style={{ flex: 2, justifyContent: "center" }}>
            {editId ? "Update" : "Tambah Broker"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Broker card ───────────────────────────────────────────────────
function BrokerCard({ broker, isSelected, onClick }) {
  const stars = Math.round(broker.rating || 0);
  return (
    <div onClick={onClick} style={{
      background: isSelected ? "var(--accent-dim)" : "var(--bg-subtle)",
      border: `1px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
      borderRadius: "var(--r-lg)", padding: "12px 14px",
      cursor: "pointer", transition: "all var(--t-base)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text)" }}>{broker.name}</div>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 2 }}>{broker.type} · {broker.country}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--gold)" }}>{"★".repeat(stars)}{"☆".repeat(5 - stars)}</div>
          <div style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)" }}>{broker.rating}/5</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {broker.swapFree && <span className="badge badge-green" style={{ fontSize: 8 }}>Islamic</span>}
        {(broker.regulation || []).slice(0, 2).map(r => (
          <span key={r} className="badge badge-blue" style={{ fontSize: 8 }}>{r}</span>
        ))}
      </div>
    </div>
  );
}

// ── Broker detail ─────────────────────────────────────────────────
function BrokerDetail({ broker, onEdit, onDelete, onSaveNotes }) {
  const { isMobile } = useBreakpoint();
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(broker.notes || "");
  const stars = Math.round(broker.rating || 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
        <div>
          <h2 style={{ fontSize: "var(--fs-xl)", fontWeight: 600, color: "var(--text)" }}>{broker.name}</h2>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 3 }}>
            {broker.type} · {broker.country}
          </div>
          <div style={{ fontSize: "var(--fs-base)", color: "var(--gold)", marginTop: 4 }}>
            {"★".repeat(stars)}{"☆".repeat(5 - stars)}
            <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginLeft: 6 }}>{broker.rating}/5</span>
          </div>
        </div>
        {!broker.isDefault && (
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => onEdit(broker)} className="btn-ghost" style={{ height: 28, fontSize: "var(--fs-xs)" }}>Edit</button>
            <button onClick={() => onDelete(broker.id)} className="btn-icon" style={{ color: "var(--danger)" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
            </button>
          </div>
        )}
      </div>

      {/* Key stats */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 8 }}>
        {[
          { label: "Min Deposit",  val: `$${broker.minDeposit}` },
          { label: "Leverage",     val: broker.leverage },
          { label: "Commission",   val: broker.commission ? `$${broker.commission}/lot` : "No commission" },
          { label: "Swap Free",    val: broker.swapFree ? "✅ Ya" : "❌ Tidak" },
          { label: "Website",      val: broker.website || "—" },
          { label: "Platform",     val: (broker.platforms || []).join(", ") || "—" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--bg-subtle)", borderRadius: "var(--r-md)", padding: "8px 10px" }}>
            <div className="kpi-label">{s.label}</div>
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--text)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Regulation */}
      {(broker.regulation || []).length > 0 && (
        <div>
          <div className="section-label" style={{ marginBottom: 8 }}>Regulasi</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {broker.regulation.map(r => <span key={r} className="badge badge-blue">{r}</span>)}
          </div>
        </div>
      )}

      {/* Spreads */}
      {Object.keys(broker.spreads || {}).length > 0 && (
        <div>
          <div className="section-label" style={{ marginBottom: 8 }}>Spread (pips)</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 6 }}>
            {Object.entries(broker.spreads).map(([pair, spread]) => {
              const color = spread <= 0.5 ? "var(--success)" : spread <= 1.5 ? "var(--warning)" : "var(--danger)";
              return (
                <div key={pair} style={{ background: "var(--bg-subtle)", borderRadius: "var(--r-md)", padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)" }}>{pair}</div>
                  <div style={{ fontSize: "var(--fs-base)", color, fontFamily: "var(--font-mono)", fontWeight: 600, marginTop: 2 }}>{spread}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Personal notes */}
      <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "12px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div className="section-label">Catatan Pribadi</div>
          <button onClick={() => setEditingNotes(e => !e)} className="btn-ghost" style={{ height: 24, fontSize: "var(--fs-xs)", padding: "0 8px" }}>
            {editingNotes ? "Batal" : "Edit"}
          </button>
        </div>
        {editingNotes ? (
          <div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Pengalaman pakai broker ini, kelebihan, kekurangan..."
              style={{ lineHeight: 1.6 }}/>
            <button onClick={() => { onSaveNotes(broker.id, notes); setEditingNotes(false); }}
              className="btn-primary" style={{ marginTop: 8, fontSize: "var(--fs-xs)", height: 28, padding: "0 14px" }}>
              Simpan
            </button>
          </div>
        ) : (
          <div style={{ fontSize: "var(--fs-sm)", color: notes ? "var(--text-muted)" : "var(--text-dim)", lineHeight: 1.7, fontStyle: notes ? "normal" : "italic" }}>
            {notes || "Belum ada catatan. Klik Edit untuk tambah."}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Spread comparison ─────────────────────────────────────────────
function SpreadComparison({ brokers, comparePair, setComparePair }) {
  const sorted   = [...brokers].filter(b => b.spreads?.[comparePair] !== undefined).sort((a, b) => (a.spreads[comparePair] || 99) - (b.spreads[comparePair] || 99));
  const maxSpread = sorted[sorted.length - 1]?.spreads[comparePair] || 1;

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {COMMON_PAIRS.map(p => {
          const active = comparePair === p;
          return (
            <button key={p} onClick={() => setComparePair(p)} style={{
              padding: "4px 12px", borderRadius: "var(--r-sm)", cursor: "pointer",
              border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
              background: active ? "var(--accent-dim)" : "transparent",
              color: active ? "var(--accent)" : "var(--text-dim)",
              fontSize: "var(--fs-xs)", fontFamily: "var(--font-mono)",
            }}>{p}</button>
          );
        })}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {sorted.map((broker, i) => {
          const spread = broker.spreads[comparePair] || 0;
          const pct    = (spread / maxSpread) * 100;
          const color  = spread <= 0.5 ? "var(--success)" : spread <= 1.5 ? "var(--warning)" : "var(--danger)";
          const medals = ["🥇","🥈","🥉"];
          return (
            <div key={broker.id} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              background: i === 0 ? "var(--success-dim)" : "var(--bg-subtle)",
              border: `1px solid ${i === 0 ? "var(--success)" : "var(--border)"}`,
              borderRadius: "var(--r-md)",
            }}>
              <span style={{ width: 20, textAlign: "center" }}>{medals[i] || `${i+1}`}</span>
              <span style={{ width: 100, fontSize: "var(--fs-sm)", color: "var(--text)", flexShrink: 0 }}>{broker.name}</span>
              <div style={{ flex: 1, height: 6, background: "var(--bg-card)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.4s" }}/>
              </div>
              <span style={{ fontSize: "var(--fs-base)", color, fontFamily: "var(--font-mono)", fontWeight: 600, width: 36, textAlign: "right" }}>{spread}</span>
              <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>pip</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Cost analysis ─────────────────────────────────────────────────
function CostAnalysis({ costAnalysis }) {
  if (!costAnalysis.length || costAnalysis.every(c => c.totalCost === 0)) return (
    <div style={{ color: "var(--text-dim)", fontSize: "var(--fs-sm)", textAlign: "center", padding: "20px 0" }}>
      Log beberapa trade dulu untuk lihat estimasi biaya per broker.
    </div>
  );

  const maxCost = costAnalysis[costAnalysis.length - 1]?.totalCost || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {costAnalysis.slice(0, 6).map((c, i) => (
        <div key={c.broker.id} style={{
          display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
          background: i === 0 ? "var(--success-dim)" : "var(--bg-subtle)",
          border: `1px solid ${i === 0 ? "var(--success)" : "var(--border)"}`,
          borderRadius: "var(--r-md)",
        }}>
          <span style={{ width: 100, fontSize: "var(--fs-sm)", color: "var(--text)", flexShrink: 0 }}>{c.broker.name}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginBottom: 4 }}>
              Spread: ${c.spreadCost.toFixed(0)} · Komisi: ${c.commissionCost.toFixed(0)}
            </div>
            <div style={{ height: 4, background: "var(--bg-card)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, (c.totalCost / maxCost) * 100)}%`, background: i === 0 ? "var(--success)" : "var(--warning)", borderRadius: 2 }}/>
            </div>
          </div>
          <span style={{ fontSize: "var(--fs-base)", color: i === 0 ? "var(--success)" : "var(--text)", fontFamily: "var(--font-mono)", fontWeight: 600, flexShrink: 0 }}>
            ${c.totalCost.toFixed(0)}
          </span>
        </div>
      ))}
      <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", textAlign: "center", marginTop: 4 }}>
        *Estimasi berdasarkan history trade kamu
      </p>
    </div>
  );
}

// ── Main BrokerComparison ─────────────────────────────────────────
export default function BrokerComparison({ brokerHook, theme }) {
  const { isMobile } = useBreakpoint();
  const [activePanel, setActivePanel] = useState("list");
  const {
    brokers, costAnalysis,
    comparePair, setComparePair,
    showForm, form, setField, setSpread, editId,
    selected, setSelected,
    openAdd, openEdit, closeForm, saveBroker, deleteBroker, saveNotes,
  } = brokerHook;

  const selectedBroker = selected ? brokers.find(b => b.id === selected.id) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Broker Comparison</h1>
          <p className="page-subtitle">Bandingkan broker, spread, dan biaya trading</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ display: "flex", gap: 2, background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 2 }}>
            {[{ v: "list", l: "Brokers" }, { v: "spread", l: "Spread" }, { v: "cost", l: "Biaya" }].map(p => (
              <button key={p.v} onClick={() => setActivePanel(p.v)} style={{
                padding: "5px 12px", borderRadius: "var(--r-sm)", border: "none", cursor: "pointer",
                fontSize: "var(--fs-xs)", fontFamily: "var(--font-mono)",
                background: activePanel === p.v ? "var(--accent)"      : "transparent",
                color:      activePanel === p.v ? "var(--text-inverse)" : "var(--text-dim)",
                fontWeight: activePanel === p.v ? 600 : 400,
              }}>{p.l}</button>
            ))}
          </div>
          <button onClick={openAdd} className="btn-primary" style={{ height: 30, fontSize: "var(--fs-sm)" }}>
            + Tambah Broker
          </button>
        </div>
      </div>

      {activePanel === "spread" && (
        <div className="stat-card">
          <div className="section-label" style={{ marginBottom: 14 }}>Perbandingan Spread</div>
          <SpreadComparison brokers={brokers} comparePair={comparePair} setComparePair={setComparePair}/>
        </div>
      )}

      {activePanel === "cost" && (
        <div className="stat-card">
          <div className="section-label" style={{ marginBottom: 14 }}>Estimasi Biaya Trading</div>
          <CostAnalysis costAnalysis={costAnalysis}/>
        </div>
      )}

      {activePanel === "list" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "260px 1fr", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: isMobile ? "50vh" : "80vh", overflowY: "auto", paddingRight: 2 }}>
            {brokers.map(b => (
              <BrokerCard key={b.id} broker={b} isSelected={selected?.id === b.id} onClick={() => setSelected(b)}/>
            ))}
          </div>
          <div className="stat-card">
            {selectedBroker ? (
              <BrokerDetail broker={selectedBroker} onEdit={openEdit} onDelete={deleteBroker} onSaveNotes={saveNotes}/>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-dim)", fontSize: "var(--fs-sm)" }}>
                Pilih broker di kiri
              </div>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <BrokerForm form={form} setField={setField} setSpread={setSpread}
          onSave={saveBroker} onClose={closeForm} editId={editId}/>
      )}
    </div>
  );
}