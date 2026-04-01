import { useMemo } from "react";

/**
 * Evaluate all risk rules against today's and this week's trades
 * Returns status per rule + overall lock status
 */
export function useRiskRules(trades, settings) {
  return useMemo(() => {
    if (!settings || !trades) return { rules: [], locked: false, warnings: [] };

    const today     = new Date().toISOString().slice(0, 10);
    const weekStart = (() => {
      const d   = new Date();
      const day = d.getDay();
      d.setDate(d.getDate() - ((day + 6) % 7));
      return d.toISOString().slice(0, 10);
    })();

    const todayTrades  = (trades || []).filter(t => t.date === today);
    const weekTrades   = (trades || []).filter(t => t.date >= weekStart);

    // Today P&L
    const todayPnl  = todayTrades.reduce((s, t) => s + (t.pnl || 0), 0);
    const weekPnl   = weekTrades.reduce((s, t)  => s + (t.pnl || 0), 0);
    const todayCount = todayTrades.length;

    // Consecutive loss streak (recent)
    let consLoss = 0;
    const sorted = [...(trades || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
    for (const tr of sorted) {
      if (tr.pnl < 0) consLoss++;
      else break;
    }

    const rules = [];
    const warnings = [];
    let locked = false;

    // ── Daily loss limit ──────────────────────────────────────
    if (settings.riskDailyLoss) {
      const limit  = parseFloat(settings.riskDailyLoss);
      const used   = Math.abs(Math.min(todayPnl, 0));
      const pct    = limit > 0 ? (used / limit) * 100 : 0;
      const hit    = todayPnl <= -limit;
      const warn   = pct >= 80 && !hit;
      rules.push({ id: "dailyLoss", label: "Daily Loss Limit", limit, used, pct, hit, warn, type: "loss",
        desc: `Hari ini: ${todayPnl >= 0 ? "+" : ""}$${todayPnl.toFixed(0)} / limit -$${limit}` });
      if (hit) { locked = true; warnings.push({ level: "danger", msg: `Daily loss limit $${limit} tercapai — stop trading hari ini!` }); }
      else if (warn) warnings.push({ level: "warning", msg: `Mendekati daily loss limit (${pct.toFixed(0)}%)` });
    }

    // ── Daily profit target ───────────────────────────────────
    if (settings.riskDailyProfit) {
      const limit = parseFloat(settings.riskDailyProfit);
      const used  = Math.max(todayPnl, 0);
      const pct   = limit > 0 ? (used / limit) * 100 : 0;
      const hit   = todayPnl >= limit;
      rules.push({ id: "dailyProfit", label: "Daily Profit Target", limit, used, pct, hit, warn: false, type: "profit",
        desc: `Hari ini: +$${Math.max(todayPnl, 0).toFixed(0)} / target $${limit}` });
      if (hit && settings.riskLockOnProfit) {
        locked = true;
        warnings.push({ level: "success", msg: `Daily profit target $${limit} tercapai — waktunya stop trading!` });
      }
    }

    // ── Max trades per day ────────────────────────────────────
    if (settings.riskMaxTrades) {
      const limit = parseInt(settings.riskMaxTrades);
      const pct   = limit > 0 ? (todayCount / limit) * 100 : 0;
      const hit   = todayCount >= limit;
      const warn  = pct >= 80 && !hit;
      rules.push({ id: "maxTrades", label: "Max Trades / Hari", limit, used: todayCount, pct, hit, warn, type: "count",
        desc: `Hari ini: ${todayCount} / ${limit} trades` });
      if (hit) { locked = true; warnings.push({ level: "danger", msg: `Batas ${limit} trades hari ini sudah tercapai!` }); }
      else if (warn) warnings.push({ level: "warning", msg: `${todayCount}/${limit} trades hari ini` });
    }

    // ── Max consecutive loss ──────────────────────────────────
    if (settings.riskMaxConsLoss) {
      const limit = parseInt(settings.riskMaxConsLoss);
      const pct   = limit > 0 ? (consLoss / limit) * 100 : 0;
      const hit   = consLoss >= limit;
      const warn  = pct >= 80 && !hit;
      rules.push({ id: "consLoss", label: "Max Consecutive Loss", limit, used: consLoss, pct, hit, warn, type: "streak",
        desc: `${consLoss} loss berturut-turut / max ${limit}` });
      if (hit) { locked = true; warnings.push({ level: "danger", msg: `${limit} loss berturut-turut — ambil jeda dulu!` }); }
      else if (warn) warnings.push({ level: "warning", msg: `${consLoss} loss berturut-turut — hati-hati!` });
    }

    // ── Weekly loss limit ─────────────────────────────────────
    if (settings.riskWeeklyLoss) {
      const limit = parseFloat(settings.riskWeeklyLoss);
      const used  = Math.abs(Math.min(weekPnl, 0));
      const pct   = limit > 0 ? (used / limit) * 100 : 0;
      const hit   = weekPnl <= -limit;
      const warn  = pct >= 80 && !hit;
      rules.push({ id: "weeklyLoss", label: "Weekly Loss Limit", limit, used, pct, hit, warn, type: "loss",
        desc: `Minggu ini: ${weekPnl >= 0 ? "+" : ""}$${weekPnl.toFixed(0)} / limit -$${limit}` });
      if (hit) { locked = true; warnings.push({ level: "danger", msg: `Weekly loss limit $${limit} tercapai — stop trading minggu ini!` }); }
      else if (warn) warnings.push({ level: "warning", msg: `Mendekati weekly loss limit (${pct.toFixed(0)}%)` });
    }

    return { rules, locked: locked && settings.riskLockMode, warnings, todayPnl, todayCount, weekPnl, consLoss };
  }, [trades, settings]);
}