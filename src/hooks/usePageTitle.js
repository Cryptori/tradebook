import { useEffect } from "react";

const TAB_TITLES = {
  dashboard: "Dashboard",
  journal:   "Trade Log",
  analytics: "Analytics",
  calendar:  "Calendar",
  insights:  "Insights",
  review:    "Review",
  playbook:  "Playbook",
  daily:     "Daily Journal",
  replay:    "Trade Replay",
  share:     "Share",
  ai:        "AI Advisor",
  portfolio:      "Portfolio",
  "calendar-eco":  "Economic Calendar",
  achievements: "Achievements",
  plan:         "Trading Plan",
  risk:         "Risk Calculator",
  settings:  "Settings",
};

export function usePageTitle(activeTab) {
  useEffect(() => {
    const tab   = TAB_TITLES[activeTab] ?? activeTab;
    document.title = `${tab} · Tradebook`;
    return () => { document.title = "Tradebook"; };
  }, [activeTab]);
}