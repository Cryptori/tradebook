// Reusable skeleton loading components

function Pulse({ width = "100%", height = 16, radius = 6, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: "var(--bg-subtle)",
      backgroundImage: "linear-gradient(90deg, var(--bg-subtle) 25%, var(--bg-hover) 50%, var(--bg-subtle) 75%)",
      backgroundSize: "200% 100%",
      animation: "skeletonPulse 1.4s ease infinite",
      ...style,
    }} />
  );
}

// ── Stat card skeleton ────────────────────────────────────────────
export function StatCardSkeleton() {
  return (
    <div className="stat-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Pulse width="60%" height={10} />
      <Pulse width="80%" height={26} />
      <Pulse width="50%" height={10} />
    </div>
  );
}

// ── Dashboard skeleton ────────────────────────────────────────────
export function DashboardSkeleton() {
  return (
    <div>
      <Pulse width={160} height={28} radius={6} style={{ marginBottom: 24 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
        {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="stat-card">
            <Pulse width="50%" height={10} style={{ marginBottom: 16 }} />
            <Pulse width="100%" height={180} radius={8} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Table row skeleton ────────────────────────────────────────────
export function TableSkeleton({ rows = 6 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {[...Array(rows)].map((_, i) => (
        <div key={i} style={{ display: "flex", gap: 12, padding: "14px 18px", alignItems: "center" }}
          className="stat-card">
          <Pulse width={70}  height={11} />
          <Pulse width={90}  height={11} style={{ flex: 1 }} />
          <Pulse width={50}  height={20} radius={10} />
          <Pulse width={60}  height={11} />
          <Pulse width={60}  height={11} />
          <Pulse width={60}  height={11} />
          <Pulse width={70}  height={11} />
          <Pulse width={80}  height={28} radius={8} />
        </div>
      ))}
    </div>
  );
}

// ── Card list skeleton (Playbook / Review sidebar) ─────────────────
export function CardListSkeleton({ count = 4 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="stat-card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Pulse width="70%" height={13} />
          <Pulse width="45%" height={10} />
          <Pulse width="100%" height={4} radius={2} />
        </div>
      ))}
    </div>
  );
}

// ── Full page loading ─────────────────────────────────────────────
export function PageSkeleton() {
  return (
    <div style={{ padding: 24 }}>
      <Pulse width={200} height={28} style={{ marginBottom: 24 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px,1fr))", gap: 14, marginBottom: 24 }}>
        {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <TableSkeleton rows={5} />
    </div>
  );
}

// ── CSS keyframe — inject once ────────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("skeleton-style")) {
  const style = document.createElement("style");
  style.id = "skeleton-style";
  style.textContent = `
    @keyframes skeletonPulse {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  document.head.appendChild(style);
}