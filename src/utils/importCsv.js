const REQUIRED_HEADERS = ["Date", "Pair"];
const EXPECTED_HEADERS = [
  "Date", "Market", "Pair", "Side",
  "Entry", "Exit", "Size", "PnL ($)", "R:R",
  "Session", "Strategy", "Emotion", "Notes", "Tags",
];

function splitCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

function parseRow(headers, cells) {
  const obj = {};
  headers.forEach((h, i) => { obj[h] = (cells[i] ?? "").trim(); });

  const tagsRaw = obj["Tags"] ?? "";
  const tags = tagsRaw ? tagsRaw.split("|").map(t => t.trim()).filter(Boolean) : [];

  return {
    id:       Date.now() + Math.random(),
    date:     obj["Date"]      ?? "",
    market:   obj["Market"]    || "Forex",
    pair:     obj["Pair"]      ?? "",
    side:     obj["Side"]      || "BUY",
    entry:    parseFloat(obj["Entry"])    || 0,
    exit:     parseFloat(obj["Exit"])     || 0,
    size:     parseFloat(obj["Size"])     || 0,
    pnl:      parseFloat(obj["PnL ($)"])  || 0,
    rr:       parseFloat(obj["R:R"])      || 0,
    session:  obj["Session"]   || "All Day",
    strategy: obj["Strategy"]  || "Other",
    emotion:  obj["Emotion"]   || "Calm",
    notes:    obj["Notes"]     ?? "",
    tags,
    screenshotUrl: "",
    screenshots:   [],
    stopLoss:  0,
    takeProfit: 0,
  };
}

export function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        // Strip BOM if present
        const text = e.target.result.replace(/^\uFEFF/, "");
        const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");

        if (lines.length < 2) {
          return reject(new Error("File kosong atau tidak valid."));
        }

        const headers = splitCsvLine(lines[0]).map(h => h.trim());

        // Hanya wajibkan kolom minimum
        const missing = REQUIRED_HEADERS.filter(h => !headers.includes(h));
        if (missing.length > 0) {
          return reject(new Error(`Kolom wajib tidak ditemukan: ${missing.join(", ")}`));
        }

        const trades = lines.slice(1).map(line => parseRow(headers, splitCsvLine(line)));
        const valid  = trades.filter(t => t.pair && t.date);

        if (valid.length === 0) {
          return reject(new Error("Tidak ada data trade valid ditemukan."));
        }

        resolve(valid);
      } catch (err) {
        reject(new Error(`Gagal memproses file: ${err.message}`));
      }
    };
    reader.onerror = () => reject(new Error("Gagal membaca file."));
    reader.readAsText(file, "UTF-8");
  });
}