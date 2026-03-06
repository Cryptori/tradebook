import {
  ScatterChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "../../utils/formatters";

function ScatterTooltip({ active, payload, symbol, theme: t }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 8, padding: "10px 14px", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
      <div style={{ color: t.text, fontWeight: 500, marginBottom: 4 }}>{d.pair}</div>
      <div style={{ color: t.textMuted }}>
        R:R: <span style={{ color: d.rr >= 0 ? "#00d4aa" : "#ef4444" }}>{d.rr >= 0 ? "+" : ""}{(d.rr ?? 0).toFixed(2)}</span>
      </div>
      <div style={{ color: t.textMuted }}>
        P&L: <span style={{ color: d.pnl >= 0 ? "#00d4aa" : "#ef4444" }}>{formatCurrency(d.pnl, false, symbol)}</span>
      </div>
      <div style={{ color: t.textDim, fontSize: 10, marginTop: 2 }}>{d.date} · {d.strategy}</div>
    </div>
  );
}

function DotShape({ cx, cy, payload }) {
  const color = payload.pnl >= 0 ? "#00d4aa" : "#ef4444";
  return <circle cx={cx} cy={cy} r={5} fill={color} fillOpacity={0.75} stroke={color} strokeWidth={1} />;
}

export default function RRScatterChart({ trades, symbol = "$", theme }) {
  const t    = theme;
  const data = trades.map(tr => ({ ...tr, x: tr.rr, y: tr.pnl }));

  return (
    <div>
      <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
        R:R vs P&L Scatter
      </div>
      <div style={{ fontSize: 10, color: t.textDim, marginBottom: 16 }}>
        Setiap titik = 1 trade. Ideal: cluster di kanan atas (RR tinggi, profit besar)
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} />
          <XAxis dataKey="x" name="R:R" type="number"
            tick={{ fill: t.textDim, fontSize: 10, fontFamily: "DM Mono" }}
            tickLine={false} axisLine={false}
            label={{ value: "R:R Ratio", position: "insideBottomRight", offset: -5, fill: t.textDim, fontSize: 10 }} />
          <YAxis dataKey="y" name="P&L" type="number"
            tick={{ fill: t.textDim, fontSize: 10, fontFamily: "DM Mono" }}
            tickLine={false} axisLine={false}
            tickFormatter={v => `${symbol}${v}`} />
          <Tooltip content={<ScatterTooltip symbol={symbol} theme={t} />} />
          <ReferenceLine x={0} stroke={t.border} strokeDasharray="4 4" />
          <ReferenceLine y={0} stroke={t.border} strokeDasharray="4 4" />
          <Scatter data={data} shape={<DotShape />} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}