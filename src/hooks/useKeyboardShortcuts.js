import { useEffect } from "react";

const TAB_KEYS = {
  "1": "dashboard",
  "2": "journal",
  "3": "analytics",
  "4": "calendar",
  "5": "insights",
  "6": "review",
  "7": "playbook",
  "8": "risk",
  "9": "settings",
};

/**
 * Global keyboard shortcuts:
 * 1-9        → switch tab
 * N          → new trade
 * Escape     → close form
 * ? or /     → show shortcut help (future)
 */
export function useKeyboardShortcuts({ setActiveTab, onAddTrade, onCloseForm, showForm }) {
  useEffect(() => {
    function handleKey(e) {
      // Skip if typing in an input/textarea/select
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (["input", "textarea", "select"].includes(tag)) return;

      // Skip if modifier keys (Ctrl/Cmd) — those are for other shortcuts
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Escape — close form
      if (e.key === "Escape" && showForm) {
        e.preventDefault();
        onCloseForm?.();
        return;
      }

      // N — new trade
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        onAddTrade?.();
        return;
      }

      // 1-9 — switch tab
      const tab = TAB_KEYS[e.key];
      if (tab) {
        e.preventDefault();
        setActiveTab(tab);
        return;
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [setActiveTab, onAddTrade, onCloseForm, showForm]);
}