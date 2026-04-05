// ── Multi-Currency Support ────────────────────────────────────────

export const CURRENCIES = [
  { code: "USD", symbol: "$",    name: "US Dollar",          locale: "en-US",  decimals: 2 },
  { code: "IDR", symbol: "Rp",   name: "Indonesian Rupiah",  locale: "id-ID",  decimals: 0 },
  { code: "EUR", symbol: "€",    name: "Euro",               locale: "de-DE",  decimals: 2 },
  { code: "GBP", symbol: "£",    name: "British Pound",      locale: "en-GB",  decimals: 2 },
  { code: "SGD", symbol: "S$",   name: "Singapore Dollar",   locale: "en-SG",  decimals: 2 },
  { code: "MYR", symbol: "RM",   name: "Malaysian Ringgit",  locale: "ms-MY",  decimals: 2 },
  { code: "JPY", symbol: "¥",    name: "Japanese Yen",       locale: "ja-JP",  decimals: 0 },
  { code: "AUD", symbol: "A$",   name: "Australian Dollar",  locale: "en-AU",  decimals: 2 },
  { code: "CAD", symbol: "C$",   name: "Canadian Dollar",    locale: "en-CA",  decimals: 2 },
  { code: "CHF", symbol: "CHF",  name: "Swiss Franc",        locale: "de-CH",  decimals: 2 },
  { code: "HKD", symbol: "HK$",  name: "Hong Kong Dollar",   locale: "zh-HK",  decimals: 2 },
  { code: "CNY", symbol: "¥",    name: "Chinese Yuan",       locale: "zh-CN",  decimals: 2 },
  { code: "KRW", symbol: "₩",    name: "Korean Won",         locale: "ko-KR",  decimals: 0 },
  { code: "INR", symbol: "₹",    name: "Indian Rupee",       locale: "en-IN",  decimals: 2 },
  { code: "BRL", symbol: "R$",   name: "Brazilian Real",     locale: "pt-BR",  decimals: 2 },
  { code: "ZAR", symbol: "R",    name: "South African Rand", locale: "en-ZA",  decimals: 2 },
];

export function getCurrencyMeta(code) {
  return CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
}

/**
 * Format currency amount with proper locale
 */
export function formatCurrencyAmount(amount, currencyCode = "USD", showSign = false) {
  const meta = getCurrencyMeta(currencyCode);
  const abs  = Math.abs(amount);
  const sign = showSign ? (amount >= 0 ? "+" : "-") : amount < 0 ? "-" : "";

  // IDR special formatting: Rp 1.000.000
  if (currencyCode === "IDR") {
    if (abs >= 1_000_000) return `${sign}Rp ${(abs / 1_000_000).toFixed(1)}jt`;
    if (abs >= 1_000)     return `${sign}Rp ${(abs / 1_000).toFixed(0)}rb`;
    return `${sign}Rp ${abs.toFixed(0)}`;
  }

  // JPY/KRW no decimals
  if (meta.decimals === 0) {
    return `${sign}${meta.symbol}${Math.round(abs).toLocaleString(meta.locale)}`;
  }

  // Default
  const formatted = abs.toLocaleString(meta.locale, {
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  });
  return `${sign}${meta.symbol}${formatted}`;
}

/**
 * Fetch live exchange rates (base: USD)
 */
export async function fetchExchangeRates() {
  try {
    const res  = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await res.json();
    if (data.rates) {
      return { ...data.rates, USD: 1 };
    }
  } catch {}
  return null;
}

/**
 * Convert amount from USD to target currency
 */
export function convertFromUSD(amount, targetCode, rates) {
  if (!rates || targetCode === "USD") return amount;
  const rate = rates[targetCode];
  if (!rate) return amount;
  return amount * rate;
}