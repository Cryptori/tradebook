import { useState, useMemo } from "react";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { formatCurrency } from "../utils/formatters";

// ── Sortable th ───────────────────────────────────────────────────
function SortTh({ label, k, sortKey, sortDir, toggleSort, right }) {
  const active = sortKey === k;
  return (
    <th
      className={`sortable${right ? " text-right" : ""}`}
      onClick={() => toggleSort(k)}
      style={{ color: active ? "var(--accent)" : undefined }}
    >
      {label}
      {active && <span style={{ marginLeft: 3, opacity: 0.6 }}>{sortDir === "desc" ? " ↓" : " ↑"}</span>}
    </th>
  );
}

// ── Filter pill select ────────────────────────────────────────────
function Pill({ value, onChange, options, placeholder }) {
  const active = !!value;
  return (
    <div style={{ position: "relative" }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        height: 28, padding: "0 22px 0 9px",
        fontSize: "var(--fs-xs)", fontFamily: "var(--font-ui)",
        borderRadius: "var(--r-sm)",
        border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
        background: active ? "var(--accent-dim)" : "var(--bg-subtle)",
        color: active ? "var(--accent)" : "var(--text-muted)",
        cursor: "pointer", outline: "none",
        appearance: "none", WebkitAppearance: "none",
      }}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <span style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", fontSize: 7, color: active ? "var(--accent)" : "var(--text-dim)", pointerEvents: "none" }}>▼</span>
    </div>
  );
}

// ── Mini P&L bar ──────────────────────────────────────────────────
function PnlBar({ pnl, maxAbs }) {
  const pct = maxAbs > 0 ? (Math.abs(pnl) / maxAbs) * 100 : 0;
  return (
    <div style={{ width: 32, height: 3, background: "var(--bg-subtle)", borderRadius: 2, overflow: "hidden", flexShrink: 0 }}>
      <div style={{ height: "100%", width: `${pct}%`, background: pnl >= 0 ? "var(--success)" : "var(--danger)", borderRadius: 2 }}/>
    </div>
  );
}

// ── Main Journal ──────────────────────────────────────────────────
export default function Journal({
  trades, stats, currencyMeta, theme,
  onAdd, onEdit, onDelete, onImport,
  filterHook, onShareTrade, onReplay,
}) {
  const sym = currencyMeta?.symbol ?? "$";
  const { isMobile } = useBreakpoint();

  // Sort
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");

  // Filter panel open/close
  const [showFilters, setShowFilters] = useState(false);

  // Import message
  const [importMsg, setImportMsg] = useState({ text: "", type: "" });

  function toggleSort(k) {
    if (sortKey === k) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortKey(k); setSortDir("desc"); }
  }

  // Use filterHook if available, otherwise fallback to raw trades
  const filter    = filterHook?.filter  ?? {};
  const setField  = filterHook?.setField ?? (() => {});
  const clearFilter = filterHook?.clearFilter ?? (() => {});
  const options   = filterHook?.options  ?? {};
  const activeCount = filterHook?.activeFilterCount ?? 0;

  // Source trades — filtered by hook or raw
  const sourceTrades = filterHook?.filtered ?? trades ?? [];

  // Client-side sort on top of hook's filtered list
  const sortedTrades = useMemo(() => {
    return [...sourceTrades].sort((a, b) => {
      let va = a[sortKey] ?? "", vb = b[sortKey] ?? "";
      if (sortKey === "pnl" || sortKey === "rr") { va = parseFloat(va) || 0; vb = parseFloat(vb) || 0; }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ?  1 : -1;
      return 0;
    });
  }, [sourceTrades, sortKey, sortDir]);

  const maxAbsPnl = useMemo(() => Math.max(...sortedTrades.map(t => Math.abs(t.pnl ?? 0)), 1), [sortedTrades]);

  // Filtered stats
  const fStats = useMemo(() => {
    const wins     = sortedTrades.filter(t => (t.pnl ?? 0) >= 0);
    const losses   = sortedTrades.filter(t => (t.pnl ?? 0) <  0);
    const totalPnl = sortedTrades.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const gw = wins.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const gl = Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0));
    return {
      total: sortedTrades.length, wins: wins.length, losses: losses.length,
      winRate: sortedTrades.length ? (wins.length / sortedTrades.length) * 100 : 0,
      totalPnl, pf: gl > 0 ? gw / gl : gw > 0 ? 999 : 0,
    };
  }, [sortedTrades]);

  function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        const count = onImport?.(data);
        setImportMsg({ text: `✓ Import berhasil (${count ?? "?"} trades)`, type: "success" });
      } catch {
        setImportMsg({ text: "✗ Format file tidak valid", type: "error" });
      }
      setTimeout(() => setImportMsg({ text: "", type: "" }), 3000);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const thProps = { sortKey, sortDir, toggleSort };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 className="page-title">Trade Journal</h1>
          <p className="page-subtitle">
            {sortedTrades.length} trades
            {activeCount > 0 && (
              <span style={{ color: "var(--accent)", marginLeft: 8, fontSize: "var(--fs-xs)" }}>
                • {activeCount} filter aktif
              </span>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(f => !f)}
            style={{
              height: 30, display: "inline-flex", alignItems: "center", gap: 5,
              padding: "0 12px", borderRadius: "var(--r-sm)", cursor: "pointer",
              fontSize: "var(--fs-xs)", fontFamily: "var(--font-ui)",
              border: `1px solid ${activeCount > 0 ? "var(--accent)" : "var(--border)"}`,
              background: showFilters ? "var(--accent-dim)" : activeCount > 0 ? "var(--accent-dim)" : "var(--bg-subtle)",
              color: activeCount > 0 || showFilters ? "var(--accent)" : "var(--text-muted)",
              transition: "all var(--t-fast)",
            }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="4" y1="6" x2="20" y2="6"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
              <line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
            Filter{activeCount > 0 ? ` (${activeCount})` : ""}
          </button>

          {/* Import */}
          <label className="btn-ghost" style={{ height: 30, fontSize: "var(--fs-xs)", display: "inline-flex", alignItems: "center", cursor: "pointer", padding: "0 10px" }}>
            ↑ Import
            <input type="file" accept=".json,.csv" onChange={handleImport} style={{ display: "none" }}/>
          </label>

          {/* Add */}
          <button onClick={onAdd} className="btn-primary" style={{ height: 30, fontSize: "var(--fs-sm)" }}>
            + Log Trade
          </button>
        </div>
      </div>

      {/* ── Filter bar ── */}
      {showFilters && (
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)", padding: "14px 16px",
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          {/* Row 1 — search + pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {/* Search */}
            <div style={{ position: "relative" }}>
              <svg style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", opacity: 0.4, pointerEvents: "none" }} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text" value={filter.search ?? ""}
                onChange={e => setField("search", e.target.value)}
                placeholder="Cari pair, notes..."
                style={{ height: 28, paddingLeft: 26, paddingRight: 8, width: 160, fontSize: "var(--fs-xs)", borderRadius: "var(--r-sm)", border: `1px solid ${filter.search ? "var(--accent)" : "var(--border)"}`, background: filter.search ? "var(--accent-dim)" : "var(--bg-subtle)", color: "var(--text)", outline: "none" }}
              />
            </div>

            <Pill value={filter.market   ?? ""} onChange={v => setField("market", v)}   options={options.markets   ?? []} placeholder="Market"/>
            <Pill value={filter.side     ?? ""} onChange={v => setField("side", v)}     options={["BUY","SELL"]}          placeholder="Side"/>
            <Pill value={filter.result   ?? ""} onChange={v => setField("result", v)}   options={["win","loss"]}          placeholder="Result"/>
            <Pill value={filter.strategy ?? ""} onChange={v => setField("strategy", v)} options={options.strategies ?? []} placeholder="Strategy"/>
            <Pill value={filter.session  ?? ""} onChange={v => setField("session", v)}  options={options.sessions  ?? []} placeholder="Session"/>
            <Pill value={filter.emotion  ?? ""} onChange={v => setField("emotion", v)}  options={options.emotions  ?? []} placeholder="Emotion"/>
          </div>

          {/* Row 2 — date range + clear */}
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>Tanggal:</span>
            <input type="date" value={filter.dateFrom ?? ""} onChange={e => setField("dateFrom", e.target.value)}
              style={{ height: 28, padding: "0 8px", fontSize: "var(--fs-xs)", borderRadius: "var(--r-sm)", border: `1px solid ${filter.dateFrom ? "var(--accent)" : "var(--border)"}`, background: "var(--bg-subtle)", color: "var(--text)", outline: "none" }}/>
            <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>–</span>
            <input type="date" value={filter.dateTo ?? ""} onChange={e => setField("dateTo", e.target.value)}
              style={{ height: 28, padding: "0 8px", fontSize: "var(--fs-xs)", borderRadius: "var(--r-sm)", border: `1px solid ${filter.dateTo ? "var(--accent)" : "var(--border)"}`, background: "var(--bg-subtle)", color: "var(--text)", outline: "none" }}/>

            {activeCount > 0 && (
              <button onClick={clearFilter} style={{
                height: 28, padding: "0 10px", borderRadius: "var(--r-sm)", cursor: "pointer",
                fontSize: "var(--fs-xs)", fontFamily: "var(--font-ui)",
                border: "1px solid var(--danger)", background: "var(--danger-dim)",
                color: "var(--danger)",
              }}>
                ✕ Reset semua
              </button>
            )}

            {/* Active filter chips */}
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {Object.entries(filter).filter(([k, v]) => v && v !== "" && k !== "tags" && !["search","dateFrom","dateTo"].includes(k)).map(([k, v]) => (
                <span key={k} onClick={() => setField(k, "")} style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  height: 22, padding: "0 8px", borderRadius: 100,
                  background: "var(--accent-dim)", border: "1px solid var(--accent)",
                  color: "var(--accent)", fontSize: "var(--fs-2xs)", cursor: "pointer",
                  fontWeight: 600,
                }}>
                  {v} ✕
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Import message ── */}
      {importMsg.text && (
        <div style={{
          padding: "8px 12px", borderRadius: "var(--r-md)",
          background: importMsg.type === "success" ? "var(--success-dim)" : "var(--danger-dim)",
          border: `1px solid ${importMsg.type === "success" ? "var(--success)" : "var(--danger)"}`,
          fontSize: "var(--fs-sm)",
          color: importMsg.type === "success" ? "var(--success)" : "var(--danger)",
        }}>
          {importMsg.text}
        </div>
      )}

      {/* ── KPI bar ── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, 1fr)", gap: 8 }}>
        {[
          { label: "Total P&L",     val: formatCurrency(fStats.totalPnl, false, sym), color: fStats.totalPnl >= 0 ? "var(--success)" : "var(--danger)" },
          { label: "Win Rate",      val: `${fStats.winRate.toFixed(1)}%`,              color: fStats.winRate >= 50 ? "var(--success)" : "var(--warning)" },
          { label: "Profit Factor", val: fStats.pf >= 999 ? "∞" : fStats.pf.toFixed(2), color: fStats.pf >= 1.5 ? "var(--success)" : "var(--warning)" },
          { label: "Trades",        val: fStats.total,                                 color: "var(--text)" },
          { label: "W / L",         val: `${fStats.wins} / ${fStats.losses}`,          color: "var(--text-muted)" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--r-md)", padding: "8px 12px" }}>
            <div className="kpi-label">{s.label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-lg)", fontWeight: 700, color: s.color, marginTop: 2, lineHeight: 1 }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      {sortedTrades.length === 0 ? (
        <div className="stat-card">
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">{activeCount > 0 ? "Tidak ada trade yang cocok" : "Belum ada trade"}</div>
            <div className="empty-desc">{activeCount > 0 ? "Coba ubah atau reset filter" : "Klik + Log Trade untuk mulai mencatat"}</div>
            {activeCount > 0
              ? <button onClick={clearFilter} className="btn-ghost" style={{ marginTop: 14 }}>Reset Filter</button>
              : <button onClick={onAdd} className="btn-primary" style={{ marginTop: 14 }}>+ Log Trade</button>
            }
          </div>
        </div>
      ) : (
        <div className="journal-table-wrap">
          <div style={{ overflowX: "auto" }}>
            <table className="journal-table">
              <thead>
                <tr>
                  <SortTh label="Date"      k="date"     {...thProps}/>
                  <SortTh label="Pair"      k="pair"     {...thProps}/>
                  <th>Side</th>
                  {!isMobile && <SortTh label="Entry"    k="entry"    {...thProps} right/>}
                  {!isMobile && <SortTh label="Exit"     k="exit"     {...thProps} right/>}
                  {!isMobile && <SortTh label="Size"     k="size"     {...thProps} right/>}
                  <SortTh label="P&L"       k="pnl"      {...thProps} right/>
                  {!isMobile && <SortTh label="R:R"      k="rr"       {...thProps} right/>}
                  {!isMobile && <SortTh label="Strategy" k="strategy" {...thProps}/>}
                  {!isMobile && <SortTh label="Session"  k="session"  {...thProps}/>}
                  <th className="text-right" style={{ width: 76 }}/>
                </tr>
              </thead>
              <tbody>
                {sortedTrades.map(tr => {
                  const win = (tr.pnl ?? 0) >= 0;
                  return (
                    <tr key={tr.id} onClick={() => onEdit?.(tr)} className="journal-row" style={{ cursor: "pointer" }}>
                      <td className="td-date">
                        <span className="date-full">{tr.date}</span>
                        <span className="date-short">{tr.date?.slice(5)}</span>
                      </td>
                      <td className="td-pair">{tr.pair}</td>
                      <td>
                        <span className={`badge ${tr.side === "BUY" ? "badge-green" : "badge-yellow"}`}>{tr.side}</span>
                      </td>
                      {!isMobile && <td className="td-price text-right">{tr.entry || "—"}</td>}
                      {!isMobile && <td className="td-price text-right">{tr.exit  || "—"}</td>}
                      {!isMobile && <td className="td-price text-right">{tr.size  || "—"}</td>}
                      <td className="text-right">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                          {!isMobile && <PnlBar pnl={tr.pnl ?? 0} maxAbs={maxAbsPnl}/>}
                          <span className={`pnl-val ${win ? "pnl-win" : "pnl-loss"}`}>
                            {win ? "+" : ""}{formatCurrency(tr.pnl ?? 0, true, sym)}
                          </span>
                        </div>
                      </td>
                      {!isMobile && (
                        <td className="text-right">
                          <span className={`rr-chip ${(parseFloat(tr.rr) || 0) >= 1 ? "rr-good" : "rr-low"}`}>
                            {tr.rr ? `${parseFloat(tr.rr).toFixed(1)}R` : "—"}
                          </span>
                        </td>
                      )}
                      {!isMobile && <td className="td-tag">{tr.strategy || "—"}</td>}
                      {!isMobile && <td className="td-tag">{tr.session  || "—"}</td>}
                      <td className="td-actions text-right" onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: 3, justifyContent: "flex-end" }}>
                          {onReplay && (
                            <button className="btn-icon row-action" title="Replay" onClick={() => onReplay(tr)}>
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                            </button>
                          )}
                          <button className="btn-icon row-action" title="Edit" onClick={() => onEdit?.(tr)}>
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button className="btn-icon row-action row-delete" title="Delete"
                            onClick={() => { if (window.confirm("Hapus trade ini?")) onDelete?.(tr.id); }}>
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div style={{ padding: "9px 16px", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "var(--fs-xs)", color: "var(--text-dim)", background: "var(--bg-card2)" }}>
            <span>{fStats.total} trade{fStats.total !== 1 ? "s" : ""} · {fStats.wins}W {fStats.losses}L · {fStats.winRate.toFixed(0)}% WR</span>
            <span style={{ fontFamily: "var(--font-mono)", color: fStats.totalPnl >= 0 ? "var(--success)" : "var(--danger)", fontWeight: 700 }}>
              {fStats.totalPnl >= 0 ? "+" : ""}{formatCurrency(fStats.totalPnl, false, sym)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}