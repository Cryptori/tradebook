import { useMemo, useState } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";

// ── Math ──────────────────────────────────────────────────────────
function pearson(x, y) {
  const n = Math.min(x.length, y.length);
  if (n < 3) return null;
  const mx = x.reduce((s,v) => s+v, 0) / n;
  const my = y.reduce((s,v) => s+v, 0) / n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i]-mx, dy = y[i]-my;
    num += dx*dy; dx2 += dx*dx; dy2 += dy*dy;
  }
  const den = Math.sqrt(dx2*dy2);
  return den === 0 ? 0 : num/den;
}

function corrColor(val) {
  if (val === null) return "var(--bg-subtle)";
  if (val >= 0.7)  return "rgba(0,200,150,0.80)";
  if (val >= 0.4)  return "rgba(16,185,129,0.55)";
  if (val >= 0.1)  return "rgba(245,158,11,0.35)";
  if (val >= -0.1) return "rgba(100,116,139,0.25)";
  if (val >= -0.4) return "rgba(245,158,11,0.35)";
  if (val >= -0.7) return "rgba(239,68,68,0.55)";
  return "rgba(239,68,68,0.80)";
}

function corrLabel(val) {
  if (val === null)  return "—";
  if (val >= 0.7)   return "Sangat Positif";
  if (val >= 0.4)   return "Positif";
  if (val >= 0.1)   return "Lemah Positif";
  if (val >= -0.1)  return "Tidak Ada";
  if (val >= -0.4)  return "Lemah Negatif";
  if (val >= -0.7)  return "Negatif";
  return "Sangat Negatif";
}

// ── Data hook ─────────────────────────────────────────────────────
function useCorrelationData(trades) {
  return useMemo(() => {
    if (!trades || trades.length < 5) return null;
    const byDate = {};
    trades.forEach(tr => {
      if (!tr.date || !tr.pair) return;
      if (!byDate[tr.date]) byDate[tr.date] = {};
      if (!byDate[tr.date][tr.pair]) byDate[tr.date][tr.pair] = { pnl: 0, wins: 0, count: 0 };
      byDate[tr.date][tr.pair].pnl   += tr.pnl || 0;
      byDate[tr.date][tr.pair].count += 1;
      if ((tr.pnl ?? 0) >= 0) byDate[tr.date][tr.pair].wins++;
    });

    const pairs = [...new Set(trades.map(t => t.pair).filter(Boolean))].sort();
    if (pairs.length < 2) return null;
    const dates = Object.keys(byDate).sort();

    const series = {};
    pairs.forEach(p => {
      series[p] = {
        pnl:    dates.map(d => byDate[d]?.[p]?.pnl ?? 0),
        wr:     dates.map(d => byDate[d]?.[p] ? (byDate[d][p].wins / byDate[d][p].count) * 100 : 0),
        active: dates.map(d => byDate[d]?.[p] ? 1 : 0),
      };
    });

    const pnlM = {}, wrM = {}, combos = [];
    pairs.forEach(a => {
      pnlM[a] = {}; wrM[a] = {};
      pairs.forEach(b => {
        if (a === b) { pnlM[a][b] = 1; wrM[a][b] = 1; return; }
        const both = dates.filter((d, i) => series[a].active[i] && series[b].active[i]);
        if (both.length < 3) { pnlM[a][b] = null; wrM[a][b] = null; return; }
        const idx  = both.map(d => dates.indexOf(d));
        pnlM[a][b] = pearson(idx.map(i => series[a].pnl[i]), idx.map(i => series[b].pnl[i]));
        wrM[a][b]  = pearson(idx.map(i => series[a].wr[i]),  idx.map(i => series[b].wr[i]));
        if (a < b) combos.push({ pairA: a, pairB: b, pnlCorr: pnlM[a][b], wrCorr: wrM[a][b], sharedDays: both.length });
      });
    });

    const eligible = combos.filter(c => c.pnlCorr !== null && c.sharedDays >= 5);
    return {
      pairs, pnlM, wrM,
      bestCombos:  [...eligible].sort((a,b) => b.pnlCorr - a.pnlCorr).slice(0,5),
      hedgeCombos: [...eligible].filter(c => c.pnlCorr < 0).sort((a,b) => a.pnlCorr - b.pnlCorr).slice(0,5),
    };
  }, [trades]);
}

// ── Matrix ────────────────────────────────────────────────────────
function CorrelationMatrix({ pairs, matrix }) {
  const { isMobile } = useBreakpoint();
  const cell = isMobile ? 48 : 68;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "separate", borderSpacing: 3 }}>
        <thead>
          <tr>
            <th style={{ width: 66 }}/>
            {pairs.map(p => (
              <th key={p} style={{ width: cell, minWidth: cell, fontSize: "var(--fs-2xs)", color: "var(--text-dim)", fontWeight: 600, textAlign: "center", padding: "3px 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pairs.map(a => (
            <tr key={a}>
              <td style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)", padding: "2px 6px", whiteSpace: "nowrap", fontWeight: 600 }}>{a}</td>
              {pairs.map(b => {
                const val  = matrix[a]?.[b] ?? null;
                const diag = a === b;
                return (
                  <td key={b}
                    title={val !== null ? `${a} × ${b}: ${val.toFixed(2)} (${corrLabel(val)})` : `${a} × ${b}: Data tidak cukup`}
                    style={{
                      width: cell, height: cell,
                      background: diag ? "var(--accent-dim)" : corrColor(val),
                      border: diag ? "1px solid var(--accent)" : "none",
                      borderRadius: "var(--r-sm)", textAlign: "center",
                      verticalAlign: "middle", cursor: "default",
                      transition: "transform 0.1s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.06)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                    <div style={{ fontSize: isMobile ? 9 : "var(--fs-xs)", color: "#fff", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                      {diag ? "—" : val !== null ? val.toFixed(2) : "·"}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Combo card ────────────────────────────────────────────────────
function ComboCard({ combo, type }) {
  const color = type === "best" ? "var(--success)" : "var(--danger)";
  const bg    = type === "best" ? "var(--success-dim)" : "var(--danger-dim)";
  const icon  = type === "best" ? "🤝" : "⚡";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: bg, border: `1px solid ${color}`, borderRadius: "var(--r-md)" }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color, fontFamily: "var(--font-mono)" }}>
          {combo.pairA} × {combo.pairB}
        </div>
        <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 2 }}>
          {combo.sharedDays} hari bersama · {corrLabel(combo.pnlCorr)}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-xl)", color, fontWeight: 700 }}>
          {combo.pnlCorr?.toFixed(2)}
        </div>
        <div style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)" }}>P&L corr</div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function CorrelationAnalysis({ trades, currencyMeta, theme }) {
  const { isMobile } = useBreakpoint();
  const [metric, setMetric] = useState("pnl");
  const data = useCorrelationData(trades);

  if (!data) return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 20 }}>Correlation Analysis</h1>
      <div className="stat-card">
        <div className="empty-state">
          <div className="empty-icon">🔗</div>
          <div className="empty-title">Data tidak cukup</div>
          <div className="empty-desc">Butuh minimal 2 pair dengan 5+ hari trading bersama untuk analisis korelasi</div>
        </div>
      </div>
    </div>
  );

  const matrix = metric === "pnl" ? data.pnlM : data.wrM;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Correlation Analysis</h1>
          <p className="page-subtitle">{data.pairs.length} pairs · {trades?.length} trades</p>
        </div>
        <div style={{ display: "flex", gap: 2, background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 2 }}>
          {[{ v: "pnl", l: "P&L" }, { v: "winRate", l: "Win Rate" }].map(m => (
            <button key={m.v} onClick={() => setMetric(m.v)} style={{
              padding: "5px 12px", borderRadius: "var(--r-sm)", border: "none", cursor: "pointer",
              fontSize: "var(--fs-xs)",
              background: metric === m.v ? "var(--accent)"      : "transparent",
              color:      metric === m.v ? "var(--text-inverse)" : "var(--text-dim)",
              fontWeight: metric === m.v ? 600 : 400,
            }}>{m.l}</button>
          ))}
        </div>
      </div>

      {/* Matrix */}
      <div className="stat-card">
        <div className="section-label" style={{ marginBottom: 12 }}>
          Correlation Matrix — {metric === "pnl" ? "P&L" : "Win Rate"}
        </div>
        <CorrelationMatrix pairs={data.pairs} matrix={matrix}/>
        {/* Legend */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 12 }}>
          <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>Legenda:</span>
          {[
            { label: "> 0.7",  color: "rgba(0,200,150,0.8)" },
            { label: "0.4–0.7",color: "rgba(16,185,129,0.55)" },
            { label: "0–0.4",  color: "rgba(245,158,11,0.35)" },
            { label: "-0.7–0", color: "rgba(239,68,68,0.55)" },
            { label: "< -0.7", color: "rgba(239,68,68,0.8)" },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }}/>
              <span style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)" }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Best & Hedge */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
        <div className="stat-card">
          <div className="section-label" style={{ marginBottom: 10, color: "var(--success)" }}>🤝 Best Combinations</div>
          <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginBottom: 10, lineHeight: 1.6 }}>
            Pair yang cenderung profit/loss bersamaan — trading keduanya bisa amplify hasil.
          </p>
          {data.bestCombos.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {data.bestCombos.map(c => <ComboCard key={`${c.pairA}-${c.pairB}`} combo={c} type="best"/>)}
            </div>
          ) : (
            <div style={{ color: "var(--text-dim)", fontSize: "var(--fs-sm)", textAlign: "center", padding: "16px 0" }}>Data belum cukup</div>
          )}
        </div>
        <div className="stat-card">
          <div className="section-label" style={{ marginBottom: 10, color: "var(--danger)" }}>⚡ Hedge Opportunities</div>
          <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginBottom: 10, lineHeight: 1.6 }}>
            Pair yang bergerak berlawanan — bisa digunakan untuk hedge atau diversifikasi risiko.
          </p>
          {data.hedgeCombos.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {data.hedgeCombos.map(c => <ComboCard key={`${c.pairA}-${c.pairB}`} combo={c} type="hedge"/>)}
            </div>
          ) : (
            <div style={{ color: "var(--text-dim)", fontSize: "var(--fs-sm)", textAlign: "center", padding: "16px 0" }}>Tidak ada korelasi negatif signifikan</div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div style={{ background: "var(--success-dim)", border: "1px solid var(--success)", borderRadius: "var(--r-lg)", padding: "14px 16px" }}>
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--success)", fontWeight: 500, marginBottom: 8 }}>💡 Cara Membaca</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {[
            "+1.0 → kedua pair profit/loss bersamaan (highly correlated)",
            "-1.0 → satu profit sementara yang lain loss (inversely correlated) — potensi hedge",
            "≈0.0 → tidak ada hubungan signifikan antar pair",
            "Diagonal selalu 1.0 karena pair dibandingkan dengan dirinya sendiri",
          ].map((tip, i) => (
            <div key={i} style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", display: "flex", gap: 8 }}>
              <span style={{ color: "var(--accent)", flexShrink: 0 }}>→</span>{tip}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}