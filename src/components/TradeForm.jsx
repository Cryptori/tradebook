import { useRef, useEffect, useCallback, useState } from "react";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { MARKETS, SIDES, SESSIONS, STRATEGIES, EMOTIONS } from "../constants";
import TagSelector from "./TagSelector";

// ── Calculations ──────────────────────────────────────────────────
function calcPnL(form) {
  const entry = parseFloat(form.entry);
  const exit  = parseFloat(form.exit);
  const size  = parseFloat(form.size);
  if (!entry || !exit || !size) return null;
  const diff = form.side === "BUY" ? exit - entry : entry - exit;
  return (diff * size).toFixed(2);
}

function calcRR(form) {
  const entry = parseFloat(form.entry);
  const sl    = parseFloat(form.stopLoss);
  const tp    = parseFloat(form.takeProfit);
  if (!entry || !sl || !tp) return null;
  const risk   = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);
  if (!risk) return null;
  return (reward / risk).toFixed(2);
}

// ── Section divider ───────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      marginBottom: 12, marginTop: 4,
    }}>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }}/>
      <span style={{
        fontSize: "var(--fs-2xs)", color: "var(--accent)",
        textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 600,
        whiteSpace: "nowrap",
      }}>
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }}/>
    </div>
  );
}

// ── Screenshot grid ───────────────────────────────────────────────
function ScreenshotGrid({ urls, onRemove }) {
  if (!urls?.length) return null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8, marginTop: 8 }}>
      {urls.map((url, i) => (
        <div key={i} style={{ position: "relative", borderRadius: "var(--r-md)", overflow: "hidden", border: "1px solid var(--border)" }}>
          <img src={url} alt={`ss-${i}`}
            style={{ width: "100%", height: 88, objectFit: "cover", display: "block" }}
            onError={e => { e.target.style.display = "none"; }}/>
          <button onClick={() => onRemove(i)} style={{
            position: "absolute", top: 4, right: 4,
            background: "rgba(0,0,0,0.7)", border: "none",
            color: "#fff", borderRadius: "50%", width: 20, height: 20,
            cursor: "pointer", fontSize: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>
      ))}
    </div>
  );
}

// ── Main TradeForm ────────────────────────────────────────────────
export default function TradeForm({ form, setForm, editingTrade, onSubmit, onClose, theme, supabase }) {
  const fileRef = useRef(null);
  const { isMobile } = useBreakpoint();
  const [uploading, setUploading] = useState(false);
  const [urlInput,  setUrlInput]  = useState("");

  const set = useCallback((key, val) => setForm(p => ({ ...p, [key]: val })), [setForm]);

  // Auto-calc P&L and R:R
  useEffect(() => {
    const pnl = calcPnL(form);
    const rr  = calcRR(form);
    setForm(p => ({
      ...p,
      ...(pnl !== null ? { pnl } : {}),
      ...(rr  !== null ? { rr  } : {}),
    }));
  }, [form.entry, form.exit, form.stopLoss, form.takeProfit, form.size, form.side]); // eslint-disable-line

  async function handleFileUpload(e) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    const newUrls = [];
    for (const file of files) {
      if (supabase) {
        const ext = file.name.split(".").pop();
        const filename = `screenshots/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { data, error } = await supabase.storage.from("tradebook").upload(filename, file, { upsert: true });
        if (!error && data) {
          const { data: urlData } = supabase.storage.from("tradebook").getPublicUrl(filename);
          newUrls.push(urlData.publicUrl);
          continue;
        }
      }
      await new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = ev => { newUrls.push(ev.target.result); resolve(); };
        reader.readAsDataURL(file);
      });
    }
    const existing = Array.isArray(form.screenshots) ? form.screenshots : (form.screenshotUrl ? [form.screenshotUrl] : []);
    set("screenshots", [...existing, ...newUrls]);
    e.target.value = "";
    setUploading(false);
  }

  function addUrl(url) {
    if (!url?.trim()) return;
    const existing = Array.isArray(form.screenshots) ? form.screenshots : (form.screenshotUrl ? [form.screenshotUrl] : []);
    if (existing.includes(url)) return;
    set("screenshots", [...existing, url]);
  }

  function removeScreenshot(i) {
    set("screenshots", (Array.isArray(form.screenshots) ? form.screenshots : []).filter((_, idx) => idx !== i));
  }

  const screenshots = Array.isArray(form.screenshots) ? form.screenshots : (form.screenshotUrl ? [form.screenshotUrl] : []);
  const pnlVal   = parseFloat(form.pnl);
  const rrVal    = parseFloat(form.rr);
  const pnlColor = !isNaN(pnlVal) && pnlVal >= 0 ? "var(--success)" : "var(--danger)";
  const rrColor  = !isNaN(rrVal)  && rrVal  >= 1 ? "var(--success)" : "var(--warning)";

  // Shared input style
  const inputStyle = {
    background: "var(--bg-input)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    borderRadius: "var(--r-md)",
    width: "100%",
    padding: "8px 10px",
    fontSize: "var(--fs-base)",
    fontFamily: "var(--font-ui)",
  };

  const monoInputStyle = { ...inputStyle, fontFamily: "var(--font-mono)", fontSize: "var(--fs-base)" };

  function NumInput({ k, placeholder = "0.00", readOnly = false }) {
    return (
      <input
        type="number" step="any"
        value={form[k]}
        onChange={e => set(k, e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        style={monoInputStyle}
      />
    );
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "var(--bg-overlay)",
      backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-xl)",
        padding: isMobile ? 16 : 24,
        width: "100%",
        maxWidth: 780,
        maxHeight: "92vh",
        overflowY: "auto",
        boxShadow: "var(--shadow-lg)",
      }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-disp)", fontSize: 20, letterSpacing: 3, color: "var(--text)", lineHeight: 1, fontWeight: 400 }}>
              {editingTrade ? "EDIT TRADE" : "LOG NEW TRADE"}
            </h2>
            <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 4 }}>
              P&L dan R:R dihitung otomatis
            </p>
          </div>
          <button onClick={onClose} className="btn-icon">✕</button>
        </div>

        {/* Basic Info */}
        <SectionLabel>Info Dasar</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(170px, 1fr))", gap: 10, marginBottom: 20 }}>
          <div>
            <label>Date</label>
            <input type="date" value={form.date} onChange={e => set("date", e.target.value)} style={inputStyle}/>
          </div>
          <div>
            <label>Pair / Symbol</label>
            <input type="text" value={form.pair}
              onChange={e => set("pair", e.target.value.toUpperCase())}
              placeholder="EUR/USD, BBCA, BTC"
              style={{ ...monoInputStyle, textTransform: "uppercase" }}/>
          </div>
          <div>
            <label>Market</label>
            <select value={form.market} onChange={e => set("market", e.target.value)} style={inputStyle}>
              {MARKETS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label>Session</label>
            <select value={form.session} onChange={e => set("session", e.target.value)} style={inputStyle}>
              {SESSIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label>Strategy</label>
            <select value={form.strategy} onChange={e => set("strategy", e.target.value)} style={inputStyle}>
              {STRATEGIES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label>Emotion</label>
            <select value={form.emotion} onChange={e => set("emotion", e.target.value)} style={inputStyle}>
              {EMOTIONS.map(em => <option key={em}>{em}</option>)}
            </select>
          </div>
        </div>

        {/* Side selector */}
        <div style={{ marginBottom: 20 }}>
          <label>Side</label>
          <div style={{ display: "flex", gap: 8 }}>
            {SIDES.map(s => {
              const active = form.side === s;
              const color  = s === "BUY" ? "var(--success)" : "var(--warning)";
              const dimColor = s === "BUY" ? "var(--success-dim)" : "var(--warning-dim)";
              return (
                <button key={s} onClick={() => set("side", s)} style={{
                  flex: 1, padding: "9px 0",
                  borderRadius: "var(--r-md)",
                  cursor: "pointer",
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--fs-sm)",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  border: `1px solid ${active ? color : "var(--border)"}`,
                  background: active ? dimColor : "transparent",
                  color: active ? color : "var(--text-muted)",
                  transition: "all 0.15s",
                }}>
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Price Levels */}
        <SectionLabel>Price Levels</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, 1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { k: "entry",      label: "Entry" },
            { k: "stopLoss",   label: "Stop Loss" },
            { k: "takeProfit", label: "Take Profit" },
            { k: "exit",       label: "Exit Price" },
            { k: "size",       label: "Size (lot)", placeholder: "0.01" },
          ].map(f => (
            <div key={f.k}>
              <label>{f.label}</label>
              <NumInput k={f.k} placeholder={f.placeholder ?? "0.00"}/>
            </div>
          ))}
        </div>

        {/* Auto P&L + R:R */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { k: "pnl", label: "P&L", hint: "auto calculated", color: pnlColor },
            { k: "rr",  label: "R:R", hint: "auto calculated", color: rrColor  },
          ].map(f => (
            <div key={f.k} style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-lg)",
              padding: "12px 14px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <label style={{ color: "var(--text-dim)", marginBottom: 0 }}>{f.label}</label>
                <span style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)" }}>{f.hint}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="number" step="any" value={form[f.k]}
                  onChange={e => set(f.k, e.target.value)}
                  placeholder="0.00"
                  style={{
                    background: "transparent", border: "none",
                    color: f.color, fontFamily: "var(--font-mono)",
                    fontSize: "var(--fs-2xl)", fontWeight: 600,
                    padding: 0, outline: "none", width: "100%",
                  }}/>
              </div>
            </div>
          ))}
        </div>

        {/* Notes & Tags */}
        <SectionLabel>Notes & Tags</SectionLabel>
        <div style={{ marginBottom: 12 }}>
          <label>Notes</label>
          <textarea
            value={form.notes}
            onChange={e => set("notes", e.target.value)}
            rows={3}
            placeholder="Trade reasoning, market context, lessons learned..."
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, minHeight: 72 }}
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <TagSelector tags={form.tags ?? []} onChange={tags => set("tags", tags)} theme={theme}/>
        </div>

        {/* Screenshots */}
        <SectionLabel>Screenshots ({screenshots.length}/5)</SectionLabel>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            type="text" value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addUrl(urlInput); setUrlInput(""); }}}
            placeholder="Paste URL gambar lalu Enter..."
            style={{ ...inputStyle, flex: 1 }}
            disabled={screenshots.length >= 5}
          />
          <button onClick={() => { addUrl(urlInput); setUrlInput(""); }}
            className="btn-ghost"
            disabled={!urlInput.trim() || screenshots.length >= 5}>
            + URL
          </button>
          <button onClick={() => fileRef.current?.click()}
            className="btn-ghost"
            disabled={uploading || screenshots.length >= 5}>
            {uploading ? "Uploading..." : "↑ Upload"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFileUpload} style={{ display: "none" }}/>
        </div>
        <ScreenshotGrid urls={screenshots} onRemove={removeScreenshot}/>
        {screenshots.length === 0 && (
          <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", padding: "6px 0" }}>Belum ada screenshot</p>
        )}

        {/* Actions */}
        <div style={{
          display: "flex", gap: 10, justifyContent: "flex-end",
          marginTop: 24, paddingTop: 16,
          borderTop: "1px solid var(--border)",
        }}>
          <button className="btn-ghost" onClick={onClose} style={{ minWidth: 80 }}>Batal</button>
          <button className="btn-primary" onClick={onSubmit} style={{ minWidth: 140, justifyContent: "center" }}>
            {editingTrade ? "✓ Simpan Perubahan" : "✓ Log Trade"}
          </button>
        </div>
      </div>
    </div>
  );
}