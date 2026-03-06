// ── Dropdown options ─────────────────────────────────────────────
export const MARKETS    = ["Forex", "Crypto", "Saham IDX", "Saham Global"];
export const SIDES      = ["BUY", "SELL"];
export const SESSIONS   = ["Asia", "London", "New York", "All Day"];
export const STRATEGIES = ["Breakout", "Trend Following", "Reversal", "Scalping", "Swing", "News", "Other"];
export const EMOTIONS   = ["Calm", "Confident", "Anxious", "FOMO", "Greedy", "Disciplined"];
export const COLORS     = ["#00d4aa", "#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6"];

// ── App constants ────────────────────────────────────────────────
export const STORAGE_KEY     = "tj_trades";
export const ACCOUNT_CAPITAL = 10000;

// ── Empty form state ─────────────────────────────────────────────
export const EMPTY_FORM = {
  date:          new Date().toISOString().split("T")[0],
  market:        "Forex",
  pair:          "",
  side:          "BUY",
  entry:         "",
  exit:          "",
  stopLoss:      "",
  takeProfit:    "",
  size:          "",
  pnl:           "",
  rr:            "",
  session:       "London",
  strategy:      "Breakout",
  emotion:       "Calm",
  notes:         "",
  screenshotUrl: "",
  tags:          [],
};