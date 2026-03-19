import { useRef, useEffect, useCallback, useState } from "react";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { MARKETS, SIDES, SESSIONS, STRATEGIES, EMOTIONS } from "../constants";
import TagSelector from "./TagSelector";

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

// ── Section header ────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 9, textTransform: "uppercase", letterSpacing: "0.18em",
      color: "var(--accent)", fontWeight: 600, marginBottom: 12,
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, var(--accent)30, transparent)" }} />
      {children}
      <div style={{ flex: 1, height: 1, background: "linear-gradient(270deg, var(--accent)30, transparent)" }} />
    </div>
  );
}

// ── Screenshot grid ───────────────────────────────────────────────
function ScreenshotGrid({ urls, onRemove, theme: t }) {
  if (!urls?.length) return null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8, marginTop: 8 }}>
      {urls.map((url, i) => (
        <div key={i} style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: `1px solid ${t.border}` }}>
          <img src={url} alt={`ss-${i}`}
            style={{ width: "100%", height: 96, objectFit: "cover", display: "block" }}
            onError={e => { e.target.style.display = "none"; }} />
          <button onClick={() => onRemove(i)}
            style={{
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

export default function TradeForm({ form, setForm, editingTrade, onSubmit, onClose, theme, supabase }) {
  const t       = theme;
  const fileRef = useRef(null);
  const { isMobile } = useBreakpoint();
  const [uploading, setUploading] = useState(false);
  const [urlInput,  setUrlInput]  = useState("");

  const set = useCallback((key, val) => setForm(p => ({ ...p, [key]: val })), [setForm]);

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
  const pnlVal = parseFloat(form.pnl);
  const rrVal  = parseFloat(form.rr);
  const pnlColor = !isNaN(pnlVal) && pnlVal >= 0 ? "#00c896" : "#ef4444";
  const rrColor  = !isNaN(rrVal)  && rrVal  >= 0 ? "#00c896" : "#ef4444";

  const inp = (key, placeholder = "0.00", readOnly = false) => (
    <input
      type="number" step="any" value={form[key]}
      onChange={e => set(key, e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      style={{
        background: t.bgInput, border: `1px solid ${t.border}`,
        color: t.text, borderRadius: 8, width: "100%",
        padding: "9px 12px", fontFamily: "DM Mono, monospace", fontSize: 13,
      }}
    />
  );

  return (
    <div className="form-modal" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="form-card" style={{ background: t.bgCard, borderColor: t.border, maxWidth: 800, maxHeight: "92vh", overflowY: "auto" }}>

        {/* ── Header ──────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 3, color: t.text, lineHeight: 1 }}>
              {editingTrade ? "EDIT TRADE" : "LOG NEW TRADE"}
            </div>
            <div style={{ fontSize: 11, color: t.textDim, marginTop: 4 }}>
              P&L dan R:R dihitung otomatis
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: t.bgSubtle, border: `1px solid ${t.border}`, color: t.textDim, cursor: "pointer", borderRadius: 7, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
            ✕
          </button>
        </div>

        {/* ── Basic Info ──────────────────────────────────────── */}
        <SectionLabel>Info Dasar</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(180px,1fr))", gap: 12, marginBottom: 20 }}>
          <div>
            <label>Date</label>
            <input type="date" value={form.date} onChange={e => set("date", e.target.value)}
              style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8 }} />
          </div>
          <div>
            <label>Pair / Symbol</label>
            <input type="text" value={form.pair} onChange={e => set("pair", e.target.value.toUpperCase())}
              placeholder="EUR/USD, BBCA, BTC/USDT"
              style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, fontFamily: "DM Mono, monospace", textTransform: "uppercase" }} />
          </div>
          <div>
            <label>Market</label>
            <select value={form.market} onChange={e => set("market", e.target.value)}
              style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8 }}>
              {MARKETS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label>Side</label>
            <div style={{ display: "flex", gap: 6 }}>
              {SIDES.map(s => (
                <button key={s} onClick={() => set("side", s)}
                  style={{
                    flex: 1, padding: "9px 0", borderRadius: 8, cursor: "pointer",
                    fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 600,
                    letterSpacing: "0.08em",
                    border: `1px solid ${form.side === s ? (s === "BUY" ? "#00c896" : "#f59e0b") : t.border}`,
                    background: form.side === s
                      ? (s === "BUY" ? "rgba(0,200,150,0.1)" : "rgba(245,158,11,0.1)")
                      : "transparent",
                    color: form.side === s ? (s === "BUY" ? "#00c896" : "#f59e0b") : t.textMuted,
                    transition: "all 0.15s",
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label>Session</label>
            <select value={form.session} onChange={e => set("session", e.target.value)}
              style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8 }}>
              {SESSIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label>Strategy</label>
            <select value={form.strategy} onChange={e => set("strategy", e.target.value)}
              style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8 }}>
              {STRATEGIES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* ── Price Levels ────────────────────────────────────── */}
        <SectionLabel>Price Levels</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(180px,1fr))", gap: 12, marginBottom: 20 }}>
          <div>
            <label>Entry Price</label>
            {inp("entry")}
          </div>
          <div>
            <label>Stop Loss <span style={{ color: t.textDim, textTransform: "none", fontSize: 9 }}>→ R:R</span></label>
            {inp("stopLoss")}
          </div>
          <div>
            <label>Take Profit <span style={{ color: t.textDim, textTransform: "none", fontSize: 9 }}>→ R:R</span></label>
            {inp("takeProfit")}
          </div>
          <div>
            <label>Exit Price <span style={{ color: t.textDim, textTransform: "none", fontSize: 9 }}>→ P&L</span></label>
            {inp("exit")}
          </div>
          <div>
            <label>Position Size (lot)</label>
            {inp("size", "0.1")}
          </div>
          <div>
            <label>Emotion</label>
            <select value={form.emotion} onChange={e => set("emotion", e.target.value)}
              style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8 }}>
              {EMOTIONS.map(em => <option key={em}>{em}</option>)}
            </select>
          </div>
        </div>

        {/* ── Auto P&L + R:R ──────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { key: "pnl", label: "P&L — auto calculated", color: pnlColor },
            { key: "rr",  label: "R:R — auto calculated",  color: rrColor  },
          ].map(f => (
            <div key={f.key} style={{
              background: `${f.color}08`,
              border: `1px solid ${f.color}25`,
              borderRadius: 10, padding: "12px 14px",
            }}>
              <label style={{ color: t.textDim }}>{f.label}</label>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="number" step="any" value={form[f.key]}
                  onChange={e => set(f.key, e.target.value)}
                  placeholder="0.00"
                  style={{
                    background: "transparent", border: "none",
                    color: f.color, fontFamily: "DM Mono, monospace",
                    fontSize: 20, fontWeight: 600, padding: 0,
                    outline: "none", width: "100%",
                  }} />
                <span style={{ fontSize: 9, color: t.textDim, flexShrink: 0 }}>override</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Notes + Tags ────────────────────────────────────── */}
        <SectionLabel>Notes & Tags</SectionLabel>
        <div style={{ marginBottom: 14 }}>
          <label>Notes</label>
          <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
            rows={2} placeholder="Trade reasoning, market context, lessons..."
            style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, lineHeight: 1.6 }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <TagSelector tags={form.tags ?? []} onChange={tags => set("tags", tags)} theme={t} />
        </div>

        {/* ── Screenshots ─────────────────────────────────────── */}
        <SectionLabel>Screenshots ({screenshots.length}/5)</SectionLabel>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input type="text" value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addUrl(urlInput); setUrlInput(""); } }}
            placeholder="Paste URL gambar lalu Enter..."
            style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, flex: 1 }}
            disabled={screenshots.length >= 5} />
          <button onClick={() => { addUrl(urlInput); setUrlInput(""); }}
            className="btn-ghost" style={{ whiteSpace: "nowrap", fontSize: 11 }}
            disabled={!urlInput.trim() || screenshots.length >= 5}>
            + URL
          </button>
          <button onClick={() => fileRef.current?.click()}
            className="btn-ghost" style={{ whiteSpace: "nowrap", fontSize: 11 }}
            disabled={uploading || screenshots.length >= 5}>
            {uploading ? "Uploading..." : "↑ Upload"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFileUpload} style={{ display: "none" }} />
        </div>
        <ScreenshotGrid urls={screenshots} onRemove={removeScreenshot} theme={t} />
        {screenshots.length === 0 && (
          <div style={{ fontSize: 11, color: t.textDim, padding: "8px 0" }}>
            Belum ada screenshot
          </div>
        )}

        {/* ── Actions ─────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24, paddingTop: 20, borderTop: `1px solid ${t.borderSubtle}` }}>
          <button className="btn-ghost" onClick={onClose} style={{ minWidth: 80 }}>Batal</button>
          <button className="btn-primary" onClick={onSubmit} style={{ minWidth: 140, justifyContent: "center" }}>
            {editingTrade ? "✓ Simpan Perubahan" : "✓ Log Trade"}
          </button>
        </div>
      </div>
    </div>
  );
}