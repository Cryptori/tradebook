import { useState, useEffect } from "react";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { CURRENCIES, DEFAULT_SETTINGS } from "../hooks/useSettings";
import RiskRulesPanel from "./RiskRulesPanel";
import { formatCurrency, formatPct } from "../utils/formatters";

function ProgressBar({ value, color, theme: t }) {
  // theme used via CSS vars
  return (
    <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", borderRadius: 6, height: 8, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.max(0, Math.min(value, 100))}%`, background: color, borderRadius: 6, transition: "width 0.5s ease" }} />
    </div>
  );
}

export default function Settings({ settings, onUpdate, onReset, currencyMeta, stats, theme }) {
  const t = theme;
  const { isMobile } = useBreakpoint();
  const [draft, setDraft] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  // Sync draft when settings change externally (e.g. account switch)
  useEffect(() => { setDraft({ ...settings }); }, [settings]);

  const sym     = CURRENCIES.find(c => c.code === draft.currency)?.symbol ?? "$";
  const capital = parseFloat(draft.capitalInitial) || 0;
  const targetProfit  = capital * ((parseFloat(draft.targetProfitPct) || 0) / 100);
  const maxDrawdown   = capital * ((parseFloat(draft.maxDrawdownPct)  || 0) / 100);
  const profitProgress    = targetProfit > 0 ? (stats.totalPnl / targetProfit) * 100 : 0;
  const drawdownProgress  = maxDrawdown  > 0 ? (Math.abs(Math.min(stats.worstTrade, 0)) / maxDrawdown) * 100 : 0;
  const ddColor = drawdownProgress >= 80 ? "#ef4444" : drawdownProgress >= 50 ? "#f59e0b" : "#00d4aa";

  function set(key, val) { setDraft(p => ({ ...p, [key]: val })); }

  function handleSave() {
    onUpdate({
      capitalInitial:       parseFloat(draft.capitalInitial)       || DEFAULT_SETTINGS.capitalInitial,
      currency:             draft.currency,
      targetProfitPct:      parseFloat(draft.targetProfitPct)      || DEFAULT_SETTINGS.targetProfitPct,
      maxDrawdownPct:       parseFloat(draft.maxDrawdownPct)       || DEFAULT_SETTINGS.maxDrawdownPct,
      targetTradesPerMonth: parseInt(draft.targetTradesPerMonth)   || DEFAULT_SETTINGS.targetTradesPerMonth,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    if (!window.confirm("Reset semua settings ke default?")) return;
    setDraft({ ...DEFAULT_SETTINGS });
    onReset();
  }

  const numInput = (key, opts = {}) => (
    <input
      type="number"
      min={opts.min ?? 0}
      max={opts.max}
      step={opts.step ?? 1}
      value={draft[key]}
      onChange={e => set(key, e.target.value)}
      style={opts.style}
    />
  );

  return (
    <div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2, marginBottom: 4, color: t.text }}>SETTINGS</div>
      <div style={{ fontSize: 11, color: t.textDim, marginBottom: 24 }}>Konfigurasi akun dan target trading kamu</div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>

        {/* Account */}
        <div className="stat-card">
          <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>Akun</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label>Starting Capital</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: t.textDim, fontSize: 13, pointerEvents: "none" }}>{sym}</span>
                {numInput("capitalInitial", { min: 0, step: 100, style: { paddingLeft: 28 } })}
              </div>
            </div>
            <div>
              <label>Mata Uang</label>
              <select value={draft.currency} onChange={e => set("currency", e.target.value)}>
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} — {c.name} ({c.code})</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Targets */}
        <div className="stat-card">
          <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>Target & Limit</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label>Target Profit (%)</label>
              <div style={{ position: "relative" }}>
                {numInput("targetProfitPct", { min: 1, max: 1000, style: { paddingRight: 36 } })}
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: t.textDim, fontSize: 13, pointerEvents: "none" }}>%</span>
              </div>
              <div style={{ fontSize: 10, color: "#00d4aa", marginTop: 4 }}>= {formatCurrency(targetProfit, false, sym)} target</div>
            </div>
            <div>
              <label>Max Drawdown (%)</label>
              <div style={{ position: "relative" }}>
                {numInput("maxDrawdownPct", { min: 1, max: 100, style: { paddingRight: 36 } })}
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: t.textDim, fontSize: 13, pointerEvents: "none" }}>%</span>
              </div>
              <div style={{ fontSize: 10, color: "#ef4444", marginTop: 4 }}>= {formatCurrency(maxDrawdown, false, sym)} max loss</div>
            </div>
            <div>
              <label>Target Trades / Bulan</label>
              {numInput("targetTradesPerMonth", { min: 1, max: 500 })}
            </div>
          </div>
        </div>

        {/* Live Progress */}
        <div className="stat-card" style={{ gridColumn: isMobile ? "auto" : "span 2" }}>
          <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>Progress vs Target (Live)</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 20 }}>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: t.textMuted }}>Profit Target</span>
                <span style={{ fontSize: 11, color: stats.totalPnl >= 0 ? "#00d4aa" : "#ef4444" }}>
                  {formatCurrency(stats.totalPnl, false, currencyMeta.symbol)} / {formatCurrency(targetProfit, false, currencyMeta.symbol)}
                </span>
              </div>
              <ProgressBar value={profitProgress} color={profitProgress >= 100 ? "#00d4aa" : "linear-gradient(90deg, #00d4aa80, #00d4aa)"} theme={t} />
              <div style={{ fontSize: 10, color: t.textDim, marginTop: 4 }}>
                {profitProgress >= 100 ? "🎯 Target tercapai!" : `${Math.max(0, profitProgress).toFixed(1)}% tercapai`}
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: t.textMuted }}>Drawdown Safety</span>
                <span style={{ fontSize: 11, color: ddColor }}>{drawdownProgress.toFixed(1)}% terpakai</span>
              </div>
              <ProgressBar value={drawdownProgress} color={ddColor} theme={t} />
              <div style={{ fontSize: 10, color: t.textDim, marginTop: 4 }}>Limit: {formatCurrency(maxDrawdown, false, currencyMeta.symbol)}</div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: t.textMuted }}>Return on Capital</span>
                <span style={{ fontSize: 11, color: stats.totalPnl >= 0 ? "#00d4aa" : "#ef4444" }}>
                  {capital > 0 ? formatPct((stats.totalPnl / capital) * 100) : "N/A"}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
                <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 9, color: t.textDim, marginBottom: 2 }}>CURRENT EQUITY</div>
                  <div style={{ fontSize: 13, color: t.text }}>{formatCurrency(capital + stats.totalPnl, true, currencyMeta.symbol)}</div>
                </div>
                <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 9, color: t.textDim, marginBottom: 2 }}>WIN RATE</div>
                  <div style={{ fontSize: 13, color: stats.winRate >= 50 ? "#00d4aa" : "#f59e0b" }}>{stats.winRate.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Supabase status slot — rendered by parent if needed */}
      <div id="supabase-status-slot" />

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
        <button className="btn-danger" onClick={handleReset}>↺ Reset Default</button>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {saved && <span style={{ fontSize: 12, color: "#00d4aa" }}>✓ Tersimpan!</span>}
          <button className="btn-primary" onClick={handleSave}>Simpan Settings</button>
        </div>
      </div>
    </div>
  );
}

// ── SupabaseStatus widget (used separately in trade.jsx) ──────────
export function SupabaseStatus({ isConfigured, syncing, syncError, lastSynced, theme }) {
  const t = theme;
  const dotColor = !isConfigured ? "#64748b" : syncError ? "#ef4444" : "#00d4aa";
  const statusText = !isConfigured
    ? "Supabase not configured"
    : syncError ? `Sync error: ${syncError}`
    : syncing ? "Syncing..."
    : "Supabase connected";

  return (
    <div style={{ marginTop: 16, padding: "14px 16px", background: t.bgSubtle, border: `1px solid ${t.border}`, borderRadius: 10, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: t.text }}>{statusText}</div>
        {lastSynced && !syncError && (
          <div style={{ fontSize: 10, color: t.textDim, marginTop: 2 }}>Last synced: {lastSynced.toLocaleTimeString()}</div>
        )}
        {!isConfigured && (
          <div style={{ fontSize: 10, color: t.textDim, marginTop: 2 }}>Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file</div>
        )}
      </div>
    </div>
  );
}