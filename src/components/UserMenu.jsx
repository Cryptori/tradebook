import { useState } from "react";

const AVATAR_COLORS = ["#00d4aa", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#10b981"];

function getInitials(profile, user) {
  const name = profile?.username ?? user?.email ?? "?";
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function Avatar({ initials, color, size = 28 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${color}, ${color}99)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.4, fontWeight: 700, color: "#fff", flexShrink: 0,
      fontFamily: "DM Mono, monospace",
    }}>
      {initials}
    </div>
  );
}

export default function UserMenu({ user, profile, onSignOut, theme }) {
  const t = theme;
  const [open, setOpen] = useState(false);
  if (!user) return null;

  const initials    = getInitials(profile, user);
  const avatarColor = getAvatarColor(user.email ?? "");
  const displayName = profile?.username ?? user.email?.split("@")[0] ?? "User";

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: `1px solid ${t.border}`, borderRadius: 20, padding: "4px 12px 4px 4px", cursor: "pointer" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = t.accent; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; }}>
        <Avatar initials={initials} color={avatarColor} />
        <span style={{ fontSize: 12, color: t.text, fontFamily: "DM Mono, monospace", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {displayName}
        </span>
        <span style={{ fontSize: 10, color: t.textDim }}>▾</span>
      </button>

      {open && (
        <>
          <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, minWidth: 200, zIndex: 100, boxShadow: "0 8px 32px rgba(0,0,0,0.25)", overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${t.border}`, display: "flex", gap: 10, alignItems: "center" }}>
              <Avatar initials={initials} color={avatarColor} size={36} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, color: t.text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</div>
                <div style={{ fontSize: 10, color: t.textDim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
              </div>
            </div>
            <div style={{ padding: "6px 0" }}>
              <button
                onClick={() => { setOpen(false); onSignOut(); }}
                style={{ width: "100%", padding: "10px 16px", background: "none", border: "none", color: "#ef4444", fontFamily: "DM Mono, monospace", fontSize: 12, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; }}>
                <span>⏏</span> Logout
              </button>
            </div>
          </div>
          <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />
        </>
      )}
    </div>
  );
}