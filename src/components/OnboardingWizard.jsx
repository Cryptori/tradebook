import { useState, useCallback } from "react";
import { CURRENCIES } from "../hooks/useSettings";

const STORAGE_KEY = "tb_onboarded";

export function useOnboarding() {
  const [show, setShow] = useState(() => {
    try { return !localStorage.getItem(STORAGE_KEY); } catch { return false; }
  });

  function complete() {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    setShow(false);
  }

  function reset() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setShow(true);
  }

  return { show, complete, reset };
}

// ── Step components ───────────────────────────────────────────────
function StepWelcome({ onNext, theme: t }) {
  const features = [
    { icon: "📊", label: "Trade Journal",        desc: "Log setiap trade dengan detail lengkap" },
    { icon: "🤖", label: "AI Advisor",            desc: "Analisis mingguan otomatis dengan Claude" },
    { icon: "📈", label: "Analytics Mendalam",    desc: "Win rate, equity curve, dan 10+ chart" },
    { icon: "🎯", label: "Risk Calculator",       desc: "Position sizing & breakeven calculator" },
    { icon: "🔥", label: "Streak & Gamifikasi",   desc: "Badge, level XP, dan streak harian" },
    { icon: "🌍", label: "30+ Fitur Lainnya",     desc: "Heatmap, correlation, goal tracker, dll" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      {/* Logo */}
      <div style={{ width: 64, height: 64, background: "linear-gradient(135deg, #00c896, #0ea5e9)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 24 }}>◈</div>

      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 4, color: t.text, marginBottom: 8 }}>TRADEBOOK</div>
      <div style={{ fontSize: 16, color: t.textMuted, marginBottom: 8 }}>Trading Journal Profesional untuk Trader Indonesia</div>
      <div style={{ fontSize: 13, color: t.textDim, marginBottom: 32, maxWidth: 400, lineHeight: 1.7 }}>
        Platform lengkap untuk track, analisis, dan tingkatkan performa trading kamu — dengan AI, gamifikasi, dan 30+ fitur premium.
      </div>

      {/* Feature grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 32, width: "100%", maxWidth: 480 }}>
        {features.map(f => (
          <div key={f.label} style={{ background: "rgba(0,200,150,0.06)", border: "1px solid rgba(0,200,150,0.15)", borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{f.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: t.text, marginBottom: 3 }}>{f.label}</div>
            <div style={{ fontSize: 9, color: t.textDim, lineHeight: 1.4 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      <button onClick={onNext} className="btn-primary" style={{ fontSize: 14, padding: "12px 40px", justifyContent: "center" }}>
        Mulai Setup →
      </button>
    </div>
  );
}

function StepSetup({ form, setField, onNext, onPrev, theme: t }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>⚙️</div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2, color: t.text, marginBottom: 6 }}>SETUP AKUN</div>
        <div style={{ fontSize: 13, color: t.textDim }}>Konfigurasi dasar untuk memulai</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={{ color: t.textDim }}>Mata Uang Akun</label>
          <select value={form.currency || "USD"} onChange={e => setField("currency", e.target.value)}
            style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8 }}>
            {(CURRENCIES || []).map(c => (
              <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name || c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ color: t.textDim }}>Modal Awal</label>
          <div style={{ display: "flex", alignItems: "center", background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: 8, overflow: "hidden" }}>
            <span style={{ padding: "0 12px", color: t.textDim, borderRight: `1px solid ${t.border}`, background: t.bgSubtle, fontSize: 12 }}>
              {(CURRENCIES || []).find(c => c.code === form.currency)?.symbol || "$"}
            </span>
            <input type="number" value={form.capitalInitial || 10000} onChange={e => setField("capitalInitial", parseFloat(e.target.value) || 0)}
              style={{ flex: 1, background: "transparent", border: "none", color: t.text, padding: "9px 12px", fontFamily: "DM Mono, monospace", fontSize: 13, outline: "none" }} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ color: t.textDim }}>Target Profit Bulanan (%)</label>
            <input type="number" value={form.targetProfitPct || 10} onChange={e => setField("targetProfitPct", parseFloat(e.target.value) || 0)}
              style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, fontFamily: "DM Mono, monospace" }} />
          </div>
          <div>
            <label style={{ color: t.textDim }}>Max Drawdown (%)</label>
            <input type="number" value={form.maxDrawdownPct || 5} onChange={e => setField("maxDrawdownPct", parseFloat(e.target.value) || 0)}
              style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, fontFamily: "DM Mono, monospace" }} />
          </div>
        </div>

        <div>
          <label style={{ color: t.textDim }}>Market Utama yang Kamu Trade</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
            {["Forex", "Crypto", "Saham IDX", "Saham Global", "Gold"].map(m => {
              const selected = (form.markets || []).includes(m);
              return (
                <button key={m} onClick={() => setField("markets", selected ? (form.markets || []).filter(x => x !== m) : [...(form.markets || []), m])}
                  style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${selected ? "#00c896" : t.border}`, background: selected ? "rgba(0,200,150,0.1)" : "transparent", color: selected ? "#00c896" : t.textDim, fontSize: 12, cursor: "pointer" }}>
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onPrev} className="btn-ghost" style={{ flex: 1 }}>← Kembali</button>
        <button onClick={onNext} className="btn-primary" style={{ flex: 2, justifyContent: "center" }}>Lanjut →</button>
      </div>
    </div>
  );
}

function StepTutorial({ onNext, onPrev, onLogTrade, theme: t }) {
  const steps = [
    { icon: "1️⃣", title: "Buka Journal",    desc: 'Klik tab "Trading → Journal" di navigation bar atas.' },
    { icon: "2️⃣", title: "Klik + LOG",       desc: 'Klik tombol hijau "+ LOG" di kanan atas untuk buka form trade.' },
    { icon: "3️⃣", title: "Isi Detail Trade", desc: "Isi pair, side (BUY/SELL), entry, SL, TP, dan exit. P&L dihitung otomatis." },
    { icon: "4️⃣", title: "Tambah Context",   desc: "Isi strategy, session, emosi, dan notes untuk analisis yang lebih mendalam." },
    { icon: "5️⃣", title: "Simpan",           desc: 'Klik "✓ Log Trade" untuk menyimpan. Trade langsung muncul di Journal dan Analytics.' },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2, color: t.text, marginBottom: 6 }}>CARA LOG TRADE</div>
        <div style={{ fontSize: 13, color: t.textDim }}>5 langkah mudah untuk mulai tracking</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {steps.map(s => (
          <div key={s.title} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "12px 14px", background: t.bgSubtle, borderRadius: 10 }}>
            <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 3 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: t.textDim, lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "rgba(0,200,150,0.06)", border: "1px solid rgba(0,200,150,0.2)", borderRadius: 10, padding: "14px 16px", fontSize: 12, color: t.textMuted, lineHeight: 1.7 }}>
        💡 <strong>Pro tip:</strong> Isi setiap trade sesegera mungkin setelah close — saat detail masih segar di ingatan. Konsistensi adalah kunci!
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onPrev} className="btn-ghost" style={{ flex: 1 }}>← Kembali</button>
        <button onClick={onNext} className="btn-primary" style={{ flex: 2, justifyContent: "center" }}>Lanjut →</button>
      </div>
    </div>
  );
}

function StepChecklist({ onComplete, onPrev, theme: t }) {
  const items = [
    { id: "journal",   icon: "📊", label: "Coba log trade pertama di Journal" },
    { id: "settings",  icon: "⚙️", label: "Cek Settings — sesuaikan modal dan target" },
    { id: "analytics", icon: "📈", label: "Explore Analytics setelah punya beberapa trade" },
    { id: "ai",        icon: "🤖", label: "Generate AI Weekly Report setelah 1 minggu trading" },
    { id: "risk",      icon: "🎯", label: "Pakai Risk Calculator sebelum entry" },
    { id: "streak",    icon: "🔥", label: "Jaga streak harian — log setiap hari!" },
  ];

  const [checked, setChecked] = useState(new Set());
  const toggle = (id) => setChecked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🚀</div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2, color: t.text, marginBottom: 6 }}>GETTING STARTED</div>
        <div style={{ fontSize: 13, color: t.textDim }}>Checklist untuk memulai perjalanan trading yang lebih baik</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map(item => (
          <div key={item.id} onClick={() => toggle(item.id)}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: checked.has(item.id) ? "rgba(0,200,150,0.06)" : t.bgSubtle, border: `1px solid ${checked.has(item.id) ? "rgba(0,200,150,0.25)" : t.borderSubtle}`, borderRadius: 10, cursor: "pointer", transition: "all 0.15s" }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${checked.has(item.id) ? "#00c896" : t.border}`, background: checked.has(item.id) ? "#00c896" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {checked.has(item.id) && <span style={{ fontSize: 12, color: "#090e1a", fontWeight: 700 }}>✓</span>}
            </div>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <span style={{ fontSize: 13, color: checked.has(item.id) ? t.text : t.textMuted, textDecoration: checked.has(item.id) ? "line-through" : "none" }}>{item.label}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onPrev} className="btn-ghost" style={{ flex: 1 }}>← Kembali</button>
        <button onClick={onComplete} className="btn-primary" style={{ flex: 2, justifyContent: "center", background: "linear-gradient(135deg, #00c896, #0ea5e9)" }}>
          🚀 Mulai Trading!
        </button>
      </div>
    </div>
  );
}

// ── Main OnboardingWizard ─────────────────────────────────────────
export default function OnboardingWizard({ onComplete, onSaveSettings, theme }) {
  const t = theme;
  const [step, setStep]   = useState(0);
  const [form, setFormData] = useState({ currency: "USD", capitalInitial: 10000, targetProfitPct: 10, maxDrawdownPct: 5, markets: ["Forex"] });

  function setField(key, val) { setFormData(p => ({ ...p, [key]: val })); }

  const STEPS = ["welcome", "setup", "tutorial", "checklist"];
  const progress = ((step) / (STEPS.length - 1)) * 100;

  function handleComplete() {
    onSaveSettings?.(form);
    onComplete();
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(8,12,20,0.97)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(12px)" }}>
      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 20, padding: 36, width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 32px 100px rgba(0,0,0,0.5)" }}>
        {/* Progress + skip */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ flex: 1, height: 4, background: t.bgSubtle, borderRadius: 2, overflow: "hidden", marginRight: 16 }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #00c896, #0ea5e9)", borderRadius: 2, transition: "width 0.4s ease" }} />
          </div>
          <div style={{ fontSize: 10, color: t.textDim, fontFamily: "DM Mono, monospace", marginRight: 12 }}>{step + 1}/{STEPS.length}</div>
          <button onClick={handleComplete} style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" }}>
            Skip →
          </button>
        </div>

        {/* Step content */}
        {step === 0 && <StepWelcome    onNext={() => setStep(1)} theme={t} />}
        {step === 1 && <StepSetup      form={form} setField={setField} onNext={() => setStep(2)} onPrev={() => setStep(0)} theme={t} />}
        {step === 2 && <StepTutorial   onNext={() => setStep(3)} onPrev={() => setStep(1)} theme={t} />}
        {step === 3 && <StepChecklist  onComplete={handleComplete} onPrev={() => setStep(2)} theme={t} />}
      </div>
    </div>
  );
}