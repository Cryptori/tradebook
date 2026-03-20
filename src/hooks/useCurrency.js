import { useState, useEffect, useCallback } from "react";
import { getCurrencyMeta, fetchExchangeRates, convertFromUSD, formatCurrencyAmount } from "../utils/currency";

const RATES_KEY = "tb_fx_rates";
const RATES_TTL = 3600000; // 1 hour

function loadRates() {
  try {
    const saved = JSON.parse(localStorage.getItem(RATES_KEY) || "null");
    if (saved && Date.now() - saved.ts < RATES_TTL) return saved.rates;
  } catch {}
  return null;
}

function saveRates(rates) {
  try { localStorage.setItem(RATES_KEY, JSON.stringify({ rates, ts: Date.now() })); } catch {}
}

export function useCurrency(settings) {
  const currencyCode = settings?.currency || "USD";
  const meta         = getCurrencyMeta(currencyCode);
  const [rates, setRates]   = useState(loadRates);
  const [loading, setLoading] = useState(false);

  // Fetch rates on mount or when currency changes
  useEffect(() => {
    if (currencyCode === "USD") return;
    const cached = loadRates();
    if (cached) { setRates(cached); return; }

    setLoading(true);
    fetchExchangeRates().then(r => {
      if (r) { setRates(r); saveRates(r); }
      setLoading(false);
    });
  }, [currencyCode]);

  const convert = useCallback((usdAmount) => {
    if (currencyCode === "USD" || !rates) return usdAmount;
    return convertFromUSD(usdAmount, currencyCode, rates);
  }, [currencyCode, rates]);

  const format = useCallback((usdAmount, showSign = false) => {
    const converted = convert(usdAmount);
    return formatCurrencyAmount(converted, currencyCode, showSign);
  }, [convert, currencyCode]);

  const formatAbs = useCallback((usdAmount) => {
    const converted = convert(Math.abs(usdAmount));
    return formatCurrencyAmount(converted, currencyCode, false);
  }, [convert, currencyCode]);

  const rate = rates?.[currencyCode] || 1;

  return { meta, currencyCode, rate, rates, loading, convert, format, formatAbs };
}