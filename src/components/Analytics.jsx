import { useBreakpoint } from "../hooks/useBreakpoint";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatCurrency } from "../utils/formatters";
import HeatmapChart   from "./charts/HeatmapChart";
import RRScatterChart from "./charts/ScatterChart";

const tooltipStyle = (t) => ({
  contentStyle: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 8, fontFamily: "DM Mono", fontSize: 12, color: t.text },
});

export default function Analytics({ trades, stats, strategyStats, marketBreakdown, emotionStats, currencyMeta, theme }) {
  const t   = theme;
  const sym = currencyMeta?.symbol ?? "$";
  const { isMobile, md } = useBreakpoint();
  const maxStrategyPnl = Math.max(...strategyStats.map(x => Math.abs(x.pnl)), 1);

  return (
    <div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2, marginBottom: 20, color: t.text }}>
        PERFORMANCE ANALYTICS
      </div>

      {/* Win/Loss + Strategy */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div className="stat-card" style={{ background: `linear-gradient(135deg, ${t.bgCard}, ${t.bgCard2})`, borderColor: t.border }}>
          <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Win vs Loss</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
            <div style={{ textAlign: "center", background: "rgba(0,212,170,0.06)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 10, color: t.textDim, marginBottom: 4 }}>AVG WIN</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: "#00d4aa" }}>{formatCurrency(stats.avgWin, false, sym)}</div>
            </div>
            <div style={{ textAlign: "center", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 10, color: t.textDim, marginBottom: 4 }}>AVG LOSS</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: "#ef4444" }}>{formatCurrency(stats.avgLoss, false, sym)}</div>
            </div>
          </div>
          <div style={{ marginTop: 12, padding: 12, background: t.bgSubtle, borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: t.textDim }}>Profit Factor</span>
            <span style={{ fontSize: 14, color: stats.profitFactor >= 1.5 ? "#00d4aa" : "#f59e0b", fontWeight: 500 }}>
              {stats.profitFactor >= 999 ? "∞" : stats.profitFactor.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="stat-card" style={{ background: `linear-gradient(135deg, ${t.bgCard}, ${t.bgCard2})`, borderColor: t.border }}>
          <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Strategy Performance</div>
          {strategyStats.length === 0 ? (
            <div style={{ color: t.textDim, fontSize: 12, textAlign: "center", paddingTop: 20 }}>Belum ada data</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {strategyStats.map(s => (
                <div key={s.strategy} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 11, color: t.textMuted, width: 90, flexShrink: 0 }}>{s.strategy}</div>
                  <div style={{ flex: 1, background: t.bgSubtle, borderRadius: 4, height: 6, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(Math.abs(s.pnl) / maxStrategyPnl) * 100}%`, background: s.pnl >= 0 ? "#00d4aa" : "#ef4444", borderRadius: 4 }} />
                  </div>
                  <div style={{ fontSize: 11, color: s.pnl >= 0 ? "#00d4aa" : "#ef4444", width: 70, textAlign: "right" }}>{formatCurrency(s.pnl, false, sym)}</div>
                  <div style={{ fontSize: 10, color: t.textDim, width: 30, textAlign: "right" }}>{s.count}x</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* P&L by Market */}
      <div className="stat-card" style={{ background: `linear-gradient(135deg, ${t.bgCard}, ${t.bgCard2})`, borderColor: t.border, marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>P&L by Market</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={marketBreakdown} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} horizontal={false} />
            <XAxis type="number" tick={{ fill: t.textDim, fontSize: 10, fontFamily: "DM Mono" }} tickLine={false} axisLine={false} tickFormatter={v => `${sym}${v}`} />
            <YAxis type="category" dataKey="market" tick={{ fill: t.textMuted, fontSize: 11, fontFamily: "DM Mono" }} tickLine={false} axisLine={false} width={90} />
            <Tooltip {...tooltipStyle(t)} formatter={v => [formatCurrency(v, false, sym), "P&L"]} />
            <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
              {marketBreakdown.map(m => <Cell key={m.market} fill={m.pnl >= 0 ? "#00d4aa" : "#ef4444"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Scatter + Heatmap */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div className="stat-card" style={{ background: `linear-gradient(135deg, ${t.bgCard}, ${t.bgCard2})`, borderColor: t.border }}>
          <RRScatterChart trades={trades} symbol={sym} theme={t} />
        </div>
        <div className="stat-card" style={{ background: `linear-gradient(135deg, ${t.bgCard}, ${t.bgCard2})`, borderColor: t.border }}>
          <HeatmapChart trades={trades} symbol={sym} theme={t} />
        </div>
      </div>

      {/* Emotion stats */}
      <div className="stat-card" style={{ background: `linear-gradient(135deg, ${t.bgCard}, ${t.bgCard2})`, borderColor: t.border }}>
        <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>P&L by Emotion State</div>
        {emotionStats.length === 0 ? (
          <div style={{ color: t.textDim, fontSize: 12, textAlign: "center", padding: "20px 0" }}>Belum ada data</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {emotionStats.map(({ emotion, pnl, count }) => (
              <div key={emotion} style={{ background: t.bgSubtle, borderRadius: 8, padding: "12px 14px", border: `1px solid ${t.borderSubtle}` }}>
                <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 4 }}>{emotion}</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: pnl >= 0 ? "#00d4aa" : "#ef4444" }}>{formatCurrency(pnl, false, sym)}</div>
                <div style={{ fontSize: 10, color: t.textDim, marginTop: 2 }}>{count} trades</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}