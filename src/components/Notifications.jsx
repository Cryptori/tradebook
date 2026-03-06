const TOAST_STYLES = {
  danger:  { bg: "rgba(239,68,68,0.12)",  border: "#ef4444", icon: "⚠️" },
  warning: { bg: "rgba(245,158,11,0.12)", border: "#f59e0b", icon: "🔔" },
  success: { bg: "rgba(0,212,170,0.12)",  border: "#00d4aa", icon: "🎯" },
  info:    { bg: "transparent",           border: "#1e3a5f", icon: "ℹ️" },
};

function Toast({ toast, onDismiss, theme: t }) {
  const s = TOAST_STYLES[toast.type] ?? TOAST_STYLES.info;
  return (
    <div style={{
      background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: 10, padding: "12px 16px",
      display: "flex", alignItems: "flex-start", gap: 10,
      boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      animation: "toastIn 0.3s ease",
      minWidth: 280, maxWidth: 360,
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{s.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: t.text, marginBottom: 2 }}>{toast.title}</div>
        <div style={{ fontSize: 11, color: t.textMuted }}>{toast.message}</div>
      </div>
      <button onClick={() => onDismiss(toast.id)}
        style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 14, padding: 0, flexShrink: 0, lineHeight: 1 }}>
        ✕
      </button>
    </div>
  );
}

export default function NotificationsContainer({ toasts, onDismiss, theme }) {
  if (!toasts?.length) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 300, display: "flex", flexDirection: "column", gap: 8 }}>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}`}</style>
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} theme={theme} />
      ))}
    </div>
  );
}