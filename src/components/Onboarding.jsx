import { useState, useEffect } from "react";

const ONBOARDING_KEY = "tj_onboarded_v1";

const STEPS = [
  {
    emoji: "📊",
    title: "Selamat Datang di Tradebook!",
    desc: "Trading journal untuk trader serius. Catat, analisis, dan tingkatkan performa trading kamu.",
    hint: null,
  },
  {
    emoji: "➕",
    title: "Log Trade Pertama",
    desc: 'Klik tombol "+ LOG TRADE" atau tekan N untuk mencatat trade. P&L dan R:R dihitung otomatis dari entry, exit, dan SL/TP.',
    hint: "Shortcut: tekan N kapan saja",
  },
  {
    emoji: "📈",
    title: "Dashboard & Analytics",
    desc: "Dashboard menampilkan equity curve, win rate, dan progress target. Analytics memberikan breakdown detail per strategy, market, dan emosi.",
    hint: "Shortcut: tekan 1 untuk Dashboard, 3 untuk Analytics",
  },
  {
    emoji: "📖",
    title: "Playbook & Review",
    desc: "Simpan setup trading favoritmu di Playbook. Review halaman merangkum performa per minggu atau bulan secara otomatis.",
    hint: "Shortcut: tekan 7 untuk Playbook, 6 untuk Review",
  },
  {
    emoji: "🎯",
    title: "Set Target di Settings",
    desc: "Atur modal awal, target profit (%), dan max drawdown di Settings. Target Tracker di Dashboard akan melacak progressnya.",
    hint: "Shortcut: tekan 9 untuk Settings",
  },
];

export default function Onboarding({ theme: t, onDone }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(9,14,26,0.92)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 20, padding: "40px 48px", width: "100%", maxWidth: 480, textAlign: "center", position: "relative" }}>

        {/* Skip */}
        <button onClick={onDone}
          style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 12 }}>
          Skip
        </button>

        {/* Step indicator */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 28 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 3, background: i === step ? "#00d4aa" : t.border, transition: "all 0.3s" }} />
          ))}
        </div>

        {/* Content */}
        <div style={{ fontSize: 48, marginBottom: 16, lineHeight: 1 }}>{current.emoji}</div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 2, color: t.text, marginBottom: 12 }}>
          {current.title}
        </div>
        <div style={{ fontSize: 13, color: t.textMuted, lineHeight: 1.8, marginBottom: current.hint ? 14 : 32 }}>
          {current.desc}
        </div>
        {current.hint && (
          <div style={{ fontSize: 11, color: "#00d4aa", background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 8, padding: "7px 14px", marginBottom: 32, display: "inline-block" }}>
            💡 {current.hint}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="btn-ghost" style={{ padding: "10px 24px" }}>
              ← Back
            </button>
          )}
          <button
            onClick={() => isLast ? onDone() : setStep(s => s + 1)}
            className="btn-primary" style={{ padding: "10px 32px" }}>
            {isLast ? "Mulai Trading! 🚀" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useOnboarding() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(ONBOARDING_KEY)) setShow(true);
    } catch { /* ignore */ }
  }, []);

  function done() {
    try { localStorage.setItem(ONBOARDING_KEY, "1"); } catch { /* ignore */ }
    setShow(false);
  }

  return { show, done };
}