import { useState, useEffect, useRef, useCallback } from "react";

const TOAST_DURATION = 6000;
const MAX_TOASTS     = 5;

const WIN_STREAK_MILESTONES  = [3, 5, 10, 15, 20];
const LOSS_STREAK_MILESTONES = [3, 5];
const WIN_COUNT_MILESTONES   = [10, 25, 50, 100];
const TRADE_COUNT_MILESTONES = [10, 25, 50, 100, 200];

function sendPush(title, body) {
  try {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted") new Notification(title, { body, icon: "/icon-192.png" });
  } catch {}
}

async function requestPush() {
  try {
    if (typeof Notification === "undefined") return "unsupported";
    if (Notification.permission !== "default") return Notification.permission;
    return await Notification.requestPermission();
  } catch { return "unsupported"; }
}

function getRemState() {
  try { return JSON.parse(localStorage.getItem("tb_rem") || "{}"); } catch { return {}; }
}
function setRemState(key) {
  try { const s = getRemState(); localStorage.setItem("tb_rem", JSON.stringify({ ...s, [key]: 1 })); } catch {}
}
function journaledToday(entries) {
  const today = new Date().toISOString().slice(0, 10);
  return (entries || []).some(function(e) { return e.date === today; });
}

export function useNotifications({ stats, settings, currencyMeta, journalEntries, trades }) {
  const [toasts,      setToasts]      = useState([]);
  const [pushEnabled, setPushEnabled] = useState(false);
  const pushRef   = useRef(false);
  const prevStats = useRef(null);
  const timers    = useRef({});
  const fired     = useRef(new Set());
  const sym       = currencyMeta ? (currencyMeta.symbol || "$") : "$";

  // Sync pushRef dengan state
  useEffect(function() {
    pushRef.current = pushEnabled;
  }, [pushEnabled]);

  // Check push permission on mount
  useEffect(function() {
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        setPushEnabled(true);
        pushRef.current = true;
      }
    } catch {}
  }, []);

  const dismiss = useCallback(function(id) {
    setToasts(function(p) { return p.filter(function(t) { return t.id !== id; }); });
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  // add tidak depend on pushEnabled — pakai pushRef
  const add = useCallback(function(toast) {
    if (toast.key && fired.current.has(toast.key)) return;
    if (toast.key) fired.current.add(toast.key);
    var id = Date.now() + "_" + Math.random().toString(36).slice(2);
    setToasts(function(p) { return p.slice(-(MAX_TOASTS - 1)).concat([Object.assign({}, toast, { id: id })]); });
    timers.current[id] = setTimeout(function() { dismiss(id); }, TOAST_DURATION);
    if (pushRef.current) sendPush(toast.title, toast.message);
  }, [dismiss]);

  const enablePush = useCallback(async function() {
    var r = await requestPush();
    var granted = r === "granted";
    setPushEnabled(granted);
    pushRef.current = granted;
    return r;
  }, []);

  useEffect(function() {
    return function() { Object.values(timers.current).forEach(clearTimeout); };
  }, []);

  // Reminder harian & mingguan
  useEffect(function() {
    function check() {
      var now   = new Date();
      var h     = now.getHours();
      var today = now.toISOString().slice(0, 10);
      var s     = getRemState();

      var jKey = "j_" + today + "_" + (h >= 20 ? "pm" : "am");
      if (!s[jKey] && (h === 8 || h === 20) && !journaledToday(journalEntries)) {
        add({ type: "info", key: jKey, title: "Isi Jurnal Harian", message: h === 8 ? "Pagi! Tulis pre-market analysis hari ini." : "Malam! Sudah isi post-market journal belum?" });
        setRemState(jKey);
      }

      var sKey = "sw_" + today;
      if (!s[sKey] && h === 12 && (trades || []).length > 0) {
        var todayTrades = (trades || []).filter(function(t) { return t.date === today; });
        if (todayTrades.length === 0) {
          add({ type: "warning", key: sKey, title: "Belum Ada Trade Hari Ini", message: "Sudah jam 12 siang, belum ada trade yang di-log." });
          setRemState(sKey);
        }
      }

      var wKey = "wr_" + today;
      if (!s[wKey] && now.getDay() === 0 && h === 10) {
        add({ type: "info", key: wKey, title: "Weekly Review Time!", message: "Hari Minggu — review performa minggu ini di tab AI!" });
        setRemState(wKey);
      }
    }

    check();
    var iv = setInterval(check, 60 * 60 * 1000);
    return function() { clearInterval(iv); };
  }, [journalEntries, trades, add]);

  // Stats notifications
  useEffect(function() {
    if (!prevStats.current) { prevStats.current = stats; return; }
    var prev    = prevStats.current;
    var capital = settings ? (settings.capitalInitial || 10000) : 10000;
    var maxDD   = capital * ((settings ? (settings.maxDrawdownPct  || 10) : 10) / 100);
    var targetP = capital * ((settings ? (settings.targetProfitPct || 20) : 20) / 100);
    var targetT = settings ? (settings.targetTradesPerMonth || 20) : 20;
    var ddPct     = maxDD > 0 ? Math.abs(Math.min(stats.totalPnl, 0)) / maxDD * 100 : 0;
    var prevDdPct = maxDD > 0 ? Math.abs(Math.min(prev.totalPnl,  0)) / maxDD * 100 : 0;

    if (ddPct >= 100 && prevDdPct < 100) add({ type: "danger",  key: "dd100_" + Math.floor(stats.totalPnl), title: "Max Drawdown Terlewat!", message: "Loss melebihi limit " + sym + maxDD.toFixed(0) });
    else if (ddPct >= 80 && prevDdPct < 80) add({ type: "warning", key: "dd80_" + Math.floor(stats.totalPnl), title: "Drawdown 80%", message: "Sudah 80% dari limit (" + sym + maxDD.toFixed(0) + ")." });
    else if (ddPct >= 50 && prevDdPct < 50) add({ type: "info",    key: "dd50_" + Math.floor(stats.totalPnl), title: "Drawdown 50%", message: "Separuh drawdown limit terpakai." });

    if (stats.totalPnl >= targetP && prev.totalPnl < targetP)
      add({ type: "success", key: "tp_" + Math.floor(targetP), title: "Target Profit Tercapai!", message: (settings ? settings.targetProfitPct : 20) + "% target berhasil!" });

    if (stats.streakType === "win" && stats.currentStreak > prev.currentStreak)
      WIN_STREAK_MILESTONES.forEach(function(ms) { if (stats.currentStreak === ms) add({ type: "success", key: "ws_" + ms, title: ms + " Win Streak!", message: ms + " kemenangan berturut-turut!" }); });

    if (stats.streakType === "loss" && stats.currentStreak > prev.currentStreak)
      LOSS_STREAK_MILESTONES.forEach(function(ms) { if (stats.currentStreak === ms) add({ type: "warning", key: "ls_" + ms + "_" + stats.totalTrades, title: ms + " Loss Berturut-turut", message: "Review setup kamu." }); });

    if (stats.wins > prev.wins)
      WIN_COUNT_MILESTONES.forEach(function(ms) { if (stats.wins === ms) add({ type: "success", key: "wc_" + ms, title: ms + " Total Wins!", message: "Milestone " + ms + " kemenangan tercapai!" }); });

    if (stats.totalTrades > prev.totalTrades)
      TRADE_COUNT_MILESTONES.forEach(function(ms) { if (stats.totalTrades === ms) add({ type: "info", key: "tc_" + ms, title: ms + " Trades Logged!", message: "Kamu sudah log " + ms + " trades." }); });

    if (stats.monthTrades > prev.monthTrades && stats.monthTrades === targetT)
      add({ type: "success", key: "mt_" + new Date().toISOString().slice(0, 7), title: "Target Trades Bulan Ini!", message: targetT + " trades bulan ini terpenuhi." });

    if (prev.streakType === "loss" && prev.currentStreak >= 3 && stats.streakType === "win")
      add({ type: "success", key: "bounce_" + stats.totalTrades, title: "Balik Profit!", message: "Setelah " + prev.currentStreak + " loss, kamu kembali profit!" });

    prevStats.current = stats;
  }, [stats.totalPnl, stats.currentStreak, stats.streakType, stats.wins, stats.totalTrades, stats.monthTrades, add]);

  return { toasts: toasts, dismissToast: dismiss, pushEnabled: pushEnabled, enablePush: enablePush };
}