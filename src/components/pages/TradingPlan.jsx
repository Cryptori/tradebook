import { useState } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import GoalTrackerPanel from "../GoalTrackerPanel";
import { formatCurrency } from "../../utils/formatters";
import { SESSIONS, PLAN_MARKETS, getWeekEnd } from "../../hooks/useTradingPlan";

// ── Plan form modal ───────────────────────────────────────────────
function PlanForm({ form, setField, onSave, onClose, editId, sym }) {
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
            {editId ? "EDIT PLAN" : "BUAT TRADING PLAN"}
          </h2>
          <button onClick={onClose} className="btn-icon">✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Week */}
          <div>
            <label>Minggu</label>
            <input type="date" value={form.weekStart} onChange={e => setField("weekStart", e.target.value)}/>
          </div>

          {/* Targets */}
          <div>
            <div className="section-label" style={{ marginBottom: 10 }}>Target & Limit</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { k: "targetProfit",  label: `Target Profit (${sym})` },
                { k: "targetTrades",  label: "Target Trades" },
                { k: "maxLoss",       label: `Max Loss Minggu (${sym})` },
                { k: "maxLossPerDay", label: `Max Loss/Hari (${sym})` },
              ].map(f => (
                <div key={f.k}>
                  <label>{f.label}</label>
                  <input type="number" step="any" value={form[f.k]}
                    onChange={e => setField(f.k, e.target.value)}
                    placeholder="0" style={{ fontFamily: "var(--font-mono)" }}/>
                </div>
              ))}
            </div>
          </div>

          {/* Focus */}
          <div>
            <div className="section-label" style={{ marginBottom: 10 }}>Fokus Trading</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label>Pair / Instrumen Fokus</label>
                <input value={form.pairs} onChange={e => setField("pairs", e.target.value)}
                  placeholder="EUR/USD, BTC/USDT, BBCA..."/>
              </div>
              <div>
                <label>Session</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                  {SESSIONS.map(s => {
                    const active = (form.sessions || []).includes(s);
                    return (
                      <button key={s} onClick={() => toggleArr("sessions", s)} style={{
                        padding: "4px 12px", borderRadius: "var(--r-sm)", cursor: "pointer",
                        border: `1px solid ${active ? "var(--accent2)" : "var(--border)"}`,
                        background: active ? "var(--accent2-dim)" : "transparent",
                        color: active ? "var(--accent2)" : "var(--text-dim)",
                        fontSize: "var(--fs-xs)",
                      }}>{s}</button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label>Market</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                  {PLAN_MARKETS.map(m => {
                    const active = (form.markets || []).includes(m);
                    return (
                      <button key={m} onClick={() => toggleArr("markets", m)} style={{
                        padding: "4px 12px", borderRadius: "var(--r-sm)", cursor: "pointer",
                        border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                        background: active ? "var(--accent-dim)" : "transparent",
                        color: active ? "var(--accent)" : "var(--text-dim)",
                        fontSize: "var(--fs-xs)",
                      }}>{m}</button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Rules */}
          <div>
            <div className="section-label" style={{ marginBottom: 10 }}>Rules & Mindset</div>
            {[
              { k: "entryRules", label: "Entry Rules",         ph: "Kondisi setup yang harus terpenuhi sebelum entry..." },
              { k: "exitRules",  label: "Exit Rules",          ph: "Kapan cut loss, kapan TP, kapan move SL..." },
              { k: "riskRules",  label: "Risk Rules",          ph: "Max % per trade, max trades per hari..." },
              { k: "mindset",    label: "Mindset Reminder",    ph: "Kalimat motivasi untuk diri sendiri..." },
              { k: "avoid",      label: "Yang Harus Dihindari",ph: "Revenge trading, FOMO entry, trading saat news..." },
            ].map(f => (
              <div key={f.k} style={{ marginBottom: 10 }}>
                <label>{f.label}</label>
                <textarea value={form[f.k]} onChange={e => setField(f.k, e.target.value)}
                  rows={2} placeholder={f.ph} style={{ lineHeight: 1.6 }}/>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>Batal</button>
          <button onClick={onSave} className="btn-primary" style={{ flex: 2, justifyContent: "center" }}>
            {editId ? "Update Plan" : "Simpan Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Review modal ──────────────────────────────────────────────────
function ReviewModal({ plan, weekReview, onSave, onClose, sym }) {
  const [notes,  setNotes]  = useState(plan.reviewNotes  || "");
  const [rating, setRating] = useState(plan.reviewRating || 3);

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
            REVIEW MINGGU INI
          </h2>
          <button onClick={onClose} className="btn-icon">✕</button>
        </div>

        {weekReview && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
            {[
              { label: "P&L",      val: `${weekReview.pnl >= 0 ? "+" : ""}${formatCurrency(weekReview.pnl, false, sym)}`, color: weekReview.pnl >= 0 ? "var(--success)" : "var(--danger)" },
              { label: "Trades",   val: weekReview.trades, color: "var(--text)" },
              { label: "Win Rate", val: `${weekReview.winRate.toFixed(1)}%`, color: weekReview.winRate >= 50 ? "var(--success)" : "var(--warning)" },
              { label: "Status",   val: weekReview.lossBreached ? "⚠️ Max Loss" : "✅ Aman", color: weekReview.lossBreached ? "var(--danger)" : "var(--success)" },
            ].map(s => (
              <div key={s.label} style={{ background: "var(--bg-subtle)", borderRadius: "var(--r-md)", padding: "10px 12px" }}>
                <div className="kpi-label">{s.label}</div>
                <div style={{ fontSize: "var(--fs-base)", color: s.color, fontWeight: 500 }}>{s.val}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label>Rating Minggu Ini</label>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            {[1,2,3,4,5].map(r => (
              <button key={r} onClick={() => setRating(r)} style={{
                flex: 1, padding: "8px 0", borderRadius: "var(--r-md)", cursor: "pointer",
                border: `1px solid ${rating >= r ? "var(--gold)" : "var(--border)"}`,
                background: rating >= r ? "var(--gold-dim)" : "transparent",
                color: rating >= r ? "var(--gold)" : "var(--text-dim)",
                fontSize: 18,
              }}>⭐</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label>Catatan Review</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
            placeholder="Apa yang berjalan baik? Apa yang perlu diperbaiki minggu depan?"
            style={{ lineHeight: 1.6 }}/>
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

// ── Plan detail ───────────────────────────────────────────────────
function PlanDetail({ plan, weekReview, onEdit, onDelete, onReview, sym }) {
  const weekEnd = getWeekEnd(plan.weekStart);
  const targetP = parseFloat(plan.targetProfit) || 0;
  const targetT = parseInt(plan.targetTrades)   || 0;
  const maxL    = parseFloat(plan.maxLoss)       || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: "var(--fs-base)", fontWeight: 500, color: "var(--text)" }}>
            {new Date(plan.weekStart + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long" })}
            {" — "}
            {new Date(weekEnd + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </div>
          {plan.reviewed && (
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--accent)", marginTop: 2 }}>
              ✅ Direview · {"⭐".repeat(plan.reviewRating)}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => onReview(plan)} className="btn-ghost" style={{ height: 28, fontSize: "var(--fs-xs)" }}>Review</button>
          <button onClick={() => onEdit(plan.weekStart)} className="btn-ghost" style={{ height: 28, fontSize: "var(--fs-xs)" }}>Edit</button>
          <button onClick={() => onDelete(plan.id)} className="btn-icon" style={{ color: "var(--danger)" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
          </button>
        </div>
      </div>

      {/* Progress */}
      {weekReview && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {targetP > 0 && (
            <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "10px 12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-xs)", marginBottom: 6 }}>
                <span style={{ color: "var(--text-dim)" }}>Target Profit</span>
                <span style={{ color: "var(--text)", fontFamily: "var(--font-mono)" }}>
                  {formatCurrency(weekReview.pnl, false, sym)} / {formatCurrency(targetP, false, sym)}
                </span>
              </div>
              <div style={{ height: 4, background: "var(--bg-card)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, weekReview.profitPct || 0)}%`, background: weekReview.pnl >= 0 ? "var(--success)" : "var(--danger)", borderRadius: 2 }}/>
              </div>
            </div>
          )}
          {targetT > 0 && (
            <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "10px 12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-xs)", marginBottom: 6 }}>
                <span style={{ color: "var(--text-dim)" }}>Target Trades</span>
                <span style={{ color: "var(--text)" }}>{weekReview.trades} / {targetT}</span>
              </div>
              <div style={{ height: 4, background: "var(--bg-card)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, weekReview.tradesPct || 0)}%`, background: "var(--accent2)", borderRadius: 2 }}/>
              </div>
            </div>
          )}
          {maxL > 0 && (
            <div style={{
              background: weekReview.lossBreached ? "var(--danger-dim)" : "var(--bg-subtle)",
              border: `1px solid ${weekReview.lossBreached ? "var(--danger)" : "var(--border)"}`,
              borderRadius: "var(--r-md)", padding: "10px 12px", gridColumn: "span 2",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-xs)" }}>
                <span style={{ color: "var(--text-dim)" }}>Max Loss Limit</span>
                <span style={{ color: weekReview.lossBreached ? "var(--danger)" : "var(--success)", fontFamily: "var(--font-mono)" }}>
                  {weekReview.lossBreached ? "⚠️ TERLEWATI" : "✅ Aman"} · {formatCurrency(Math.abs(Math.min(weekReview.pnl, 0)), false, sym)} / {formatCurrency(maxL, false, sym)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Focus */}
      {(plan.pairs || plan.sessions?.length > 0 || plan.markets?.length > 0) && (
        <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "10px 14px" }}>
          <div className="section-label" style={{ marginBottom: 8 }}>Fokus Minggu Ini</div>
          {plan.pairs && <div style={{ fontSize: "var(--fs-sm)", color: "var(--text)", marginBottom: 4 }}>📌 {plan.pairs}</div>}
          {plan.sessions?.length > 0 && <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>Session: {plan.sessions.join(", ")}</div>}
          {plan.markets?.length  > 0 && <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>Market: {plan.markets.join(", ")}</div>}
        </div>
      )}

      {/* Rules */}
      {[
        { k: "entryRules", label: "Entry Rules",      color: "var(--accent)"  },
        { k: "exitRules",  label: "Exit Rules",       color: "var(--warning)" },
        { k: "riskRules",  label: "Risk Rules",       color: "var(--danger)"  },
        { k: "mindset",    label: "Mindset",          color: "var(--accent2)" },
        { k: "avoid",      label: "Yang Dihindari",   color: "var(--text-dim)" },
      ].filter(f => plan[f.k]).map(f => (
        <div key={f.k} style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "10px 14px" }}>
          <div style={{ fontSize: "var(--fs-2xs)", color: f.color, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600, marginBottom: 6 }}>{f.label}</div>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{plan[f.k]}</div>
        </div>
      ))}

      {/* Review notes */}
      {plan.reviewed && plan.reviewNotes && (
        <div style={{ background: "var(--success-dim)", border: "1px solid var(--success)", borderRadius: "var(--r-md)", padding: "10px 14px" }}>
          <div className="section-label" style={{ marginBottom: 6, color: "var(--success)" }}>Review Notes</div>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{plan.reviewNotes}</div>
        </div>
      )}
    </div>
  );
}

// ── Main TradingPlan ──────────────────────────────────────────────
export default function TradingPlan({ planHook, goalHook, theme }) {
  const { isMobile } = useBreakpoint();
  const [showReview,   setShowReview]   = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);

  const {
    plans, currentPlan, weekTrades, weekReview, allWeeks,
    activeWeek, setActiveWeek,
    showForm, form, setField, editId,
    openAdd, closeForm, savePlan, deletePlan, saveReview, sym,
  } = planHook;

  const currentWeekKey = allWeeks[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Trading Plan</h1>
          <p className="page-subtitle">Rencanakan minggu trading kamu — target, fokus, dan rules</p>
        </div>
        <button onClick={() => openAdd(activeWeek)} className="btn-primary" style={{ height: 30, fontSize: "var(--fs-sm)" }}>
          {currentPlan ? "✏️ Edit Plan" : "+ Buat Plan"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "180px 1fr", gap: 14 }}>
        {/* Week sidebar */}
        <div style={{ display: "flex", flexDirection: isMobile ? "row" : "column", gap: 4, overflowX: isMobile ? "auto" : "visible" }}>
          {allWeeks.map(week => {
            const hasPlan  = plans.some(p => p.weekStart === week);
            const isActive = week === activeWeek;
            return (
              <button key={week} onClick={() => setActiveWeek(week)} style={{
                padding: "8px 12px", borderRadius: "var(--r-md)", cursor: "pointer",
                border: `1px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
                background: isActive ? "var(--accent-dim)" : "transparent",
                color: isActive ? "var(--accent)" : "var(--text-muted)",
                fontSize: "var(--fs-xs)", fontFamily: "var(--font-mono)",
                textAlign: "left", whiteSpace: "nowrap",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span>{week === currentWeekKey ? "📌 " : ""}{week.slice(5)}</span>
                {hasPlan && <span className="badge badge-dim" style={{ fontSize: 8, padding: "1px 4px" }}>PLAN</span>}
              </button>
            );
          })}
        </div>

        {/* Plan detail */}
        <div>
          {currentPlan ? (
            <div className="stat-card">
              <PlanDetail plan={currentPlan} weekReview={weekReview}
                weekTrades={weekTrades} sym={sym}
                onEdit={openAdd} onDelete={deletePlan} onReview={p => { setReviewTarget(p); setShowReview(true); }}/>
            </div>
          ) : (
            <div className="stat-card">
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <div className="empty-title">
                  {activeWeek === currentWeekKey ? "Belum ada plan minggu ini" : "Tidak ada plan"}
                </div>
                <div className="empty-desc">
                  {activeWeek === currentWeekKey ? "Rencanakan target, fokus pair, dan rules minggu ini" : "Tidak ada data untuk minggu ini"}
                </div>
                {activeWeek === currentWeekKey && (
                  <button onClick={() => openAdd(activeWeek)} className="btn-primary" style={{ marginTop: 16 }}>
                    + Buat Trading Plan
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Goal tracker */}
      {goalHook && <GoalTrackerPanel goalHook={goalHook} theme={theme}/>}

      {/* Modals */}
      {showForm && (
        <PlanForm form={form} setField={setField} onSave={savePlan}
          onClose={closeForm} editId={editId} sym={sym}/>
      )}
      {showReview && reviewTarget && (
        <ReviewModal plan={reviewTarget} weekReview={weekReview} sym={sym}
          onSave={saveReview}
          onClose={() => { setShowReview(false); setReviewTarget(null); }}/>
      )}
    </div>
  );
}