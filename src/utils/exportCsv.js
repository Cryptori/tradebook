const CSV_HEADERS = [
  "Date", "Market", "Pair", "Side",
  "Entry", "Exit", "StopLoss", "TakeProfit", "Size",
  "PnL", "RR",
  "Session", "Strategy", "Emotion",
  "Notes", "Tags", "Screenshots",
  "StopLossRules", "Win/Loss",
];

function escapeCell(value) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCsv(trades, filename = "tradebook-export.csv") {
  if (!trades?.length) return;

  const rows = [...trades]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(t => {
      const screenshots = Array.isArray(t.screenshots)
        ? t.screenshots.join("|")
        : (t.screenshotUrl ?? "");
      return [
        t.date, t.market, t.pair, t.side,
        t.entry, t.exit, t.stopLoss ?? "", t.takeProfit ?? "", t.size,
        t.pnl, t.rr ?? "",
        t.session ?? "", t.strategy ?? "", t.emotion ?? "",
        t.notes ?? "",
        (t.tags ?? []).join("|"),
        screenshots,
        t.sl_rules ?? "",
        t.pnl >= 0 ? "Win" : "Loss",
      ].map(escapeCell).join(",");
    });

  const csv  = [CSV_HEADERS.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}