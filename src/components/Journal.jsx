import React, { useRef, useState } from "react";
import { useBreakpoint } from "../hooks/useBreakpoint";
import TradeDetailModal from "./TradeDetailModal";
import { MARKETS } from "../constants";
import { formatCurrency } from "../utils/formatters";
import { exportToCsv }   from "../utils/exportCsv";
import { exportToExcel }      from "../utils/exportExcel";
import BrokerImportModal from "./BrokerImportModal";
import { parseCsvFile } from "../utils/importCsv";
import DateRangeFilter from "./DateRangeFilter";


function Alert({ msg, color, bg, border }) {
  if (!msg) return null;
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color, marginBottom: 12 }}>
      {msg}
    </div>
  );
}

export default function Journal({
  filteredTrades, filterMarket, setFilterMarket,
  dateFrom, dateTo, onFromChange, onToChange, onClearDates,
  onAdd, onEdit, onDelete, onImport, theme, currencyMeta,
  trades, stats, settings, onShareTrade,
}) {
  const t       = theme;
  const fileRef = useRef(null);
  const sym     = currencyMeta?.symbol ?? "$";
  const { isMobile } = useBreakpoint();
  const [showBrokerImport, setShowBrokerImport] = React.useState(false);

  const COL_TEMPLATE = isMobile
    ? "80px 1fr 60px 80px 60px"
    : "90px 1fr 80px 80px 80px 80px 80px 80px 100px";
  const COL_HEADERS = isMobile
    ? ["Date", "Pair", "Side", "P&L", ""]
    : ["Date", "Pair", "Side", "Entry", "Exit", "Size", "P&L", "R:R", "Actions"];
  const [importError,   setImportError]   = useState("");
  const [importSuccess, setImportSuccess] = useState("");
  const [selectedTrade, setSelectedTrade] = useState(null);

  function handleExport() {
    const date   = new Date().toISOString().split("T")[0];
    const market = filterMarket === "All" ? "all" : filterMarket.toLowerCase().replace(/\s+/g, "-");
    exportToCsv(filteredTrades, `tradebook-${market}-${date}.csv`);
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError("");
    setImportSuccess("");
    try {
      const trades = await parseCsvFile(file);
      onImport(trades);
      setImportSuccess(`✓ ${trades.length} trades berhasil diimport!`);
      setTimeout(() => setImportSuccess(""), 4000);
    } catch (err) {
      setImportError(err.message);
      setTimeout(() => setImportError(""), 5000);
    }
    e.target.value = "";
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2, color: t.text }}>TRADE LOG</div>
          <div style={{ fontSize: 11, color: t.textDim }}>{filteredTrades.length} trades</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select value={filterMarket} onChange={e => setFilterMarket(e.target.value)}
            style={{ width: "auto", padding: "8px 12px", background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, fontFamily: "DM Mono, monospace", fontSize: 13, outline: "none" }}>
            <option value="All">All Markets</option>
            {MARKETS.map(m => <option key={m}>{m}</option>)}
          </select>
          <button className="btn-ghost" onClick={handleExport} disabled={filteredTrades.length === 0}>↓ CSV</button>
              <button className="btn-ghost" onClick={() => exportToExcel(trades, stats, settings, currencyMeta)} disabled={trades.length === 0}>↓ Excel</button>
              <button className="btn-primary" onClick={() => setShowBrokerImport(true)} style={{ fontSize: 11, padding: "6px 12px" }}>↑ Import Broker</button>
          <button className="btn-ghost" onClick={() => fileRef.current?.click()}>↑ Import CSV</button>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleImportFile} style={{ display: "none" }} />
          <button className="btn-primary" onClick={onAdd}>+ LOG TRADE</button>
        </div>
      </div>

      {/* Date filter */}
      <div style={{ marginBottom: 16 }}>
        <DateRangeFilter dateFrom={dateFrom} dateTo={dateTo} onFromChange={onFromChange} onToChange={onToChange} onClear={onClearDates} theme={t} />
      </div>

      {/* Import feedback */}
      <Alert msg={importError   ? `⚠️ ${importError}` : ""} color="#ef4444" bg="rgba(239,68,68,0.1)"  border="#ef4444" />
      <Alert msg={importSuccess}                             color="#00d4aa" bg="rgba(0,212,170,0.1)"  border="#00d4aa" />

      {/* Table header */}
      <div style={{ display: "grid", gridTemplateColumns: COL_TEMPLATE, gap: 8, padding: "8px 18px", fontSize: 10, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
        {COL_HEADERS.map(h => <span key={h}>{h}</span>)}
      </div>

      {/* Rows */}
      {filteredTrades.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: t.textDim, fontSize: 13 }}>
          No trades found. Try adjusting filters or click "+ LOG TRADE".
        </div>
      ) : (
        filteredTrades.map(trade => (
          <div key={trade.id}
            style={{ background: t.bgCard, border: `1px solid ${t.borderSubtle}`, borderRadius: 8, padding: "14px 18px", display: "grid", gridTemplateColumns: COL_TEMPLATE, gap: 8, alignItems: "center", fontSize: 12, marginBottom: 4, transition: "background 0.15s", cursor: "pointer" }}
            onClick={() => setSelectedTrade(trade)}
            onMouseEnter={e => { e.currentTarget.style.background = t.bgHover; }}
            onMouseLeave={e => { e.currentTarget.style.background = t.bgCard; }}>
            <span style={{ color: t.textDim, fontSize: 11 }}>{trade.date.slice(5)}</span>
            <div style={{ display: "flex", gap: 6, alignItems: "center", minWidth: 0 }}>
              <span style={{ color: t.text, fontWeight: 500, whiteSpace: "nowrap" }}>{trade.pair}</span>
              {!isMobile && <span className="badge badge-market" style={{ fontSize: 9, whiteSpace: "nowrap" }}>{trade.market}</span>}
            </div>
            <span className={`badge badge-${trade.side.toLowerCase()}`}>{trade.side}</span>
            {!isMobile && <span style={{ color: t.textMuted }}>{trade.entry}</span>}
            {!isMobile && <span style={{ color: t.textMuted }}>{trade.exit}</span>}
            {!isMobile && <span style={{ color: t.textMuted }}>{trade.size}</span>}
            <span style={{ color: trade.pnl >= 0 ? "#00d4aa" : "#ef4444" }}>{formatCurrency(trade.pnl, true, sym)}</span>
            {!isMobile && <span style={{ color: (trade.rr ?? 0) >= 0 ? "#00d4aa" : "#ef4444" }}>
              {(trade.rr ?? 0) >= 0 ? "+" : ""}{(trade.rr ?? 0).toFixed(1)}R
            </span>}
            {isMobile
              ? <span style={{ color: t.textDim, fontSize: 10 }}>→</span>
              : <div style={{ display: "flex", gap: 4 }}>
                  <button className="btn-ghost" onClick={e => { e.stopPropagation(); setSelectedTrade(trade); }}>View</button>
                </div>
            }
          </div>
        ))
      )}
      {/* Trade Detail Modal */}
      {selectedTrade && (
        <TradeDetailModal
          trade={selectedTrade}
          onClose={() => setSelectedTrade(null)}
          onEdit={trade => { setSelectedTrade(null); onEdit(trade); }}
          onDelete={id => { setSelectedTrade(null); onDelete(id); }}
          currencyMeta={currencyMeta}
          theme={t}
        />
      )}

      {showBrokerImport && (
        <BrokerImportModal
          onImport={(importedTrades) => {
            if (onImport) onImport(importedTrades);
            setShowBrokerImport(false);
          }}
          existingTrades={trades}
          theme={theme}
          onClose={() => setShowBrokerImport(false)}
        />
      )}
    </div>
  );
}