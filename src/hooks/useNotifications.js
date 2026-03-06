import { useState, useEffect, useRef, useCallback } from "react";

const TOAST_DURATION = 6000;
const MAX_TOASTS     = 5;

// Milestones yang akan di-trigger
const WIN_STREAK_MILESTONES  = [3, 5, 10, 15, 20];
const LOSS_STREAK_MILESTONES = [3, 5];
const WIN_COUNT_MILESTONES   = [10, 25, 50, 100];
const TRADE_COUNT_MILESTONES = [10, 25, 50, 100, 200];

export function useNotifications({ stats, settings, currencyMeta }) {
  const [toasts, setToasts] = useState([]);
  const prevStats  = useRef(null);
  const timers     = useRef({});
  const fired      = useRef(new Set()); // prevent repeat-fire same milestone
  const sym        = currencyMeta?.symbol ?? "$";

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const addToast = useCallback((toast) => {
    // Dedupe by key
    if (toast.key && fired.current.has(toast.key)) return;
    if (toast.key) fired.current.add(toast.key);

    const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev.slice(-(MAX_TOASTS - 1)), { ...toast, id }]);
    timers.current[id] = setTimeout(() => dismissToast(id), TOAST_DURATION);
  }, [dismissToast]);

  // Cleanup timers on unmount
  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  useEffect(() => {
    if (!prevStats.current) {
      prevStats.current = stats;
      return;
    }
    const prev    = prevStats.current;
    const capital = settings?.capitalInitial ?? 10000;
    const maxDD   = capital * ((settings?.maxDrawdownPct   ?? 10) / 100);
    const targetP = capital * ((settings?.targetProfitPct  ?? 20) / 100);
    const targetT = settings?.targetTradesPerMonth ?? 20;

    // ── Drawdown alerts ──────────────────────────────────────────
    const ddPct     = maxDD > 0 ? (Math.abs(Math.min(stats.totalPnl, 0))   / maxDD) * 100 : 0;
    const prevDdPct = maxDD > 0 ? (Math.abs(Math.min(prev.totalPnl,  0))   / maxDD) * 100 : 0;

    if (ddPct >= 100 && prevDdPct < 100) {
      addToast({ type: "danger", key: `dd_100_${Math.floor(stats.totalPnl)}`,
        title: "⛔ Max Drawdown Terlewat!",
        message: `Total loss melebihi limit ${sym}${maxDD.toFixed(0)}. Pertimbangkan stop trading hari ini.`,
      });
    } else if (ddPct >= 80 && prevDdPct < 80) {
      addToast({ type: "warning", key: `dd_80_${Math.floor(stats.totalPnl)}`,
        title: "⚠️ Drawdown 80%",
        message: `Sudah 80% dari limit (${sym}${maxDD.toFixed(0)}). Hati-hati!`,
      });
    } else if (ddPct >= 50 && prevDdPct < 50) {
      addToast({ type: "info", key: `dd_50_${Math.floor(stats.totalPnl)}`,
        title: "ℹ️ Drawdown 50%",
        message: `Separuh drawdown limit terpakai. Review strategi sebelum lanjut.`,
      });
    }

    // ── Profit target ────────────────────────────────────────────
    if (stats.totalPnl >= targetP && prev.totalPnl < targetP) {
      addToast({ type: "success", key: `target_${Math.floor(targetP)}`,
        title: "🎯 Target Profit Tercapai!",
        message: `Selamat! ${settings.targetProfitPct}% target (${sym}${targetP.toFixed(0)}) berhasil dicapai. Kerja bagus!`,
      });
    }

    // ── Win streak milestones ────────────────────────────────────
    if (stats.streakType === "win" && stats.currentStreak > prev.currentStreak) {
      for (const ms of WIN_STREAK_MILESTONES) {
        if (stats.currentStreak === ms) {
          addToast({ type: "success", key: `win_streak_${ms}`,
            title: `🔥 ${ms} Win Streak!`,
            message: ms >= 10
              ? `Luar biasa! ${ms} kemenangan berturut-turut. Tetap disiplin!`
              : `${ms} trades menang berturut-turut. Momentum bagus!`,
          });
        }
      }
    }

    // ── Loss streak alert ────────────────────────────────────────
    if (stats.streakType === "loss" && stats.currentStreak > prev.currentStreak) {
      for (const ms of LOSS_STREAK_MILESTONES) {
        if (stats.currentStreak === ms) {
          addToast({ type: "warning", key: `loss_streak_${ms}_${stats.totalTrades}`,
            title: `⚠️ ${ms} Loss Berturut-turut`,
            message: ms >= 5
              ? `Waspada! ${ms} loss streak. Cek ulang setup dan kondisi market.`
              : `3 loss berturut-turut. Istirahat sebentar dan review trade terakhir.`,
          });
        }
      }
    }

    // ── Total wins milestone ─────────────────────────────────────
    if (stats.wins > prev.wins) {
      for (const ms of WIN_COUNT_MILESTONES) {
        if (stats.wins === ms) {
          addToast({ type: "success", key: `wins_${ms}`,
            title: `🏆 ${ms} Total Wins!`,
            message: `Milestone tercapai — ${ms} kemenangan total. Konsistensi adalah kunci!`,
          });
        }
      }
    }

    // ── Total trades milestone ───────────────────────────────────
    if (stats.totalTrades > prev.totalTrades) {
      for (const ms of TRADE_COUNT_MILESTONES) {
        if (stats.totalTrades === ms) {
          addToast({ type: "info", key: `trades_${ms}`,
            title: `📊 ${ms} Trades Logged!`,
            message: `Kamu sudah log ${ms} trades. Data makin akurat untuk analisis.`,
          });
        }
      }
    }

    // ── Monthly target trades ────────────────────────────────────
    if (stats.monthTrades > prev.monthTrades && stats.monthTrades === targetT) {
      addToast({ type: "success", key: `month_trades_${new Date().toISOString().slice(0, 7)}`,
        title: "📅 Target Trades Bulan Ini Tercapai!",
        message: `${targetT} trades bulan ini sudah terpenuhi. Win rate: ${((stats.monthWins / stats.monthTrades) * 100).toFixed(1)}%`,
      });
    }

    // ── First profitable trade after loss streak ─────────────────
    if (prev.streakType === "loss" && prev.currentStreak >= 3 && stats.streakType === "win") {
      addToast({ type: "success", key: `bounce_${stats.totalTrades}`,
        title: "💪 Balik Profit!",
        message: `Setelah ${prev.currentStreak} loss berturut-turut, kamu kembali profit. Lanjutkan!`,
      });
    }

    prevStats.current = stats;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.totalPnl, stats.currentStreak, stats.streakType, stats.wins, stats.totalTrades, stats.monthTrades]);

  return { toasts, dismissToast };
}