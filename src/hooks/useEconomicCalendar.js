import { useState, useEffect, useCallback, useMemo } from "react";

const STORAGE_KEY = "tb_custom_events";
const CACHE_KEY   = "tb_calendar_cache";
const CACHE_TTL   = 30 * 60 * 1000; // 30 menit

function loadCustomEvents() {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

function saveCustomEvents(events) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(events)); } catch {}
}

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch { return null; }
}

function saveCache(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch {}
}

export const IMPACT_COLORS = {
  High:    "#ef4444",
  Medium:  "#f59e0b",
  Low:     "#3b82f6",
  Holiday: "#6b7280",
};

export const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "NZD", "CNY", "IDR"];

export const EMPTY_EVENT = {
  id:       "",
  title:    "",
  currency: "USD",
  date:     new Date().toISOString().slice(0, 10),
  time:     "00:00",
  impact:   "High",
  forecast: "",
  previous: "",
  actual:   "",
  notes:    "",
  isCustom: true,
};

export function useEconomicCalendar(trades) {
  const [apiEvents,    setApiEvents]    = useState([]);
  const [customEvents, setCustomEvents] = useState(loadCustomEvents);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [lastFetched,  setLastFetched]  = useState(null);

  // Form state
  const [showForm, setShowForm]   = useState(false);
  const [form,     setForm]       = useState(EMPTY_EVENT);
  const [editId,   setEditId]     = useState(null);

  // Filters
  const [filterCurrency, setFilterCurrency] = useState("ALL");
  const [filterImpact,   setFilterImpact]   = useState("ALL");
  const [filterDate,     setFilterDate]     = useState("week"); // "today" | "week" | "month" | "all"

  // Fetch dari API
  const fetchCalendar = useCallback(async (force = false) => {
    if (!force) {
      const cached = loadCache();
      if (cached) { setApiEvents(cached); return; }
    }
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/calendar");
      const data = await res.json();
      if (data.events) {
        setApiEvents(data.events);
        saveCache(data.events);
        setLastFetched(new Date());
      }
    } catch (e) {
      setError("Gagal fetch calendar — pakai data manual");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCalendar(); }, [fetchCalendar]);

  // Semua events digabung
  const allEvents = useMemo(() => {
    const combined = [
      ...apiEvents.map(e => ({ ...e, isCustom: false })),
      ...customEvents,
    ];
    return combined.sort((a, b) => {
      const da = new Date(a.date + "T" + (a.time || "00:00"));
      const db = new Date(b.date + "T" + (b.time || "00:00"));
      return da - db;
    });
  }, [apiEvents, customEvents]);

  // Filter events
  const filteredEvents = useMemo(() => {
    const now   = new Date();
    const today = now.toISOString().slice(0, 10);
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

    return allEvents.filter(e => {
      if (filterCurrency !== "ALL" && e.currency !== filterCurrency && e.country !== filterCurrency) return false;
      if (filterImpact   !== "ALL" && e.impact !== filterImpact) return false;
      if (filterDate === "today") return e.date === today;
      if (filterDate === "week")  return e.date >= today && e.date <= weekEnd;
      if (filterDate === "month") return e.date >= today && e.date <= monthEnd;
      return true;
    });
  }, [allEvents, filterCurrency, filterImpact, filterDate]);

  // Countdown ke event berikutnya (High impact)
  const nextHighImpact = useMemo(() => {
    const now = new Date();
    return allEvents.find(e => {
      if (e.impact !== "High") return false;
      const eventTime = new Date(e.date + "T" + (e.time || "00:00"));
      return eventTime > now;
    }) || null;
  }, [allEvents]);

  // Trades yang kena news (dalam 30 menit sebelum/sesudah event)
  const taggedTrades = useMemo(() => {
    const tagged = new Set();
    (trades || []).forEach(tr => {
      allEvents.forEach(e => {
        if (e.impact !== "High") return;
        if (e.date !== tr.date) return;
        tagged.add(tr.id);
      });
    });
    return tagged;
  }, [trades, allEvents]);

  // CRUD custom events
  const openAdd = useCallback(() => {
    setForm({ ...EMPTY_EVENT, id: Date.now().toString() });
    setEditId(null);
    setShowForm(true);
  }, []);

  const openEdit = useCallback((event) => {
    setForm({ ...event });
    setEditId(event.id);
    setShowForm(true);
  }, []);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_EVENT);
  }, []);

  const saveEvent = useCallback(() => {
    if (!form.title.trim()) return;
    setCustomEvents(prev => {
      const updated = editId
        ? prev.map(e => e.id === editId ? { ...form } : e)
        : [...prev, { ...form, id: form.id || Date.now().toString(), isCustom: true }];
      saveCustomEvents(updated);
      return updated;
    });
    closeForm();
  }, [form, editId, closeForm]);

  const deleteEvent = useCallback((id) => {
    if (!window.confirm("Hapus event ini?")) return;
    setCustomEvents(prev => {
      const updated = prev.filter(e => e.id !== id);
      saveCustomEvents(updated);
      return updated;
    });
  }, []);

  const setField = useCallback((key, val) => {
    setForm(p => ({ ...p, [key]: val }));
  }, []);

  return {
    events: filteredEvents,
    allEvents,
    loading, error, lastFetched,
    nextHighImpact, taggedTrades,
    filterCurrency, setFilterCurrency,
    filterImpact,   setFilterImpact,
    filterDate,     setFilterDate,
    showForm, form, setField, editId,
    openAdd, openEdit, closeForm, saveEvent, deleteEvent,
    refetch: () => fetchCalendar(true),
  };
}