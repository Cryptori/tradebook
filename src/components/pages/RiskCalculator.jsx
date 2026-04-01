import { useState, useMemo } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";

const MARKET_CONFIG = {
  "Forex":        { pipSize: 0.0001, pipValuePerLot: 10,  unit: "pip",   decimals: 5 },
  "Forex JPY":    { pipSize: 0.01,   pipValuePerLot: 6.5, unit: "pip",   decimals: 3 },
  "Gold (XAU)":   { pipSize: 0.1,    pipValuePerLot: 10,  unit: "pip",   decimals: 2 },
  "Oil (WTI)":    { pipSize: 0.01,   pipValuePerLot: 10,  unit: "pip",   decimals: 2 },
  "Crypto":       { pipSize: 1,      pipValuePerLot: 1,   unit: "point", decimals: 2 },
  "Saham IDX":    { pipSize: 1,      pipValuePerLot: 1,   unit: "point", decimals: 0 },
  "Saham Global": { pipSize: 0.01,   pipValuePerLot: 1,   unit: "point", decimals: 2 },
};
const MARKETS = Object.keys(MARKET_CONFIG);

function getConfig(market, pair) {
  const isJPY = (pair || "").toUpperCase().includes("JPY");
  return MARKET_CONFIG[isJPY ? "Forex JPY" : (MARKET_CONFIG[market] ? market : "Forex")];
}
function loadPresets() { try { return JSON.parse(localStorage.getItem("tb_risk_presets") || "[]"); } catch { return []; } }
function savePresets(p) { try { localStorage.setItem("tb_risk_presets", JSON.stringify(p)); } catch {} }

// ── UI helpers ────────────────────────────────────────────────────
function NumInput({ label, value, onChange, prefix, suffix }) {
  return (
    <div>
      <label>{label}</label>
      <div style={{ display: "flex", alignItems: "center", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
        {prefix && <span style={{ padding: "0 10px", color: "var(--text-dim)", fontSize: "var(--fs-sm)", borderRight: "1px solid var(--border)", background: "var(--bg-subtle)", whiteSpace: "nowrap" }}>{prefix}</span>}
        <input type="number" step="any" value={value} onChange={e => onChange(e.target.value)}
          style={{ flex: 1, background: "transparent", border: "none", color: "var(--text)", padding: "8px 10px", fontFamily: "var(--font-mono)", fontSize: "var(--fs-base)", outline: "none" }}/>
        {suffix && <span style={{ padding: "0 10px", color: "var(--text-dim)", fontSize: "var(--fs-sm)", borderLeft: "1px solid var(--border)", background: "var(--bg-subtle)" }}>{suffix}</span>}
      </div>
    </div>
  );
}

function ResultBox({ label, value, color, sub }) {
  return (
    <div style={{ background: color ? `${color}10` : "var(--bg-subtle)", border: `1px solid ${color ? `${color}30` : "var(--border)"}`, borderRadius: "var(--r-lg)", padding: "12px 14px", textAlign: "center" }}>
      <div className="kpi-label">{label}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-2xl)", color: color || "var(--text)", fontWeight: 700, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ── RR Visualizer ─────────────────────────────────────────────────
function RRVisualizer({ entry, sl, tp, side }) {
  const e = parseFloat(entry), s = parseFloat(sl), p = parseFloat(tp);
  if (!e || !s || !p) return null;
  const risk   = Math.abs(e - s);
  const reward = Math.abs(p - e);
  const rr     = risk > 0 ? (reward / risk).toFixed(2) : 0;
  const total  = risk + reward || 1;
  const slW    = (risk / total) * 100;
  const isBuy  = side === "BUY";

  return (
    <div>
      <div style={{ display: "flex", height: 26, borderRadius: "var(--r-md)", overflow: "hidden" }}>
        {isBuy ? (
          <>
            <div style={{ width: `${slW}%`, background: "rgba(239,68,68,0.6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--fs-2xs)", color: "#fff" }}>SL</div>
            <div style={{ width: 2, background: "rgba(255,255,255,0.4)" }}/>
            <div style={{ flex: 1, background: "rgba(0,200,150,0.6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--fs-2xs)", color: "#fff" }}>TP · R:R {rr}</div>
          </>
        ) : (
          <>
            <div style={{ flex: 1, background: "rgba(0,200,150,0.6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--fs-2xs)", color: "#fff" }}>TP · R:R {rr}</div>
            <div style={{ width: 2, background: "rgba(255,255,255,0.4)" }}/>
            <div style={{ width: `${slW}%`, background: "rgba(239,68,68,0.6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--fs-2xs)", color: "#fff" }}>SL</div>
          </>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: "var(--fs-xs)" }}>
        <span style={{ color: "var(--danger)" }}>Risk: {risk.toFixed(5)}</span>
        <span style={{ color: "var(--success)" }}>Reward: {reward.toFixed(5)}</span>
        <span style={{ color: parseFloat(rr) >= 1.5 ? "var(--success)" : "var(--warning)" }}>R:R {rr}</span>
      </div>
    </div>
  );
}

// ── Main RiskCalculator ───────────────────────────────────────────
export default function RiskCalculator({ settings, currencyMeta, theme }) {
  const sym = currencyMeta?.symbol ?? "$";
  const { isMobile } = useBreakpoint();

  const [activeTab,   setActiveTab]   = useState("lot");
  const [market,      setMarket]      = useState("Forex");
  const [pair,        setPair]        = useState("EUR/USD");
  const [side,        setSide]        = useState("BUY");
  const [capital,     setCapital]     = useState(settings?.capitalInitial ?? 10000);
  const [riskPct,     setRiskPct]     = useState(1);
  const [entry,       setEntry]       = useState("");
  const [sl,          setSl]          = useState("");
  const [tp,          setTp]          = useState("");
  const [beLot,       setBeLot]       = useState(0.1);
  const [beTp1,       setBeTp1]       = useState("");
  const [bePct1,      setBePct1]      = useState(50);
  const [presets,     setPresets]     = useState(loadPresets);
  const [presetName,  setPresetName]  = useState("");
  const [multiPairs,  setMultiPairs]  = useState([
    { id: 1, pair: "EUR/USD", market: "Forex",     entry: "", sl: "", riskPct: 1 },
    { id: 2, pair: "XAU/USD", market: "Gold (XAU)", entry: "", sl: "", riskPct: 1 },
  ]);

  const cfg        = useMemo(() => getConfig(market, pair), [market, pair]);
  const riskAmount = parseFloat(capital) * (parseFloat(riskPct) / 100);

  const calcLot = useMemo(() => {
    const e = parseFloat(entry), s = parseFloat(sl);
    if (!e || !s || !riskAmount) return null;
    const slDist  = Math.abs(e - s);
    const pipDist = slDist / cfg.pipSize;
    const lot     = riskAmount / (pipDist * cfg.pipValuePerLot);
    return {
      lotSize:  Math.max(0.01, lot).toFixed(2),
      pipDist:  pipDist.toFixed(1),
      pipValue: (lot * cfg.pipValuePerLot).toFixed(2),
      riskAmt:  riskAmount.toFixed(2),
    };
  }, [entry, sl, riskAmount, cfg]);

  const calcRR = useMemo(() => {
    const e = parseFloat(entry), s = parseFloat(sl), p = parseFloat(tp);
    if (!e || !s || !p) return null;
    const risk = Math.abs(e - s), reward = Math.abs(p - e);
    return risk > 0 ? (reward / risk).toFixed(2) : null;
  }, [entry, sl, tp]);

  const calcBE = useMemo(() => {
    const e = parseFloat(entry), s = parseFloat(sl), t1 = parseFloat(beTp1);
    const lot = parseFloat(beLot), pct = parseFloat(bePct1) / 100;
    if (!e || !s || !t1 || !lot) return null;
    const profitAtTp1 = Math.abs(t1 - e) / cfg.pipSize * cfg.pipValuePerLot * lot * pct;
    const remainLot   = lot * (1 - pct);
    const slLoss      = Math.abs(e - s) / cfg.pipSize * cfg.pipValuePerLot * remainLot;
    return { profitAtTp1: profitAtTp1.toFixed(2), slLoss: slLoss.toFixed(2), net: (profitAtTp1 - slLoss).toFixed(2), remainLot: remainLot.toFixed(2) };
  }, [entry, sl, beTp1, beLot, bePct1, cfg]);

  const multiResults = useMemo(() => multiPairs.map(p => {
    const cfg2 = getConfig(p.market, p.pair);
    const e = parseFloat(p.entry), s = parseFloat(p.sl);
    const ra = parseFloat(capital) * (parseFloat(p.riskPct) / 100);
    if (!e || !s || !ra) return { ...p, lotSize: null, riskAmt: ra.toFixed(2) };
    const lot = ra / ((Math.abs(e - s) / cfg2.pipSize) * cfg2.pipValuePerLot);
    return { ...p, lotSize: Math.max(0.01, lot).toFixed(2), riskAmt: ra.toFixed(2) };
  }), [multiPairs, capital]);

  function savePreset() {
    if (!presetName.trim()) return;
    const p = { id: Date.now().toString(), name: presetName, pair, market, riskPct, entry, sl, tp };
    const u = [...presets, p]; setPresets(u); savePresets(u); setPresetName("");
  }
  function loadPreset(p) { setPair(p.pair); setMarket(p.market); setRiskPct(p.riskPct); setEntry(p.entry); setSl(p.sl); setTp(p.tp); }
  function deletePreset(id) { const u = presets.filter(p => p.id !== id); setPresets(u); savePresets(u); }

  function updateMulti(idx, key, val) { setMultiPairs(p => p.map((x, i) => i === idx ? { ...x, [key]: val } : x)); }

  const TABS = [{ id: "lot", l: "📐 Lot Size" }, { id: "multi", l: "📊 Multi-Pair" }, { id: "be", l: "⚖️ Breakeven" }];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 className="page-title">Risk Calculator</h1>
        <p className="page-subtitle">Position sizing, pip value, breakeven & multi-pair</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 2, width: "fit-content" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: "6px 14px", borderRadius: "var(--r-sm)", border: "none", cursor: "pointer",
            fontSize: "var(--fs-sm)",
            background: activeTab === t.id ? "var(--accent)"      : "transparent",
            color:      activeTab === t.id ? "var(--text-inverse)" : "var(--text-dim)",
            fontWeight: activeTab === t.id ? 600 : 400,
          }}>{t.l}</button>
        ))}
      </div>

      {/* ── Lot Size ─────────────────────────────────────────────── */}
      {activeTab === "lot" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
          {/* Inputs */}
          <div className="stat-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="section-label">Account</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <NumInput label={`Modal (${sym})`} value={capital}  onChange={setCapital} prefix={sym}/>
              <NumInput label="Risk (%)"          value={riskPct}  onChange={setRiskPct} suffix="%"/>
            </div>
            <div className="section-label">Setup</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label>Market</label>
                <select value={market} onChange={e => setMarket(e.target.value)}>
                  {MARKETS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label>Pair</label>
                <input value={pair} onChange={e => setPair(e.target.value.toUpperCase())} style={{ fontFamily: "var(--font-mono)" }}/>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["BUY","SELL"].map(s => {
                const active = side === s;
                const color  = s === "BUY" ? "var(--success)" : "var(--warning)";
                return (
                  <button key={s} onClick={() => setSide(s)} style={{
                    flex: 1, padding: "7px 0", borderRadius: "var(--r-md)", cursor: "pointer",
                    border: `1px solid ${active ? color : "var(--border)"}`,
                    background: active ? (s === "BUY" ? "var(--success-dim)" : "var(--warning-dim)") : "transparent",
                    color: active ? color : "var(--text-dim)",
                    fontSize: "var(--fs-sm)", fontWeight: 700,
                  }}>{s}</button>
                );
              })}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <NumInput label="Entry"       value={entry} onChange={setEntry}/>
              <NumInput label="Stop Loss"   value={sl}    onChange={setSl}/>
              <NumInput label="Take Profit" value={tp}    onChange={setTp}/>
            </div>
            {entry && sl && tp && <RRVisualizer entry={entry} sl={sl} tp={tp} side={side}/>}
            <div style={{ padding: "8px 12px", background: "var(--danger-dim)", border: "1px solid var(--danger)", borderRadius: "var(--r-md)", fontSize: "var(--fs-sm)", color: "var(--danger)", display: "flex", justifyContent: "space-between" }}>
              <span>Risk Amount:</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{sym}{riskAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Results */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {calcLot ? (
              <>
                <div className="section-label">Hasil Kalkulasi</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <ResultBox label="Lot Size"    value={calcLot.lotSize} color="var(--success)" sub="Ukuran posisi optimal"/>
                  <ResultBox label="Risk Amount" value={`${sym}${calcLot.riskAmt}`} color="var(--danger)" sub={`${riskPct}% dari modal`}/>
                  <ResultBox label="SL Distance" value={`${calcLot.pipDist} ${cfg.unit}s`} color="var(--warning)"/>
                  <ResultBox label="Pip Value"   value={`${sym}${calcLot.pipValue}`} color="var(--accent2)" sub="Per pip/point"/>
                  {calcRR && <ResultBox label="R:R Ratio" value={`${calcRR}R`} color={parseFloat(calcRR) >= 1.5 ? "var(--success)" : "var(--warning)"}/>}
                </div>

                {/* Lot size table */}
                <div className="stat-card">
                  <div className="section-label" style={{ marginBottom: 10 }}>Pip Value per Lot Size</div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="text-right">Lot</th>
                        <th className="text-right">Pip Value</th>
                        <th className="text-right">Risk @ SL</th>
                        <th className="text-right">Profit @ TP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[0.01, 0.05, 0.1, 0.25, 0.5, 1.0].map(lot => {
                        const pv      = (lot * cfg.pipValuePerLot).toFixed(2);
                        const slDist  = calcLot ? parseFloat(calcLot.pipDist) : 0;
                        const risk    = (slDist * lot * cfg.pipValuePerLot).toFixed(2);
                        const tpDist  = entry && tp ? Math.abs(parseFloat(tp) - parseFloat(entry)) / cfg.pipSize : 0;
                        const profit  = (tpDist * lot * cfg.pipValuePerLot).toFixed(2);
                        const isOpt   = Math.abs(parseFloat(calcLot.lotSize) - lot) < 0.04;
                        return (
                          <tr key={lot} style={{ background: isOpt ? "var(--success-dim)" : "transparent" }}>
                            <td className="text-right mono" style={{ color: isOpt ? "var(--success)" : "var(--text)", fontWeight: isOpt ? 700 : 400 }}>{lot.toFixed(2)}{isOpt ? " ✓" : ""}</td>
                            <td className="text-right mono" style={{ color: "var(--text-muted)" }}>{sym}{pv}</td>
                            <td className="text-right mono" style={{ color: "var(--danger)" }}>{sym}{risk}</td>
                            <td className="text-right mono" style={{ color: "var(--success)" }}>{sym}{profit}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-dim)", fontSize: "var(--fs-sm)" }}>
                Isi Entry dan Stop Loss untuk mulai kalkulasi
              </div>
            )}

            {/* Presets */}
            <div className="stat-card">
              <div className="section-label" style={{ marginBottom: 10 }}>💾 Preset</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <input value={presetName} onChange={e => setPresetName(e.target.value)}
                  placeholder="Nama preset..." style={{ flex: 1, height: 30, fontSize: "var(--fs-xs)" }}/>
                <button onClick={savePreset} className="btn-primary" style={{ height: 30, fontSize: "var(--fs-xs)", padding: "0 12px" }}>Simpan</button>
              </div>
              {presets.map(p => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", background: "var(--bg-subtle)", borderRadius: "var(--r-sm)", marginBottom: 4 }}>
                  <span style={{ flex: 1, fontSize: "var(--fs-xs)", color: "var(--text)" }}>{p.name} — {p.pair}</span>
                  <button onClick={() => loadPreset(p)} className="btn-ghost" style={{ height: 24, fontSize: "var(--fs-2xs)", padding: "0 8px" }}>Load</button>
                  <button onClick={() => deletePreset(p.id)} className="btn-icon" style={{ width: 22, height: 22, color: "var(--danger)" }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Multi-Pair ────────────────────────────────────────────── */}
      {activeTab === "multi" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ maxWidth: 200 }}>
            <NumInput label={`Modal (${sym})`} value={capital} onChange={setCapital} prefix={sym}/>
          </div>
          {multiPairs.map((mp, idx) => {
            const res = multiResults[idx];
            return (
              <div key={mp.id} className="stat-card">
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "110px 120px 90px 90px 80px 1fr 28px", gap: 8, alignItems: "end" }}>
                  <div><label>Pair</label><input value={mp.pair} onChange={e => updateMulti(idx,"pair",e.target.value.toUpperCase())} style={{ fontFamily: "var(--font-mono)" }}/></div>
                  <div><label>Market</label><select value={mp.market} onChange={e => updateMulti(idx,"market",e.target.value)}>{MARKETS.map(m => <option key={m}>{m}</option>)}</select></div>
                  <div><label>Entry</label><input type="number" step="any" value={mp.entry} onChange={e => updateMulti(idx,"entry",e.target.value)} style={{ fontFamily: "var(--font-mono)" }}/></div>
                  <div><label>Stop Loss</label><input type="number" step="any" value={mp.sl} onChange={e => updateMulti(idx,"sl",e.target.value)} style={{ fontFamily: "var(--font-mono)" }}/></div>
                  <div><label>Risk %</label><input type="number" step="0.1" value={mp.riskPct} onChange={e => updateMulti(idx,"riskPct",e.target.value)}/></div>
                  <div style={{ display: "flex", alignItems: "flex-end" }}>
                    {res.lotSize ? (
                      <div style={{ flex: 1, background: "var(--success-dim)", border: "1px solid var(--success)", borderRadius: "var(--r-md)", padding: "7px 10px", textAlign: "center" }}>
                        <div className="kpi-label">LOT SIZE</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-xl)", color: "var(--success)", fontWeight: 700 }}>{res.lotSize}</div>
                        <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>{sym}{res.riskAmt} risk</div>
                      </div>
                    ) : (
                      <div style={{ flex: 1, textAlign: "center", color: "var(--text-dim)", fontSize: "var(--fs-xs)" }}>Isi entry & SL</div>
                    )}
                  </div>
                  <button onClick={() => setMultiPairs(p => p.filter((_,i) => i !== idx))} className="btn-icon" style={{ color: "var(--danger)", marginBottom: 1 }}>✕</button>
                </div>
              </div>
            );
          })}
          <button onClick={() => setMultiPairs(p => [...p, { id: Date.now(), pair: "", market: "Forex", entry: "", sl: "", riskPct: 1 }])}
            className="btn-ghost" style={{ fontSize: "var(--fs-sm)" }}>+ Tambah Pair</button>
          {multiResults.some(r => r.lotSize) && (
            <div style={{ padding: "10px 14px", background: "var(--danger-dim)", border: "1px solid var(--danger)", borderRadius: "var(--r-md)", fontSize: "var(--fs-sm)", display: "flex", gap: 8 }}>
              <span style={{ color: "var(--danger)", fontWeight: 500 }}>Total Risk:</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--danger)" }}>
                {sym}{multiResults.reduce((s, r) => s + parseFloat(r.riskAmt || 0), 0).toFixed(2)}
              </span>
              <span style={{ color: "var(--text-dim)" }}>
                ({(multiResults.reduce((s, r) => s + parseFloat(r.riskAmt || 0), 0) / parseFloat(capital) * 100).toFixed(1)}% dari modal)
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Breakeven ─────────────────────────────────────────────── */}
      {activeTab === "be" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
          <div className="stat-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="section-label">Trade Setup</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <NumInput label="Entry"     value={entry}  onChange={setEntry}/>
              <NumInput label="Stop Loss" value={sl}     onChange={setSl}/>
              <NumInput label="Lot Size"  value={beLot}  onChange={setBeLot}/>
            </div>
            <div className="section-label">Partial Close di TP1</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <NumInput label="TP1 Price"      value={beTp1}  onChange={setBeTp1}/>
              <NumInput label="Close % di TP1" value={bePct1} onChange={setBePct1} suffix="%"/>
            </div>
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-dim)", lineHeight: 1.7, padding: "10px 12px", background: "var(--bg-subtle)", borderRadius: "var(--r-md)" }}>
              💡 Hitung apakah profit dari partial close di TP1 bisa menutupi potensi loss jika sisa posisi kena SL.
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {calcBE ? (
              <>
                <div className="section-label">Hasil</div>
                <ResultBox label="Profit di TP1"    value={`+${sym}${calcBE.profitAtTp1}`} color="var(--success)" sub={`${bePct1}% lot ditutup`}/>
                <ResultBox label="Potential Loss SL" value={`-${sym}${calcBE.slLoss}`} color="var(--danger)" sub={`${calcBE.remainLot} lot sisa`}/>
                <ResultBox
                  label="Net jika SL kena"
                  value={`${parseFloat(calcBE.net) >= 0 ? "+" : ""}${sym}${calcBE.net}`}
                  color={parseFloat(calcBE.net) >= 0 ? "var(--success)" : "var(--danger)"}
                  sub={parseFloat(calcBE.net) >= 0 ? "✅ Breakeven atau profit!" : "❌ Masih rugi jika SL kena"}
                />
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-dim)", fontSize: "var(--fs-sm)" }}>
                Isi semua field untuk kalkulasi breakeven
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}