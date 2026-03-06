import { useState, useEffect } from "react";

const THEME_KEY = "tj_theme";

export const THEMES = {
  dark: {
    name: "dark",
    bg: "#090e1a",
    bgCard: "#0d1526",
    bgCard2: "#111827",
    bgHover: "#111827",
    bgInput: "#0d1526",
    bgSubtle: "rgba(255,255,255,0.03)",
    border: "#1e3a5f",
    borderSubtle: "rgba(30,58,95,0.13)",
    text: "#e2e8f0",
    textMuted: "#94a3b8",
    textDim: "#64748b",
    accent: "#00d4aa",
    accentAlt: "#00b4d8",
    danger: "#ef4444",
    warning: "#f59e0b",
    blue: "#3b82f6",
    chartGrid: "rgba(30,58,95,0.3)",
  },
  light: {
    name: "light",
    bg: "#f0f4f8",
    bgCard: "#ffffff",
    bgCard2: "#f8fafc",
    bgHover: "#f1f5f9",
    bgInput: "#ffffff",
    bgSubtle: "rgba(0,0,0,0.03)",
    border: "#cbd5e1",
    borderSubtle: "rgba(203,213,225,0.6)",
    text: "#0f172a",
    textMuted: "#475569",
    textDim: "#94a3b8",
    accent: "#0d9488",
    accentAlt: "#0284c7",
    danger: "#dc2626",
    warning: "#d97706",
    blue: "#2563eb",
    chartGrid: "rgba(203,213,225,0.5)",
  },
};

function getSavedTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved;
    // Auto-detect system preference on first visit
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }
    return "dark";
  } catch { return "dark"; }
}

export function useTheme() {
  const [themeName, setThemeName] = useState(getSavedTheme);
  const theme = THEMES[themeName] ?? THEMES.dark;

  useEffect(() => {
    try { localStorage.setItem(THEME_KEY, themeName); } catch { /* ignore */ }
    // Set data-theme on <html> so CSS variables switch automatically
    document.documentElement.setAttribute("data-theme", themeName);
    // Also set body bg/color as fallback for inline styles
    document.body.style.background = theme.bg;
    document.body.style.color = theme.text;
  }, [themeName, theme]);

  // Listen for system preference changes (only if user hasn't manually set a preference)
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: light)");
    if (!mq) return;

    function handleSystemChange(e) {
      // Only follow system if user hasn't saved a preference
      try {
        if (!localStorage.getItem(THEME_KEY)) {
          setThemeName(e.matches ? "light" : "dark");
        }
      } catch { /* ignore */ }
    }

    mq.addEventListener("change", handleSystemChange);
    return () => mq.removeEventListener("change", handleSystemChange);
  }, []);

  function toggleTheme() {
    setThemeName(prev => (prev === "dark" ? "light" : "dark"));
  }

  return { theme, themeName, toggleTheme };
}