import { useState, useEffect } from "react";

const THEME_KEY = "tj_theme";

export const THEMES = {
  dark: {
    name: "dark",
    label: "Dark",
    emoji: "🌙",
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
    label: "Light",
    emoji: "☀️",
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
  midnight: {
    name: "midnight",
    label: "Midnight",
    emoji: "🌑",
    bg: "#000000",
    bgCard: "#0a0a0a",
    bgCard2: "#111111",
    bgHover: "#1a1a1a",
    bgInput: "#0a0a0a",
    bgSubtle: "rgba(255,255,255,0.03)",
    border: "#222222",
    borderSubtle: "rgba(34,34,34,0.5)",
    text: "#e8e8e8",
    textMuted: "#888888",
    textDim: "#444444",
    accent: "#00ff99",
    accentAlt: "#00ccff",
    gold: "#ffd700",
    danger: "#ff4444",
    warning: "#ffaa00",
    blue: "#4488ff",
    chartGrid: "rgba(34,34,34,0.4)",
  },
  forest: {
    name: "forest",
    label: "Forest",
    emoji: "🌲",
    bg: "#0a1a0f",
    bgCard: "#0f2318",
    bgCard2: "#132b1e",
    bgHover: "#1a3526",
    bgInput: "#0f2318",
    bgSubtle: "rgba(0,255,100,0.03)",
    border: "#1e4028",
    borderSubtle: "rgba(30,64,40,0.5)",
    text: "#d4edda",
    textMuted: "#7aaa88",
    textDim: "#3d6648",
    accent: "#4ade80",
    accentAlt: "#22d3ee",
    gold: "#fbbf24",
    danger: "#f87171",
    warning: "#fbbf24",
    blue: "#60a5fa",
    chartGrid: "rgba(30,64,40,0.35)",
  },
  sepia: {
    name: "sepia",
    label: "Sepia",
    emoji: "📜",
    bg: "#1a1208",
    bgCard: "#231a0c",
    bgCard2: "#2c2010",
    bgHover: "#352815",
    bgInput: "#231a0c",
    bgSubtle: "rgba(255,200,100,0.04)",
    border: "#3d2e14",
    borderSubtle: "rgba(61,46,20,0.5)",
    text: "#f0e6cc",
    textMuted: "#b09060",
    textDim: "#6b5030",
    accent: "#d4a84b",
    accentAlt: "#e8934a",
    gold: "#f5c842",
    danger: "#e05252",
    warning: "#e8934a",
    blue: "#7ab8d4",
    chartGrid: "rgba(61,46,20,0.35)",
  },
  ocean: {
    name: "ocean",
    label: "Ocean",
    emoji: "🌊",
    bg: "#060e1a",
    bgCard: "#091525",
    bgCard2: "#0c1c2e",
    bgHover: "#102238",
    bgInput: "#091525",
    bgSubtle: "rgba(0,150,255,0.04)",
    border: "#0e2540",
    borderSubtle: "rgba(14,37,64,0.5)",
    text: "#cce8ff",
    textMuted: "#6699cc",
    textDim: "#2e5580",
    accent: "#00b4d8",
    accentAlt: "#48cae4",
    gold: "#f0c040",
    danger: "#ef4444",
    warning: "#f59e0b",
    blue: "#3b82f6",
    chartGrid: "rgba(14,37,64,0.4)",
  },
  rose: {
    name: "rose",
    label: "Rose",
    emoji: "🌹",
    bg: "#160c10",
    bgCard: "#1f1018",
    bgCard2: "#271420",
    bgHover: "#301828",
    bgInput: "#1f1018",
    bgSubtle: "rgba(255,100,150,0.04)",
    border: "#3d1828",
    borderSubtle: "rgba(61,24,40,0.5)",
    text: "#ffe4ec",
    textMuted: "#cc7090",
    textDim: "#6b3048",
    accent: "#f472b6",
    accentAlt: "#e879a0",
    gold: "#fbbf24",
    danger: "#ef4444",
    warning: "#f59e0b",
    blue: "#818cf8",
    chartGrid: "rgba(61,24,40,0.35)",
  }

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

  return { theme, themeName, toggleTheme, setThemeName };
}