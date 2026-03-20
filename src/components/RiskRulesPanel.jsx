// ── Risk Rules Panel — embedded in Settings ───────────────────────
export default function RiskRulesPanel({ form, setField, riskStatus, theme: t }) {
  const sym = "$";

  function RuleInput({ id, label, placeholder, hint, icon }) {
    return (
      <div style={{ background: t.bgSubtle, border: `1px solid ${t.border}`, borderRadius: 10, padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span style={{ fontSize: 12, color: t.text, fontWeight: 500 }}>{label}</span>
        </div>
        <input type="number" step="any" value={form[id] ?? ""} onChange={e => setField(id, e.target.value)}
          placeholder={placeholder}
          style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 7, width: "100%", padding: "8px 10px", fontFamily: "DM Mono, monospace", fontSize: 13 }} />
        {hint && <div style={{ fontSize: 10, color: t.textDim, marginTop: 4 }}>{hint}</div>}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 9, color: t.accent, textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 600 }}>Risk Management Rules</div>

      {/* Rule inputs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <RuleInput id="riskDailyLoss"   label="Daily Loss Limit ($)"    icon="🛑" placeholder="e.g. 100"  hint="Stop trading kalau rugi lebih dari ini hari ini" />
        <RuleInput id="riskDailyProfit" label="Daily Profit Target ($)"  icon="🎯" placeholder="e.g. 200"  hint="Stop trading kalau profit sudah cukup" />
        <RuleInput id="riskMaxTrades"   label="Max Trades / Hari"        icon="📊" placeholder="e.g. 5"    hint="Maksimal berapa kali trade dalam sehari" />
        <RuleInput id="riskMaxConsLoss" label="Max Consecutive Loss"     icon="⛔" placeholder="e.g. 3"    hint="Stop kalau kalah berturut-turut sebanyak ini" />
        <RuleInput id="riskWeeklyLoss"  label="Weekly Loss Limit ($)"    icon="📅" placeholder="e.g. 300"  hint="Batas total rugi dalam satu minggu" />
      </div>

      {/* Lock mode toggles */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { id: "riskLockMode",     label: "Lock Mode",           desc: "Block log trade baru kalau loss/count limit sudah kena" },
          { id: "riskLockOnProfit", label: "Lock on Profit Hit",  desc: "Block log trade kalau daily profit target sudah tercapai" },
        ].map(toggle => (
          <div key={toggle.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: t.bgSubtle, border: `1px solid ${form[toggle.id] ? "rgba(0,200,150,0.2)" : t.border}`, borderRadius: 10, padding: "12px 16px" }}>
            <div>
              <div style={{ fontSize: 12, color: t.text, fontWeight: 500 }}>{toggle.label}</div>
              <div style={{ fontSize: 11, color: t.textDim, marginTop: 2 }}>{toggle.desc}</div>
            </div>
            <button onClick={() => setField(toggle.id, !form[toggle.id])}
              style={{ width: 40, height: 22, borderRadius: 11, background: form[toggle.id] ? "#00c896" : t.bgCard, border: `1px solid ${form[toggle.id] ? "#00c896" : t.border}`, cursor: "pointer", position: "relative", transition: "all 0.2s", flexShrink: 0 }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: form[toggle.id] ? 20 : 2, transition: "left 0.2s" }} />
            </button>
          </div>
        ))}
      </div>

      {/* Live status */}
      {riskStatus?.rules?.length > 0 && (
        <div style={{ background: t.bgSubtle, border: `1px solid ${t.border}`, borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>Status Hari Ini</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {riskStatus.rules.map(rule => {
              const color = rule.hit ? "#ef4444" : rule.warn ? "#f59e0b" : "#00c896";
              return (
                <div key={rule.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: t.textMuted }}>{rule.label}</span>
                    <span style={{ fontSize: 11, color, fontFamily: "DM Mono, monospace" }}>
                      {rule.hit ? "🚫 LIMIT" : rule.warn ? "⚠️ " + rule.pct.toFixed(0) + "%" : "✅ " + rule.pct.toFixed(0) + "%"}
                    </span>
                  </div>
                  <div style={{ height: 4, background: t.bgCard, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, rule.pct)}%`, background: color, borderRadius: 2, transition: "width 0.5s" }} />
                  </div>
                  <div style={{ fontSize: 10, color: t.textDim, marginTop: 2 }}>{rule.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}