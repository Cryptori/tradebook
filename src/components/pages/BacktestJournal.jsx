import { useState } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { formatCurrency } from "../../utils/formatters";
import { TIMEFRAMES, VERDICTS } from "../../hooks/useBacktest";
import { MARKETS } from "../../constants";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, ReferenceLine,
} from "recharts";

// ── Session Form ─────────────────────────────────────────────────
function SessionForm({ form, setField, onSave, onClose, editId, playbookSetups, theme: t }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2, color: t.text }}>
            {editId ? "EDIT BACKTEST" : "LOG BACKTEST SESSION"}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Basic info */}
          <div>
            <label style={{ color: t.textDim }}>Nama Session</label>
            <input value={form.name} onChange={e => setField("name", e.target.value)}
              placeholder="Backtest Breakout EUR/USD H1 Jan 2025"
              style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "9px 12px", fontSize: 13, marginTop: 4 }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ color: t.textDim }}>Strategy</label>
              <input value={form.strategy} onChange={e => setField("strategy", e.target.value)}
                placeholder="Breakout, Trend Follow..."
                list="bt-strategies"
                style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "9px 12px", fontSize: 13, marginTop: 4 }} />
              <datalist id="bt-strategies">
                {(playbookSetups || []).map(s => <option key={s.id} value={s.title} />)}
              </datalist>
            </div>
            <div>
              <label style={{ color: t.textDim }}>Market</label>
              <select value={form.market} onChange={e => setField("market", e.target.value)}
                style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "9px 12px", fontSize: 13, marginTop: 4 }}>
                {MARKETS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: t.textDim }}>Pair</label>
              <input value={form.pair} onChange={e => setField("pair", e.target.value.toUpperCase())}
                placeholder="EUR/USD"
                style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "9px 12px", fontFamily: "DM Mono, monospace", fontSize: 13, marginTop: 4 }} />
            </div>
            <div>
              <label style={{ color: t.textDim }}>Timeframe</label>
              <select value={form.timeframe} onChange={e => setField("timeframe", e.target.value)}
                style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "9px 12px", fontSize: 13, marginTop: 4 }}>
                {TIMEFRAMES.map(tf => <option key={tf}>{tf}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: t.textDim }}>Period Dari</label>
              <input type="date" value={form.dateFrom} onChange={e => setField("dateFrom", e.target.value)}
                style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "9px 12px", fontSize: 13, marginTop: 4 }} />
            </div>
            <div>
              <label style={{ color: t.textDim }}>Period Sampai</label>
              <input type="date" value={form.dateTo} onChange={e => setField("dateTo", e.target.value)}
                style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "9px 12px", fontSize: 13, marginTop: 4 }} />
            </div>
          </div>

          {/* Stats */}
          <div style={{ fontSize: 11, color: "#00d4aa", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>📊 Hasil Backtest</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { key: "wins",        label: "Total Wins" },
              { key: "losses",      label: "Total Losses" },
              { key: "totalPnl",    label: "Total P&L (pips/points)" },
              { key: "grossWin",    label: "Gross Win" },
              { key: "grossLoss",   label: "Gross Loss" },
              { key: "avgRR",       label: "Avg R:R" },
              { key: "maxDrawdown", label: "Max Drawdown" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ color: t.textDim, fontSize: 11 }}>{f.label}</label>
                <input type="number" step="any" value={form[f.key]} onChange={e => setField(f.key, e.target.value)}
                  placeholder="0"
                  style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 13, marginTop: 4 }} />
              </div>
            ))}
          </div>

          {/* Verdict */}
          <div>
            <label style={{ color: t.textDim, fontSize: 11, display: "block", marginBottom: 6 }}>Verdict</label>
            <div style={{ display: "flex", gap: 8 }}>
              {VERDICTS.map(v => (
                <button key={v.value} onClick={() => setField("verdict", v.value)}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer", border: `1px solid ${form.verdict === v.value ? v.color : t.border}`, background: form.verdict === v.value ? v.color + "20" : "transparent", color: form.verdict === v.value ? v.color : t.textDim, fontSize: 12, fontFamily: "DM Mono, monospace" }}>
                  {v.icon} {v.value}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          {[
            { key: "notes",      label: "Catatan",    placeholder: "Kondisi market saat backtest, kendala yang ditemukan..." },
            { key: "conclusion", label: "Kesimpulan", placeholder: "Apakah strategy ini layak di-live trade? Apa yang perlu diperbaiki?" },
          ].map(f => (
            <div key={f.key}>
              <label style={{ color: t.textDim, fontSize: 11 }}>{f.label}</label>
              <textarea value={form[f.key]} onChange={e => setField(f.key, e.target.value)}
                rows={3} placeholder={f.placeholder}
                style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, width: "100%", padding: "8px 12px", fontSize: 12, resize: "vertical", marginTop: 4, lineHeight: 1.6 }} />
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>Batal</button>
          <button onClick={onSave} className="btn-primary" style={{ flex: 2, justifyContent: "center" }}>
            {editId ? "Update" : "Simpan Session"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Session Card ─────────────────────────────────────────────────
function SessionCard({ session, isSelected, onClick, theme: t }) {
  const { stats } = session;
  const verdict = VERDICTS.find(v => v.value === session.verdict) || VERDICTS[0];
  return (
    <div onClick={onClick} style={{ background: isSelected ? "rgba(0,212,170,0.06)" : t.bgSubtle, border: `1px solid ${isSelected ? "rgba(0,212,170,0.4)" : t.borderSubtle}`, borderRadius: 10, padding: "14px 16px", cursor: "pointer", transition: "all 0.15s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.name}</div>
          <div style={{ fontSize: 10, color: t.textDim, marginTop: 2 }}>{session.strategy} · {session.pair} · {session.timeframe}</div>
        </div>
        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: verdict.color + "20", color: verdict.color, border: `1px solid ${verdict.color}40`, flexShrink: 0, marginLeft: 8 }}>
          {verdict.icon} {verdict.value}
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 6 }}>
        {[
          { label: "Trades",   value: stats.totalTrades },
          { label: "Win Rate", value: stats.winRate.toFixed(1) + "%" },
          { label: "PF",       value: stats.profitFactor >= 999 ? "∞" : stats.profitFactor.toFixed(2) },
        ].map(s => (
          <div key={s.label} style={{ textAlign: "center", background: t.bgCard, borderRadius: 6, padding: "6px 4px" }}>
            <div style={{ fontSize: 9, color: t.textDim }}>{s.label}</div>
            <div style={{ fontSize: 12, color: t.text, fontFamily: "DM Mono, monospace" }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Session Detail ────────────────────────────────────────────────
function SessionDetail({ session, onEdit, onDelete, theme: t }) {
  const { stats } = session;
  const verdict   = VERDICTS.find(v => v.value === session.verdict) || VERDICTS[0];

  // Build simple equity curve from wins/losses
  const eqCurve = [];
  let equity = 0;
  const totalT = stats.totalTrades || 0;
  if (totalT > 0) {
    const avgWin  = stats.wins    > 0 ? (parseFloat(session.grossWin)  || 0) / stats.wins    : 0;
    const avgLoss = stats.losses  > 0 ? (parseFloat(session.grossLoss) || 0) / stats.losses  : 0;
    for (let i = 0; i < Math.min(totalT, 30); i++) {
      equity += Math.random() < stats.winRate / 100 ? avgWin : -avgLoss;
      eqCurve.push({ i: i + 1, equity: parseFloat(equity.toFixed(2)) });
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 500, color: t.text }}>{session.name}</div>
          <div style={{ fontSize: 11, color: t.textDim, marginTop: 3 }}>
            {session.strategy} · {session.pair} · {session.timeframe}
            {session.dateFrom && ` · ${session.dateFrom} → ${session.dateTo || "now"}`}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => onEdit(session)} className="btn-ghost" style={{ fontSize: 11, padding: "6px 12px" }}>Edit</button>
          <button onClick={() => onDelete(session.id)} style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 14 }}>🗑️</button>
        </div>
      </div>

      {/* Verdict */}
      <div style={{ background: verdict.color + "10", border: `1px solid ${verdict.color}30`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 24 }}>{verdict.icon}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: verdict.color }}>{verdict.value}</div>
          {session.conclusion && <div style={{ fontSize: 12, color: t.textMuted, marginTop: 3, lineHeight: 1.6 }}>{session.conclusion}</div>}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10 }}>
        {[
          { label: "Total Trades",  value: stats.totalTrades,                                                                  color: t.text    },
          { label: "Win Rate",      value: stats.winRate.toFixed(1) + "%",                                                     color: stats.winRate >= 50 ? "#00d4aa" : "#f59e0b" },
          { label: "Profit Factor", value: stats.profitFactor >= 999 ? "∞" : stats.profitFactor.toFixed(2),                    color: stats.profitFactor >= 1.5 ? "#00d4aa" : "#f59e0b" },
          { label: "Avg R:R",       value: stats.avgRR.toFixed(2),                                                             color: stats.avgRR >= 1.5 ? "#00d4aa" : "#f59e0b" },
          { label: "Total P&L",     value: (stats.totalPnl >= 0 ? "+" : "") + stats.totalPnl.toFixed(1),                      color: stats.totalPnl >= 0 ? "#00d4aa" : "#ef4444" },
          { label: "Wins",          value: stats.wins,                                                                         color: "#00d4aa"  },
          { label: "Losses",        value: stats.losses,                                                                       color: "#ef4444"  },
          { label: "Max DD",        value: stats.maxDD > 0 ? "-" + stats.maxDD.toFixed(1) : "—",                              color: "#ef4444"  },
        ].map(s => (
          <div key={s.label} style={{ background: t.bgSubtle, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 9, color: t.textDim, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 14, color: s.color, fontWeight: 500, fontFamily: "DM Mono, monospace" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Equity curve simulation */}
      {eqCurve.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Equity Curve (Simulasi)</div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={eqCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} vertical={false} />
              <XAxis dataKey="i" tick={{ fill: t.textDim, fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: t.textDim, fontSize: 9 }} axisLine={false} tickLine={false} width={40} />
              <ReferenceLine y={0} stroke={t.border} strokeDasharray="4 4" />
              <Tooltip contentStyle={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 8, fontSize: 11, color: t.text }} />
              <Line type="monotone" dataKey="equity" stroke="#00d4aa" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 9, color: t.textDim, textAlign: "center", marginTop: 4 }}>*Simulasi berdasarkan win rate & avg win/loss</div>
        </div>
      )}

      {/* Notes */}
      {session.notes && (
        <div style={{ background: t.bgSubtle, borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontSize: 10, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Catatan</div>
          <div style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{session.notes}</div>
        </div>
      )}
    </div>
  );
}

// ── Comparison Panel ─────────────────────────────────────────────
function ComparisonPanel({ comparison, theme: t }) {
  if (comparison.length === 0) return (
    <div style={{ textAlign: "center", padding: "40px 20px", color: t.textDim, fontSize: 13 }}>
      Belum ada data untuk dibandingkan.<br/>Tambah backtest session dan live trade dengan strategy yang sama.
    </div>
  );

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="trade-table">
        <thead>
          <tr>
            <th>Strategy</th>
            <th>Backtest WR%</th>
            <th>Live WR%</th>
            <th>Backtest PF</th>
            <th>Live PF</th>
            <th>Backtest Avg RR</th>
            <th>Live Avg RR</th>
            <th>Backtest Trades</th>
            <th>Live Trades</th>
          </tr>
        </thead>
        <tbody>
          {comparison.map(row => (
            <tr key={row.strategy}>
              <td style={{ fontWeight: 500 }}>{row.strategy}</td>
              <td style={{ color: row.backtest?.winRate >= 50 ? "#00d4aa" : "#f59e0b" }}>
                {row.backtest ? (row.backtest?.winRate || 0).toFixed(1) + "%" : "—"}
              </td>
              <td style={{ color: row.live?.winRate >= 50 ? "#00d4aa" : "#f59e0b" }}>
                {row.live ? (row.live?.winRate || 0).toFixed(1) + "%" : "—"}
              </td>
              <td style={{ color: (row.backtest?.profitFactor || 0) >= 1.5 ? "#00d4aa" : "#f59e0b" }}>
                {row.backtest ? (row.backtest.profitFactor >= 999 ? "∞" : (row.backtest?.profitFactor || 0).toFixed(2)) : "—"}
              </td>
              <td style={{ color: (row.live?.profitFactor || 0) >= 1.5 ? "#00d4aa" : "#f59e0b" }}>
                {row.live ? (row.live.profitFactor >= 999 ? "∞" : (row.live?.profitFactor || 0).toFixed(2)) : "—"}
              </td>
              <td>{row.backtest ? (row.backtest?.avgRR || 0).toFixed(2) : "—"}</td>
              <td>{row.live ? (row.live?.avgRR || 0).toFixed(2) : "—"}</td>
              <td>{row.backtest?.trades || "—"}</td>
              <td>{row.live?.trades || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main BacktestJournal Page ────────────────────────────────────
export default function BacktestJournal({ backtestHook, theme }) {
  const t = theme;
  const { isMobile } = useBreakpoint();
  const [activePanel, setActivePanel] = useState("sessions"); // "sessions" | "compare"
  const {
    sessions, comparison,
    showForm, form, setField, editId,
    selected, setSelected, selectedEnriched,
    openAdd, openEdit, closeForm, saveSession, deleteSession,
    playbookSetups,
  } = backtestHook;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2, color: t.text }}>BACKTESTING JOURNAL</div>
          <div style={{ fontSize: 11, color: t.textDim }}>Log hasil backtest dan compare dengan performa live trading</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {/* Panel switcher */}
          <div style={{ display: "flex", gap: 4, background: t.bgSubtle, border: `1px solid ${t.border}`, borderRadius: 8, padding: 3 }}>
            {[{ v: "sessions", l: "Sessions" }, { v: "compare", l: "vs Live" }].map(p => (
              <button key={p.v} onClick={() => setActivePanel(p.v)}
                style={{ padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, fontFamily: "DM Mono, monospace", background: activePanel === p.v ? t.accent : "transparent", color: activePanel === p.v ? "#090e1a" : t.textDim }}>
                {p.l}
              </button>
            ))}
          </div>
          <button onClick={() => openAdd()} className="btn-primary" style={{ fontSize: 12 }}>+ Log Backtest</button>
        </div>
      </div>

      {activePanel === "compare" && (
        <div className="stat-card">
          <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Backtest vs Live Performance</div>
          <ComparisonPanel comparison={comparison} theme={t} />
        </div>
      )}

      {activePanel === "sessions" && (
        sessions.length === 0 ? (
          <div className="stat-card">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 24px", textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, rgba(0,200,150,0.08), rgba(0,200,150,0.04))", border: "1px solid rgba(0,200,150,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, marginBottom: 20 }}>🔬</div>
              <div style={{ fontSize: 15, fontWeight: 500, color: t.text, marginBottom: 8 }}>Belum ada backtest session</div>
              <div style={{ fontSize: 12, color: t.textDim, maxWidth: 280, lineHeight: 1.8, marginBottom: 20 }}>Log hasil backtest strategy sebelum live trade — bandingkan performa backtest vs live</div>
              <button onClick={() => openAdd()} className="btn-primary" style={{ fontSize: 12 }}>+ Log Backtest Session</button>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "300px 1fr", gap: 16 }}>
            {/* Session list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sessions.map(s => (
                <SessionCard key={s.id} session={s} isSelected={selected?.id === s.id} onClick={() => setSelected(s)} theme={t} />
              ))}
            </div>

            {/* Session detail */}
            <div className="stat-card">
              {selectedEnriched ? (
                <SessionDetail session={selectedEnriched} onEdit={openEdit} onDelete={deleteSession} theme={t} />
              ) : (
                <div style={{ textAlign: "center", padding: "40px 20px", color: t.textDim, fontSize: 13 }}>
                  Pilih session di kiri untuk lihat detail
                </div>
              )}
            </div>
          </div>
        )
      )}

      {showForm && (
        <SessionForm
          form={form} setField={setField} onSave={saveSession} onClose={closeForm}
          editId={editId} playbookSetups={playbookSetups} theme={t}
        />
      )}
    </div>
  );
}