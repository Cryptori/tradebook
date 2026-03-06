import { useRef, useEffect, useCallback, useState } from "react";
import { MARKETS, SIDES, SESSIONS, STRATEGIES, EMOTIONS } from "../constants";
import TagSelector from "./TagSelector";

// ── Pure calculation helpers ──────────────────────────────────────
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

function FormField({ label, hint, children }) {
  return (
    <div>
      {label && <label>{label}</label>}
      {children}
      {hint && <div style={{ fontSize: 10, color: "#00d4aa", marginTop: 3 }}>{hint}</div>}
    </div>
  );
}

// ── Screenshot grid — multiple images ────────────────────────────
function ScreenshotGrid({ urls, onRemove, theme: t }) {
  if (!urls?.length) return null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8, marginTop: 8 }}>
      {urls.map((url, i) => (
        <div key={i} style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: `1px solid ${t.border}` }}>
          <img src={url} alt={`screenshot-${i}`}
            style={{ width: "100%", height: 110, objectFit: "cover", display: "block", background: "#000" }}
            onError={e => { e.target.style.display = "none"; }} />
          <button onClick={() => onRemove(i)}
            style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.75)", border: "none", color: "#fff", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

export default function TradeForm({ form, setForm, editingTrade, onSubmit, onClose, theme, supabase }) {
  const t         = theme;
  const fileRef   = useRef(null);
  const [uploading, setUploading] = useState(false);

  const set = useCallback((key, val) => setForm(p => ({ ...p, [key]: val })), [setForm]);

  // Auto-calculate P&L and R:R
  useEffect(() => {
    const pnl = calcPnL(form);
    const rr  = calcRR(form);
    setForm(p => ({
      ...p,
      ...(pnl !== null ? { pnl } : {}),
      ...(rr  !== null ? { rr  } : {}),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.entry, form.exit, form.stopLoss, form.takeProfit, form.size, form.side]);

  // ── Multiple screenshot upload ────────────────────────────────
  async function handleFileUpload(e) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);

    const newUrls = [];
    for (const file of files) {
      if (supabase) {
        const ext      = file.name.split(".").pop();
        const filename = `screenshots/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { data, error } = await supabase.storage
          .from("tradebook").upload(filename, file, { upsert: true });
        if (!error && data) {
          const { data: urlData } = supabase.storage.from("tradebook").getPublicUrl(filename);
          newUrls.push(urlData.publicUrl);
          continue;
        }
      }
      // Fallback: base64
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

  function addUrlManually(url) {
    if (!url?.trim()) return;
    const existing = Array.isArray(form.screenshots) ? form.screenshots : (form.screenshotUrl ? [form.screenshotUrl] : []);
    if (existing.includes(url)) return;
    set("screenshots", [...existing, url]);
  }

  function removeScreenshot(i) {
    const existing = Array.isArray(form.screenshots) ? form.screenshots : [];
    set("screenshots", existing.filter((_, idx) => idx !== i));
  }

  const screenshots = Array.isArray(form.screenshots)
    ? form.screenshots
    : (form.screenshotUrl ? [form.screenshotUrl] : []);

  const [urlInput, setUrlInput] = useState("");

  const numInput = (key, label, opts = {}) => (
    <FormField key={key} label={label} hint={opts.hint}>
      <input
        type="number" step="any" value={form[key]}
        onChange={e => set(key, e.target.value)}
        placeholder={opts.placeholder ?? "0.00"}
        style={{ background: t.bgCard, border: `1px solid ${t.border}`, color: t.text }}
        readOnly={opts.readOnly}
      />
    </FormField>
  );

  const pnlColor = parseFloat(form.pnl) >= 0 ? "#00d4aa" : "#ef4444";
  const rrColor  = parseFloat(form.rr)  >= 0 ? "#00d4aa" : "#ef4444";

  return (
    <div className="form-modal"
      style={{ background: `rgba(${t.name === "light" ? "240,244,248" : "9,14,26"},0.95)` }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="form-card" style={{ background: t.bgCard, borderColor: t.border, maxWidth: 780 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 2, color: t.text }}>
              {editingTrade ? "EDIT TRADE" : "LOG NEW TRADE"}
            </div>
            <div style={{ fontSize: 11, color: t.textDim }}>P&L dan R:R dihitung otomatis</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>

        {/* Basic Info */}
        <div style={{ fontSize: 10, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Info Dasar</div>
        <div className="form-grid" style={{ marginBottom: 16 }}>
          <FormField label="Date">
            <input type="date" value={form.date} onChange={e => set("date", e.target.value)}
              style={{ background: t.bgCard, border: `1px solid ${t.border}`, color: t.text }} />
          </FormField>
          <FormField label="Pair / Symbol">
            <input type="text" value={form.pair} onChange={e => set("pair", e.target.value)}
              placeholder="EUR/USD, BBCA, BTC/USDT"
              style={{ background: t.bgCard, border: `1px solid ${t.border}`, color: t.text }} />
          </FormField>
          <FormField label="Market">
            <select value={form.market} onChange={e => set("market", e.target.value)}
              style={{ background: t.bgCard, border: `1px solid ${t.border}`, color: t.text }}>
              {MARKETS.map(m => <option key={m}>{m}</option>)}
            </select>
          </FormField>
          <FormField label="Side">
            <div style={{ display: "flex", gap: 6 }}>
              {SIDES.map(s => (
                <button key={s} onClick={() => set("side", s)}
                  style={{ flex: 1, padding: "9px 0", borderRadius: 8, cursor: "pointer", fontFamily: "DM Mono, monospace", fontSize: 13, fontWeight: 500,
                    border: `1px solid ${form.side === s ? (s === "BUY" ? "#00d4aa" : "#f59e0b") : t.border}`,
                    background: form.side === s ? (s === "BUY" ? "rgba(0,212,170,0.1)" : "rgba(245,158,11,0.1)") : "transparent",
                    color: form.side === s ? (s === "BUY" ? "#00d4aa" : "#f59e0b") : t.textMuted,
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </FormField>
          <FormField label="Session">
            <select value={form.session} onChange={e => set("session", e.target.value)}
              style={{ background: t.bgCard, border: `1px solid ${t.border}`, color: t.text }}>
              {SESSIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </FormField>
          <FormField label="Strategy">
            <select value={form.strategy} onChange={e => set("strategy", e.target.value)}
              style={{ background: t.bgCard, border: `1px solid ${t.border}`, color: t.text }}>
              {STRATEGIES.map(s => <option key={s}>{s}</option>)}
            </select>
          </FormField>
        </div>

        {/* Price Levels */}
        <div style={{ fontSize: 10, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Price Levels</div>
        <div className="form-grid" style={{ marginBottom: 16 }}>
          {numInput("entry",      "Entry Price")}
          {numInput("stopLoss",   "Stop Loss",   { hint: "Untuk hitung R:R" })}
          {numInput("takeProfit", "Take Profit", { hint: "Untuk hitung R:R" })}
          {numInput("exit",       "Exit Price",  { hint: "Untuk hitung P&L" })}
          {numInput("size",       "Position Size")}
          <FormField label="Emotion">
            <select value={form.emotion} onChange={e => set("emotion", e.target.value)}
              style={{ background: t.bgCard, border: `1px solid ${t.border}`, color: t.text }}>
              {EMOTIONS.map(em => <option key={em}>{em}</option>)}
            </select>
          </FormField>
        </div>

        {/* Auto P&L + R:R */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { key: "pnl", label: "P&L ($) — auto",  color: pnlColor },
            { key: "rr",  label: "R:R Ratio — auto", color: rrColor  },
          ].map(f => (
            <div key={f.key} style={{ background: t.bgSubtle, border: `1px solid ${t.border}`, borderRadius: 8, padding: "10px 12px" }}>
              <label style={{ color: t.textDim }}>{f.label}</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="number" step="any" value={form[f.key]}
                  onChange={e => set(f.key, e.target.value)}
                  placeholder="0.00"
                  style={{ background: "transparent", border: "none", color: f.color, fontFamily: "DM Mono, monospace", fontSize: 16, fontWeight: 500, padding: 0, outline: "none", width: "100%" }} />
                <span style={{ fontSize: 10, color: t.textDim, whiteSpace: "nowrap" }}>override</span>
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: t.textDim }}>Notes</label>
          <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
            rows={2} placeholder="Trade reasoning, observations..."
            style={{ resize: "vertical", background: t.bgCard, border: `1px solid ${t.border}`, color: t.text }} />
        </div>

        {/* Tags */}
        <div style={{ marginBottom: 16 }}>
          <TagSelector tags={form.tags ?? []} onChange={tags => set("tags", tags)} theme={t} />
        </div>

        {/* Screenshots — multiple */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <label style={{ color: t.textDim, margin: 0 }}>
              Screenshots ({screenshots.length}/5)
            </label>
            {uploading && <span style={{ fontSize: 11, color: t.accent }}>Uploading...</span>}
          </div>

          {/* URL input */}
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input type="text" value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addUrlManually(urlInput); setUrlInput(""); } }}
              placeholder="Paste URL gambar lalu Enter..."
              style={{ background: t.bgCard, border: `1px solid ${t.border}`, color: t.text, flex: 1 }}
              disabled={screenshots.length >= 5} />
            <button onClick={() => { addUrlManually(urlInput); setUrlInput(""); }}
              className="btn-ghost" style={{ whiteSpace: "nowrap" }}
              disabled={!urlInput.trim() || screenshots.length >= 5}>
              + URL
            </button>
            <button onClick={() => fileRef.current?.click()}
              className="btn-ghost" style={{ whiteSpace: "nowrap" }}
              disabled={uploading || screenshots.length >= 5}>
              ↑ Upload
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple
              onChange={handleFileUpload} style={{ display: "none" }} />
          </div>

          {/* Grid preview */}
          <ScreenshotGrid urls={screenshots} onRemove={removeScreenshot} theme={t} />

          {screenshots.length === 0 && (
            <div style={{ fontSize: 11, color: t.textDim, padding: "10px 0" }}>
              Belum ada screenshot. Upload atau paste URL gambar.
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={onSubmit}>
            {editingTrade ? "SAVE CHANGES" : "LOG TRADE"}
          </button>
        </div>
      </div>
    </div>
  );
}