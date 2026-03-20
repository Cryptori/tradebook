import { useMemo, useState } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { formatCurrency } from "../../utils/formatters";

// ── Math helpers ──────────────────────────────────────────────────
function pearsonCorrelation(x, y) {
  const n = Math.min(x.length, y.length);
  if (n < 3) return null;
  const meanX = x.reduce((s, v) => s + v, 0) / n;
  const meanY = y.reduce((s, v) => s + v, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX, dy = y[i] - meanY;
    num  += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

// ── Correlation color ─────────────────────────────────────────────
function corrColor(val, alpha = 0.8) {
  if (val === null) return "rgba(30,45,74,0.3)";
  if (val >= 0.7)  return `rgba(0,200,150,${alpha})`;
  if (val >= 0.4)  return `rgba(16,185,129,${alpha * 0.7})`;
  if (val >= 0.1)  return `rgba(245,158,11,${alpha * 0.4})`;
  if (val >= -0.1) return `rgba(100,116,139,${alpha * 0.3})`;
  if (val >= -0.4) return `rgba(245,158,11,${alpha * 0.4})`;
  if (val >= -0.7) return `rgba(239,68,68,${alpha * 0.6})`;
  return `rgba(239,68,68,${alpha})`;
}

function corrLabel(val) {
  if (val === null)  return "—";
  if (val >= 0.7)  return "Sangat Positif";
  if (val >= 0.4)  return "Positif";
  if (val >= 0.1)  return "Lemah Positif";
  if (val >= -0.1) return "Tidak Ada";
  if (val >= -0.4) return "Lemah Negatif";
  if (val >= -0.7) return "Negatif";
  return "Sangat Negatif";
}

// ── Compute all correlation data ──────────────────────────────────
function useCorrelationData(trades) {
  return useMemo(() => {
    if (!trades || trades.length < 5) return null;

    // Group by date
    const byDate = {};
    trades.forEach(tr => {
      if (!tr.date || !tr.pair) return;
      if (!byDate[tr.date]) byDate[tr.date] = {};
      if (!byDate[tr.date][tr.pair]) byDate[tr.date][tr.pair] = { pnl: 0, wins: 0, count: 0 };
      byDate[tr.date][tr.pair].pnl   += tr.pnl || 0;
      byDate[tr.date][tr.pair].count += 1;
      if (tr.pnl >= 0) byDate[tr.date][tr.pair].wins++;
    });

    const pairs = [...new Set(trades.map(t => t.pair).filter(Boolean))].sort();
    if (pairs.length < 2) return null;

    const dates = Object.keys(byDate).sort();

    // Build time series per pair
    const series = {};
    pairs.forEach(pair => {
      series[pair] = {
        pnl:     dates.map(d => byDate[d]?.[pair]?.pnl     ?? 0),
        winRate: dates.map(d => byDate[d]?.[pair] ? (byDate[d][pair].wins / byDate[d][pair].count) * 100 : 0),
        active:  dates.map(d => byDate[d]?.[pair] ? 1 : 0),
      };
    });

    // Build correlation matrices
    const pnlMatrix     = {};
    const winRateMatrix = {};
    const combinations  = [];

    pairs.forEach(pairA => {
      pnlMatrix[pairA]     = {};
      winRateMatrix[pairA] = {};
      pairs.forEach(pairB => {
        if (pairA === pairB) {
          pnlMatrix[pairA][pairB]     = 1;
          winRateMatrix[pairA][pairB] = 1;
          return;
        }
        // Only use dates where BOTH pairs traded
        const bothActive = dates.filter((d, i) => series[pairA].active[i] && series[pairB].active[i]);
        if (bothActive.length < 3) {
          pnlMatrix[pairA][pairB]     = null;
          winRateMatrix[pairA][pairB] = null;
          return;
        }
        const idxs = bothActive.map(d => dates.indexOf(d));
        const xPnl = idxs.map(i => series[pairA].pnl[i]);
        const yPnl = idxs.map(i => series[pairB].pnl[i]);
        const xWR  = idxs.map(i => series[pairA].winRate[i]);
        const yWR  = idxs.map(i => series[pairB].winRate[i]);

        const pnlCorr = pearsonCorrelation(xPnl, yPnl);
        const wrCorr  = pearsonCorrelation(xWR, yWR);

        pnlMatrix[pairA][pairB]     = pnlCorr;
        winRateMatrix[pairA][pairB] = wrCorr;

        if (pairA < pairB) {
          combinations.push({ pairA, pairB, pnlCorr, wrCorr, sharedDays: bothActive.length });
        }
      });
    });

    // Best combinations (highly positive)
    const bestCombos = combinations
      .filter(c => c.pnlCorr !== null && c.sharedDays >= 5)
      .sort((a, b) => b.pnlCorr - a.pnlCorr)
      .slice(0, 5);

    // Hedge opportunities (highly negative)
    const hedgeCombos = combinations
      .filter(c => c.pnlCorr !== null && c.sharedDays >= 5)
      .sort((a, b) => a.pnlCorr - b.pnlCorr)
      .slice(0, 5);

    return { pairs, pnlMatrix, winRateMatrix, combinations, bestCombos, hedgeCombos };
  }, [trades]);
}

// ── Correlation Matrix Grid ───────────────────────────────────────
function CorrelationMatrix({ pairs, matrix, metric, theme: t }) {
  const { isMobile } = useBreakpoint();
  const cellSize = isMobile ? 52 : 72;
  const fontSize = isMobile ? 10 : 12;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "separate", borderSpacing: 3 }}>
        <thead>
          <tr>
            <th style={{ width: 70, minWidth: 70 }} />
            {pairs.map(p => (
              <th key={p} style={{ width: cellSize, minWidth: cellSize, fontSize: 9, color: t.textDim, fontWeight: 600, textAlign: "center", padding: "4px 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {p.replace("/", "/")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pairs.map(pairA => (
            <tr key={pairA}>
              <td style={{ fontSize: 9, color: t.textDim, padding: "2px 6px", whiteSpace: "nowrap", fontWeight: 600 }}>{pairA}</td>
              {pairs.map(pairB => {
                const val = matrix[pairA]?.[pairB] ?? null;
                const isDiag = pairA === pairB;
                return (
                  <td key={pairB}
                    title={val !== null ? `${pairA} × ${pairB}: ${val.toFixed(2)} (${corrLabel(val)})` : `${pairA} × ${pairB}: Data tidak cukup`}
                    style={{
                      width: cellSize, height: cellSize,
                      background: isDiag ? "rgba(0,200,150,0.15)" : corrColor(val),
                      borderRadius: 6, textAlign: "center",
                      verticalAlign: "middle", cursor: "default",
                      border: isDiag ? "1px solid rgba(0,200,150,0.3)" : "none",
                      transition: "transform 0.1s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                    <div style={{ fontSize, color: "#fff", fontFamily: "DM Mono, monospace", fontWeight: 600 }}>
                      {isDiag ? "—" : val !== null ? val.toFixed(2) : "·"}
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

// ── Combo Card ────────────────────────────────────────────────────
function ComboCard({ combo, type, theme: t }) {
  const color = type === "best" ? "#00c896" : "#ef4444";
  const icon  = type === "best" ? "🤝" : "⚡";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: type === "best" ? "rgba(0,200,150,0.06)" : "rgba(239,68,68,0.06)", border: `1px solid ${type === "best" ? "rgba(0,200,150,0.2)" : "rgba(239,68,68,0.2)"}`, borderRadius: 10 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color, fontFamily: "DM Mono, monospace" }}>{combo.pairA} × {combo.pairB}</div>
        <div style={{ fontSize: 10, color: t.textDim, marginTop: 2 }}>{combo.sharedDays} hari bersama · {corrLabel(combo.pnlCorr)}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: "DM Mono, monospace", fontSize: 16, color, fontWeight: 700 }}>{combo.pnlCorr?.toFixed(2)}</div>
        <div style={{ fontSize: 9, color: t.textDim }}>P&L corr</div>
      </div>
    </div>
  );
}

// ── Legend ────────────────────────────────────────────────────────
function Legend({ theme: t }) {
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
      <span style={{ fontSize: 10, color: t.textDim }}>Legenda:</span>
      {[
        { label: "> 0.7 Sangat Positif", color: "rgba(0,200,150,0.8)" },
        { label: "0.4–0.7 Positif",      color: "rgba(16,185,129,0.56)" },
        { label: "0–0.4 Lemah",          color: "rgba(245,158,11,0.32)" },
        { label: "-0.4–0 Lemah Neg",     color: "rgba(245,158,11,0.32)" },
        { label: "< -0.7 Sangat Neg",    color: "rgba(239,68,68,0.8)" },
      ].map(l => (
        <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color }} />
          <span style={{ fontSize: 9, color: t.textDim }}>{l.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────
export default function CorrelationAnalysis({ trades, currencyMeta, theme }) {
  const t   = theme;
  const sym = currencyMeta?.symbol ?? "$";
  const { isMobile } = useBreakpoint();
  const [metric, setMetric] = useState("pnl"); // "pnl" | "winRate"

  const data = useCorrelationData(trades);

  if (!data) {
    return (
      <div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 3, color: t.text, marginBottom: 20 }}>CORRELATION ANALYSIS</div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 24px", textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, rgba(0,200,150,0.08), rgba(0,200,150,0.04))", border: "1px solid rgba(0,200,150,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, marginBottom: 20 }}>🔗</div>
          <div style={{ fontSize: 15, color: t.text, marginBottom: 8 }}>Data tidak cukup</div>
          <div style={{ fontSize: 12, color: t.textDim, maxWidth: 300, lineHeight: 1.8 }}>
            Butuh minimal 2 pair dengan 5+ hari trading bersama untuk analisis korelasi. Log lebih banyak trade dengan pair berbeda.
          </div>
        </div>
      </div>
    );
  }

  const matrix = metric === "pnl" ? data.pnlMatrix : data.winRateMatrix;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 3, color: t.text, lineHeight: 1 }}>CORRELATION ANALYSIS</div>
          <div style={{ fontSize: 11, color: t.textDim, marginTop: 4 }}>Hubungan antar pair berdasarkan {data.pairs.length} pair, {trades?.length} trade</div>
        </div>
        <div style={{ display: "flex", gap: 4, background: t.bgSubtle, border: `1px solid ${t.border}`, borderRadius: 8, padding: 3 }}>
          {[{ v: "pnl", l: "P&L Correlation" }, { v: "winRate", l: "Win Rate Correlation" }].map(m => (
            <button key={m.v} onClick={() => setMetric(m.v)}
              style={{ padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, background: metric === m.v ? t.accent : "transparent", color: metric === m.v ? "#090e1a" : t.textDim, fontWeight: metric === m.v ? 600 : 400 }}>
              {m.l}
            </button>
          ))}
        </div>
      </div>

      {/* Matrix */}
      <div className="stat-card">
        <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 14 }}>
          Correlation Matrix — {metric === "pnl" ? "P&L" : "Win Rate"}
        </div>
        <CorrelationMatrix pairs={data.pairs} matrix={matrix} metric={metric} theme={t} />
        <div style={{ marginTop: 14 }}>
          <Legend theme={t} />
        </div>
      </div>

      {/* Best & Hedge combos */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
        {/* Best combinations */}
        <div className="stat-card">
          <div style={{ fontSize: 9, color: "#00c896", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 14 }}>
            🤝 Best Pair Combinations
          </div>
          <div style={{ fontSize: 11, color: t.textDim, marginBottom: 12, lineHeight: 1.6 }}>
            Pair yang cenderung profit/loss bersamaan — trading keduanya bisa amplify hasil.
          </div>
          {data.bestCombos.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data.bestCombos.map(c => <ComboCard key={`${c.pairA}-${c.pairB}`} combo={c} type="best" theme={t} />)}
            </div>
          ) : (
            <div style={{ color: t.textDim, fontSize: 12, textAlign: "center", padding: "16px 0" }}>Data belum cukup</div>
          )}
        </div>

        {/* Hedge opportunities */}
        <div className="stat-card">
          <div style={{ fontSize: 9, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 14 }}>
            ⚡ Hedge Opportunities
          </div>
          <div style={{ fontSize: 11, color: t.textDim, marginBottom: 12, lineHeight: 1.6 }}>
            Pair yang bergerak berlawanan — bisa digunakan untuk hedge atau diversifikasi risiko.
          </div>
          {data.hedgeCombos.filter(c => c.pnlCorr !== null && c.pnlCorr < 0).length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data.hedgeCombos.filter(c => c.pnlCorr < 0).map(c => <ComboCard key={`${c.pairA}-${c.pairB}`} combo={c} type="hedge" theme={t} />)}
            </div>
          ) : (
            <div style={{ color: t.textDim, fontSize: 12, textAlign: "center", padding: "16px 0" }}>Tidak ada korelasi negatif signifikan</div>
          )}
        </div>
      </div>

      {/* Insight */}
      <div style={{ background: "rgba(0,200,150,0.04)", border: "1px solid rgba(0,200,150,0.15)", borderRadius: 12, padding: "16px 18px" }}>
        <div style={{ fontSize: 11, color: t.accent, fontWeight: 500, marginBottom: 10 }}>💡 Cara Membaca Correlation Matrix</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            "Nilai mendekati +1.0 → kedua pair cenderung profit/loss di hari yang sama (highly correlated)",
            "Nilai mendekati -1.0 → satu profit sementara yang lain loss (inversely correlated) — potensi hedge",
            "Nilai mendekati 0 → tidak ada hubungan signifikan antara performa kedua pair",
            "Titik diagonal selalu 1.0 karena pair dibandingkan dengan dirinya sendiri",
            "Korelasi dihitung dari hari-hari di mana KEDUA pair diperdagangkan secara bersamaan",
          ].map((tip, i) => (
            <div key={i} style={{ fontSize: 12, color: t.textMuted, display: "flex", gap: 8 }}>
              <span style={{ color: t.accent, flexShrink: 0 }}>→</span>{tip}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}