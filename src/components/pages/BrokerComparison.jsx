import { useState } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { formatCurrency } from "../../utils/formatters";
import { BROKER_TYPES, BROKER_PLATFORMS, COMMON_PAIRS } from "../../hooks/useBroker";

// ── Broker Form ──────────────────────────────────────────────────
function BrokerForm({ form, setField, setSpread, onSave, onClose, editId, theme: t }) {
  function toggleArr(key, val) {
    const arr = form[key] || [];
    setField(key, arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2, color: t.text }}>
            {editId ? "EDIT BROKER" : "TAMBAH BROKER"}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ color: t.textDim }}>Nama Broker</label>
              <input value={form.name} onChange={e => setField("name", e.target.value)} placeholder="IC Markets"
                style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "9px 12px", fontSize: 13, marginTop: 4 }} />
            </div>
            <div>
              <label style={{ color: t.textDim }}>Tipe</label>
              <select value={form.type} onChange={e => setField("type", e.target.value)}
                style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "9px 12px", fontSize: 13, marginTop: 4 }}>
                {BROKER_TYPES.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: t.textDim }}>Rating (1-5)</label>
              <input type="number" min="1" max="5" step="0.1" value={form.rating} onChange={e => setField("rating", parseFloat(e.target.value) || 0)}
                style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "9px 12px", fontSize: 13, marginTop: 4 }} />
            </div>
            <div>
              <label style={{ color: t.textDim }}>Min Deposit ($)</label>
              <input type="number" value={form.minDeposit} onChange={e => setField("minDeposit", e.target.value)}
                style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "9px 12px", fontSize: 13, marginTop: 4 }} />
            </div>
            <div>
              <label style={{ color: t.textDim }}>Leverage</label>
              <input value={form.leverage} onChange={e => setField("leverage", e.target.value)} placeholder="1:500"
                style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "9px 12px", fontSize: 13, marginTop: 4 }} />
            </div>
            <div>
              <label style={{ color: t.textDim }}>Komisi/lot (USD)</label>
              <input type="number" step="0.1" value={form.commission} onChange={e => setField("commission", e.target.value)}
                style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "9px 12px", fontSize: 13, marginTop: 4 }} />
            </div>
            <div>
              <label style={{ color: t.textDim }}>Negara / Regulasi</label>
              <input value={form.country} onChange={e => setField("country", e.target.value)} placeholder="Australia"
                style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "9px 12px", fontSize: 13, marginTop: 4 }} />
            </div>
          </div>

          {/* Platforms */}
          <div>
            <label style={{ color: t.textDim, fontSize: 11, display: "block", marginBottom: 6 }}>Platform</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {BROKER_PLATFORMS.map(p => (
                <button key={p} onClick={() => toggleArr("platforms", p)}
                  style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${(form.platforms || []).includes(p) ? "#00d4aa" : t.border}`, background: (form.platforms || []).includes(p) ? "rgba(0,212,170,0.1)" : "transparent", color: (form.platforms || []).includes(p) ? "#00d4aa" : t.textDim, fontSize: 11, cursor: "pointer" }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Spreads */}
          <div>
            <div style={{ fontSize: 11, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Spread (pips)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {COMMON_PAIRS.map(pair => (
                <div key={pair} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: t.textDim, width: 70, flexShrink: 0 }}>{pair}</span>
                  <input type="number" step="0.01" value={form.spreads?.[pair] || ""} onChange={e => setSpread(pair, e.target.value)}
                    placeholder="0.0"
                    style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 6, flex: 1, padding: "6px 10px", fontFamily: "DM Mono, monospace", fontSize: 12 }} />
                </div>
              ))}
            </div>
          </div>

          {/* Swap free */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setField("swapFree", !form.swapFree)}
              style={{ width: 36, height: 20, borderRadius: 10, background: form.swapFree ? "#00d4aa" : t.bgSubtle, border: `1px solid ${form.swapFree ? "#00d4aa" : t.border}`, cursor: "pointer", position: "relative", transition: "all 0.2s" }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: form.swapFree ? 18 : 2, transition: "left 0.2s" }} />
            </button>
            <span style={{ fontSize: 13, color: t.text }}>Islamic / Swap Free</span>
          </div>

          {/* Notes */}
          <div>
            <label style={{ color: t.textDim, fontSize: 11 }}>Catatan Pribadi</label>
            <textarea value={form.notes} onChange={e => setField("notes", e.target.value)} rows={3}
              placeholder="Pengalaman pakai broker ini..."
              style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "8px 12px", fontSize: 12, resize: "vertical", marginTop: 4 }} />
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

// ── Broker Card ──────────────────────────────────────────────────
function BrokerCard({ broker, isSelected, onClick, theme: t }) {
  const stars = "★".repeat(Math.round(broker.rating)) + "☆".repeat(5 - Math.round(broker.rating));
  return (
    <div onClick={onClick} style={{ background: isSelected ? "rgba(0,212,170,0.06)" : t.bgSubtle, border: `1px solid ${isSelected ? "rgba(0,212,170,0.4)" : t.borderSubtle}`, borderRadius: 10, padding: "14px 16px", cursor: "pointer", transition: "all 0.15s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: t.text }}>{broker.name}</div>
          <div style={{ fontSize: 10, color: t.textDim, marginTop: 2 }}>{broker.type} · {broker.country}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, color: "#f59e0b" }}>{stars}</div>
          <div style={{ fontSize: 10, color: t.textDim }}>{broker.rating}/5</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {(broker.regulation || []).slice(0, 3).map(r => (
          <span key={r} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)" }}>{r}</span>
        ))}
        {broker.swapFree && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(0,212,170,0.1)", color: "#00d4aa", border: "1px solid rgba(0,212,170,0.2)" }}>Islamic</span>}
      </div>
    </div>
  );
}

// ── Broker Detail ────────────────────────────────────────────────
function BrokerDetail({ broker, onEdit, onDelete, onSaveNotes, theme: t }) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes]               = useState(broker.notes || "");
  const stars = Math.round(broker.rating);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: t.text }}>{broker.name}</div>
          <div style={{ fontSize: 12, color: t.textDim, marginTop: 3 }}>{broker.type} · Founded {broker.founded} · {broker.country}</div>
          <div style={{ fontSize: 14, color: "#f59e0b", marginTop: 4 }}>{"★".repeat(stars)}{"☆".repeat(5 - stars)} <span style={{ fontSize: 11, color: t.textDim }}>{broker.rating}/5</span></div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {!broker.isDefault && <button onClick={() => onEdit(broker)} className="btn-ghost" style={{ fontSize: 11, padding: "6px 12px" }}>Edit</button>}
          {!broker.isDefault && <button onClick={() => onDelete(broker.id)} style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 14 }}>🗑️</button>}
        </div>
      </div>

      {/* Key stats */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 10 }}>
        {[
          { label: "Min Deposit",  value: "$" + broker.minDeposit },
          { label: "Leverage",     value: broker.leverage },
          { label: "Commission",   value: broker.commission ? "$" + broker.commission + "/lot" : "No commission" },
          { label: "Swap Free",    value: broker.swapFree ? "✅ Ya" : "❌ Tidak" },
          { label: "Website",      value: broker.website },
          { label: "Platform",     value: (broker.platforms || []).join(", ") },
        ].map(s => (
          <div key={s.label} style={{ background: t.bgSubtle, borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontSize: 9, color: t.textDim, marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: t.text, fontFamily: "DM Mono, monospace" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Regulation */}
      {(broker.regulation || []).length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Regulasi</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {broker.regulation.map(r => (
              <span key={r} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)" }}>{r}</span>
            ))}
          </div>
        </div>
      )}

      {/* Spreads */}
      {Object.keys(broker.spreads || {}).length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Spread (pips)</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 6 }}>
            {Object.entries(broker.spreads).map(([pair, spread]) => (
              <div key={pair} style={{ background: t.bgSubtle, borderRadius: 6, padding: "8px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 9, color: t.textDim }}>{pair}</div>
                <div style={{ fontSize: 13, color: spread <= 0.5 ? "#00d4aa" : spread <= 1.5 ? "#f59e0b" : "#ef4444", fontFamily: "DM Mono, monospace" }}>{spread}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personal notes */}
      <div style={{ background: t.bgSubtle, borderRadius: 10, padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em" }}>Catatan Pribadi</div>
          <button onClick={() => setEditingNotes(e => !e)} className="btn-ghost" style={{ fontSize: 10, padding: "4px 8px" }}>
            {editingNotes ? "Batal" : "Edit"}
          </button>
        </div>
        {editingNotes ? (
          <div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Pengalaman pakai broker ini, kelebihan, kekurangan..."
              style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "8px 12px", fontSize: 12, resize: "vertical", lineHeight: 1.6 }} />
            <button onClick={() => { onSaveNotes(broker.id, notes); setEditingNotes(false); }}
              className="btn-primary" style={{ marginTop: 8, fontSize: 12, padding: "7px 16px" }}>
              Simpan
            </button>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: notes ? t.textMuted : t.textDim, lineHeight: 1.7, fontStyle: notes ? "normal" : "italic" }}>
            {notes || "Belum ada catatan. Klik Edit untuk tambah."}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Spread Comparison Table ──────────────────────────────────────
function SpreadComparison({ brokers, comparePair, setComparePair, theme: t }) {
  const sorted = [...brokers].filter(b => b.spreads[comparePair] !== undefined).sort((a, b) => (a.spreads[comparePair] || 99) - (b.spreads[comparePair] || 99));
  const min    = sorted[0]?.spreads[comparePair] || 0;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {COMMON_PAIRS.map(p => (
          <button key={p} onClick={() => setComparePair(p)}
            style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${comparePair === p ? t.accent : t.border}`, background: comparePair === p ? "rgba(0,212,170,0.08)" : "transparent", color: comparePair === p ? "#00d4aa" : t.textDim, fontSize: 11, fontFamily: "DM Mono, monospace", cursor: "pointer" }}>
            {p}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.map((broker, i) => {
          const spread  = broker.spreads[comparePair] || 0;
          const maxSpread = sorted[sorted.length - 1]?.spreads[comparePair] || 1;
          const pct     = (spread / maxSpread) * 100;
          const color   = spread === min ? "#00d4aa" : spread <= 0.5 ? "#00d4aa" : spread <= 1.5 ? "#f59e0b" : "#ef4444";
          return (
            <div key={broker.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: i === 0 ? "rgba(0,212,170,0.06)" : t.bgSubtle, borderRadius: 8, border: `1px solid ${i === 0 ? "rgba(0,212,170,0.3)" : t.borderSubtle}` }}>
              {i === 0 && <span style={{ fontSize: 14 }}>🥇</span>}
              {i === 1 && <span style={{ fontSize: 14 }}>🥈</span>}
              {i === 2 && <span style={{ fontSize: 14 }}>🥉</span>}
              {i > 2    && <span style={{ fontSize: 14, width: 20, textAlign: "center", color: t.textDim }}>{i + 1}</span>}
              <div style={{ width: 100, fontSize: 12, color: t.text, flexShrink: 0 }}>{broker.name}</div>
              <div style={{ flex: 1, height: 8, background: t.bgCard, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.5s" }} />
              </div>
              <div style={{ fontSize: 14, color, fontFamily: "DM Mono, monospace", fontWeight: 500, width: 40, textAlign: "right" }}>{spread}</div>
              <div style={{ fontSize: 10, color: t.textDim, width: 30 }}>pip</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Cost Analysis ────────────────────────────────────────────────
function CostAnalysis({ costAnalysis, theme: t }) {
  if (costAnalysis.length === 0 || costAnalysis.every(c => c.totalCost === 0)) {
    return <div style={{ color: t.textDim, fontSize: 13, textAlign: "center", padding: "20px 0" }}>Log beberapa trade dulu untuk lihat estimasi biaya per broker.</div>;
  }
  const min = costAnalysis[0]?.totalCost || 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {costAnalysis.slice(0, 6).map((c, i) => (
        <div key={c.broker.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: i === 0 ? "rgba(0,212,170,0.06)" : t.bgSubtle, borderRadius: 8, border: `1px solid ${i === 0 ? "rgba(0,212,170,0.3)" : t.borderSubtle}` }}>
          <div style={{ width: 100, fontSize: 12, color: t.text, flexShrink: 0 }}>{c.broker.name}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: t.textDim, marginBottom: 2 }}>
              Spread: ${c.spreadCost.toFixed(0)} · Komisi: ${c.commissionCost.toFixed(0)}
            </div>
            <div style={{ height: 4, background: t.bgCard, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, (c.totalCost / (costAnalysis[costAnalysis.length-1]?.totalCost || 1)) * 100)}%`, background: i === 0 ? "#00d4aa" : "#f59e0b", borderRadius: 2 }} />
            </div>
          </div>
          <div style={{ fontSize: 13, color: i === 0 ? "#00d4aa" : t.text, fontFamily: "DM Mono, monospace", fontWeight: 500, flexShrink: 0 }}>
            ${c.totalCost.toFixed(0)}
          </div>
        </div>
      ))}
      <div style={{ fontSize: 10, color: t.textDim, textAlign: "center", marginTop: 4 }}>*Estimasi total biaya berdasarkan {costAnalysis[0]?.broker ? "history trade kamu" : "data"}</div>
    </div>
  );
}

// ── Main BrokerComparison Page ───────────────────────────────────
export default function BrokerComparison({ brokerHook, theme }) {
  const t = theme;
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
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2, color: t.text }}>BROKER COMPARISON</div>
          <div style={{ fontSize: 11, color: t.textDim }}>Bandingkan broker, spread, dan biaya trading</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ display: "flex", gap: 4, background: t.bgSubtle, border: `1px solid ${t.border}`, borderRadius: 8, padding: 3 }}>
            {[{ v: "list", l: "Brokers" }, { v: "spread", l: "Spread" }, { v: "cost", l: "Biaya" }].map(p => (
              <button key={p.v} onClick={() => setActivePanel(p.v)}
                style={{ padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, fontFamily: "DM Mono, monospace", background: activePanel === p.v ? t.accent : "transparent", color: activePanel === p.v ? "#090e1a" : t.textDim }}>
                {p.l}
              </button>
            ))}
          </div>
          <button onClick={openAdd} className="btn-primary" style={{ fontSize: 12 }}>+ Tambah Broker</button>
        </div>
      </div>

      {activePanel === "spread" && (
        <div className="stat-card">
          <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Perbandingan Spread</div>
          <SpreadComparison brokers={brokers} comparePair={comparePair} setComparePair={setComparePair} theme={t} />
        </div>
      )}

      {activePanel === "cost" && (
        <div className="stat-card">
          <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Estimasi Biaya Trading (berdasarkan history trade kamu)</div>
          <CostAnalysis costAnalysis={costAnalysis} theme={t} />
        </div>
      )}

      {activePanel === "list" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "280px 1fr", gap: 16 }}>
          {/* Broker list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {brokers.map(b => (
              <BrokerCard key={b.id} broker={b} isSelected={selected?.id === b.id} onClick={() => setSelected(b)} theme={t} />
            ))}
          </div>

          {/* Broker detail */}
          <div className="stat-card">
            {selectedBroker ? (
              <BrokerDetail broker={selectedBroker} onEdit={openEdit} onDelete={deleteBroker} onSaveNotes={saveNotes} theme={t} />
            ) : (
              <div style={{ textAlign: "center", padding: "40px 20px", color: t.textDim, fontSize: 13 }}>
                Pilih broker di kiri untuk lihat detail
              </div>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <BrokerForm form={form} setField={setField} setSpread={setSpread} onSave={saveBroker} onClose={closeForm} editId={editId} theme={t} />
      )}
    </div>
  );
}