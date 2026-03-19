// ── Advanced Trading Statistics ───────────────────────────────────

/**
 * Sharpe Ratio — return per unit of total risk
 * (avg return - risk free rate) / std dev of returns
 */
export function calcSharpeRatio(trades, riskFreeRate = 0) {
  if (!trades || trades.length < 2) return null;
  const returns = trades.map(t => t.pnl || 0);
  const avg     = returns.reduce((s, r) => s + r, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + Math.pow(r - avg, 2), 0) / returns.length;
  const stdDev  = Math.sqrt(variance);
  if (stdDev === 0) return null;
  return ((avg - riskFreeRate) / stdDev).toFixed(2);
}

/**
 * Sortino Ratio — like Sharpe but only penalizes downside volatility
 */
export function calcSortinoRatio(trades, riskFreeRate = 0) {
  if (!trades || trades.length < 2) return null;
  const returns    = trades.map(t => t.pnl || 0);
  const avg        = returns.reduce((s, r) => s + r, 0) / returns.length;
  const downsideReturns = returns.filter(r => r < 0);
  if (downsideReturns.length === 0) return null;
  const downsideVariance = downsideReturns.reduce((s, r) => s + Math.pow(r, 2), 0) / downsideReturns.length;
  const downsideStdDev   = Math.sqrt(downsideVariance);
  if (downsideStdDev === 0) return null;
  return ((avg - riskFreeRate) / downsideStdDev).toFixed(2);
}

/**
 * Expectancy — expected value per trade in $
 * (Win% × Avg Win) - (Loss% × Avg Loss)
 */
export function calcExpectancy(trades) {
  if (!trades || trades.length === 0) return null;
  const wins   = trades.filter(t => t.pnl > 0);
  const losses = trades.filter(t => t.pnl < 0);
  const winPct  = wins.length   / trades.length;
  const lossPct = losses.length / trades.length;
  const avgWin  = wins.length   > 0 ? wins.reduce((s, t)   => s + t.pnl, 0) / wins.length   : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length) : 0;
  return ((winPct * avgWin) - (lossPct * avgLoss)).toFixed(2);
}

/**
 * Payoff Ratio — avg win / avg loss
 */
export function calcPayoffRatio(trades) {
  if (!trades || trades.length === 0) return null;
  const wins   = trades.filter(t => t.pnl > 0);
  const losses = trades.filter(t => t.pnl < 0);
  if (!wins.length || !losses.length) return null;
  const avgWin  = wins.reduce((s, t)   => s + t.pnl, 0) / wins.length;
  const avgLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length);
  return (avgWin / avgLoss).toFixed(2);
}

/**
 * Kelly Criterion — optimal position sizing %
 * K = W - (1-W)/R  where W=win rate, R=payoff ratio
 */
export function calcKellyCriterion(trades) {
  if (!trades || trades.length < 10) return null;
  const wins    = trades.filter(t => t.pnl > 0);
  const losses  = trades.filter(t => t.pnl < 0);
  const W       = wins.length / trades.length;
  if (!wins.length || !losses.length) return null;
  const avgWin  = wins.reduce((s, t)   => s + t.pnl, 0) / wins.length;
  const avgLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length);
  const R       = avgWin / avgLoss;
  const kelly   = W - (1 - W) / R;
  return Math.max(0, kelly * 100).toFixed(1); // as percentage, min 0
}

/**
 * Calmar Ratio — annualized return / max drawdown
 */
export function calcCalmarRatio(trades, capital) {
  if (!trades || trades.length < 2 || !capital) return null;
  const totalPnl  = trades.reduce((s, t) => s + (t.pnl || 0), 0);
  const annReturn = totalPnl / capital * 100;

  // Calculate max drawdown
  let peak = capital, maxDD = 0, equity = capital;
  const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  sorted.forEach(t => {
    equity += t.pnl || 0;
    if (equity > peak) peak = equity;
    const dd = (peak - equity) / peak * 100;
    if (dd > maxDD) maxDD = dd;
  });

  if (maxDD === 0) return null;
  return (annReturn / maxDD).toFixed(2);
}

/**
 * Recovery Factor — total profit / max drawdown $
 */
export function calcRecoveryFactor(trades, capital) {
  if (!trades || trades.length < 2 || !capital) return null;
  const totalPnl = trades.reduce((s, t) => s + (t.pnl || 0), 0);
  if (totalPnl <= 0) return null;

  let peak = capital, maxDDAmount = 0, equity = capital;
  const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  sorted.forEach(t => {
    equity += t.pnl || 0;
    if (equity > peak) peak = equity;
    const dd = peak - equity;
    if (dd > maxDDAmount) maxDDAmount = dd;
  });

  if (maxDDAmount === 0) return null;
  return (totalPnl / maxDDAmount).toFixed(2);
}

/**
 * Consecutive wins/losses analysis
 */
export function calcConsecutiveStats(trades) {
  if (!trades || trades.length === 0) return null;
  const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));

  let maxWin = 0, maxLoss = 0, curWin = 0, curLoss = 0;
  const winStreaks = [], lossStreaks = [];

  sorted.forEach(t => {
    if (t.pnl > 0) {
      curWin++;
      if (curLoss > 0) { lossStreaks.push(curLoss); curLoss = 0; }
      if (curWin > maxWin) maxWin = curWin;
    } else {
      curLoss++;
      if (curWin > 0) { winStreaks.push(curWin); curWin = 0; }
      if (curLoss > maxLoss) maxLoss = curLoss;
    }
  });
  if (curWin > 0)  winStreaks.push(curWin);
  if (curLoss > 0) lossStreaks.push(curLoss);

  const avgWinStreak  = winStreaks.length  > 0 ? winStreaks.reduce((s, v)  => s + v, 0) / winStreaks.length  : 0;
  const avgLossStreak = lossStreaks.length > 0 ? lossStreaks.reduce((s, v) => s + v, 0) / lossStreaks.length : 0;

  return { maxWin, maxLoss, avgWinStreak: avgWinStreak.toFixed(1), avgLossStreak: avgLossStreak.toFixed(1) };
}

/**
 * Trade duration analysis (if date info available)
 * Returns avg holding period in days
 */
export function calcDurationStats(trades) {
  if (!trades || trades.length === 0) return null;
  // Group trades by date to estimate duration
  const byDate = {};
  trades.forEach(t => {
    if (!t.date) return;
    if (!byDate[t.date]) byDate[t.date] = [];
    byDate[t.date].push(t);
  });

  const dates = Object.keys(byDate).sort();
  if (dates.length < 2) return null;

  const tradingDays = dates.length;
  const totalDays   = Math.round((new Date(dates[dates.length-1]) - new Date(dates[0])) / 86400000) + 1;
  const tradesPerDay = (trades.length / tradingDays).toFixed(1);
  const activeDaysPct = ((tradingDays / totalDays) * 100).toFixed(0);

  // Best and worst day
  const dayPnl = {};
  trades.forEach(t => {
    if (!t.date) return;
    dayPnl[t.date] = (dayPnl[t.date] || 0) + (t.pnl || 0);
  });
  const dayValues = Object.values(dayPnl);
  const bestDay   = Math.max(...dayValues);
  const worstDay  = Math.min(...dayValues);

  return { tradingDays, totalDays, tradesPerDay, activeDaysPct, bestDay, worstDay };
}

/**
 * MAE/MFE simulation — estimated from SL/TP distance
 * Since we don't track tick-by-tick, we estimate from entry/SL/TP
 */
export function calcMAEMFE(trades) {
  if (!trades || trades.length === 0) return null;

  const maes = [], mfes = [];
  trades.forEach(t => {
    const entry = parseFloat(t.entry) || 0;
    const sl    = parseFloat(t.stopLoss) || 0;
    const tp    = parseFloat(t.takeProfit) || 0;
    const exit  = parseFloat(t.exit) || 0;
    if (!entry) return;

    // MAE = max adverse excursion (worst point against you)
    // Estimated: distance from entry to SL
    if (sl) {
      const mae = Math.abs(entry - sl) / entry * 100;
      maes.push(mae);
    }

    // MFE = max favorable excursion (best point in your favor)
    // Estimated: distance from entry to TP or exit (whichever better)
    const exitDist = exit ? Math.abs(exit - entry) / entry * 100 : 0;
    const tpDist   = tp   ? Math.abs(tp - entry)   / entry * 100 : 0;
    const mfe      = Math.max(exitDist, tpDist);
    if (mfe > 0) mfes.push(mfe);
  });

  if (maes.length === 0 && mfes.length === 0) return null;

  const avgMAE = maes.length > 0 ? (maes.reduce((s, v) => s + v, 0) / maes.length).toFixed(2) : null;
  const avgMFE = mfes.length > 0 ? (mfes.reduce((s, v) => s + v, 0) / mfes.length).toFixed(2) : null;
  const mfeMAERatio = (avgMAE && avgMFE) ? (parseFloat(avgMFE) / parseFloat(avgMAE)).toFixed(2) : null;

  return { avgMAE, avgMFE, mfeMAERatio, sampleSize: Math.min(maes.length, mfes.length) };
}

/**
 * Calculate all advanced stats at once
 */
export function calcAllAdvancedStats(trades, capital) {
  return {
    sharpe:       calcSharpeRatio(trades),
    sortino:      calcSortinoRatio(trades),
    expectancy:   calcExpectancy(trades),
    payoff:       calcPayoffRatio(trades),
    kelly:        calcKellyCriterion(trades),
    calmar:       calcCalmarRatio(trades, capital),
    recovery:     calcRecoveryFactor(trades, capital),
    consecutive:  calcConsecutiveStats(trades),
    duration:     calcDurationStats(trades),
    maemfe:       calcMAEMFE(trades),
  };
}