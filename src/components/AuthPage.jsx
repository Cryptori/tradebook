import { useState } from "react";

const INPUT_STYLE_BASE = {
  borderRadius: 10, width: "100%", padding: "12px 14px",
  fontFamily: "DM Mono, monospace", fontSize: 14,
  outline: "none", transition: "border-color 0.2s",
};

// ── Confirmation screen ──────────────────────────────────────────
function ConfirmationScreen({ email, onResend, onBack, theme: t }) {
  const [resent, setResent] = useState(false);

  async function handleResend() {
    await onResend(email);
    setResent(true);
    setTimeout(() => setResent(false), 5000);
  }

  return (
    <div style={{ textAlign: "center", padding: "8px 0" }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>📧</div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2, color: t.text, marginBottom: 8 }}>
        CEK INBOX KAMU
      </div>
      <div style={{ fontSize: 13, color: t.textMuted, marginBottom: 6 }}>
        Email konfirmasi dikirim ke:
      </div>
      <div style={{ fontSize: 13, color: t.accent, fontFamily: "DM Mono, monospace", marginBottom: 20 }}>
        {email}
      </div>
      <div style={{ fontSize: 12, color: t.textDim, marginBottom: 24, lineHeight: 1.6 }}>
        Klik link di email tersebut untuk mengaktifkan akun.<br />
        Setelah itu kamu bisa login.
      </div>

      <button onClick={handleResend} disabled={resent}
        style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: `1px solid ${t.border}`, background: "transparent", color: resent ? "#00d4aa" : t.textMuted, fontFamily: "DM Mono, monospace", fontSize: 13, cursor: resent ? "default" : "pointer", marginBottom: 10 }}>
        {resent ? "✓ Email terkirim!" : "Kirim ulang email"}
      </button>
      <button onClick={onBack}
        style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: "none", background: "transparent", color: t.textDim, fontFamily: "DM Mono, monospace", fontSize: 12, cursor: "pointer" }}>
        ← Kembali ke login
      </button>
    </div>
  );
}

// ── Main AuthPage ────────────────────────────────────────────────
export default function AuthPage({ onSignIn, onSignUp, onResendConfirmation, loading, error, onClearError, theme, compact = false }) {
  const t = theme;
  const [mode,         setMode]         = useState("login");
  const [form,         setForm]         = useState({ username: "", email: "", password: "", confirm: "" });
  const [localError,   setLocalError]   = useState("");
  const [pendingEmail, setPendingEmail] = useState(null); // waiting for confirmation

  const inputStyle = { ...INPUT_STYLE_BASE, background: t.bgInput, border: `1px solid ${t.border}`, color: t.text };
  const isRegister = mode === "register";

  function setField(key, val) {
    setForm(p => ({ ...p, [key]: val }));
    setLocalError("");
    onClearError?.();
  }

  function switchMode(m) {
    setMode(m);
    setLocalError("");
    onClearError?.();
  }

  async function handleSubmit() {
    setLocalError("");
    if (!form.email || !form.password) return setLocalError("Email dan password wajib diisi.");

    if (isRegister) {
      if (!form.username.trim())          return setLocalError("Username wajib diisi.");
      if (form.username.length < 3)       return setLocalError("Username minimal 3 karakter.");
      if (form.password.length < 6)       return setLocalError("Password minimal 6 karakter.");
      if (form.password !== form.confirm) return setLocalError("Password tidak cocok.");

      const result = await onSignUp(form.email, form.password, form.username.trim());
      if (result?.success) {
        // Always show confirmation screen after register.
        // If Supabase "Confirm email" is ON  → user must click link before login.
        // If Supabase "Confirm email" is OFF → user can go back and login immediately.
        setPendingEmail(form.email);
      }
    } else {
      await onSignIn(form.email, form.password);
    }
  }

  const displayError = localError || error;

  const card = (
    <div style={{ width: "100%", maxWidth: 420 }}>
      {!compact && (
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 56, height: 56, background: "linear-gradient(135deg, #00d4aa, #00b4d8)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(0,212,170,0.3)" }}>◈</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 4, color: t.text }}>TRADEBOOK</div>
          <div style={{ fontSize: 11, color: t.textDim, letterSpacing: 3, marginTop: 2 }}>JOURNAL & PORTFOLIO</div>
        </div>
      )}

      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: "28px 32px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>

        {/* Confirmation state */}
        {pendingEmail ? (
          <ConfirmationScreen
            email={pendingEmail}
            onResend={onResendConfirmation}
            onBack={() => { setPendingEmail(null); switchMode("login"); }}
            theme={t}
          />
        ) : (
          <>
            {/* Mode tabs */}
            <div style={{ display: "flex", background: t.bgSubtle, borderRadius: 10, padding: 3, marginBottom: 24 }}>
              {[["login", "Masuk"], ["register", "Daftar"]].map(([m, label]) => (
                <button key={m} onClick={() => switchMode(m)}
                  style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "none", cursor: "pointer",
                    background: mode === m ? t.bgCard : "transparent",
                    color:      mode === m ? t.text    : t.textDim,
                    fontFamily: "DM Mono, monospace", fontSize: 13,
                    fontWeight: mode === m ? 500 : 400,
                    boxShadow:  mode === m ? "0 1px 6px rgba(0,0,0,0.15)" : "none",
                    transition: "all 0.2s",
                  }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {isRegister && (
                <div>
                  <label>Username</label>
                  <input type="text" value={form.username} onChange={e => setField("username", e.target.value)}
                    placeholder="trader_handal" style={inputStyle} autoFocus
                    onFocus={e => { e.target.style.borderColor = t.accent; }}
                    onBlur={e  => { e.target.style.borderColor = t.border; }} />
                </div>
              )}
              <div>
                <label>Email</label>
                <input type="email" value={form.email} onChange={e => setField("email", e.target.value)}
                  placeholder="trader@email.com" style={inputStyle}
                  autoFocus={!isRegister}
                  onFocus={e => { e.target.style.borderColor = t.accent; }}
                  onBlur={e  => { e.target.style.borderColor = t.border; }}
                  onKeyDown={e => e.key === "Enter" && !isRegister && handleSubmit()} />
              </div>
              <div>
                <label>Password</label>
                <input type="password" value={form.password} onChange={e => setField("password", e.target.value)}
                  placeholder="••••••••" style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = t.accent; }}
                  onBlur={e  => { e.target.style.borderColor = t.border; }}
                  onKeyDown={e => e.key === "Enter" && !isRegister && handleSubmit()} />
              </div>
              {isRegister && (
                <div>
                  <label>Konfirmasi Password</label>
                  <input type="password" value={form.confirm} onChange={e => setField("confirm", e.target.value)}
                    placeholder="••••••••" style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = t.accent; }}
                    onBlur={e  => { e.target.style.borderColor = t.border; }}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()} />
                </div>
              )}

              {displayError && (
                <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#ef4444" }}>
                  {displayError}
                </div>
              )}

              <button onClick={handleSubmit} disabled={loading}
                style={{ background: loading ? t.border : "linear-gradient(135deg, #00d4aa, #00b4d8)", border: "none", color: "#090e1a", fontFamily: "DM Mono, monospace", fontSize: 14, fontWeight: 600, padding: "13px 0", borderRadius: 10, cursor: loading ? "not-allowed" : "pointer", marginTop: 4, letterSpacing: "0.05em" }}>
                {loading ? "Loading..." : isRegister ? "DAFTAR" : "MASUK"}
              </button>

              {/* Register hint */}
              {isRegister && (
                <div style={{ fontSize: 11, color: t.textDim, textAlign: "center", lineHeight: 1.5 }}>
                  Email konfirmasi akan dikirim ke inbox kamu.<br />
                  Gunakan email asli yang bisa kamu akses.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {!compact && !pendingEmail && (
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: t.textDim }}>
          Data tersimpan aman di Supabase · Sync antar device
        </div>
      )}
    </div>
  );

  if (compact) return card;

  return (
    <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -200, right: -200, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,170,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -150, left: -150, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,180,216,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />
      {card}
    </div>
  );
}