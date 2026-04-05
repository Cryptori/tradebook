import { formatCurrency } from "../../utils/formatters";

const DAYS     = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SESSIONS = ["Asia", "London", "New York", "All Day"];

function cellBg(pnl, maxAbs) {
  if (pnl === 0 || !maxAbs) return "transparent";
  const intensity = Math.min(Math.abs(pnl) / maxAbs, 1);
  const alpha = 0.1 + intensity * 0.7;
  return pnl > 0 ? `rgba(0,212,170,${alpha})` : `rgba(239,68,68,${alpha})`;
}

export default function HeatmapChart({ trades, symbol = "$", theme }) {
  const t = theme;

  // Build matrix
  const matrix = {};
  DAYS.forEach(d => {
    matrix[d] = {};
    SESSIONS.forEach(s => { matrix[d][s] = { pnl: 0, count: 0 }; });
  });

  trades.forEach(trade => {
    const dow     = new Date(trade.date + "T00:00:00").getDay();
    const dayName = DAYS[dow === 0 ? 6 : dow - 1];
    const session = SESSIONS.includes(trade.session) ? trade.session : "All Day";
    matrix[dayName][session].pnl   += trade.pnl;
    matrix[dayName][session].count += 1;
  });

  const maxAbs = Math.max(
    ...DAYS.flatMap(d => SESSIONS.map(s => Math.abs(matrix[d][s].pnl))),
    1
  );

  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
        P&L Heatmap — Day × Session
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 4 }}>
          <thead>
            <tr>
              <th style={{ width: 44, fontWeight: 400 }} />
              {SESSIONS.map(s => (
                <th key={s} style={{ fontSize: 10, color: "var(--text-dim)", fontWeight: 400, textAlign: "center", paddingBottom: 6, whiteSpace: "nowrap" }}>{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map(day => (
              <tr key={day}>
                <td style={{ fontSize: 11, color: "var(--text-muted)", paddingRight: 8, whiteSpace: "nowrap" }}>{day}</td>
                {SESSIONS.map(session => {
                  const cell = matrix[day][session];
                  return (
                    <td key={session} style={{ padding: 0 }}>
                      <div
                        title={cell.count > 0 ? `${day} / ${session}: ${formatCurrency(cell.pnl, false, symbol)} (${cell.count} trades)` : "No trades"}
                        style={{ background: cellBg(cell.pnl, maxAbs), borderRadius: 6, height: 40, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
                      >
                        {cell.count > 0 ? (
                          <>
                            <div style={{ fontSize: 10, color: cell.pnl >= 0 ? "#00d4aa" : "#ef4444", fontWeight: 500 }}>
                              {formatCurrency(cell.pnl, true, symbol)}
                            </div>
                            <div style={{ fontSize: 9, color: "var(--text-dim)" }}>{cell.count}x</div>
                          </>
                        ) : (
                          <div style={{ fontSize: 10, color: "var(--text-dim)" }}>—</div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}