import { useState, useCallback, useMemo } from "react";

const STORAGE_KEY = "tb_brokers";

function load() {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {} 
}

// ── Default broker data ──────────────────────────────────────────
export const DEFAULT_BROKERS = [
  {
    id: "icmarkets", name: "IC Markets", type: "ECN", regulation: ["ASIC", "CySEC", "FSA"],
    minDeposit: 200, leverage: "1:500", platforms: ["MT4", "MT5", "cTrader"],
    spreads: { "EUR/USD": 0.1, "GBP/USD": 0.4, "BTC/USD": 15, "XAU/USD": 0.12 },
    commission: 3.5, swapFree: false, founded: 2007, country: "Australia",
    website: "icmarkets.com", rating: 4.8, isDefault: true,
    notes: "", reviewed: false,
  },
  {
    id: "exness", name: "Exness", type: "ECN/STP", regulation: ["FCA", "CySEC", "FSA", "CBCS"],
    minDeposit: 10, leverage: "1:Unlimited", platforms: ["MT4", "MT5"],
    spreads: { "EUR/USD": 0.3, "GBP/USD": 0.5, "BTC/USD": 20, "XAU/USD": 0.25 },
    commission: 0, swapFree: true, founded: 2008, country: "Cyprus",
    website: "exness.com", rating: 4.6, isDefault: true,
    notes: "", reviewed: false,
  },
  {
    id: "xm", name: "XM", type: "Market Maker", regulation: ["CySEC", "ASIC", "IFSC"],
    minDeposit: 5, leverage: "1:888", platforms: ["MT4", "MT5"],
    spreads: { "EUR/USD": 1.6, "GBP/USD": 1.8, "BTC/USD": 35, "XAU/USD": 0.3 },
    commission: 0, swapFree: true, founded: 2009, country: "Cyprus",
    website: "xm.com", rating: 4.3, isDefault: true,
    notes: "", reviewed: false,
  },
  {
    id: "tickmill", name: "Tickmill", type: "ECN", regulation: ["FCA", "CySEC", "FSCA"],
    minDeposit: 100, leverage: "1:500", platforms: ["MT4", "MT5"],
    spreads: { "EUR/USD": 0.0, "GBP/USD": 0.3, "BTC/USD": 18, "XAU/USD": 0.13 },
    commission: 2, swapFree: false, founded: 2014, country: "UK",
    website: "tickmill.com", rating: 4.5, isDefault: true,
    notes: "", reviewed: false,
  },
  {
    id: "fbs", name: "FBS", type: "Market Maker", regulation: ["CySEC", "IFSC", "FSCA"],
    minDeposit: 1, leverage: "1:3000", platforms: ["MT4", "MT5"],
    spreads: { "EUR/USD": 1.0, "GBP/USD": 1.2, "BTC/USD": 30, "XAU/USD": 0.4 },
    commission: 0, swapFree: true, founded: 2009, country: "Belize",
    website: "fbs.com", rating: 4.1, isDefault: true,
    notes: "", reviewed: false,
  },
];

export const EMPTY_BROKER = {
  id: "", name: "", type: "ECN", regulation: [],
  minDeposit: "", leverage: "", platforms: [],
  spreads: {}, commission: "", swapFree: false,
  founded: "", country: "", website: "", rating: 3,
  notes: "", reviewed: false, isDefault: false,
};

export const BROKER_TYPES    = ["ECN", "STP", "ECN/STP", "Market Maker", "DMA"];
export const BROKER_PLATFORMS = ["MT4", "MT5", "cTrader", "TradingView", "Proprietary"];
export const COMMON_PAIRS    = ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD", "XAU/USD", "BTC/USD", "NAS100"];

export function useBroker(trades) {
  const [customBrokers, setCustomBrokers] = useState(load);
  const [showForm,  setShowForm]  = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [form,      setForm]      = useState(EMPTY_BROKER);
  const [comparePair, setComparePair] = useState("EUR/USD");
  const [selected,  setSelected]  = useState(null);

  // Merge default + custom
  const allBrokers = useMemo(() => {
    const customIds = new Set(customBrokers.map(b => b.id));
    const defaults  = DEFAULT_BROKERS.filter(b => !customIds.has(b.id));
    return [...defaults, ...customBrokers].sort((a, b) => b.rating - a.rating);
  }, [customBrokers]);

  // Cost calculator — berdasarkan history trade user
  const costAnalysis = useMemo(() => {
    if (!trades || trades.length === 0) return [];
    const avgSize    = trades.reduce((s, tr) => s + (parseFloat(tr.size) || 0), 0) / trades.length;
    const totalTrades = trades.length;

    return allBrokers.map(broker => {
      const pairs = [...new Set(trades.map(tr => tr.pair))];
      let totalSpreadCost = 0;
      let totalCommission = 0;

      (trades || []).forEach(tr => {
        const spread = broker.spreads[tr.pair] || broker.spreads["EUR/USD"] || 1;
        const size   = parseFloat(tr.size) || avgSize || 0.1;
        totalSpreadCost += spread * size * 10; // rough pip value
        totalCommission += (parseFloat(broker.commission) || 0) * size * 2; // round trip
      });

      return {
        broker,
        totalCost:      totalSpreadCost + totalCommission,
        spreadCost:     totalSpreadCost,
        commissionCost: totalCommission,
        costPerTrade:   (totalSpreadCost + totalCommission) / totalTrades,
      };
    }).sort((a, b) => a.totalCost - b.totalCost);
  }, [allBrokers, trades]);

  const openAdd = useCallback(() => {
    setForm({ ...EMPTY_BROKER, id: Date.now().toString() });
    setEditId(null);
    setShowForm(true);
  }, []);

  const openEdit = useCallback((broker) => {
    setForm({ ...broker });
    setEditId(broker.id);
    setShowForm(true);
  }, []);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_BROKER);
  }, []);

  const saveBroker = useCallback(() => {
    if (!form.name.trim()) return;
    setCustomBrokers(prev => {
      const updated = editId
        ? prev.map(b => b.id === editId ? { ...form } : b)
        : [...prev, { ...form }];
      save(updated);
      return updated;
    });
    closeForm();
  }, [form, editId, closeForm]);

  const deleteBroker = useCallback((id) => {
    if (!window.confirm("Hapus broker ini?")) return;
    setCustomBrokers(prev => { const u = prev.filter(b => b.id !== id); save(u); return u; });
    if (selected?.id === id) setSelected(null);
  }, [selected]);

  const saveNotes = useCallback((id, notes) => {
    const isDefault = DEFAULT_BROKERS.some(b => b.id === id);
    if (isDefault) {
      setCustomBrokers(prev => {
        const existing = prev.find(b => b.id === id);
        const broker   = DEFAULT_BROKERS.find(b => b.id === id);
        const updated  = existing
          ? prev.map(b => b.id === id ? { ...b, notes, reviewed: true } : b)
          : [...prev, { ...broker, notes, reviewed: true }];
        save(updated);
        return updated;
      });
    } else {
      setCustomBrokers(prev => {
        const updated = prev.map(b => b.id === id ? { ...b, notes, reviewed: true } : b);
        save(updated);
        return updated;
      });
    }
  }, []);

  const setField = useCallback((key, val) => {
    setForm(p => ({ ...p, [key]: val }));
  }, []);

  const setSpread = useCallback((pair, val) => {
    setForm(p => ({ ...p, spreads: { ...p.spreads, [pair]: parseFloat(val) || 0 } }));
  }, []);

  return {
    brokers: allBrokers, costAnalysis,
    comparePair, setComparePair,
    showForm, form, setField, setSpread, editId,
    selected, setSelected,
    openAdd, openEdit, closeForm, saveBroker, deleteBroker, saveNotes,
  };
}