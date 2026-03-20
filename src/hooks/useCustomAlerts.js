import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "tb_custom_alerts";

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

export const ALERT_TYPES = [
  { id: "price",    label: "Price Alert",         icon: "💹", desc: "Notif kalau pair menyentuh level harga" },
  { id: "drawdown", label: "Drawdown Alert",       icon: "📉", desc: "Notif kalau drawdown mendekati limit" },
  { id: "streak",   label: "Win Streak Alert",     icon: "🔥", desc: "Notif kalau win streak mencapai target" },
  { id: "daily",    label: "Daily Reminder",       icon: "📝", desc: "Pengingat isi jurnal harian" },
  { id: "weekly",   label: "Weekly Review",        icon: "📊", desc: "Pengingat review mingguan" },
  { id: "custom",   label: "Custom Alert",         icon: "⚡", desc: "Alert dengan kondisi bebas" },
];

export const EMPTY_ALERT = {
  id: "", type: "daily", label: "", enabled: true,
  // Price alert
  pair: "", direction: "above", price: "",
  // Drawdown alert
  ddPercent: 80,
  // Streak alert
  streakTarget: 5,
  // Daily/weekly reminder
  time: "08:00", days: [1, 2, 3, 4, 5], // Mon-Fri
  // Custom
  condition: "",
  // All
  message: "", lastTriggered: null,
};

export function useCustomAlerts(trades, stats, settings) {
  const [alerts,   setAlerts]   = useState(load);
  const [showForm, setShowForm] = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [form,     setForm]     = useState(EMPTY_ALERT);
  const [triggered, setTriggered] = useState([]);

  // Check alerts every minute
  useEffect(() => {
    function checkAlerts() {
      const now     = new Date();
      const hour    = now.getHours();
      const minute  = now.getMinutes();
      const day     = now.getDay(); // 0=Sun
      const today   = now.toISOString().slice(0, 10);
      const capital = settings?.capitalInitial ?? 10000;
      const maxDD   = capital * ((settings?.maxDrawdownPct ?? 10) / 100);
      const ddPct   = maxDD > 0 ? (Math.abs(Math.min(stats?.totalPnl ?? 0, 0)) / maxDD) * 100 : 0;

      alerts.filter(a => a.enabled).forEach(alert => {
        const key = `${alert.id}_${today}_${hour}`;
        const alreadyFired = triggered.includes(key);
        if (alreadyFired) return;

        let shouldFire = false;
        let msg = alert.message || alert.label;

        switch (alert.type) {
          case "daily": {
            const [h, m] = (alert.time || "08:00").split(":").map(Number);
            const days = alert.days || [1,2,3,4,5];
            if (hour === h && minute < 5 && days.includes(day)) {
              shouldFire = true;
              msg = alert.message || "⏰ Waktunya isi jurnal trading harian!";
            }
            break;
          }
          case "weekly": {
            const [h, m] = (alert.time || "09:00").split(":").map(Number);
            if (day === 1 && hour === h && minute < 5) { // Monday
              shouldFire = true;
              msg = alert.message || "📊 Saatnya weekly review — lihat performa minggu lalu!";
            }
            break;
          }
          case "drawdown": {
            const threshold = parseFloat(alert.ddPercent) || 80;
            if (ddPct >= threshold) {
              shouldFire = true;
              msg = alert.message || `📉 Drawdown sudah ${ddPct.toFixed(0)}% dari limit — hati-hati!`;
            }
            break;
          }
          case "streak": {
            const target = parseInt(alert.streakTarget) || 5;
            const curStreak = stats?.currentStreak ?? 0;
            if (curStreak >= target) {
              shouldFire = true;
              msg = alert.message || `🔥 Win streak ${curStreak}x! Target ${target}x tercapai!`;
            }
            break;
          }
          default: break;
        }

        if (shouldFire) {
          setTriggered(prev => [...prev, key]);
          // Browser notification
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("Tradebook Alert", { body: msg, icon: "/icon-192.png" });
          }
          // Update lastTriggered
          setAlerts(prev => {
            const updated = prev.map(a => a.id === alert.id ? { ...a, lastTriggered: new Date().toISOString() } : a);
            save(updated);
            return updated;
          });
        }
      });
    }

    checkAlerts();
    const interval = setInterval(checkAlerts, 60000);
    return () => clearInterval(interval);
  }, [alerts, stats, settings, triggered]);

  function openAdd() {
    setForm({ ...EMPTY_ALERT, id: Date.now().toString() });
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(alert) {
    setForm({ ...alert });
    setEditId(alert.id);
    setShowForm(true);
  }

  function saveAlert() {
    if (!form.label.trim()) return;
    setAlerts(prev => {
      const updated = editId
        ? prev.map(a => a.id === editId ? { ...form } : a)
        : [...prev, { ...form }];
      save(updated);
      return updated;
    });
    setShowForm(false);
  }

  function deleteAlert(id) {
    setAlerts(prev => { const u = prev.filter(a => a.id !== id); save(u); return u; });
  }

  function toggleAlert(id) {
    setAlerts(prev => {
      const u = prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a);
      save(u);
      return u;
    });
  }

  function setField(key, val) {
    setForm(p => ({ ...p, [key]: val }));
  }

  async function requestPermission() {
    if (typeof Notification === "undefined") return "unsupported";
    const result = await Notification.requestPermission();
    return result;
  }

  const pushEnabled = typeof Notification !== "undefined" && Notification.permission === "granted";

  return {
    alerts, showForm, form, editId,
    openAdd, openEdit, closeForm: () => setShowForm(false),
    saveAlert, deleteAlert, toggleAlert, setField,
    requestPermission, pushEnabled,
  };
}