import { useState } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { formatCurrency } from "../../utils/formatters";
import { TIMEFRAMES, VERDICTS } from "../../hooks/useBacktest";
import { MARKETS } from "../../constants";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

// ── Session form ──────────────────────────────────────────────────
function SessionForm({ form, setField, onSave, onClose, editId, playbookSetups }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "var(--bg-overlay)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: "var(--r-xl)", padding: 24, width: "100%", maxWidth: 540,
        maxHeight: "92vh", overflowY: "auto", boxShadow: "var(--shadow-lg)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "var(--font-disp)", fontSize: 18, letterSpacing: 2, color: "var(--text)", fontWeight: 400 }}>
            {editId ? "EDIT BACKTEST" : "LOG BACKTEST SESSION"}
          </h2>
          <button onClick={onClose} className="btn-icon">✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label>Nama Session</label>
            <input value={form.name} onChange={e => setField("name", e.target.value)}
              placeholder="Backtest Breakout EUR/USD H1 Jan 2025"/>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label>Strategy</label>
              <input value={form.strategy} onChange={e => setField("strategy", e.target.value)}
                placeholder="Breakout, Trend Follow..." list="bt-strategies"/>
              <datalist id="bt-strategies">
                {(playbookSetups || []).map(s => <option key={s.id} value={s.title}/>)}
              </datalist>
            </div>
            <div>
              <label>Market</label>
              <select value={form.market} onChange={e => setField("market", e.target.value)}>
                {MARKETS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label>Pair</label>
              <input value={form.pair} onChange={e => setField("pair", e.target.value.toUpperCase())}
                placeholder="EUR/USD" style={{ fontFamily: "var(--font-mono)" }}/>
            </div>
            <div>
              <label>Timeframe</label>
              <select value={form.timeframe} onChange={e => setField("timeframe", e.target.value)}>
                {TIMEFRAMES.map(tf => <option key={tf}>{tf}</option>)}
              </select>
            </div>
            <div>
              <label>Period Dari</label>
              <input type="date" value={form.dateFrom} onChange={e => setField("dateFrom", e.target.value)}/>
            </div>
            <div>
              <label>Period Sampai</label>
              <input type="date" value={form.dateTo} onChange={e => setField("dateTo", e.target.value)}/>
            </div>
          </div>

          <div className="section-label" style={{ marginTop: 4 }}>Hasil Backtest</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { k: "wins",        label: "Total Wins" },
              { k: "losses",      label: "Total Losses" },
              { k: "totalPnl",    label: "Total P&L (pips)" },
              { k: "grossWin",    label: "Gross Win" },
              { k: "grossLoss",   label: "Gross Loss" },
              { k: "avgRR",       label: "Avg R:R" },
              { k: "maxDrawdown", label: "Max Drawdown" },
            ].map(f => (
              <div key={f.k}>
                <label>{f.label}</label>
                <input type="number" step="any" value={form[f.k]}
                  onChange={e => setField(f.k, e.target.value)}
                  placeholder="0" style={{ fontFamily: "var(--font-mono)" }}/>
              </div>
            ))}
          </div>

          <div>
            <label>Verdict</label>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              {VERDICTS.map(v => {
                const active = form.verdict === v.value;
                return (
                  <button key={v.value} onClick={() => setField("verdict", v.value)} style={{
                    flex: 1, padding: "8px 0", borderRadius: "var(--r-md)", cursor: "pointer",
                    border: `1px solid ${active ? v.color : "var(--border)"}`,
                    background: active ? `${v.color}20` : "transparent",
                    color: active ? v.color : "var(--text-dim)",
                    fontSize: "var(--fs-xs)", fontFamily: "var(--font-mono)",
                  }}>
                    {v.icon} {v.value}
                  </button>
                );
              })}
            </div>
          </div>

          {[
            { k: "notes",      label: "Catatan",    ph: "Kondisi market saat backtest, kendala..." },
            { k: "conclusion", label: "Kesimpulan", ph: "Apakah layak live trade? Apa yang perlu diperbaiki?" },
          ].map(f => (
            <div key={f.k}>
              <label>{f.label}</label>
              <textarea value={form[f.k]} onChange={e => setField(f.k, e.target.value)}
                rows={3} placeholder={f.ph} style={{ lineHeight: 1.6 }}/>
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

// ── Session card ──────────────────────────────────────────────────
function SessionCard({ session, isSelected, onClick }) {
  const { stats }  = session;
  const verdict    = VERDICTS.find(v => v.value === session.verdict) || VERDICTS[0];
  return (
    <div onClick={onClick} style={{
      background: isSelected ? "var(--accent-dim)" : "var(--bg-subtle)",
      border: `1px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
      borderRadius: "var(--r-lg)", padding: "12px 14px",
      cursor: "pointer", transition: "all var(--t-base)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {session.name}
          </div>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 2 }}>
            {session.strategy} · {session.pair} · {session.timeframe}
          </div>
        </div>
        <span style={{ fontSize: "var(--fs-xs)", padding: "2px 7px", borderRadius: 3, background: `${verdict.color}20`, color: verdict.color, border: `1px solid ${verdict.color}40`, flexShrink: 0, marginLeft: 8 }}>
          {verdict.icon} {verdict.value}
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
        {[
          { label: "Trades",  val: stats.totalTrades },
          { label: "WR%",     val: `${(stats.winRate ?? 0).toFixed(1)}%` },
          { label: "PF",      val: (stats.profitFactor ?? 0) >= 999 ? "∞" : (stats.profitFactor ?? 0).toFixed(2) },
        ].map(s => (
          <div key={s.label} style={{ textAlign: "center", background: "var(--bg-card)", borderRadius: "var(--r-sm)", padding: "5px 4px" }}>
            <div style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)" }}>{s.label}</div>
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--text)", fontFamily: "var(--font-mono)" }}>{s.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Session detail ────────────────────────────────────────────────
function SessionDetail({ session, onEdit, onDelete }) {
  const { stats } = session;
  const verdict   = VERDICTS.find(v => v.value === session.verdict) || VERDICTS[0];
  const { isMobile } = useBreakpoint();

  // Simulated equity curve
  const eqCurve = [];
  let equity = 0;
  const totalT = stats.totalTrades || 0;
  if (totalT > 0) {
    const avgWin  = stats.wins   > 0 ? (parseFloat(session.grossWin)  || 0) / stats.wins   : 0;
    const avgLoss = stats.losses > 0 ? (parseFloat(session.grossLoss) || 0) / stats.losses : 0;
    for (let i = 0; i < Math.min(totalT, 30); i++) {
      equity += Math.random() < (stats.winRate ?? 0) / 100 ? avgWin : -avgLoss;
      eqCurve.push({ i: i + 1, equity: parseFloat(equity.toFixed(2)) });
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: "var(--fs-base)", fontWeight: 600, color: "var(--text)" }}>{session.name}</div>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 3 }}>
            {session.strategy} · {session.pair} · {session.timeframe}
            {session.dateFrom && ` · ${session.dateFrom} → ${session.dateTo || "now"}`}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => onEdit(session)} className="btn-ghost" style={{ height: 28, fontSize: "var(--fs-xs)" }}>Edit</button>
          <button onClick={() => onDelete(session.id)} className="btn-icon" style={{ color: "var(--danger)" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
          </button>
        </div>
      </div>

      {/* Verdict */}
      <div style={{ background: `${verdict.color}10`, border: `1px solid ${verdict.color}30`, borderRadius: "var(--r-lg)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 22 }}>{verdict.icon}</span>
        <div>
          <div style={{ fontSize: "var(--fs-base)", fontWeight: 500, color: verdict.color }}>{verdict.value}</div>
          {session.conclusion && <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", marginTop: 3, lineHeight: 1.6 }}>{session.conclusion}</div>}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 8 }}>
        {[
          { label: "Total Trades",  val: stats.totalTrades, color: "var(--text)" },
          { label: "Win Rate",      val: `${(stats.winRate ?? 0).toFixed(1)}%`, color: (stats.winRate ?? 0) >= 50 ? "var(--success)" : "var(--warning)" },
          { label: "Profit Factor", val: (stats.profitFactor ?? 0) >= 999 ? "∞" : (stats.profitFactor ?? 0).toFixed(2), color: (stats.profitFactor ?? 0) >= 1.5 ? "var(--success)" : "var(--warning)" },
          { label: "Avg R:R",       val: (stats.avgRR ?? 0).toFixed(2), color: (stats.avgRR ?? 0) >= 1.5 ? "var(--success)" : "var(--warning)" },
          { label: "Total P&L",     val: `${(stats.totalPnl ?? 0) >= 0 ? "+" : ""}${(stats.totalPnl ?? 0).toFixed(1)}`, color: (stats.totalPnl ?? 0) >= 0 ? "var(--success)" : "var(--danger)" },
          { label: "Wins",          val: stats.wins,   color: "var(--success)" },
          { label: "Losses",        val: stats.losses, color: "var(--danger)"  },
          { label: "Max DD",        val: (stats.maxDD ?? 0) > 0 ? `-${(stats.maxDD ?? 0).toFixed(1)}` : "—", color: "var(--danger)" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--bg-subtle)", borderRadius: "var(--r-md)", padding: "8px 10px", textAlign: "center" }}>
            <div className="kpi-label">{s.label}</div>
            <div style={{ fontSize: "var(--fs-base)", color: s.color, fontWeight: 600, fontFamily: "var(--font-mono)", marginTop: 2 }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Equity curve */}
      {eqCurve.length > 0 && (
        <div>
          <div className="section-label" style={{ marginBottom: 10 }}>Equity Curve (Simulasi)</div>
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={eqCurve} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false}/>
              <XAxis dataKey="i" tick={{ fill: "var(--text-dim)", fontSize: 9 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: "var(--text-dim)", fontSize: 9 }} axisLine={false} tickLine={false} width={40}/>
              <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="4 4"/>
              <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", fontSize: 11, color: "var(--text)" }}/>
              <Line type="monotone" dataKey="equity" stroke="var(--accent)" strokeWidth={2} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
          <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", textAlign: "center", marginTop: 4 }}>
            *Simulasi berdasarkan win rate & avg win/loss
          </p>
        </div>
      )}

      {/* Notes */}
      {session.notes && (
        <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "10px 14px" }}>
          <div className="section-label" style={{ marginBottom: 6 }}>Catatan</div>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{session.notes}</div>
        </div>
      )}
    </div>
  );
}

// ── Comparison panel ──────────────────────────────────────────────
function ComparisonPanel({ comparison }) {
  if (!comparison.length) return (
    <div className="empty-state">
      <div className="empty-desc">Belum ada data. Tambah backtest session dan live trade dengan strategy yang sama.</div>
    </div>
  );
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Strategy</th>
            <th className="text-right">BT WR%</th>
            <th className="text-right">Live WR%</th>
            <th className="text-right">BT PF</th>
            <th className="text-right">Live PF</th>
            <th className="text-right">BT RR</th>
            <th className="text-right">Live RR</th>
            <th className="text-right">BT Trades</th>
            <th className="text-right">Live Trades</th>
          </tr>
        </thead>
        <tbody>
          {comparison.map(row => (
            <tr key={row.strategy}>
              <td style={{ fontWeight: 500, color: "var(--text)" }}>{row.strategy}</td>
              <td className="text-right mono" style={{ color: (row.backtest?.winRate ?? 0) >= 50 ? "var(--success)" : "var(--warning)" }}>
                {row.backtest ? `${(row.backtest.winRate ?? 0).toFixed(1)}%` : "—"}
              </td>
              <td className="text-right mono" style={{ color: (row.live?.winRate ?? 0) >= 50 ? "var(--success)" : "var(--warning)" }}>
                {row.live ? `${(row.live.winRate ?? 0).toFixed(1)}%` : "—"}
              </td>
              <td className="text-right mono" style={{ color: (row.backtest?.profitFactor ?? 0) >= 1.5 ? "var(--success)" : "var(--warning)" }}>
                {row.backtest ? ((row.backtest.profitFactor ?? 0) >= 999 ? "∞" : (row.backtest.profitFactor ?? 0).toFixed(2)) : "—"}
              </td>
              <td className="text-right mono" style={{ color: (row.live?.profitFactor ?? 0) >= 1.5 ? "var(--success)" : "var(--warning)" }}>
                {row.live ? ((row.live.profitFactor ?? 0) >= 999 ? "∞" : (row.live.profitFactor ?? 0).toFixed(2)) : "—"}
              </td>
              <td className="text-right mono">{row.backtest ? (row.backtest.avgRR ?? 0).toFixed(2) : "—"}</td>
              <td className="text-right mono">{row.live ? (row.live.avgRR ?? 0).toFixed(2) : "—"}</td>
              <td className="text-right mono">{row.backtest?.trades || "—"}</td>
              <td className="text-right mono">{row.live?.trades || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main BacktestJournal ──────────────────────────────────────────
export default function BacktestJournal({ backtestHook, theme }) {
  const { isMobile } = useBreakpoint();
  const [activePanel, setActivePanel] = useState("sessions");
  const {
    sessions, comparison,
    showForm, form, setField, editId,
    selected, setSelected, selectedEnriched,
    openAdd, openEdit, closeForm, saveSession, deleteSession,
    playbookSetups,
  } = backtestHook;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Backtesting Journal</h1>
          <p className="page-subtitle">Log hasil backtest dan compare dengan live trading</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ display: "flex", gap: 2, background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 2 }}>
            {[{ v: "sessions", l: "Sessions" }, { v: "compare", l: "vs Live" }].map(p => (
              <button key={p.v} onClick={() => setActivePanel(p.v)} style={{
                padding: "5px 12px", borderRadius: "var(--r-sm)", border: "none", cursor: "pointer",
                fontSize: "var(--fs-xs)", fontFamily: "var(--font-mono)",
                background: activePanel === p.v ? "var(--accent)"      : "transparent",
                color:      activePanel === p.v ? "var(--text-inverse)" : "var(--text-dim)",
                fontWeight: activePanel === p.v ? 600 : 400,
              }}>{p.l}</button>
            ))}
          </div>
          <button onClick={() => openAdd()} className="btn-primary" style={{ height: 30, fontSize: "var(--fs-sm)" }}>
            + Log Backtest
          </button>
        </div>
      </div>

      {/* Compare panel */}
      {activePanel === "compare" && (
        <div className="stat-card">
          <div className="section-label" style={{ marginBottom: 14 }}>Backtest vs Live Performance</div>
          <ComparisonPanel comparison={comparison}/>
        </div>
      )}

      {/* Sessions panel */}
      {activePanel === "sessions" && (
        sessions.length === 0 ? (
          <div className="stat-card">
            <div className="empty-state">
              <div className="empty-icon">🔬</div>
              <div className="empty-title">Belum ada backtest session</div>
              <div className="empty-desc">Log hasil backtest strategy sebelum live trade</div>
              <button onClick={() => openAdd()} className="btn-primary" style={{ marginTop: 16 }}>+ Log Backtest Session</button>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "280px 1fr", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: isMobile ? "50vh" : "80vh", overflowY: "auto", paddingRight: 2 }}>
              {sessions.map(s => (
                <SessionCard key={s.id} session={s}
                  isSelected={selected?.id === s.id}
                  onClick={() => setSelected(s)}/>
              ))}
            </div>
            <div className="stat-card">
              {selectedEnriched ? (
                <SessionDetail session={selectedEnriched} onEdit={openEdit} onDelete={deleteSession}/>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-dim)", fontSize: "var(--fs-sm)" }}>
                  Pilih session di kiri
                </div>
              )}
            </div>
          </div>
        )
      )}

      {showForm && (
        <SessionForm form={form} setField={setField} onSave={saveSession}
          onClose={closeForm} editId={editId} playbookSetups={playbookSetups}/>
      )}
    </div>
  );
}