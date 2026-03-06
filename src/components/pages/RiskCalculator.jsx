import { useState, useMemo, useEffect } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { MARKETS } from "../../constants";
import { formatCurrency } from "../../utils/formatters";

const MARKET_CONFIG = {
  "Forex":        { pipSize: 0.0001, pipValuePerLot: 10,  unit: "pip",   decimals: 5 },
  "Forex JPY":    { pipSize: 0.01,   pipValuePerLot: 6.5, unit: "pip",   decimals: 3 },
  "Crypto":       { pipSize: 1,      pipValuePerLot: 1,   unit: "point", decimals: 2 },
  "Saham IDX":    { pipSize: 1,      pipValuePerLot: 1,   unit: "point", decimals: 0 },
  "Saham Global": { pipSize: 0.01,   pipValuePerLot: 1,   unit: "point", decimals: 2 },
  "Gold (XAU)":   { pipSize: 0.1,    pipValuePerLot: 10,  unit: "pip",   decimals: 2 },
  "Oil (WTI)":    { pipSize: 0.01,   pipValuePerLot: 10,  unit: "pip",   decimals: 2 },
};

const CALC_MARKETS = [...MARKETS, "Gold (XAU)", "Oil (WTI)", "Forex JPY"];
const LOT_LEVELS   = [0.01, 0.05, 0.1, 0.5, 1.0];

function getConfig(market, pair) {
  const isJPY = pair?.toUpperCase().includes("JPY") || market === "Forex JPY";
  const key = isJPY ? "Forex JPY" : (MARKET_CONFIG[market] ? market : "Forex");
  return MARKET_CONFIG[key];
}

// ── Input field helper ────────────────────────────────────────────
function NumInput({ label, value, onChange, prefix, suffix, placeholder = "0", theme: t }) {
  return (
    <div>
      <label style={{ color: t.textDim }}>{label}</label>
      <div style={{ position: "relative" }}>
        {prefix && (
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: t.textDim, fontSize: 13, pointerEvents: "none", zIndex: 1 }}>
            {prefix}
          </span>
        )}
        <input
          type="number" step="any"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            background: t.bgInput, border: `1px solid ${t.border}`, color: t.text,
            borderRadius: 8, width: "100%",
            padding: prefix ? "9px 12px 9px 28px" : suffix ? "9px 36px 9px 12px" : "9px 12px",
            fontFamily: "DM Mono, monospace", fontSize: 13, outline: "none",
          }}
        />
        {suffix && (
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: t.textDim, fontSize: 13, pointerEvents: "none" }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export default function RiskCalculator({ settings, currencyMeta, theme }) {
  const t   = theme;
  const sym = currencyMeta?.symbol ?? "$";
  const { isMobile } = useBreakpoint();

  // Sync balance when settings change
  const [calc, setCalc] = useState({
    market:         "Forex",
    pair:           "",
    accountBalance: String(settings?.capitalInitial ?? 10000),
    riskPct:        "1",
    entry:          "",
    stopLoss:       "",
    side:           "BUY",
    customPipValue: "",
  });

  const set = (key, val) => setCalc(p => ({ ...p, [key]: val }));

  // Sync balance when account changes
  useEffect(() => {
    if (settings?.capitalInitial)
      setCalc(p => ({ ...p, accountBalance: String(settings.capitalInitial) }));
  }, [settings?.capitalInitial]);

  const result = useMemo(() => {
    const balance  = parseFloat(calc.accountBalance) || 0;
    const riskPct  = parseFloat(calc.riskPct)        || 0;
    const entry    = parseFloat(calc.entry)           || 0;
    const sl       = parseFloat(calc.stopLoss)        || 0;
    if (!balance || !riskPct || !entry || !sl) return null;

    const riskAmount = balance * (riskPct / 100);
    const slDistance = Math.abs(entry - sl);
    if (!slDistance) return null;

    const config         = getConfig(calc.market, calc.pair);
    const customPipVal   = parseFloat(calc.customPipValue) || 0;
    const pipValuePerLot = customPipVal || config.pipValuePerLot;
    const slPips         = slDistance / config.pipSize;
    const lotSize        = riskAmount / (slPips * pipValuePerLot);
    const dec            = config.decimals;

    return {
      riskAmount,
      slPips:  slPips.toFixed(1),
      unit:    config.unit,
      lotSize: lotSize.toFixed(2),
      minLot:  Math.max(0.01, Math.floor(lotSize * 100) / 100).toFixed(2),
      tp2:     (calc.side === "BUY" ? entry + slDistance * 2 : entry - slDistance * 2).toFixed(dec),
      tp3:     (calc.side === "BUY" ? entry + slDistance * 3 : entry - slDistance * 3).toFixed(dec),
    };
  }, [calc]);

  // Lot risk table — computed from current inputs
  const lotRisks = useMemo(() => {
    const entry  = parseFloat(calc.entry)    || 0;
    const sl     = parseFloat(calc.stopLoss) || 0;
    const bal    = parseFloat(calc.accountBalance) || 1;
    if (!entry || !sl) return [];
    const config         = getConfig(calc.market, calc.pair);
    const customPipVal   = parseFloat(calc.customPipValue) || 0;
    const pipValuePerLot = customPipVal || config.pipValuePerLot;
    const slPips         = Math.abs(entry - sl) / config.pipSize;
    return LOT_LEVELS.map(lot => {
      const risk       = lot * slPips * pipValuePerLot;
      const riskPctVal = ((risk / bal) * 100).toFixed(2);
      const color      = parseFloat(riskPctVal) > 2 ? "#ef4444" : parseFloat(riskPctVal) > 1 ? "#f59e0b" : "#00d4aa";
      return { lot, risk, riskPctVal, color };
    });
  }, [calc]);

  return (
    <div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2, color: t.text, marginBottom: 4 }}>RISK CALCULATOR</div>
      <div style={{ fontSize: 11, color: t.textDim, marginBottom: 24 }}>Hitung lot size berdasarkan % risk per trade</div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>

        {/* ── Input panel ── */}
        <div className="stat-card" style={{ background: `linear-gradient(135deg, ${t.bgCard}, ${t.bgCard2})`, borderColor: t.border }}>
          <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Parameter</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ color: t.textDim }}>Market</label>
              <select value={calc.market} onChange={e => set("market", e.target.value)}
                style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "9px 12px", fontFamily: "DM Mono, monospace", fontSize: 13, outline: "none" }}>
                {CALC_MARKETS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <NumInput label="Account Balance" value={calc.accountBalance} onChange={v => set("accountBalance", v)} prefix={sym} theme={t} />
            <NumInput label="Risk per Trade"  value={calc.riskPct}        onChange={v => set("riskPct", v)}        suffix="%" theme={t} />
            <div>
              <label style={{ color: t.textDim }}>Side</label>
              <div style={{ display: "flex", gap: 6 }}>
                {["BUY", "SELL"].map(s => (
                  <button key={s} onClick={() => set("side", s)}
                    style={{ flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer",
                      border: `1px solid ${calc.side === s ? (s === "BUY" ? "#00d4aa" : "#f59e0b") : t.border}`,
                      background: calc.side === s ? (s === "BUY" ? "rgba(0,212,170,0.1)" : "rgba(245,158,11,0.1)") : "transparent",
                      color: calc.side === s ? (s === "BUY" ? "#00d4aa" : "#f59e0b") : t.textMuted,
                      fontFamily: "DM Mono, monospace", fontSize: 13,
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <NumInput label="Entry Price" value={calc.entry}          onChange={v => set("entry", v)}          theme={t} />
            <NumInput label="Stop Loss"   value={calc.stopLoss}       onChange={v => set("stopLoss", v)}       theme={t} />
            <NumInput label="Pip Value per Lot (opsional)" value={calc.customPipValue}
              onChange={v => set("customPipValue", v)} placeholder="auto" theme={t} />
          </div>
        </div>

        {/* ── Result panel ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {result ? (
            <>
              <div style={{ background: "rgba(0,212,170,0.06)", border: "1px solid rgba(0,212,170,0.3)", borderRadius: 12, padding: 24, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#00d4aa", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Recommended Lot Size</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, color: "#00d4aa", lineHeight: 1 }}>{result.lotSize}</div>
                <div style={{ fontSize: 12, color: t.textDim, marginTop: 6 }}>Min lot: {result.minLot} lots</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr", gap: 10 }}>
                {[
                  { label: "Risk Amount",           value: formatCurrency(result.riskAmount, false, sym), color: "#ef4444" },
                  { label: `SL (${result.unit})`,   value: result.slPips,                                color: t.text    },
                  { label: "TP 1:2",                value: result.tp2,                                   color: "#00d4aa" },
                  { label: "TP 1:3",                value: result.tp3,                                   color: "#00d4aa" },
                ].map(s => (
                  <div key={s.label} style={{ background: t.bgSubtle, border: `1px solid ${t.border}`, borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: t.textDim, marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 14, color: s.color, fontWeight: 500 }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {lotRisks.length > 0 && (
                <div className="stat-card" style={{ background: `linear-gradient(135deg, ${t.bgCard}, ${t.bgCard2})`, borderColor: t.border }}>
                  <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Risk by Lot Size</div>
                  {lotRisks.map(({ lot, risk, riskPctVal, color }) => (
                    <div key={lot} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${t.borderSubtle}` }}>
                      <span style={{ fontSize: 12, color: t.textMuted }}>{lot} lot</span>
                      <span style={{ fontSize: 12, color }}>
                        {formatCurrency(risk, false, sym)} ({riskPctVal}%)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="stat-card" style={{ background: `linear-gradient(135deg, ${t.bgCard}, ${t.bgCard2})`, borderColor: t.border, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
              <div style={{ textAlign: "center", color: t.textDim }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🧮</div>
                <div style={{ fontSize: 13 }}>Isi Entry & Stop Loss</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>untuk lihat hasil kalkulasi</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}