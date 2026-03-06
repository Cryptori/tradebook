import { useEffect } from "react";

const TAB_TITLES = {
  dashboard: "Dashboard",
  journal:   "Trade Log",
  analytics: "Analytics",
  calendar:  "Calendar",
  insights:  "Insights",
  review:    "Review",
  playbook:  "Playbook",
  risk:      "Risk Calculator",
  settings:  "Settings",
};

export function usePageTitle(activeTab) {
  useEffect(() => {
    const tab   = TAB_TITLES[activeTab] ?? activeTab;
    document.title = `${tab} · Tradebook`;
    return () => { document.title = "Tradebook"; };
  }, [activeTab]);
}