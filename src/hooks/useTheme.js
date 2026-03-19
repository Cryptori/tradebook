import { useState, useEffect } from "react";

const THEME_KEY = "tj_theme";

export const THEMES = {
  dark: {
    name: "dark",
    bg: "#080c14",
    bgCard: "#0c1220",
    bgCard2: "#0f1628",
    bgHover: "#111a2e",
    bgInput: "#0c1220",
    bgSubtle: "rgba(255,255,255,0.025)",
    border: "#1c2d4a",
    borderSubtle: "rgba(28,45,74,0.4)",
    text: "#dde4ef",
    textMuted: "#8a96aa",
    textDim: "#4a5568",
    accent: "#00c896",
    accentAlt: "#0ea5e9",
    gold: "#c9a84c",
    danger: "#ef4444",
    warning: "#f59e0b",
    blue: "#3b82f6",
    chartGrid: "rgba(28,45,74,0.35)",
  },
  light: {
    name: "light",
    bg: "#f4f1eb",
    bgCard: "#faf8f4",
    bgCard2: "#f0ece4",
    bgHover: "#ede8df",
    bgInput: "#ffffff",
    bgSubtle: "rgba(0,0,0,0.03)",
    border: "#d4cdc0",
    borderSubtle: "rgba(212,205,192,0.5)",
    text: "#1a1a2e",
    textMuted: "#4a4a6a",
    textDim: "#8a8a9a",
    accent: "#0a7c6a",
    accentAlt: "#1565c0",
    gold: "#8b6914",
    danger: "#dc2626",
    warning: "#d97706",
    blue: "#1565c0",
    chartGrid: "rgba(212,205,192,0.4)",
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