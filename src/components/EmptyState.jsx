// ── Reusable EmptyState component ────────────────────────────────
export default function EmptyState({
  icon, title, desc, action, actionLabel, secondaryAction, secondaryLabel, theme: t,
}) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "64px 24px", textAlign: "center",
    }}>
      {/* Icon with glow */}
      <div style={{
        width: 80, height: 80, borderRadius: "50%",
        background: "linear-gradient(135deg, rgba(0,200,150,0.08), rgba(0,200,150,0.04))",
        border: "1px solid rgba(0,200,150,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 36, marginBottom: 20,
        boxShadow: "0 0 40px rgba(0,200,150,0.06)",
      }}>
        {icon}
      </div>

      <div style={{
        fontSize: 16, fontWeight: 500, color: t.text,
        marginBottom: 8, letterSpacing: "-0.01em",
      }}>
        {title}
      </div>

      {desc && (
        <div style={{
          fontSize: 12, color: t.textDim, maxWidth: 280,
          lineHeight: 1.8, marginBottom: 24,
        }}>
          {desc}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {action && (
          <button onClick={action} className="btn-primary" style={{ fontSize: 12 }}>
            {actionLabel}
          </button>
        )}
        {secondaryAction && (
          <button onClick={secondaryAction} className="btn-ghost" style={{ fontSize: 12 }}>
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}