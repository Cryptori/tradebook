import { useState, useEffect } from "react";

const SETTINGS_KEY = "tj_settings";

export const CURRENCIES = [
  { code: "USD", symbol: "$",  label: "US Dollar" },
  { code: "IDR", symbol: "Rp", label: "Indonesian Rupiah" },
  { code: "EUR", symbol: "€",  label: "Euro" },
  { code: "GBP", symbol: "£",  label: "British Pound" },
  { code: "JPY", symbol: "¥",  label: "Japanese Yen" },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar" },
  { code: "MYR", symbol: "RM", label: "Malaysian Ringgit" },
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