// Preset tags dikelompokkan per kategori
export const PRESET_TAGS = [
  // Confidence
  { label: "High Confidence", color: "#00d4aa" },
  { label: "Low Confidence",  color: "#64748b" },
  // Behavior
  { label: "Revenge Trade",   color: "#ef4444" },
  { label: "FOMO Entry",      color: "#f59e0b" },
  { label: "Patient Wait",    color: "#10b981" },
  { label: "Early Exit",      color: "#f59e0b" },
  { label: "Let It Run",      color: "#3b82f6" },
  { label: "Impulsive",       color: "#ef4444" },
  { label: "Planned",         color: "#00d4aa" },
  // Setup quality
  { label: "A+ Setup",        color: "#8b5cf6" },
  { label: "B Setup",         color: "#6366f1" },
  // Market context
  { label: "With Trend",      color: "#00d4aa" },
  { label: "Counter Trend",   color: "#f59e0b" },
  { label: "News Trade",      color: "#ec4899" },
  { label: "Range",           color: "#94a3b8" },
];

// Lookup cepat label → color
export const TAG_COLOR_MAP = Object.fromEntries(
  PRESET_TAGS.map(t => [t.label, t.color])
);

// Ambil warna tag (preset atau custom)
export function getTagColor(label) {
  return TAG_COLOR_MAP[label] ?? "#475569";
}