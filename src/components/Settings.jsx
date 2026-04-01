import { useState, useEffect } from "react";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { CURRENCIES, DEFAULT_SETTINGS } from "../hooks/useSettings";
import RiskRulesPanel from "./RiskRulesPanel";
import AlertsPanel from "./AlertsPanel";
import { ThemePicker } from "./ThemeSwitcher";
import { formatCurrency, formatPct } from "../utils/formatters";

// ── Progress bar ──────────────────────────────────────────────────
function ProgressBar({ value, color }) {
  return (
    <div style={{ height: 4, background: "var(--bg-subtle)", borderRadius: 2, overflow: "hidden" }}>
      <div style={{
        height: "100%",
        width: `${Math.max(0, Math.min(value, 100))}%`,
        background: color,
        borderRadius: 2,
        transition: "width 0.5s ease",
      }} />
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────
function SectionHead({ label }) {
  return (
    <div style={{
      fontSize: "var(--fs-2xs)",
      color: "var(--text-dim)",
      textTransform: "uppercase",
      letterSpacing: "0.14em",
      fontWeight: 600,
      marginBottom: 16,
    }}>
      {label}
    </div>
  );
}

// ── Main Settings ─────────────────────────────────────────────────
export default function Settings({
  settings, onUpdate, onReset, currencyMeta, stats, theme,
  alertsHook, riskStatus, onResetOnboarding, currentTheme, onSetTheme, authHook,
}) {
  const { isMobile } = useBreakpoint();
  const [draft, setDraft] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  useEffect(() => { setDraft({ ...settings }); }, [settings]);

  const sym          = CURRENCIES.find(c => c.code === draft.currency)?.symbol ?? "$";
  const capital      = parseFloat(draft.capitalInitial) || 0;
  const targetProfit = capital * ((parseFloat(draft.targetProfitPct) || 0) / 100);
  const maxDrawdown  = capital * ((parseFloat(draft.maxDrawdownPct)  || 0) / 100);
  const profitPct    = targetProfit > 0 ? ((stats.totalPnl ?? 0) / targetProfit) * 100 : 0;
  const ddPct        = maxDrawdown  > 0 ? (Math.abs(Math.min(stats.worstTrade ?? 0, 0)) / maxDrawdown) * 100 : 0;
  const ddColor      = ddPct >= 80 ? "var(--danger)" : ddPct >= 50 ? "var(--warning)" : "var(--success)";

  function set(key, val) { setDraft(p => ({ ...p, [key]: val })); }

  function handleSave() {
    onUpdate({
      capitalInitial:       parseFloat(draft.capitalInitial)     || DEFAULT_SETTINGS.capitalInitial,
      currency:             draft.currency,
      targetProfitPct:      parseFloat(draft.targetProfitPct)    || DEFAULT_SETTINGS.targetProfitPct,
      maxDrawdownPct:       parseFloat(draft.maxDrawdownPct)     || DEFAULT_SETTINGS.maxDrawdownPct,
      targetTradesPerMonth: parseInt(draft.targetTradesPerMonth) || DEFAULT_SETTINGS.targetTradesPerMonth,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    if (!window.confirm("Reset semua settings ke default?")) return;
    setDraft({ ...DEFAULT_SETTINGS });
    onReset();
  }

  function NumInput({ k, min = 0, max, step = 1, prefix, suffix }) {
    return (
      <div style={{ position: "relative" }}>
        {prefix && (
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)", fontSize: "var(--fs-sm)", pointerEvents: "none", zIndex: 1 }}>
            {prefix}
          </span>
        )}
        <input
          type="number"
          min={min} max={max} step={step}
          value={draft[k]}
          onChange={e => set(k, e.target.value)}
          style={{ paddingLeft: prefix ? 28 : undefined, paddingRight: suffix ? 28 : undefined }}
        />
        {suffix && (
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)", fontSize: "var(--fs-sm)", pointerEvents: "none" }}>
            {suffix}
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Konfigurasi akun dan target trading</p>
      </div>

      {/* User Account */}
      {authHook?.user && (
        <div className="stat-card">
          <SectionHead label="Akun"/>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {/* Avatar */}
              <div style={{
                width: 44, height: 44, borderRadius: "var(--r-lg)",
                background: "var(--accent-dim)",
                border: "1px solid var(--accent)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-disp)", fontSize: 20, color: "var(--accent)",
                flexShrink: 0,
              }}>
                {(authHook.profile?.username ?? "T")[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-base)", fontWeight: 600, color: "var(--text)" }}>
                  {authHook.profile?.username ?? "Trader"}
                </div>
                <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
                  {authHook.profile?.email}
                </div>
                <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 2 }}>
                  ID: {authHook.profile?.id?.slice(0, 8)}…
                </div>
              </div>
            </div>
            <button
              className="btn-danger"
              onClick={() => { if (window.confirm("Sign out?")) authHook.signOut(); }}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>

        {/* Account */}
        <div className="stat-card">
          <SectionHead label="Akun"/>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label>Starting Capital</label>
              <NumInput k="capitalInitial" min={0} step={100} prefix={sym}/>
            </div>
            <div>
              <label>Mata Uang</label>
              <select value={draft.currency} onChange={e => set("currency", e.target.value)}>
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.symbol} — {c.name} ({c.code})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Targets */}
        <div className="stat-card">
          <SectionHead label="Target & Limit"/>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label>Target Profit (%)</label>
              <NumInput k="targetProfitPct" min={1} max={1000} suffix="%"/>
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--accent)", marginTop: 4 }}>
                = {formatCurrency(targetProfit, false, sym)} target
              </div>
            </div>
            <div>
              <label>Max Drawdown (%)</label>
              <NumInput k="maxDrawdownPct" min={1} max={100} suffix="%"/>
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--danger)", marginTop: 4 }}>
                = {formatCurrency(maxDrawdown, false, sym)} max loss
              </div>
            </div>
            <div>
              <label>Target Trades / Bulan</label>
              <NumInput k="targetTradesPerMonth" min={1} max={500}/>
            </div>
          </div>
        </div>

        {/* Live Progress */}
        <div className="stat-card" style={{ gridColumn: isMobile ? "auto" : "span 2" }}>
          <SectionHead label="Progress vs Target (Live)"/>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 20 }}>

            {/* Profit */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>Profit Target</span>
                <span style={{ fontSize: "var(--fs-sm)", fontFamily: "var(--font-mono)", color: (stats.totalPnl ?? 0) >= 0 ? "var(--success)" : "var(--danger)" }}>
                  {formatCurrency(stats.totalPnl ?? 0, false, currencyMeta?.symbol ?? sym)} / {formatCurrency(targetProfit, false, sym)}
                </span>
              </div>
              <ProgressBar value={profitPct} color={profitPct >= 100 ? "var(--success)" : "var(--accent)"}/>
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 4 }}>
                {profitPct >= 100 ? "🎯 Target tercapai!" : `${Math.max(0, profitPct).toFixed(1)}% tercapai`}
              </div>
            </div>

            {/* Drawdown */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>Drawdown Safety</span>
                <span style={{ fontSize: "var(--fs-sm)", fontFamily: "var(--font-mono)", color: ddColor }}>{ddPct.toFixed(1)}% terpakai</span>
              </div>
              <ProgressBar value={ddPct} color={ddColor}/>
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 4 }}>
                Limit: {formatCurrency(maxDrawdown, false, sym)}
              </div>
            </div>

            {/* Equity stats */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>Return on Capital</span>
                <span style={{ fontSize: "var(--fs-sm)", fontFamily: "var(--font-mono)", color: (stats.totalPnl ?? 0) >= 0 ? "var(--success)" : "var(--danger)" }}>
                  {capital > 0 ? formatPct(((stats.totalPnl ?? 0) / capital) * 100) : "N/A"}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                {[
                  { label: "Equity",   val: formatCurrency(capital + (stats.totalPnl ?? 0), true, currencyMeta?.symbol ?? sym) },
                  { label: "Win Rate", val: `${(stats.winRate ?? 0).toFixed(1)}%`, color: (stats.winRate ?? 0) >= 50 ? "var(--success)" : "var(--warning)" },
                ].map(s => (
                  <div key={s.label} style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", borderRadius: "var(--r-md)", padding: "8px 10px" }}>
                    <div style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)", marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: "var(--fs-base)", fontFamily: "var(--font-mono)", color: s.color || "var(--text)" }}>{s.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Theme picker */}
      {onSetTheme && (
        <div className="stat-card">
          <SectionHead label="Tema"/>
          <ThemePicker currentTheme={currentTheme} onSetTheme={onSetTheme} theme={theme}/>
        </div>
      )}

      {/* Alerts */}
      {alertsHook && (
        <div className="stat-card">
          <SectionHead label="Alerts & Reminders"/>
          <AlertsPanel alertsHook={alertsHook} theme={theme}/>
        </div>
      )}

      {/* Supabase status slot */}
      <div id="supabase-status-slot"/>

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-danger" onClick={handleReset}>↺ Reset Default</button>
          {onResetOnboarding && (
            <button className="btn-ghost" onClick={onResetOnboarding}>🎓 Onboarding</button>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {saved && <span style={{ fontSize: "var(--fs-sm)", color: "var(--accent)" }}>✓ Tersimpan!</span>}
          <button className="btn-primary" onClick={handleSave}>Simpan Settings</button>
        </div>
      </div>
    </div>
  );
}

// ── Supabase Status ───────────────────────────────────────────────
export function SupabaseStatus({ isConfigured, syncing, syncError, lastSynced }) {
  const dotColor   = !isConfigured ? "var(--text-dim)" : syncError ? "var(--danger)" : "var(--success)";
  const statusText = !isConfigured
    ? "Supabase not configured"
    : syncError
    ? `Sync error: ${syncError}`
    : syncing
    ? "Syncing..."
    : "Supabase connected";

  return (
    <div style={{
      marginTop: 12,
      padding: "12px 16px",
      background: "var(--bg-subtle)",
      border: "1px solid var(--border)",
      borderRadius: "var(--r-lg)",
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, flexShrink: 0 }}/>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--text)" }}>{statusText}</div>
        {lastSynced && !syncError && (
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 2 }}>
            Last synced: {lastSynced.toLocaleTimeString()}
          </div>
        )}
        {!isConfigured && (
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 2 }}>
            Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file
          </div>
        )}
      </div>
    </div>
  );
}