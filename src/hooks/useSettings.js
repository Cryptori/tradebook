import { useState, useEffect } from "react";

const SETTINGS_KEY = "tj_settings";

export const CURRENCIES = [
  { code: "USD", symbol: "$",    name: "US Dollar",          label: "US Dollar" },
  { code: "IDR", symbol: "Rp",   name: "Indonesian Rupiah",  label: "Indonesian Rupiah" },
  { code: "EUR", symbol: "€",    name: "Euro",               label: "Euro" },
  { code: "GBP", symbol: "£",    name: "British Pound",      label: "British Pound" },
  { code: "SGD", symbol: "S$",   name: "Singapore Dollar",   label: "Singapore Dollar" },
  { code: "MYR", symbol: "RM",   name: "Malaysian Ringgit",  label: "Malaysian Ringgit" },
  { code: "JPY", symbol: "¥",    name: "Japanese Yen",       label: "Japanese Yen" },
  { code: "AUD", symbol: "A$",   name: "Australian Dollar",  label: "Australian Dollar" },
  { code: "CAD", symbol: "C$",   name: "Canadian Dollar",    label: "Canadian Dollar" },
  { code: "CHF", symbol: "CHF",  name: "Swiss Franc",        label: "Swiss Franc" },
  { code: "CNY", symbol: "¥",    name: "Chinese Yuan",       label: "Chinese Yuan" },
  { code: "KRW", symbol: "₩",    name: "Korean Won",         label: "Korean Won" },
  { code: "INR", symbol: "₹",    name: "Indian Rupee",       label: "Indian Rupee" },
  { code: "BRL", symbol: "R$",   name: "Brazilian Real",     label: "Brazilian Real" },
];

export const DEFAULT_SETTINGS = {
  capitalInitial: 10000,
  currency: "USD",
  targetProfitPct: 20,
  maxDrawdownPct: 10,
  targetTradesPerMonth: 20,
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

export function useSettings() {
  const [settings, setSettings] = useState(loadSettings);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch { /* localStorage unavailable */ }
  }, [settings]);

  function updateSettings(patch) {
    setSettings(prev => ({ ...prev, ...patch }));
  }

  function resetSettings() {
    setSettings(DEFAULT_SETTINGS);
  }

  const currencyMeta = CURRENCIES.find(c => c.code === settings.currency) ?? CURRENCIES[0];

  return { settings, updateSettings, resetSettings, currencyMeta };
}