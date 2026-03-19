import { useState } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { formatCurrency } from "../../utils/formatters";
import { SESSIONS, PLAN_MARKETS, getWeekEnd } from "../../hooks/useTradingPlan";

// ── Plan Form ────────────────────────────────────────────────────
function PlanForm({ form, setField, onSave, onClose, editId, sym, theme: t }) {
  function toggleArr(key, val) {
    const arr = form[key] || [];
    setField(key, arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2, color: t.text }}>
            {editId ? "EDIT PLAN" : "BUAT TRADING PLAN"}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Week */}
          <div>
            <label style={{ color: t.textDim, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>Minggu</label>
            <input type="date" value={form.weekStart} onChange={e => setField("weekStart", e.target.value)}
              style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "9px 12px", fontSize: 13, marginTop: 6 }} />
          </div>

          {/* Targets */}
          <div>
            <div style={{ fontSize: 11, color: "#00d4aa", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>🎯 Target & Limit</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { key: "targetProfit",  label: `Target Profit (${sym})` },
                { key: "targetTrades",  label: "Target Trades" },
                { key: "maxLoss",       label: `Max Loss Minggu (${sym})` },
                { key: "maxLossPerDay", label: `Max Loss Per Hari (${sym})` },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ color: t.textDim, fontSize: 11 }}>{f.label}</label>
                  <input type="number" step="any" value={form[f.key]} onChange={e => setField(f.key, e.target.value)}
                    placeholder="0"
                    style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 13, marginTop: 4 }} />
                </div>
              ))}
            </div>
          </div>

          {/* Focus */}
          <div>
            <div style={{ fontSize: 11, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>🎯 Fokus Trading</div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: t.textDim, fontSize: 11 }}>Pair / Instrumen Fokus</label>
              <input value={form.pairs} onChange={e => setField("pairs", e.target.value)}
                placeholder="EUR/USD, BTC/USDT, BBCA..."
                style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "8px 12px", fontSize: 13, marginTop: 4 }} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ color: t.textDim, fontSize: 11, display: "block", marginBottom: 6 }}>Session</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {SESSIONS.map(s => (
                  <button key={s} onClick={() => toggleArr("sessions", s)}
                    style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${(form.sessions || []).includes(s) ? "#3b82f6" : t.border}`, background: (form.sessions || []).includes(s) ? "rgba(59,130,246,0.1)" : "transparent", color: (form.sessions || []).includes(s) ? "#3b82f6" : t.textDim, fontSize: 11, cursor: "pointer" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ color: t.textDim, fontSize: 11, display: "block", marginBottom: 6 }}>Market</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {PLAN_MARKETS.map(m => (
                  <button key={m} onClick={() => toggleArr("markets", m)}
                    style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${(form.markets || []).includes(m) ? "#00d4aa" : t.border}`, background: (form.markets || []).includes(m) ? "rgba(0,212,170,0.1)" : "transparent", color: (form.markets || []).includes(m) ? "#00d4aa" : t.textDim, fontSize: 11, cursor: "pointer" }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Rules */}
          <div>
            <div style={{ fontSize: 11, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>📋 Rules & Mindset</div>
            {[
              { key: "entryRules", label: "Entry Rules",    placeholder: "Kondisi setup yang harus terpenuhi sebelum entry..." },
              { key: "exitRules",  label: "Exit Rules",     placeholder: "Kapan cut loss, kapan take profit, kapan move SL..." },
              { key: "riskRules",  label: "Risk Rules",     placeholder: "Max % per trade, max trades per hari..." },
              { key: "mindset",    label: "Mindset Reminder", placeholder: "Kalimat motivasi atau reminder untuk diri sendiri..." },
              { key: "avoid",      label: "Yang Harus Dihindari", placeholder: "Revenge trading, FOMO entry, trading saat news..." },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ color: t.textDim, fontSize: 11 }}>{f.label}</label>
                <textarea value={form[f.key]} onChange={e => setField(f.key, e.target.value)}
                  rows={2} placeholder={f.placeholder}
                  style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "8px 12px", fontSize: 12, resize: "vertical", marginTop: 4, lineHeight: 1.6 }} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>Batal</button>
          <button onClick={onSave} className="btn-primary" style={{ flex: 2, justifyContent: "center" }}>
            {editId ? "Update Plan" : "Simpan Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Review Modal ─────────────────────────────────────────────────
function ReviewModal({ plan, weekReview, onSave, onClose, sym, theme: t }) {
  const [notes,  setNotes]  = useState(plan.reviewNotes  || "");
  const [rating, setRating] = useState(plan.reviewRating || 3);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2, color: t.text }}>REVIEW MINGGU INI</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>

        {weekReview && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
            {[
              { label: "P&L",     value: (weekReview.pnl >= 0 ? "+" : "") + formatCurrency(weekReview.pnl, false, sym), color: weekReview.pnl >= 0 ? "#00d4aa" : "#ef4444" },
              { label: "Trades",  value: weekReview.trades,                                                              color: t.text },
              { label: "Win Rate",value: weekReview.winRate.toFixed(1) + "%",                                            color: weekReview.winRate >= 50 ? "#00d4aa" : "#f59e0b" },
              { label: "Status",  value: weekReview.lossBreached ? "⚠️ Max Loss" : "✅ Aman",                           color: weekReview.lossBreached ? "#ef4444" : "#00d4aa" },
            ].map(s => (
              <div key={s.label} style={{ background: t.bgSubtle, borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 9, color: t.textDim, marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: 14, color: s.color, fontWeight: 500 }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ color: t.textDim, fontSize: 11, display: "block", marginBottom: 6 }}>Rating Minggu Ini</label>
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 3, 4, 5].map(r => (
              <button key={r} onClick={() => setRating(r)}
                style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${rating >= r ? "#f59e0b" : t.border}`, background: rating >= r ? "rgba(245,158,11,0.1)" : "transparent", color: rating >= r ? "#f59e0b" : t.textDim, fontSize: 18, cursor: "pointer" }}>
                ⭐
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ color: t.textDim, fontSize: 11, display: "block", marginBottom: 6 }}>Catatan Review</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
            placeholder="Apa yang berjalan baik? Apa yang perlu diperbaiki minggu depan?"
            style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "9px 12px", fontSize: 12, resize: "vertical", lineHeight: 1.6 }} />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>Batal</button>
          <button onClick={() => { onSave(plan.id, { reviewNotes: notes, reviewRating: rating }); onClose(); }}
            className="btn-primary" style={{ flex: 2, justifyContent: "center" }}>
            Simpan Review
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Plan Detail ──────────────────────────────────────────────────
function PlanDetail({ plan, weekReview, weekTrades, onEdit, onDelete, onReview, sym, theme: t }) {
  const weekEnd = getWeekEnd(plan.weekStart);
  const targetP = parseFloat(plan.targetProfit)  || 0;
  const targetT = parseInt(plan.targetTrades)    || 0;
  const maxL    = parseFloat(plan.maxLoss)        || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: t.text }}>
            {new Date(plan.weekStart + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long" })} — {new Date(weekEnd + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </div>
          {plan.reviewed && <div style={{ fontSize: 10, color: "#00d4aa", marginTop: 2 }}>✅ Sudah direview · {"⭐".repeat(plan.reviewRating)}</div>}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => onReview(plan)} className="btn-ghost" style={{ fontSize: 11, padding: "6px 12px" }}>Review</button>
          <button onClick={() => onEdit(plan.weekStart)} className="btn-ghost" style={{ fontSize: 11, padding: "6px 12px" }}>Edit</button>
          <button onClick={() => onDelete(plan.id)} style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 14 }}>🗑️</button>
        </div>
      </div>

      {/* Progress vs targets */}
      {weekReview && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {targetP > 0 && (
            <div style={{ background: t.bgSubtle, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6 }}>
                <span style={{ color: t.textDim }}>Target Profit</span>
                <span style={{ color: weekReview.pnl >= targetP ? "#00d4aa" : t.textDim }}>
                  {formatCurrency(weekReview.pnl, false, sym)} / {formatCurrency(targetP, false, sym)}
                </span>
              </div>
              <div style={{ height: 6, background: t.bgCard, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, weekReview.profitPct || 0)}%`, background: weekReview.pnl >= 0 ? "#00d4aa" : "#ef4444", borderRadius: 3 }} />
              </div>
            </div>
          )}
          {targetT > 0 && (
            <div style={{ background: t.bgSubtle, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6 }}>
                <span style={{ color: t.textDim }}>Target Trades</span>
                <span style={{ color: t.text }}>{weekReview.trades} / {targetT}</span>
              </div>
              <div style={{ height: 6, background: t.bgCard, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, weekReview.tradesPct || 0)}%`, background: "#3b82f6", borderRadius: 3 }} />
              </div>
            </div>
          )}
          {maxL > 0 && (
            <div style={{ background: weekReview.lossBreached ? "rgba(239,68,68,0.08)" : t.bgSubtle, border: weekReview.lossBreached ? "1px solid rgba(239,68,68,0.3)" : `1px solid ${t.borderSubtle}`, borderRadius: 10, padding: "12px 14px", gridColumn: "span 2" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                <span style={{ color: t.textDim }}>Max Loss Limit</span>
                <span style={{ color: weekReview.lossBreached ? "#ef4444" : "#00d4aa" }}>
                  {weekReview.lossBreached ? "⚠️ TERLEWATI" : "✅ Aman"} · {formatCurrency(Math.abs(Math.min(weekReview.pnl, 0)), false, sym)} / {formatCurrency(maxL, false, sym)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Focus */}
      {(plan.pairs || plan.sessions?.length > 0 || plan.markets?.length > 0) && (
        <div style={{ background: t.bgSubtle, borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Fokus Minggu Ini</div>
          {plan.pairs && <div style={{ fontSize: 12, color: t.text, marginBottom: 4 }}>📌 {plan.pairs}</div>}
          {plan.sessions?.length > 0 && <div style={{ fontSize: 11, color: t.textDim }}>Session: {plan.sessions.join(", ")}</div>}
          {plan.markets?.length  > 0 && <div style={{ fontSize: 11, color: t.textDim }}>Market: {plan.markets.join(", ")}</div>}
        </div>
      )}

      {/* Rules */}
      {[
        { key: "entryRules", label: "Entry Rules",     color: "#00d4aa" },
        { key: "exitRules",  label: "Exit Rules",      color: "#f59e0b" },
        { key: "riskRules",  label: "Risk Rules",      color: "#ef4444" },
        { key: "mindset",    label: "Mindset",         color: "#3b82f6" },
        { key: "avoid",      label: "Yang Dihindari",  color: "#6b7280" },
      ].filter(f => plan[f.key]).map(f => (
        <div key={f.key} style={{ background: t.bgSubtle, borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: f.color, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{f.label}</div>
          <div style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{plan[f.key]}</div>
        </div>
      ))}

      {/* Review notes */}
      {plan.reviewed && plan.reviewNotes && (
        <div style={{ background: "rgba(0,212,170,0.06)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: "#00d4aa", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Review Notes</div>
          <div style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{plan.reviewNotes}</div>
        </div>
      )}
    </div>
  );
}

// ── Main TradingPlan Page ────────────────────────────────────────
export default function TradingPlan({ planHook, theme }) {
  const t = theme;
  const { isMobile } = useBreakpoint();
  const [showReview, setShowReview] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);

  const {
    plans, currentPlan, weekTrades, weekReview, allWeeks,
    activeWeek, setActiveWeek,
    showForm, form, setField, editId,
    openAdd, closeForm, savePlan, deletePlan, saveReview,
    sym,
  } = planHook;

  function handleReview(plan) {
    setReviewTarget(plan);
    setShowReview(true);
  }

  const currentWeekKey = allWeeks[0];
  const isCurrentWeek  = activeWeek === currentWeekKey;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2, color: t.text }}>TRADING PLAN</div>
          <div style={{ fontSize: 11, color: t.textDim }}>Rencanakan minggu trading kamu — target, fokus, dan rules</div>
        </div>
        <button onClick={() => openAdd(activeWeek)} className="btn-primary">
          {currentPlan ? "✏️ Edit Plan" : "+ Buat Plan"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "200px 1fr", gap: 16 }}>
        {/* Week sidebar */}
        <div style={{ display: "flex", flexDirection: isMobile ? "row" : "column", gap: 4, overflowX: isMobile ? "auto" : "visible" }}>
          {allWeeks.map(week => {
            const hasPlan = plans.some(p => p.weekStart === week);
            const isActive = week === activeWeek;
            return (
              <button key={week} onClick={() => setActiveWeek(week)}
                style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${isActive ? t.accent : t.border}`, background: isActive ? "rgba(0,212,170,0.08)" : "transparent", color: isActive ? "#00d4aa" : t.textMuted, cursor: "pointer", fontSize: 11, fontFamily: "DM Mono, monospace", textAlign: "left", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
                <span>{week === currentWeekKey ? "📌 " : ""}{week.slice(5)}</span>
                {hasPlan && <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 3, background: "rgba(0,212,170,0.1)", color: "#00d4aa", border: "1px solid rgba(0,212,170,0.2)" }}>PLAN</span>}
              </button>
            );
          })}
        </div>

        {/* Plan detail */}
        <div>
          {currentPlan ? (
            <div className="stat-card">
              <PlanDetail
                plan={currentPlan} weekReview={weekReview}
                weekTrades={weekTrades} sym={sym} theme={t}
                onEdit={openAdd} onDelete={deletePlan} onReview={handleReview}
              />
            </div>
          ) : (
            <div className="stat-card">
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 24px", textAlign: "center" }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, rgba(0,200,150,0.08), rgba(0,200,150,0.04))", border: "1px solid rgba(0,200,150,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, marginBottom: 20 }}>📋</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: t.text, marginBottom: 8 }}>
                  {isCurrentWeek ? "Belum ada plan minggu ini" : "Tidak ada plan untuk minggu ini"}
                </div>
                <div style={{ fontSize: 12, color: t.textDim, maxWidth: 280, lineHeight: 1.8, marginBottom: 20 }}>
                  {isCurrentWeek ? "Rencanakan minggu trading kamu — target, fokus pair, dan rules" : "Tidak ada data untuk minggu ini"}
                </div>
                {isCurrentWeek && (
                  <button onClick={() => openAdd(activeWeek)} className="btn-primary" style={{ fontSize: 12 }}>+ Buat Trading Plan</button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <PlanForm form={form} setField={setField} onSave={savePlan} onClose={closeForm} editId={editId} sym={sym} theme={t} />
      )}

      {/* Review modal */}
      {showReview && reviewTarget && (
        <ReviewModal
          plan={reviewTarget} weekReview={weekReview} sym={sym} theme={t}
          onSave={saveReview} onClose={() => { setShowReview(false); setReviewTarget(null); }}
        />
      )}
    </div>
  );
}