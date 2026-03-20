/**
 * Format currency dengan symbol
 * @param {number} v - nilai
 * @param {boolean} compact - singkat (1.2k, 3.4M)
 * @param {string} symbol - currency symbol
 */
export function formatCurrency(v, compact = false, symbol = "$", rate = 1) {
  if (v === undefined || v === null || isNaN(v)) return `${symbol}0.00`;
  if (rate && rate !== 1) v = v * rate;
  const abs = Math.abs(v);
  const neg = v < 0;

  if (compact) {
    if (abs >= 1_000_000) return `${neg ? "-" : ""}${symbol}${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000)     return `${neg ? "-" : ""}${symbol}${(abs / 1_000).toFixed(1)}k`;
  }

  return `${neg ? `-${symbol}` : symbol}${abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format percentage dengan tanda + / -
 */
export function formatPct(v, decimals = 2) {
  if (v === undefined || v === null || isNaN(v)) return "0.00%";
  return `${v >= 0 ? "+" : ""}${v.toFixed(decimals)}%`;
}

/**
 * Format R:R ratio
 */
export function formatRR(v) {
  if (!v && v !== 0) return "-";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}R`;
}

/**
 * Format date string ke display format
 */
export function formatDate(dateStr, locale = "id-ID") {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString(locale, {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch {
    return dateStr;
  }
}