import { formatCurrency, formatPct } from "./formatters";

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Build equity curve as inline SVG ─────────────────────────────
function buildEquitySvg(trades, capital) {
  if (!trades.length) return "";

  const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  let eq = capital;
  const points = [{ date: "Start", eq }];
  sorted.forEach(t => {
    eq += t.pnl;
    points.push({ date: t.date.slice(5), eq });
  });

  const W = 720, H = 160, PAD = 40;
  const minEq = Math.min(...points.map(p => p.eq));
  const maxEq = Math.max(...points.map(p => p.eq));
  const range = maxEq - minEq || 1;

  const x = i => PAD + (i / (points.length - 1)) * (W - PAD * 2);
  const y = v => PAD + (1 - (v - minEq) / range) * (H - PAD * 2);

  const polyline = points.map((p, i) => `${x(i).toFixed(1)},${y(p.eq).toFixed(1)}`).join(" ");
  const fillPath = `M${x(0)},${y(points[0].eq)} ` +
    points.map((p, i) => `L${x(i).toFixed(1)},${y(p.eq).toFixed(1)}`).join(" ") +
    ` L${x(points.length - 1)},${H - PAD} L${x(0)},${H - PAD} Z`;

  const lastEq  = points[points.length - 1].eq;
  const isProfit = lastEq >= capital;
  const lineColor = isProfit ? "#0d9488" : "#dc2626";
  const fillColor = isProfit ? "rgba(13,148,136,0.08)" : "rgba(220,38,38,0.08)";

  // Y axis labels
  const yLabels = [minEq, (minEq + maxEq) / 2, maxEq].map(v =>
    `<text x="${PAD - 6}" y="${y(v) + 4}" text-anchor="end" fill="#94a3b8" font-size="9">${(v / 1000).toFixed(1)}k</text>`
  ).join("");

  // X axis — show first, middle, last date
  const xLabels = [0, Math.floor(points.length / 2), points.length - 1].map(i =>
    `<text x="${x(i)}" y="${H - PAD + 16}" text-anchor="middle" fill="#94a3b8" font-size="9">${points[i].date}</text>`
  ).join("");

  return `
    <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto">
      <defs>
        <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${lineColor}" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="${lineColor}" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <!-- Grid lines -->
      <line x1="${PAD}" y1="${PAD}" x2="${PAD}" y2="${H - PAD}" stroke="#e2e8f0" stroke-width="1"/>
      <line x1="${PAD}" y1="${H - PAD}" x2="${W - PAD}" y2="${H - PAD}" stroke="#e2e8f0" stroke-width="1"/>
      <line x1="${PAD}" y1="${y((minEq + maxEq) / 2)}" x2="${W - PAD}" y2="${y((minEq + maxEq) / 2)}" stroke="#f1f5f9" stroke-width="1" stroke-dasharray="4,4"/>
      <!-- Fill -->
      <path d="${fillPath}" fill="url(#eqGrad)"/>
      <!-- Line -->
      <polyline points="${polyline}" fill="none" stroke="${lineColor}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      <!-- Dot at last point -->
      <circle cx="${x(points.length - 1)}" cy="${y(lastEq)}" r="4" fill="${lineColor}"/>
      ${yLabels}
      ${xLabels}
    </svg>`;
}

// ── Build market breakdown table rows ────────────────────────────
function buildMarketRows(trades, sym) {
  const markets = {};
  trades.forEach(t => {
    const m = t.market || "Other";
    if (!markets[m]) markets[m] = { pnl: 0, count: 0, wins: 0 };
    markets[m].pnl += t.pnl;
    markets[m].count++;
    if (t.pnl > 0) markets[m].wins++;
  });
  return Object.entries(markets)
    .sort((a, b) => b[1].pnl - a[1].pnl)
    .map(([m, d]) => `
      <tr>
        <td>${esc(m)}</td>
        <td>${d.count}</td>
        <td>${((d.wins / d.count) * 100).toFixed(0)}%</td>
        <td class="${d.pnl >= 0 ? "pos" : "neg"}" style="font-weight:500">${formatCurrency(d.pnl, false, sym)}</td>
      </tr>`).join("");
}

// ── Main export function ──────────────────────────────────────────
export function generatePdfReport(trades, stats, settings, currencyMeta, monthFilter = null) {
  if (!trades?.length) {
    alert("Tidak ada trade untuk di-export.");
    return;
  }

  // Filter by month if specified
  const filtered = monthFilter
    ? trades.filter(t => t.date.startsWith(monthFilter))
    : trades;

  if (!filtered.length) {
    alert(`Tidak ada trade untuk bulan ${monthFilter}.`);
    return;
  }

  const sym     = currencyMeta?.symbol ?? "$";
  const capital = settings?.capitalInitial ?? 10000;

  // Recalculate stats for filtered trades
  const wins       = filtered.filter(t => t.pnl > 0);
  const losses     = filtered.filter(t => t.pnl <= 0);
  const totalPnl   = filtered.reduce((s, t) => s + t.pnl, 0);
  const winRate    = filtered.length ? (wins.length / filtered.length) * 100 : 0;
  const avgWin     = wins.length   ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
  const avgLoss    = losses.length ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : 0;
  const grossProfit = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss   = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const pf          = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;
  const avgRR       = filtered.filter(t => t.rr).reduce((s, t) => s + (t.rr ?? 0), 0) / (filtered.filter(t => t.rr).length || 1);
  const totalReturn = capital > 0 ? (totalPnl / capital) * 100 : 0;

  // Monthly breakdown (only if not already filtered to 1 month)
  const monthly = {};
  filtered.forEach(t => {
    const m = t.date.slice(0, 7);
    if (!monthly[m]) monthly[m] = { pnl: 0, trades: 0, wins: 0 };
    monthly[m].pnl += t.pnl;
    monthly[m].trades++;
    if (t.pnl > 0) monthly[m].wins++;
  });

  // Strategy breakdown
  const strategies = {};
  filtered.forEach(t => {
    const s = t.strategy || "Other";
    if (!strategies[s]) strategies[s] = { pnl: 0, count: 0, wins: 0 };
    strategies[s].pnl += t.pnl;
    strategies[s].count++;
    if (t.pnl > 0) strategies[s].wins++;
  });

  const sortedTrades = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));

  const dateStr = new Date().toLocaleDateString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const reportTitle = monthFilter
    ? `Report — ${new Date(monthFilter + "-01").toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`
    : `Full Report — ${dateStr}`;

  const equitySvg = buildEquitySvg(filtered, capital);

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Tradebook ${reportTitle}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Mono', monospace; background: #fff; color: #0f172a; font-size: 12px; padding: 40px 48px; }

  /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 36px; padding-bottom: 20px; border-bottom: 2px solid #0f172a; }
  .logo { font-size: 36px; font-weight: 700; letter-spacing: 5px; line-height: 1; }
  .logo-sub { font-size: 9px; color: #64748b; letter-spacing: 4px; margin-top: 4px; }
  .header-right { text-align: right; font-size: 11px; color: #64748b; }
  .header-right strong { font-size: 15px; color: #0f172a; display: block; margin-bottom: 4px; }

  /* Sections */
  .section { margin-bottom: 32px; }
  .section-title { font-size: 9px; text-transform: uppercase; letter-spacing: 0.15em; color: #94a3b8; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; gap: 8px; }
  .section-title::before { content: ""; display: inline-block; width: 3px; height: 12px; background: #0d9488; border-radius: 2px; }

  /* Stats grid */
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; }
  .stat-label { font-size: 8px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 6px; }
  .stat-value { font-size: 18px; font-weight: 500; line-height: 1.2; }
  .stat-sub { font-size: 9px; color: #94a3b8; margin-top: 3px; }
  .pos { color: #0d9488; }
  .neg { color: #dc2626; }
  .neu { color: #0f172a; }

  /* Chart */
  .chart-wrap { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 12px 8px; }
  .chart-title { font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px; }

  /* Tables */
  table { width: 100%; border-collapse: collapse; }
  th { font-size: 8px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; text-align: left; padding: 8px 10px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
  td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px; color: #334155; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #fafafa; }

  /* Badges */
  .badge { padding: 2px 7px; border-radius: 4px; font-size: 9px; font-weight: 500; display: inline-block; }
  .badge-buy  { background: #d1fae5; color: #065f46; }
  .badge-sell { background: #fef3c7; color: #92400e; }
  .badge-win  { background: #d1fae5; color: #065f46; }
  .badge-loss { background: #fee2e2; color: #991b1b; }

  /* Screenshots */
  .screenshot-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .screenshot-item { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
  .screenshot-item img { width: 100%; height: 180px; object-fit: cover; display: block; }
  .screenshot-caption { padding: 8px 10px; font-size: 9px; color: #64748b; background: #f8fafc; display: flex; justify-content: space-between; }

  /* Footer */
  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; display: flex; justify-content: space-between; align-items: center; }
  .footer-accent { color: #0d9488; font-weight: 500; }

  /* Page break */
  .page-break { page-break-before: always; margin-top: 0; padding-top: 32px; }

  @media print {
    body { padding: 24px 32px; }
    .section { page-break-inside: avoid; }
  }
</style>
</head>
<body>

<!-- ── HEADER ── -->
<div class="header">
  <div>
    <div class="logo">TRADEBOOK</div>
    <div class="logo-sub">TRADING JOURNAL & PORTFOLIO REPORT</div>
  </div>
  <div class="header-right">
    <strong>${reportTitle}</strong>
    <div>${filtered.length} trades · ${currencyMeta?.code ?? "USD"}</div>
    <div>Generated: ${dateStr}</div>
  </div>
</div>

<!-- ── PERFORMANCE SUMMARY ── -->
<div class="section">
  <div class="section-title">Performance Summary</div>
  <div class="stats-grid">
    ${[
      ["Total P&L",      formatCurrency(totalPnl, false, sym),  totalPnl >= 0 ? "pos" : "neg", `${formatPct(totalReturn)} return`],
      ["Win Rate",       `${winRate.toFixed(1)}%`,              winRate >= 50  ? "pos" : "neg", `${wins.length}W / ${losses.length}L`],
      ["Profit Factor",  pf >= 999 ? "∞" : pf.toFixed(2),       pf >= 1       ? "pos" : "neg", pf >= 1 ? "Profitable" : "Unprofitable"],
      ["Avg R:R",        avgRR.toFixed(2) + "R",                avgRR >= 1     ? "pos" : "neg", "per trade"],
      ["Avg Win",        formatCurrency(avgWin, false, sym),    "pos",  `${wins.length} wins`],
      ["Avg Loss",       formatCurrency(avgLoss, false, sym),   "neg",  `${losses.length} losses`],
      ["Total Trades",   filtered.length,                       "neu",  `${monthFilter ?? "all time"}`],
      ["Final Balance",  formatCurrency(capital + totalPnl, false, sym), totalPnl >= 0 ? "pos" : "neg", `from ${formatCurrency(capital, false, sym)}`],
    ].map(([label, value, cls, sub]) => `
      <div class="stat-box">
        <div class="stat-label">${label}</div>
        <div class="stat-value ${cls}">${value}</div>
        <div class="stat-sub">${sub}</div>
      </div>`).join("")}
  </div>
</div>

<!-- ── EQUITY CURVE ── -->
${equitySvg ? `
<div class="section">
  <div class="section-title">Equity Curve</div>
  <div class="chart-wrap">
    <div class="chart-title">Portfolio value over time · Starting capital: ${formatCurrency(capital, false, sym)}</div>
    ${equitySvg}
  </div>
</div>` : ""}

<!-- ── MONTHLY BREAKDOWN ── -->
${Object.keys(monthly).length > 1 ? `
<div class="section">
  <div class="section-title">Monthly Breakdown</div>
  <table>
    <thead><tr><th>Month</th><th>Trades</th><th>Wins</th><th>Losses</th><th>Win Rate</th><th>P&L</th></tr></thead>
    <tbody>
      ${Object.entries(monthly)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([m, d]) => `
      <tr>
        <td style="font-weight:500">${m}</td>
        <td>${d.trades}</td>
        <td class="pos">${d.wins}</td>
        <td class="neg">${d.trades - d.wins}</td>
        <td><span class="badge ${d.wins / d.trades >= 0.5 ? "badge-win" : "badge-loss"}">${((d.wins / d.trades) * 100).toFixed(0)}%</span></td>
        <td class="${d.pnl >= 0 ? "pos" : "neg"}" style="font-weight:500">${formatCurrency(d.pnl, false, sym)}</td>
      </tr>`).join("")}
    </tbody>
  </table>
</div>` : ""}

<!-- ── STRATEGY & MARKET BREAKDOWN ── -->
<div class="section" style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
  <div>
    <div class="section-title">Strategy Performance</div>
    <table>
      <thead><tr><th>Strategy</th><th>Trades</th><th>Win%</th><th>P&L</th></tr></thead>
      <tbody>
        ${Object.entries(strategies)
          .sort((a, b) => b[1].pnl - a[1].pnl)
          .map(([s, d]) => `
        <tr>
          <td style="font-weight:500">${esc(s)}</td>
          <td>${d.count}</td>
          <td>${((d.wins / d.count) * 100).toFixed(0)}%</td>
          <td class="${d.pnl >= 0 ? "pos" : "neg"}" style="font-weight:500">${formatCurrency(d.pnl, false, sym)}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>
  <div>
    <div class="section-title">Market Breakdown</div>
    <table>
      <thead><tr><th>Market</th><th>Trades</th><th>Win%</th><th>P&L</th></tr></thead>
      <tbody>${buildMarketRows(filtered, sym)}</tbody>
    </table>
  </div>
</div>

<!-- ── TRADE LOG ── -->
<div class="section page-break">
  <div class="section-title">Trade Log (${sortedTrades.length} trades)</div>
  <table>
    <thead>
      <tr>
        <th>Date</th><th>Pair</th><th>Market</th><th>Side</th>
        <th>Entry</th><th>Exit</th><th>Size</th>
        <th>P&L</th><th>R:R</th><th>Strategy</th><th>Emotion</th>
      </tr>
    </thead>
    <tbody>
      ${sortedTrades.map(t => `
      <tr>
        <td style="white-space:nowrap">${t.date}</td>
        <td style="font-weight:500">${esc(t.pair)}</td>
        <td>${esc(t.market)}</td>
        <td><span class="badge badge-${(t.side ?? "").toLowerCase()}">${esc(t.side)}</span></td>
        <td>${t.entry}</td>
        <td>${t.exit}</td>
        <td>${t.size}</td>
        <td class="${t.pnl >= 0 ? "pos" : "neg"}" style="font-weight:500">${formatCurrency(t.pnl, false, sym)}</td>
        <td class="${(t.rr ?? 0) >= 0 ? "pos" : "neg"}">${(t.rr ?? 0) >= 0 ? "+" : ""}${(t.rr ?? 0).toFixed(1)}R</td>
        <td>${esc(t.strategy)}</td>
        <td>${esc(t.emotion)}</td>
      </tr>`).join("")}
    </tbody>
  </table>
</div>

<!-- ── SCREENSHOTS ── -->
${(() => {
  const withScreenshots = sortedTrades.filter(t => t.screenshotUrl && !t.screenshotUrl.startsWith("data:"));
  if (!withScreenshots.length) return "";
  return `
<div class="section page-break">
  <div class="section-title">Trade Screenshots (${withScreenshots.length})</div>
  <div class="screenshot-grid">
    ${withScreenshots.slice(0, 12).map(t => `
    <div class="screenshot-item">
      <img src="${esc(t.screenshotUrl)}" alt="${esc(t.pair)}" onerror="this.parentElement.style.display='none'"/>
      <div class="screenshot-caption">
        <span>${t.date} · ${esc(t.pair)} · ${esc(t.side)}</span>
        <span class="${t.pnl >= 0 ? "pos" : "neg"}">${formatCurrency(t.pnl, false, sym)}</span>
      </div>
    </div>`).join("")}
  </div>
</div>`;
})()}

<!-- ── FOOTER ── -->
<div class="footer">
  <span>Tradebook Trading Journal · ${dateStr}</span>
  <span>
    Final Balance: <span class="footer-accent">${formatCurrency(capital + totalPnl, false, sym)}</span>
    · Return: <span class="footer-accent">${formatPct(totalReturn)}</span>
  </span>
</div>

<script>
  // Wait for images to load before printing
  window.onload = function() {
    const imgs = document.querySelectorAll("img");
    if (!imgs.length) { window.print(); return; }
    let loaded = 0;
    const tryPrint = () => { if (++loaded >= imgs.length) window.print(); };
    imgs.forEach(img => {
      if (img.complete) tryPrint();
      else { img.onload = tryPrint; img.onerror = tryPrint; }
    });
  };
</script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, "_blank");
  if (!win) alert("Popup diblock browser. Izinkan popup untuk generate PDF.");
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}