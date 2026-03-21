import { useState, useMemo, useCallback } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";

const MARKET_CONFIG = {
  "Forex":        { pipSize: 0.0001, pipValuePerLot: 10,   unit: "pip",   decimals: 5 },
  "Forex JPY":    { pipSize: 0.01,   pipValuePerLot: 6.5,  unit: "pip",   decimals: 3 },
  "Gold (XAU)":   { pipSize: 0.1,    pipValuePerLot: 10,   unit: "pip",   decimals: 2 },
  "Oil (WTI)":    { pipSize: 0.01,   pipValuePerLot: 10,   unit: "pip",   decimals: 2 },
  "Crypto":       { pipSize: 1,      pipValuePerLot: 1,    unit: "point", decimals: 2 },
  "Saham IDX":    { pipSize: 1,      pipValuePerLot: 1,    unit: "point", decimals: 0 },
  "Saham Global": { pipSize: 0.01,   pipValuePerLot: 1,    unit: "point", decimals: 2 },
};

const MARKETS = Object.keys(MARKET_CONFIG);
const STORAGE_KEY = "tb_risk_presets";

function loadPresets() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; } }
function savePresets(p) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {} }

function getConfig(market, pair) {
  const isJPY = (pair || "").toUpperCase().includes("JPY");
  const key   = isJPY ? "Forex JPY" : (MARKET_CONFIG[market] ? market : "Forex");
  return MARKET_CONFIG[key];
}

// ── Number input ──────────────────────────────────────────────────
function Num({ label, value, onChange, prefix, suffix, theme: t }) {
  return (
    <div>
      <label style={{ color: t.textDim }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: 8, overflow: "hidden" }}>
        {prefix && <span style={{ padding: "0 10px", color: t.textDim, fontSize: 12, borderRight: `1px solid ${t.border}`, background: t.bgSubtle }}>{prefix}</span>}
        <input type="number" step="any" value={value} onChange={e => onChange(e.target.value)}
          style={{ flex: 1, background: "transparent", border: "none", color: t.text, padding: "9px 12px", fontFamily: "DM Mono, monospace", fontSize: 13, outline: "none" }} />
        {suffix && <span style={{ padding: "0 10px", color: t.textDim, fontSize: 12, borderLeft: `1px solid ${t.border}`, background: t.bgSubtle }}>{suffix}</span>}
      </div>
    </div>
  );
}

// ── Result box ────────────────────────────────────────────────────
function ResultBox({ label, value, color, sub, theme: t }) {
  return (
    <div style={{ background: color ? `${color}10` : t.bgSubtle, border: `1px solid ${color ? color + "30" : t.borderSubtle}`, borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
      <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "DM Mono, monospace", fontSize: 20, color: color || t.text, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: t.textDim, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ── Section label ─────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "20px 0 12px" }}>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, var(--border))" }} />
      <span style={{ fontSize: 9, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 600 }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(270deg, transparent, var(--border))" }} />
    </div>
  );
}

// ── RR Visualizer ─────────────────────────────────────────────────
function RRVisualizer({ entry, sl, tp, side, theme: t }) {
  const e = parseFloat(entry), s = parseFloat(sl), p = parseFloat(tp);
  if (!e || !s || !p) return null;
  const risk    = Math.abs(e - s);
  const reward  = Math.abs(p - e);
  const rr      = risk > 0 ? (reward / risk).toFixed(2) : 0;
  const isBuy   = side === "BUY";
  const slPips  = risk;
  const tpPips  = reward;
  const total   = slPips + tpPips || 1;
  const slW     = (slPips / total) * 100;
  const tpW     = (tpPips / total) * 100;

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, height: 28, borderRadius: 8, overflow: "hidden" }}>
        {isBuy ? (
          <>
            <div style={{ width: `${slW}%`, height: "100%", background: "#ef444480", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff" }}>SL {slPips.toFixed(4)}</div>
            <div style={{ width: 2, background: "#fff", height: "100%", opacity: 0.5 }} />
            <div style={{ flex: 1, height: "100%", background: "#00c89680", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff" }}>TP {tpPips.toFixed(4)} · R:R {rr}</div>
          </>
        ) : (
          <>
            <div style={{ flex: 1, height: "100%", background: "#00c89680", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff" }}>TP {tpPips.toFixed(4)} · R:R {rr}</div>
            <div style={{ width: 2, background: "#fff", height: "100%", opacity: 0.5 }} />
            <div style={{ width: `${slW}%`, height: "100%", background: "#ef444480", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff" }}>SL {slPips.toFixed(4)}</div>
          </>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10 }}>
        <span style={{ color: "#ef4444" }}>Risk: {slPips.toFixed(5)}</span>
        <span style={{ color: "#00c896" }}>Reward: {tpPips.toFixed(5)}</span>
        <span style={{ color: parseFloat(rr) >= 1.5 ? "#00c896" : "#f59e0b" }}>R:R {rr}</span>
      </div>
    </div>
  );
}

// ── Main calculator ───────────────────────────────────────────────
export default function RiskCalculator({ settings, currencyMeta, theme }) {
  const t    = theme;
  const sym  = currencyMeta?.symbol ?? "$";
  const { isMobile } = useBreakpoint();

  // State
  const [activeTab, setActiveTab] = useState("lot");
  const [market,    setMarket]    = useState("Forex");
  const [pair,      setPair]      = useState("EUR/USD");
  const [side,      setSide]      = useState("BUY");
  const [capital,   setCapital]   = useState(settings?.capitalInitial ?? 10000);
  const [riskPct,   setRiskPct]   = useState(1);
  const [entry,     setEntry]     = useState("");
  const [sl,        setSl]        = useState("");
  const [tp,        setTp]        = useState("");
  const [lotSize,   setLotSize]   = useState(0.1);
  const [presets,   setPresets]   = useState(loadPresets);
  const [presetName, setPresetName] = useState("");

  // Multi-pair
  const [multiPairs, setMultiPairs] = useState([
    { id: 1, pair: "EUR/USD", market: "Forex", entry: "", sl: "", riskPct: 1 },
    { id: 2, pair: "XAU/USD", market: "Gold (XAU)", entry: "", sl: "", riskPct: 1 },
  ]);

  // ── Calculations ──────────────────────────────────────────────
  const cfg = useMemo(() => getConfig(market, pair), [market, pair]);
  const riskAmount = parseFloat(capital) * (parseFloat(riskPct) / 100);

  // Lot size calculator
  const calcLot = useMemo(() => {
    const e = parseFloat(entry), s = parseFloat(sl);
    if (!e || !s || !riskAmount) return null;
    const slDistance = Math.abs(e - s);
    const pipDist    = slDistance / cfg.pipSize;
    const lotSize    = riskAmount / (pipDist * cfg.pipValuePerLot);
    const pipValue   = lotSize * cfg.pipValuePerLot;

    return {
      lotSize:  Math.max(0.01, lotSize).toFixed(2),
      pipDist:  pipDist.toFixed(1),
      pipValue: pipValue.toFixed(2),
      riskAmt:  riskAmount.toFixed(2),
    };
  }, [entry, sl, riskAmount, cfg]);

  // RR from TP
  const calcRR = useMemo(() => {
    const e = parseFloat(entry), s = parseFloat(sl), p = parseFloat(tp);
    if (!e || !s || !p) return null;
    const risk   = Math.abs(e - s);
    const reward = Math.abs(p - e);
    return risk > 0 ? (reward / risk).toFixed(2) : null;
  }, [entry, sl, tp]);

  // Break-even (after partial close)
  const [be_lot,  setBeLot]  = useState(0.1);
  const [be_tp1,  setBeTp1]  = useState("");
  const [be_pct1, setBePct1] = useState(50);
  const calcBreakeven = useMemo(() => {
    const e = parseFloat(entry), s = parseFloat(sl), t1 = parseFloat(be_tp1);
    const lot = parseFloat(be_lot), pct = parseFloat(be_pct1) / 100;
    if (!e || !s || !t1 || !lot) return null;
    const profitAtTp1 = Math.abs(t1 - e) / cfg.pipSize * cfg.pipValuePerLot * lot * pct;
    const remainLot   = lot * (1 - pct);
    const slLoss      = Math.abs(e - s) / cfg.pipSize * cfg.pipValuePerLot * remainLot;
    const netAtBE     = profitAtTp1 - slLoss;
    return { profitAtTp1: profitAtTp1.toFixed(2), slLoss: slLoss.toFixed(2), net: netAtBE.toFixed(2), remainLot: remainLot.toFixed(2) };
  }, [entry, sl, be_tp1, be_lot, be_pct1, cfg]);

  // Multi-pair calc
  const multiResults = useMemo(() => {
    return multiPairs.map(p => {
      const cfg2 = getConfig(p.market, p.pair);
      const e = parseFloat(p.entry), s = parseFloat(p.sl);
      const ra = parseFloat(capital) * (parseFloat(p.riskPct) / 100);
      if (!e || !s || !ra) return { ...p, lotSize: null, riskAmt: ra };
      const slDist  = Math.abs(e - s);
      const pipDist = slDist / cfg2.pipSize;
      const lot     = ra / (pipDist * cfg2.pipValuePerLot);
      return { ...p, lotSize: Math.max(0.01, lot).toFixed(2), riskAmt: ra.toFixed(2) };
    });
  }, [multiPairs, capital]);

  // Presets
  function savePreset() {
    if (!presetName.trim()) return;
    const preset = { id: Date.now().toString(), name: presetName, pair, market, riskPct, entry, sl, tp };
    const updated = [...presets, preset];
    setPresets(updated);
    savePresets(updated);
    setPresetName("");
  }
  function loadPreset(p) { setPair(p.pair); setMarket(p.market); setRiskPct(p.riskPct); setEntry(p.entry); setSl(p.sl); setTp(p.tp); }
  function deletePreset(id) { const u = presets.filter(p => p.id !== id); setPresets(u); savePresets(u); }

  const TABS = [
    { id: "lot",    label: "📐 Lot Size" },
    { id: "multi",  label: "📊 Multi-Pair" },
    { id: "be",     label: "⚖️ Breakeven" },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 3, color: t.text, lineHeight: 1 }}>RISK CALCULATOR</div>
        <div style={{ fontSize: 11, color: t.textDim, marginTop: 4 }}>Position sizing, pip value, breakeven & multi-pair</div>
      </div>

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 4, background: t.bgSubtle, border: `1px solid ${t.border}`, borderRadius: 10, padding: 3, marginBottom: 20, width: "fit-content" }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ padding: "6px 16px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 11, background: activeTab === tab.id ? t.accent : "transparent", color: activeTab === tab.id ? "#090e1a" : t.textDim, fontWeight: activeTab === tab.id ? 600 : 400, transition: "all 0.15s" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Lot Size Calculator ──────────────────────────────────── */}
      {activeTab === "lot" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>
          {/* Inputs */}
          <div className="stat-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SectionLabel>Account</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Num label={`Modal (${sym})`} value={capital}  onChange={setCapital}  prefix={sym} theme={t} />
              <Num label="Risk (%)"          value={riskPct}  onChange={setRiskPct}  suffix="%" theme={t} />
            </div>

            <SectionLabel>Setup</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ color: t.textDim }}>Market</label>
                <select value={market} onChange={e => setMarket(e.target.value)}
                  style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8 }}>
                  {MARKETS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: t.textDim }}>Pair</label>
                <input value={pair} onChange={e => setPair(e.target.value.toUpperCase())}
                  style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, fontFamily: "DM Mono, monospace" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["BUY", "SELL"].map(s => (
                <button key={s} onClick={() => setSide(s)}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1px solid ${side === s ? (s === "BUY" ? "#00c896" : "#f59e0b") : t.border}`, background: side === s ? (s === "BUY" ? "rgba(0,200,150,0.1)" : "rgba(245,158,11,0.1)") : "transparent", color: side === s ? (s === "BUY" ? "#00c896" : "#f59e0b") : t.textDim, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  {s}
                </button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <Num label="Entry"       value={entry} onChange={setEntry} theme={t} />
              <Num label="Stop Loss"   value={sl}    onChange={setSl}    theme={t} />
              <Num label="Take Profit" value={tp}    onChange={setTp}    theme={t} />
            </div>

            {/* RR Visualizer */}
            {entry && sl && tp && <RRVisualizer entry={entry} sl={sl} tp={tp} side={side} theme={t} />}

            {/* Risk amount indicator */}
            <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: 8, fontSize: 12, color: "#ef4444", display: "flex", justifyContent: "space-between" }}>
              <span>Risk Amount:</span>
              <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 600 }}>{sym}{riskAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Results */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {calcLot ? (
              <>
                <SectionLabel>Hasil Kalkulasi</SectionLabel>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <ResultBox label="Lot Size"    value={calcLot.lotSize} color="#00c896" sub="Ukuran posisi optimal" theme={t} />
                  <ResultBox label="Risk Amount" value={`${sym}${calcLot.riskAmt}`} color="#ef4444" sub={`${riskPct}% dari modal`} theme={t} />
                  <ResultBox label="SL Distance" value={`${calcLot.pipDist} ${cfg.unit}s`} color="#f59e0b" theme={t} />
                  <ResultBox label="Pip Value"   value={`${sym}${calcLot.pipValue}`} color="#0ea5e9" sub="Per pip/point" theme={t} />
                  {calcRR && <ResultBox label="R:R Ratio" value={calcRR + "R"} color={parseFloat(calcRR) >= 1.5 ? "#00c896" : "#f59e0b"} theme={t} />}
                </div>

                {/* Lot size comparison table */}
                <div className="stat-card">
                  <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>Pip Value per Lot Size</div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr>
                        {["Lot", "Pip Value", "Risk @ SL", "Profit @ TP"].map(h => (
                          <th key={h} style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.08em", padding: "6px 8px", textAlign: "right", borderBottom: `1px solid ${t.border}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[0.01, 0.05, 0.1, 0.25, 0.5, 1.0].map(lot => {
                        const pv      = (lot * cfg.pipValuePerLot).toFixed(2);
                        const slDist  = entry && sl ? parseFloat(calcLot.pipDist) : 0;
                        const risk    = (slDist * lot * cfg.pipValuePerLot).toFixed(2);
                        const tpDist  = entry && tp ? Math.abs(parseFloat(tp) - parseFloat(entry)) / cfg.pipSize : 0;
                        const profit  = (tpDist * lot * cfg.pipValuePerLot).toFixed(2);
                        const isOpt   = Math.abs(parseFloat(calcLot.lotSize) - lot) < 0.04;
                        return (
                          <tr key={lot} style={{ background: isOpt ? "rgba(0,200,150,0.06)" : "transparent" }}>
                            <td style={{ padding: "7px 8px", textAlign: "right", color: isOpt ? "#00c896" : t.text, fontFamily: "DM Mono, monospace", fontWeight: isOpt ? 700 : 400 }}>{lot.toFixed(2)}{isOpt ? " ✓" : ""}</td>
                            <td style={{ padding: "7px 8px", textAlign: "right", color: t.textMuted, fontFamily: "DM Mono, monospace" }}>{sym}{pv}</td>
                            <td style={{ padding: "7px 8px", textAlign: "right", color: "#ef4444", fontFamily: "DM Mono, monospace" }}>{sym}{risk}</td>
                            <td style={{ padding: "7px 8px", textAlign: "right", color: "#00c896", fontFamily: "DM Mono, monospace" }}>{sym}{profit}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "48px 24px", color: t.textDim, fontSize: 13 }}>
                Isi Entry dan Stop Loss untuk mulai kalkulasi
              </div>
            )}

            {/* Presets */}
            <div className="stat-card">
              <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>💾 Simpan Preset</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <input value={presetName} onChange={e => setPresetName(e.target.value)} placeholder="Nama preset..."
                  style={{ flex: 1, background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 7, padding: "6px 10px", fontSize: 11 }} />
                <button onClick={savePreset} className="btn-primary" style={{ fontSize: 11, padding: "6px 12px" }}>Simpan</button>
              </div>
              {presets.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {presets.map(p => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: t.bgSubtle, borderRadius: 7 }}>
                      <span style={{ flex: 1, fontSize: 11, color: t.text }}>{p.name} — {p.pair}</span>
                      <button onClick={() => loadPreset(p)} className="btn-ghost" style={{ fontSize: 10, padding: "3px 8px" }}>Load</button>
                      <button onClick={() => deletePreset(p.id)} style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 12 }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Multi-Pair Calculator ────────────────────────────────── */}
      {activeTab === "multi" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <Num label={`Modal (${sym})`} value={capital} onChange={setCapital} prefix={sym} theme={t} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {multiPairs.map((mp, idx) => {
              const res = multiResults[idx];
              return (
                <div key={mp.id} className="stat-card">
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "120px 120px 100px 100px 100px 1fr", gap: 10, alignItems: "end" }}>
                    <div>
                      <label style={{ color: t.textDim }}>Pair</label>
                      <input value={mp.pair} onChange={e => setMultiPairs(prev => prev.map((p, i) => i === idx ? { ...p, pair: e.target.value.toUpperCase() } : p))}
                        style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, fontFamily: "DM Mono, monospace" }} />
                    </div>
                    <div>
                      <label style={{ color: t.textDim }}>Market</label>
                      <select value={mp.market} onChange={e => setMultiPairs(prev => prev.map((p, i) => i === idx ? { ...p, market: e.target.value } : p))}
                        style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8 }}>
                        {MARKETS.map(m => <option key={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ color: t.textDim }}>Entry</label>
                      <input type="number" step="any" value={mp.entry} onChange={e => setMultiPairs(prev => prev.map((p, i) => i === idx ? { ...p, entry: e.target.value } : p))}
                        style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, fontFamily: "DM Mono, monospace" }} />
                    </div>
                    <div>
                      <label style={{ color: t.textDim }}>Stop Loss</label>
                      <input type="number" step="any" value={mp.sl} onChange={e => setMultiPairs(prev => prev.map((p, i) => i === idx ? { ...p, sl: e.target.value } : p))}
                        style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, fontFamily: "DM Mono, monospace" }} />
                    </div>
                    <div>
                      <label style={{ color: t.textDim }}>Risk %</label>
                      <input type="number" step="0.1" value={mp.riskPct} onChange={e => setMultiPairs(prev => prev.map((p, i) => i === idx ? { ...p, riskPct: e.target.value } : p))}
                        style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8 }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                      {res.lotSize ? (
                        <div style={{ flex: 1, background: "rgba(0,200,150,0.08)", border: "1px solid rgba(0,200,150,0.2)", borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
                          <div style={{ fontSize: 9, color: t.textDim }}>LOT SIZE</div>
                          <div style={{ fontFamily: "DM Mono, monospace", fontSize: 18, color: "#00c896", fontWeight: 700 }}>{res.lotSize}</div>
                          <div style={{ fontSize: 10, color: t.textDim }}>{sym}{res.riskAmt} risk</div>
                        </div>
                      ) : (
                        <div style={{ flex: 1, textAlign: "center", color: t.textDim, fontSize: 12, padding: "8px 0" }}>Isi entry & SL</div>
                      )}
                      <button onClick={() => setMultiPairs(prev => prev.filter((_, i) => i !== idx))}
                        style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 16 }}>✕</button>
                    </div>
                  </div>
                </div>
              );
            })}
            <button onClick={() => setMultiPairs(prev => [...prev, { id: Date.now(), pair: "", market: "Forex", entry: "", sl: "", riskPct: 1 }])}
              className="btn-ghost" style={{ fontSize: 12 }}>+ Tambah Pair</button>
          </div>
          {multiResults.some(r => r.lotSize) && (
            <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, fontSize: 12 }}>
              <span style={{ color: "#ef4444", fontWeight: 500 }}>Total Risk: </span>
              <span style={{ fontFamily: "DM Mono, monospace", color: "#ef4444" }}>
                {sym}{multiResults.reduce((s, r) => s + parseFloat(r.riskAmt || 0), 0).toFixed(2)}
              </span>
              <span style={{ color: t.textDim, marginLeft: 8 }}>
                ({(multiResults.reduce((s, r) => s + parseFloat(r.riskAmt || 0), 0) / parseFloat(capital) * 100).toFixed(1)}% dari modal)
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Breakeven Calculator ─────────────────────────────────── */}
      {activeTab === "be" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>
          <div className="stat-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SectionLabel>Trade Setup</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Num label="Entry"     value={entry}  onChange={setEntry}  theme={t} />
              <Num label="Stop Loss" value={sl}     onChange={setSl}     theme={t} />
              <Num label="Lot Size"  value={be_lot} onChange={setBeLot}  theme={t} />
            </div>
            <SectionLabel>Partial Close di TP1</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Num label="TP1 Price"       value={be_tp1}  onChange={setBeTp1}  theme={t} />
              <Num label="Close % di TP1"  value={be_pct1} onChange={setBePct1} suffix="%" theme={t} />
            </div>
            <div style={{ fontSize: 12, color: t.textDim, lineHeight: 1.7, padding: "10px 14px", background: t.bgSubtle, borderRadius: 8 }}>
              💡 Hitung apakah profit dari partial close di TP1 bisa menutupi potensi loss di SL jika sisa posisi kena SL.
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {calcBreakeven ? (
              <>
                <SectionLabel>Hasil</SectionLabel>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                  <ResultBox label="Profit di TP1"    value={`+${sym}${calcBreakeven.profitAtTp1}`} color="#00c896" sub={`${be_pct1}% lot ditutup`} theme={t} />
                  <ResultBox label="Potential Loss SL" value={`-${sym}${calcBreakeven.slLoss}`} color="#ef4444" sub={`${calcBreakeven.remainLot} lot sisa`} theme={t} />
                  <ResultBox
                    label="Net jika SL kena"
                    value={`${parseFloat(calcBreakeven.net) >= 0 ? "+" : ""}${sym}${calcBreakeven.net}`}
                    color={parseFloat(calcBreakeven.net) >= 0 ? "#00c896" : "#ef4444"}
                    sub={parseFloat(calcBreakeven.net) >= 0 ? "✅ Breakeven atau profit!" : "❌ Masih rugi jika SL kena"}
                    theme={t}
                  />
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "48px 24px", color: t.textDim, fontSize: 13 }}>
                Isi semua field untuk kalkulasi breakeven
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}