import { useState, useEffect, useCallback, useMemo } from "react";

const STORAGE_KEY = "tb_watchlist";

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

// Default watchlist
const DEFAULT_PAIRS = [
  { id: "eurusd", symbol: "EUR/USD", market: "Forex",  sessions: ["London", "New York"] },
  { id: "gbpusd", symbol: "GBP/USD", market: "Forex",  sessions: ["London", "New York"] },
  { id: "xauusd", symbol: "XAU/USD", market: "Gold",   sessions: ["London", "New York"] },
  { id: "btcusd", symbol: "BTC/USD", market: "Crypto", sessions: ["Asian", "London", "New York"] },
  { id: "nas100", symbol: "NAS100",  market: "Saham Global", sessions: ["New York"] },
];

// Get current session
function getCurrentSession() {
  const h = new Date().getUTCHours();
  if (h >= 0  && h < 7)  return "Asian";
  if (h >= 7  && h < 12) return "London";
  if (h >= 12 && h < 16) return "New York";
  if (h >= 16 && h < 21) return "New York";
  return "Asian";
}

// Fetch price — uses ExchangeRate-API (CORS-friendly, no key needed)
// Cached per session to avoid rate limits
const _rateCache = {};
async function fetchPrice(symbol) {
  const s = symbol.replace("/", "").toUpperCase();
  try {
    // Forex pairs — use open.er-api.com (free, supports CORS)
    const forexMap = {
      EURUSD: ["EUR","USD"], GBPUSD: ["GBP","USD"], USDJPY: ["USD","JPY"],
      AUDUSD: ["AUD","USD"], USDCAD: ["USD","CAD"], USDCHF: ["USD","CHF"],
      NZDUSD: ["NZD","USD"], EURGBP: ["EUR","GBP"], EURJPY: ["EUR","JPY"],
      GBPJPY: ["GBP","JPY"], XAUUSD: ["XAU","USD"],
    };
    if (forexMap[s]) {
      const [base, quote] = forexMap[s];
      // Cache key per base currency (fetch once, get all rates)
      if (!_rateCache[base]) {
        const r = await fetch(`https://open.er-api.com/v6/latest/${base}`);
        if (!r.ok) return null;
        const d = await r.json();
        if (d.result === "success") _rateCache[base] = d.rates;
      }
      const rate = _rateCache[base]?.[quote];
      if (rate) return { price: rate, change24h: null, lastUpdated: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) };
    }

    // Gold (XAU) — approximate via metals-api fallback
    if (s === "XAUUSD") {
      if (!_rateCache["XAU"]) {
        const r = await fetch("https://open.er-api.com/v6/latest/USD");
        if (!r.ok) return null;
        const d = await r.json();
        if (d.result === "success") _rateCache["XAU"] = d.rates;
      }
      const xauRate = _rateCache["XAU"]?.["XAU"];
      if (xauRate) return { price: parseFloat((1 / xauRate).toFixed(2)), change24h: null };
    }
  } catch {}
  return null;
}

export function useMarketScanner(trades) {
  const [watchlist, setWatchlist] = useState(() => {
    const saved = load();
    if (saved.length > 0) return saved;
    return DEFAULT_PAIRS.map(p => ({ ...p, alertHigh: "", alertLow: "", notes: "", price: null, change24h: null, lastUpdated: null }));
  });
  const [prices,    setPrices]    = useState({});
  const [loading,   setLoading]   = useState(false);
  const [showForm,  setShowForm]  = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [form,      setForm]      = useState({ symbol: "", market: "Forex", alertHigh: "", alertLow: "", notes: "", sessions: [] });

  // Fetch all prices
  const refreshPrices = useCallback(async () => {
    setLoading(true);
    const newPrices = {};
    await Promise.all(watchlist.map(async (item) => {
      const data = await fetchPrice(item.symbol);
      if (data) newPrices[item.id] = { ...data, lastUpdated: new Date().toLocaleTimeString() };
    }));
    setPrices(prev => ({ ...prev, ...newPrices }));
    setLoading(false);
  }, [watchlist]);

  // Auto refresh every 60s
  useEffect(() => {
    refreshPrices();
    const interval = setInterval(refreshPrices, 60000);
    return () => clearInterval(interval);
  }, [watchlist.length]); // eslint-disable-line

  // Check alerts
  useEffect(() => {
    watchlist.forEach(item => {
      const p = prices[item.id];
      if (!p?.price) return;
      if (item.alertHigh && p.price >= parseFloat(item.alertHigh)) {
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification(`${item.symbol} Alert!`, { body: `Harga ${p.price} menyentuh level HIGH ${item.alertHigh}` });
        }
      }
      if (item.alertLow && p.price <= parseFloat(item.alertLow)) {
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification(`${item.symbol} Alert!`, { body: `Harga ${p.price} menyentuh level LOW ${item.alertLow}` });
        }
      }
    });
  }, [prices, watchlist]);

  // Trade stats per pair
  const pairStats = useMemo(() => {
    const map = {};
    (trades || []).forEach(tr => {
      const sym = tr.pair?.toUpperCase().replace(/[^A-Z0-9]/g, "") || "";
      if (!map[sym]) map[sym] = { trades: 0, wins: 0, pnl: 0, rrs: [] };
      map[sym].trades++;
      if (tr.pnl >= 0) map[sym].wins++;
      map[sym].pnl += tr.pnl || 0;
      if (tr.rr) map[sym].rrs.push(parseFloat(tr.rr));
    });
    return map;
  }, [trades]);

  // Best pairs by win rate
  const bestPairs = useMemo(() => {
    return Object.entries(pairStats)
      .filter(([, s]) => s.trades >= 3)
      .map(([pair, s]) => ({
        pair,
        winRate: (s.wins / s.trades) * 100,
        trades: s.trades,
        pnl: s.pnl,
        avgRR: s.rrs.length > 0 ? s.rrs.reduce((a, b) => a + b, 0) / s.rrs.length : 0,
      }))
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 5);
  }, [pairStats]);

  const currentSession = getCurrentSession();

  function closeForm() { setShowForm(false); }

  function openAdd() {
    setForm({ symbol: "", market: "Forex", alertHigh: "", alertLow: "", notes: "", sessions: [] });
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(item) {
    setForm({ ...item });
    setEditId(item.id);
    setShowForm(true);
  }

  function saveItem() {
    if (!form.symbol.trim()) return;
    const sym = form.symbol.trim().toUpperCase();
    const item = { ...form, symbol: sym, id: editId || sym.toLowerCase().replace(/[^a-z0-9]/g, "") + Date.now() };
    setWatchlist(prev => {
      const updated = editId ? prev.map(p => p.id === editId ? item : p) : [...prev, item];
      save(updated);
      return updated;
    });
    setShowForm(false);
  }

  function removeItem(id) {
    setWatchlist(prev => { const u = prev.filter(p => p.id !== id); save(u); return u; });
  }

  function saveNotes(id, notes) {
    setWatchlist(prev => {
      const u = prev.map(p => p.id === id ? { ...p, notes } : p);
      save(u);
      return u;
    });
  }

  return {
    watchlist, prices, loading, pairStats, bestPairs, currentSession,
    showForm, form, setForm, editId,
    openAdd, openEdit, closeForm, saveItem, removeItem, saveNotes, refreshPrices,
  };
}