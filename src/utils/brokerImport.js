// ── Smart Broker CSV Import ───────────────────────────────────────
// Supports: MT4/MT5, Exness, FBS, IC Markets, XM, generic

// ── Broker detection signatures ──────────────────────────────────
const BROKER_SIGNATURES = [
  {
    name: "MT4/MT5 Standard",
    id: "mt4",
    detect: (headers) => {
      const h = headers.join(",").toLowerCase();
      return h.includes("ticket") && h.includes("open time") && h.includes("close time");
    },
    map: (row, headers) => mapMT4Row(row, headers),
  },
  {
    name: "MT5 Deals",
    id: "mt5_deals",
    detect: (headers) => {
      const h = headers.join(",").toLowerCase();
      return h.includes("deal") && h.includes("entry") && h.includes("symbol");
    },
    map: (row, headers) => mapMT5DealsRow(row, headers),
  },
  {
    name: "Exness",
    id: "exness",
    detect: (headers) => {
      const h = headers.join(",").toLowerCase();
      return h.includes("exness") || (h.includes("position") && h.includes("direction"));
    },
    map: (row, headers) => mapExnessRow(row, headers),
  },
  {
    name: "Generic CSV",
    id: "generic",
    detect: () => true,
    map: (row, headers) => mapGenericRow(row, headers),
  },
];

// ── MT4/MT5 Standard format ───────────────────────────────────────
// Columns: Ticket, Open Time, Type, Size, Symbol, Price, S/L, T/P, Close Time, Price, Profit
function mapMT4Row(row, headers) {
  const get = (key) => {
    const idx = headers.findIndex(h => h.toLowerCase().includes(key.toLowerCase()));
    return idx >= 0 ? (row[idx] || "").trim() : "";
  };

  const type    = get("type").toLowerCase();
  const side    = type.includes("buy") ? "BUY" : type.includes("sell") ? "SELL" : null;
  if (!side) return null; // Skip non-trade rows (deposits, etc)

  const symbol  = get("symbol").replace(/[^A-Z0-9/]/gi, "").toUpperCase();
  const size    = parseFloat(get("size") || get("volume") || "0");
  const entry   = parseFloat(get("price") || "0");
  const profit  = parseFloat(get("profit") || get("p&l") || "0");
  const sl      = parseFloat(get("s/l") || get("sl") || get("stop loss") || "0");
  const tp      = parseFloat(get("t/p") || get("tp") || get("take profit") || "0");

  const openTime  = get("open time") || get("open") || get("open_time");
  const closeTime = get("close time") || get("close") || get("close_time");

  const date   = parseDate(openTime);
  const exitPx = parseFloat(getClosePrice(row, headers) || "0");

  if (!date || !symbol || !size) return null;

  const rr = sl && tp && entry ? calcRR(entry, sl, tp, side) : null;

  return {
    date,
    pair:     formatPair(symbol),
    market:   detectMarket(symbol),
    side,
    entry:    entry || 0,
    exit:     exitPx || 0,
    stopLoss: sl || 0,
    takeProfit: tp || 0,
    size,
    pnl:      profit,
    rr:       rr ? parseFloat(rr) : 0,
    session:  detectSession(openTime),
    strategy: "MT4/MT5 Import",
    emotion:  "Calm",
    notes:    `Imported from MT4/MT5. Ticket: ${get("ticket") || get("#") || ""}`,
    tags:     ["imported", "mt4"],
    screenshots: [],
  };
}

// ── MT5 Deals format ─────────────────────────────────────────────
function mapMT5DealsRow(row, headers) {
  const get = (key) => {
    const idx = headers.findIndex(h => h.toLowerCase().includes(key.toLowerCase()));
    return idx >= 0 ? (row[idx] || "").trim() : "";
  };

  const entry = get("entry").toLowerCase();
  if (entry !== "out" && entry !== "in/out") return null;

  const direction = get("direction").toLowerCase();
  const side = direction.includes("buy") ? "BUY" : direction.includes("sell") ? "SELL" : null;
  if (!side) return null;

  const symbol  = get("symbol").toUpperCase();
  const volume  = parseFloat(get("volume") || "0");
  const price   = parseFloat(get("price") || "0");
  const profit  = parseFloat(get("profit") || "0");
  const date    = parseDate(get("time") || get("date"));

  if (!date || !symbol) return null;

  return {
    date, pair: formatPair(symbol),
    market: detectMarket(symbol),
    side, entry: price, exit: price,
    stopLoss: 0, takeProfit: 0,
    size: volume, pnl: profit, rr: 0,
    session: detectSession(get("time")),
    strategy: "MT5 Import", emotion: "Calm",
    notes: `MT5 Deal import`,
    tags: ["imported", "mt5"], screenshots: [],
  };
}

// ── Exness format ─────────────────────────────────────────────────
function mapExnessRow(row, headers) {
  const get = (key) => {
    const idx = headers.findIndex(h => h.toLowerCase().includes(key.toLowerCase()));
    return idx >= 0 ? (row[idx] || "").trim() : "";
  };

  const direction = (get("direction") || get("type") || get("side")).toLowerCase();
  const side = direction.includes("buy") ? "BUY" : direction.includes("sell") ? "SELL" : null;
  if (!side) return null;

  const symbol = (get("symbol") || get("instrument") || get("pair")).toUpperCase();
  const volume = parseFloat(get("volume") || get("size") || get("lots") || "0");
  const profit = parseFloat(get("profit") || get("p&l") || get("pnl") || "0");
  const openPrice  = parseFloat(get("open price")  || get("entry") || get("open") || "0");
  const closePrice = parseFloat(get("close price") || get("exit")  || get("close") || "0");
  const date = parseDate(get("open time") || get("date") || get("time"));

  if (!date || !symbol) return null;

  return {
    date, pair: formatPair(symbol),
    market: detectMarket(symbol),
    side, entry: openPrice, exit: closePrice,
    stopLoss: parseFloat(get("sl") || "0"),
    takeProfit: parseFloat(get("tp") || "0"),
    size: volume, pnl: profit, rr: 0,
    session: detectSession(get("open time")),
    strategy: "Exness Import", emotion: "Calm",
    notes: `Exness import`,
    tags: ["imported", "exness"], screenshots: [],
  };
}

// ── Generic CSV ───────────────────────────────────────────────────
function mapGenericRow(row, headers) {
  const get = (keys) => {
    for (const key of keys) {
      const idx = headers.findIndex(h => h.toLowerCase().replace(/[^a-z]/g, "").includes(key.replace(/[^a-z]/g, "")));
      if (idx >= 0 && row[idx]) return row[idx].trim();
    }
    return "";
  };

  const sideRaw = get(["side", "type", "direction", "buysell", "action"]).toLowerCase();
  const side = sideRaw.includes("buy") ? "BUY" : sideRaw.includes("sell") ? "SELL" : null;
  if (!side) return null;

  const symbol = get(["symbol", "pair", "instrument", "asset"]).toUpperCase();
  const pnl    = parseFloat(get(["profit", "pnl", "p&l", "gain", "result"]) || "0");
  const date   = parseDate(get(["date", "time", "opentime", "opendate", "timestamp"]));
  const size   = parseFloat(get(["volume", "size", "lots", "quantity", "amount"]) || "0");
  const entry  = parseFloat(get(["entry", "openprice", "open"]) || "0");
  const exit   = parseFloat(get(["exit", "closeprice", "close"]) || "0");

  if (!date || !symbol) return null;

  return {
    date, pair: formatPair(symbol),
    market: detectMarket(symbol),
    side, entry, exit,
    stopLoss: parseFloat(get(["sl", "stoploss"]) || "0"),
    takeProfit: parseFloat(get(["tp", "takeprofit"]) || "0"),
    size, pnl, rr: 0,
    session: "London",
    strategy: "CSV Import", emotion: "Calm",
    notes: "Auto-imported from CSV",
    tags: ["imported"], screenshots: [],
  };
}

// ── Helpers ───────────────────────────────────────────────────────
function parseDate(str) {
  if (!str) return null;
  // Try various date formats
  const formats = [
    /(\d{4})[.\-/](\d{2})[.\-/](\d{2})/,  // YYYY-MM-DD
    /(\d{2})[.\-/](\d{2})[.\-/](\d{4})/,  // DD-MM-YYYY
    /(\d{2})\.(\d{2})\.(\d{4})/,           // DD.MM.YYYY
  ];

  for (const fmt of formats) {
    const m = str.match(fmt);
    if (m) {
      if (m[1].length === 4) return `${m[1]}-${m[2].padStart(2,"0")}-${m[3].padStart(2,"0")}`;
      return `${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;
    }
  }

  // Try native Date parse
  const d = new Date(str);
  if (!isNaN(d)) return d.toISOString().slice(0, 10);
  return null;
}

function getClosePrice(row, headers) {
  const keys = ["close price", "close", "exit price", "exit", "closeprice"];
  for (const key of keys) {
    const idx = headers.findIndex(h => h.toLowerCase().includes(key));
    if (idx >= 0 && row[idx]) return row[idx];
  }
  // If only 2 "price" columns, second one is close
  const priceIdxs = headers.reduce((acc, h, i) => h.toLowerCase().includes("price") ? [...acc, i] : acc, []);
  if (priceIdxs.length >= 2) return row[priceIdxs[1]];
  return null;
}

function formatPair(symbol) {
  if (!symbol) return "";
  symbol = symbol.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  if (symbol.length === 6 && !symbol.includes("/")) {
    return symbol.slice(0, 3) + "/" + symbol.slice(3);
  }
  return symbol;
}

function detectMarket(symbol) {
  const s = symbol.toUpperCase().replace("/", "");
  const cryptos = ["BTC","ETH","XRP","SOL","ADA","DOT","DOGE","AVAX","MATIC","BNB"];
  if (cryptos.some(c => s.startsWith(c) || s.endsWith(c))) return "Crypto";
  const commodities = ["XAU","GOLD","XAG","OIL","WTI","BRENT","XAUUSD","XAGUSD"];
  if (commodities.some(c => s.includes(c))) return "Gold";
  const indices = ["NAS","SPX","DOW","DAX","NIKKEI","FTSE","US30","US500","GER"];
  if (indices.some(i => s.includes(i))) return "Saham Global";
  const forexMajors = ["USD","EUR","GBP","JPY","CHF","AUD","NZD","CAD"];
  if (forexMajors.filter(f => s.includes(f)).length >= 2) return "Forex";
  if (/^[A-Z]{2,5}$/.test(s) && s.length <= 5) return "Saham IDX";
  return "Forex";
}

function detectSession(timeStr) {
  if (!timeStr) return "London";
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) return "London";
  const hour = parseInt(match[1]);
  if (hour >= 0  && hour < 7)  return "Asian";
  if (hour >= 7  && hour < 13) return "London";
  if (hour >= 13 && hour < 17) return "New York";
  if (hour >= 17 && hour < 22) return "New York";
  return "Asian";
}

function calcRR(entry, sl, tp, side) {
  const risk   = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);
  if (!risk) return null;
  return (reward / risk).toFixed(2);
}

// ── Parse CSV string ──────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  // Find header line (skip comment/empty lines)
  let headerIdx = 0;
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    if (lines[i].includes(",") || lines[i].includes("\t")) {
      headerIdx = i;
      break;
    }
  }

  const sep = lines[headerIdx].includes("\t") ? "\t" : ",";
  const parseRow = (line) => {
    const result = [];
    let inQuote = false, cur = "";
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === sep[0] && !inQuote) { result.push(cur.trim()); cur = ""; }
      else { cur += ch; }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseRow(lines[headerIdx]);
  const rows    = lines.slice(headerIdx + 1)
    .map(l => parseRow(l))
    .filter(r => r.some(cell => cell.trim()));

  return { headers, rows };
}

// ── Main import function ──────────────────────────────────────────
export function detectBroker(headers) {
  for (const sig of BROKER_SIGNATURES) {
    if (sig.detect(headers)) return sig;
  }
  return BROKER_SIGNATURES[BROKER_SIGNATURES.length - 1]; // generic
}

export function importBrokerCSV(csvText, existingTrades = []) {
  const { headers, rows } = parseCSV(csvText);
  if (!headers.length) return { trades: [], errors: ["File CSV kosong atau format tidak valid"], broker: null, skipped: 0 };

  const broker    = detectBroker(headers);
  const trades    = [];
  const errors    = [];
  let skipped     = 0;
  const existingKeys = new Set(existingTrades.map(t => `${t.date}_${t.pair}_${t.pnl}`));

  rows.forEach((row, idx) => {
    try {
      const trade = broker.map(row, headers);
      if (!trade) return; // skip non-trade rows silently

      // Validate
      if (!trade.date)  { errors.push(`Row ${idx+2}: tanggal tidak valid`); return; }
      if (!trade.pair)  { errors.push(`Row ${idx+2}: pair/symbol tidak ditemukan`); return; }
      if (!trade.side)  { errors.push(`Row ${idx+2}: side (BUY/SELL) tidak ditemukan`); return; }

      // Skip duplicate
      const key = `${trade.date}_${trade.pair}_${trade.pnl}`;
      if (existingKeys.has(key)) { skipped++; return; }

      // Add unique ID
      trade.id = `import_${Date.now()}_${idx}_${Math.random().toString(36).slice(2)}`;
      trades.push(trade);
      existingKeys.add(key);
    } catch (err) {
      errors.push(`Row ${idx+2}: ${err.message}`);
    }
  });

  return { trades, errors, broker: broker.name, skipped, total: rows.length };
}

export { BROKER_SIGNATURES };