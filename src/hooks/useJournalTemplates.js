import { useState, useCallback } from "react";

const STORAGE_KEY = "tb_journal_templates";
const ENTRIES_KEY = "tb_template_entries";

function load(key) {
  try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; }
}
function save(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

// ── Built-in templates ────────────────────────────────────────────
export const BUILTIN_TEMPLATES = [
  {
    id: "simple_premarket",
    name: "Simple Pre-Market",
    type: "premarket",
    icon: "🌅",
    desc: "Analisis singkat sebelum market buka",
    fields: [
      { id: "bias",      label: "Market Bias",      type: "select", options: ["Bullish", "Bearish", "Sideways", "Uncertain"], required: true },
      { id: "focus",     label: "Pair Fokus Hari Ini", type: "text",   placeholder: "EUR/USD, XAU/USD..." },
      { id: "key_levels",label: "Level Penting",     type: "textarea", placeholder: "Support, resistance, POI..." },
      { id: "news",      label: "News/Events Hari Ini", type: "textarea", placeholder: "High impact news..." },
      { id: "plan",      label: "Trading Plan",      type: "textarea", placeholder: "Rencanamu hari ini..." },
    ],
  },
  {
    id: "detailed_premarket",
    name: "Detailed Pre-Market",
    type: "premarket",
    icon: "📋",
    desc: "Analisis mendalam dengan multi-timeframe",
    fields: [
      { id: "htf_bias",   label: "HTF Bias (D/W)",     type: "select",   options: ["Bullish", "Bearish", "Sideways"] },
      { id: "ltf_bias",   label: "LTF Bias (1H/4H)",   type: "select",   options: ["Bullish", "Bearish", "Sideways"] },
      { id: "dxy",        label: "DXY Analysis",        type: "textarea", placeholder: "Analisis Dollar Index..." },
      { id: "key_levels", label: "Key Levels",          type: "textarea", placeholder: "Supply/demand zones, FVG, OB..." },
      { id: "pairs",      label: "Watchlist Pair",      type: "text",     placeholder: "EUR/USD, GBP/USD..." },
      { id: "news",       label: "High Impact News",    type: "textarea", placeholder: "Waktu dan currency affected..." },
      { id: "risk",       label: "Max Risk Hari Ini",   type: "text",     placeholder: "2% atau $100..." },
      { id: "plan",       label: "Setup yang Dicari",   type: "textarea", placeholder: "Setup spesifik yang akan diambil..." },
      { id: "mindset",    label: "Mindset Hari Ini",    type: "textarea", placeholder: "Kondisi mental dan emosi..." },
    ],
  },
  {
    id: "ict_premarket",
    name: "ICT Pre-Market",
    type: "premarket",
    icon: "🎯",
    desc: "Template ICT / Smart Money style",
    fields: [
      { id: "premium_discount", label: "Premium/Discount Zone", type: "select", options: ["Premium (sell zone)", "Discount (buy zone)", "Equilibrium"] },
      { id: "ob",          label: "Order Blocks Aktif",   type: "textarea", placeholder: "Bullish/Bearish OB levels..." },
      { id: "fvg",         label: "Fair Value Gaps",      type: "textarea", placeholder: "FVG yang belum terisi..." },
      { id: "liquidity",   label: "Liquidity Targets",    type: "textarea", placeholder: "BSL, SSL, EQH, EQL..." },
      { id: "killzone",    label: "Killzone Session",     type: "select",   options: ["London Open", "New York AM", "New York PM", "Asian Range"] },
      { id: "model",       label: "ICT Model",            type: "text",     placeholder: "2022 model, Turtle soup, etc..." },
      { id: "bias",        label: "Directional Bias",     type: "select",   options: ["Long", "Short", "Neutral"] },
      { id: "news",        label: "News Catalyst",        type: "textarea", placeholder: "News yang bisa jadi catalyst..." },
    ],
  },
  {
    id: "postmarket",
    name: "Post-Market Review",
    type: "postmarket",
    icon: "🌙",
    desc: "Review dan evaluasi setelah trading",
    fields: [
      { id: "summary",    label: "Ringkasan Hari Ini",   type: "textarea", placeholder: "Apa yang terjadi hari ini?", required: true },
      { id: "trades_taken", label: "Trade yang Diambil", type: "textarea", placeholder: "Deskripsi trade-trade hari ini..." },
      { id: "wins",       label: "Apa yang Berjalan Baik", type: "textarea", placeholder: "Keputusan baik yang dibuat..." },
      { id: "mistakes",   label: "Kesalahan / Mistakes", type: "textarea", placeholder: "Apa yang bisa diperbaiki?" },
      { id: "lessons",    label: "Lesson Learned",       type: "textarea", placeholder: "Pelajaran dari hari ini..." },
      { id: "emotions",   label: "Evaluasi Emosi",       type: "select",   options: ["😌 Calm & disciplined", "😤 Frustrated", "😰 Anxious", "💪 Confident", "😴 Tired", "🤯 Overtraded"] },
      { id: "tomorrow",   label: "Plan untuk Besok",     type: "textarea", placeholder: "Fokus dan perbaikan untuk besok..." },
      { id: "rating",     label: "Rating Hari Ini",      type: "select",   options: ["⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"] },
    ],
  },
  {
    id: "weekly_review",
    name: "Weekly Review",
    type: "weekly",
    icon: "📊",
    desc: "Review komprehensif akhir minggu",
    fields: [
      { id: "week_summary", label: "Ringkasan Minggu",    type: "textarea", placeholder: "Overview performa minggu ini..." },
      { id: "best_trade",  label: "Best Trade Minggu Ini", type: "textarea", placeholder: "Trade terbaik dan alasannya..." },
      { id: "worst_trade", label: "Worst Trade",          type: "textarea", placeholder: "Trade terburuk dan pelajarannya..." },
      { id: "patterns",    label: "Pattern yang Ditemukan", type: "textarea", placeholder: "Pola behavior yang terulang..." },
      { id: "goals_review", label: "Review Goals Minggu Ini", type: "textarea", placeholder: "Apakah goals tercapai?" },
      { id: "next_week",   label: "Focus Minggu Depan",   type: "textarea", placeholder: "Target dan focus untuk minggu depan..." },
      { id: "mindset_rating", label: "Mindset Rating",    type: "select",   options: ["Need improvement", "Developing", "Good", "Excellent"] },
    ],
  },
];

export function useJournalTemplates(trades, journalEntries) {
  const [customTemplates, setCustomTemplates] = useState(() => load(STORAGE_KEY) || []);
  const [entries, setEntries] = useState(() => load(ENTRIES_KEY) || []);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [formValues,  setFormValues]  = useState({});
  const [editDate,    setEditDate]    = useState(new Date().toISOString().slice(0, 10));
  const [savedMsg,    setSavedMsg]    = useState("");

  // Combine built-in + custom
  const allTemplates = [...BUILTIN_TEMPLATES, ...customTemplates];

  // Auto-fill from today's trades
  function autoFill(templateId) {
    const today      = editDate;
    const todayTrades = (trades || []).filter(tr => tr.date === today);

    const filled = {};
    if (todayTrades.length > 0) {
      const pnl    = todayTrades.reduce((s, tr) => s + (tr.pnl || 0), 0);
      const pairs  = [...new Set(todayTrades.map(tr => tr.pair))].join(", ");
      const wins   = todayTrades.filter(tr => tr.pnl >= 0).length;
      const losses = todayTrades.length - wins;

      filled.trades_taken = `${todayTrades.length} trades: ${pairs}\nWins: ${wins} | Losses: ${losses} | P&L: ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(0)}`;
      filled.pairs = pairs;
      filled.summary = `${todayTrades.length} trade diambil. Total P&L: ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(0)}`;
    }
    setFormValues(prev => ({ ...prev, ...filled }));
  }

  function loadTemplate(template) {
    setActiveTemplate(template);
    setFormValues({});
    setSavedMsg("");
  }

  function setField(fieldId, value) {
    setFormValues(prev => ({ ...prev, [fieldId]: value }));
  }

  function saveEntry() {
    if (!activeTemplate) return;
    const entry = {
      id:         Date.now().toString(),
      templateId: activeTemplate.id,
      templateName: activeTemplate.name,
      type:       activeTemplate.type,
      date:       editDate,
      values:     { ...formValues },
      createdAt:  new Date().toISOString(),
    };
    setEntries(prev => {
      const updated = [entry, ...prev.filter(e => !(e.templateId === activeTemplate.id && e.date === editDate))];
      save(ENTRIES_KEY, updated);
      return updated;
    });
    setSavedMsg("✓ Tersimpan!");
    setTimeout(() => setSavedMsg(""), 3000);
  }

  // Load existing entry for current template + date
  function loadExisting() {
    if (!activeTemplate) return;
    const existing = entries.find(e => e.templateId === activeTemplate.id && e.date === editDate);
    if (existing) setFormValues(existing.values || {});
  }

  // Custom template CRUD
  function saveCustomTemplate(template) {
    const updated = template.id
      ? customTemplates.map(t => t.id === template.id ? template : t)
      : [...customTemplates, { ...template, id: "custom_" + Date.now() }];
    setCustomTemplates(updated);
    save(STORAGE_KEY, updated);
  }

  function deleteCustomTemplate(id) {
    const updated = customTemplates.filter(t => t.id !== id);
    setCustomTemplates(updated);
    save(STORAGE_KEY, updated);
  }

  const entriesByDate = entries.reduce((map, e) => {
    if (!map[e.date]) map[e.date] = [];
    map[e.date].push(e);
    return map;
  }, {});

  return {
    allTemplates, customTemplates, entries, entriesByDate,
    activeTemplate, formValues, editDate, savedMsg,
    setEditDate, loadTemplate, setField, saveEntry, autoFill, loadExisting,
    saveCustomTemplate, deleteCustomTemplate,
  };
}