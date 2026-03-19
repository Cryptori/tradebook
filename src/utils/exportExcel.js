// Export ke Excel menggunakan SheetJS (xlsx) — pure client side
// SheetJS sudah tersedia via CDN di index.html atau bisa import dari npm

async function loadXLSX() {
  // Lazy load SheetJS
  if (window.XLSX) return window.XLSX;
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.onload = () => resolve(window.XLSX);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// ── Style helpers ─────────────────────────────────────────────────
function headerStyle() {
  return {
    font:      { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
    fill:      { fgColor: { rgb: "1a2744" }, patternType: "solid" },
    alignment: { horizontal: "center", vertical: "center" },
    border:    { bottom: { style: "thin", color: { rgb: "00d4aa" } } },
  };
}

function cellStyle(pnl) {
  const color = pnl > 0 ? "00c896" : pnl < 0 ? "ef4444" : "ffffff";
  return {
    font:      { color: { rgb: color }, sz: 10 },
    alignment: { vertical: "center" },
  };
}

function numStyle(pnl) {
  return {
    font:      { color: { rgb: pnl >= 0 ? "00c896" : "ef4444" }, bold: true, sz: 10 },
    alignment: { horizontal: "right", vertical: "center" },
    numFmt:    "#,##0.00",
  };
}

// ── Sheet 1: Trade Log ────────────────────────────────────────────
function buildTradeSheet(XLSX, trades, sym) {
  const headers = ["#", "Date", "Market", "Pair", "Side", "Entry", "Exit", "SL", "TP", "Size", `P&L (${sym})`, "R:R", "Session", "Strategy", "Emotion", "Tags", "Notes", "Result"];

  const rows = [...trades]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((t, i) => [
      i + 1,
      t.date,
      t.market      || "",
      t.pair        || "",
      t.side        || "",
      t.entry       || 0,
      t.exit        || 0,
      t.stopLoss    || 0,
      t.takeProfit  || 0,
      t.size        || 0,
      t.pnl         || 0,
      t.rr          || 0,
      t.session     || "",
      t.strategy    || "",
      t.emotion     || "",
      (t.tags || []).join(", "),
      t.notes       || "",
      t.pnl >= 0 ? "WIN" : "LOSS",
    ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Style headers
  const range = XLSX.utils.decode_range(ws["!ref"]);
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
    if (cell) cell.s = headerStyle();
  }

  // Style P&L column (index 10) and Result (index 17)
  for (let r = 1; r <= rows.length; r++) {
    const pnlCell = ws[XLSX.utils.encode_cell({ r, c: 10 })];
    if (pnlCell) pnlCell.s = numStyle(rows[r-1][10]);
    const rrCell = ws[XLSX.utils.encode_cell({ r, c: 11 })];
    if (rrCell) rrCell.s = numStyle(rows[r-1][11]);
  }

  // Column widths
  ws["!cols"] = [
    { wch: 4 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 6 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 8 },
    { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 14 }, { wch: 12 },
    { wch: 16 }, { wch: 24 }, { wch: 8 },
  ];

  ws["!freeze"] = { xSplit: 0, ySplit: 1 };

  return ws;
}

// ── Sheet 2: Monthly Summary ──────────────────────────────────────
function buildMonthlySheet(XLSX, trades, sym) {
  const months = {};
  trades.forEach(t => {
    const m = (t.date || "").slice(0, 7);
    if (!m) return;
    if (!months[m]) months[m] = { month: m, trades: 0, wins: 0, losses: 0, pnl: 0, grossWin: 0, grossLoss: 0, rrs: [] };
    months[m].trades++;
    months[m].pnl += t.pnl || 0;
    if (t.pnl > 0) { months[m].wins++; months[m].grossWin += t.pnl; }
    else { months[m].losses++; months[m].grossLoss += Math.abs(t.pnl || 0); }
    if (t.rr) months[m].rrs.push(t.rr);
  });

  const headers = ["Month", "Trades", "Wins", "Losses", "Win Rate %", `P&L (${sym})`, "Gross Win", "Gross Loss", "Profit Factor", "Avg R:R"];
  const rows = Object.values(months).sort((a, b) => a.month.localeCompare(b.month)).map(m => [
    m.month,
    m.trades,
    m.wins,
    m.losses,
    m.trades > 0 ? parseFloat(((m.wins / m.trades) * 100).toFixed(1)) : 0,
    parseFloat(m.pnl.toFixed(2)),
    parseFloat(m.grossWin.toFixed(2)),
    parseFloat(m.grossLoss.toFixed(2)),
    m.grossLoss > 0 ? parseFloat((m.grossWin / m.grossLoss).toFixed(2)) : m.grossWin > 0 ? 999 : 0,
    m.rrs.length > 0 ? parseFloat((m.rrs.reduce((s, r) => s + r, 0) / m.rrs.length).toFixed(2)) : 0,
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Style headers
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
    if (cell) cell.s = headerStyle();
  }

  ws["!cols"] = [{ wch: 10 }, { wch: 8 }, { wch: 6 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 10 }];

  return ws;
}

// ── Sheet 3: Strategy Performance ────────────────────────────────
function buildStrategySheet(XLSX, trades, sym) {
  const strategies = {};
  trades.forEach(t => {
    const s = t.strategy || "Unknown";
    if (!strategies[s]) strategies[s] = { strategy: s, trades: 0, wins: 0, pnl: 0, rrs: [] };
    strategies[s].trades++;
    strategies[s].pnl += t.pnl || 0;
    if (t.pnl > 0) strategies[s].wins++;
    if (t.rr) strategies[s].rrs.push(t.rr);
  });

  const headers = ["Strategy", "Trades", "Wins", "Win Rate %", `Total P&L (${sym})`, "Avg R:R"];
  const rows = Object.values(strategies).sort((a, b) => b.pnl - a.pnl).map(s => [
    s.strategy,
    s.trades,
    s.wins,
    s.trades > 0 ? parseFloat(((s.wins / s.trades) * 100).toFixed(1)) : 0,
    parseFloat(s.pnl.toFixed(2)),
    s.rrs.length > 0 ? parseFloat((s.rrs.reduce((a, b) => a + b, 0) / s.rrs.length).toFixed(2)) : 0,
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
    if (cell) cell.s = headerStyle();
  }
  ws["!cols"] = [{ wch: 16 }, { wch: 8 }, { wch: 6 }, { wch: 12 }, { wch: 14 }, { wch: 10 }];
  return ws;
}

// ── Sheet 4: Stats Summary ────────────────────────────────────────
function buildSummarySheet(XLSX, trades, stats, settings, sym) {
  const capital    = settings?.capitalInitial || 10000;
  const totalPnl   = stats?.totalPnl   || 0;
  const equity     = capital + totalPnl;
  const returnPct  = capital > 0 ? (totalPnl / capital) * 100 : 0;

  const data = [
    ["TRADEBOOK — Performance Summary", ""],
    ["Generated", new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })],
    ["", ""],
    ["ACCOUNT", ""],
    ["Starting Capital", capital],
    ["Current Equity", equity],
    ["Total P&L", totalPnl],
    ["Return %", parseFloat(returnPct.toFixed(2))],
    ["", ""],
    ["PERFORMANCE", ""],
    ["Total Trades", stats?.totalTrades || 0],
    ["Wins", stats?.wins || 0],
    ["Losses", stats?.losses || 0],
    ["Win Rate %", parseFloat((stats?.winRate || 0).toFixed(1))],
    ["Profit Factor", parseFloat((stats?.profitFactor || 0).toFixed(2))],
    ["Avg R:R", parseFloat((stats?.avgRR || 0).toFixed(2))],
    ["Best Trade", stats?.bestTrade || 0],
    ["Worst Trade", stats?.worstTrade || 0],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = [{ wch: 20 }, { wch: 16 }];
  return ws;
}

// ── Main export function ──────────────────────────────────────────
export async function exportToExcel(trades, stats, settings, currencyMeta) {
  if (!trades?.length) {
    alert("Tidak ada trade untuk di-export.");
    return;
  }

  try {
    const XLSX = await loadXLSX();
    const sym  = currencyMeta?.symbol || "$";
    const wb   = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, buildSummarySheet(XLSX, trades, stats, settings, sym),  "Summary");
    XLSX.utils.book_append_sheet(wb, buildTradeSheet(XLSX, trades, sym),                      "Trade Log");
    XLSX.utils.book_append_sheet(wb, buildMonthlySheet(XLSX, trades, sym),                    "Monthly");
    XLSX.utils.book_append_sheet(wb, buildStrategySheet(XLSX, trades, sym),                   "Strategy");

    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `tradebook-export-${date}.xlsx`);
  } catch (err) {
    console.error("Export Excel error:", err);
    alert("Gagal export Excel. Coba lagi.");
  }
}