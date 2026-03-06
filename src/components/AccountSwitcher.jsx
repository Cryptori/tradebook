import { useState } from "react";
import { ACCOUNT_TYPES } from "../hooks/useAccounts";

export default function AccountSwitcher({ accounts, activeAccount, onSwitch, onAdd, onDelete, theme }) {
  const t = theme;
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("Personal");
  const [newColor, setNewColor] = useState("#00d4aa");

  const COLORS = ["#00d4aa", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#ef4444", "#10b981"];

  function handleAdd() {
    if (!newName.trim()) return;
    onAdd(newName.trim(), newType, newColor);
    setNewName(""); setNewType("Personal"); setNewColor("#00d4aa");
    setAdding(false); setOpen(false);
  }

  // Guard: accounts still loading from Supabase
  if (!activeAccount) {
    return (
      <div style={{ padding: "6px 12px", background: t.bgSubtle, border: `1px solid ${t.border}`, borderRadius: 8, fontSize: 12, color: t.textDim, fontFamily: "DM Mono, monospace" }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 8, background: t.bgSubtle, border: `1px solid ${t.border}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: "DM Mono, monospace", fontSize: 12, color: t.text, maxWidth: 200 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: activeAccount.color, flexShrink: 0 }} />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeAccount.name}</span>
        <span style={{ color: t.textDim, fontSize: 10, flexShrink: 0 }}>▾</span>
      </button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, minWidth: 220, zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,0.3)", overflow: "hidden" }}>
          {/* Account list */}
          {accounts.map(acc => (
            <div key={acc.id}
              onClick={() => { onSwitch(acc.id); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: acc.id === activeAccount.id ? t.bgSubtle : "transparent", transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = t.bgHover}
              onMouseLeave={e => e.currentTarget.style.background = acc.id === activeAccount.id ? t.bgSubtle : "transparent"}
            >
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: acc.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{acc.name}</div>
                <div style={{ fontSize: 9, color: t.textDim }}>{acc.type}</div>
              </div>
              {acc.id === activeAccount.id && <span style={{ fontSize: 10, color: t.accent }}>✓</span>}
              {accounts.length > 1 && acc.id !== "default" && (
                <button onClick={e => { e.stopPropagation(); onDelete(acc.id); }}
                  style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 12, padding: "0 2px" }}>✕</button>
              )}
            </div>
          ))}

          <div style={{ borderTop: `1px solid ${t.border}` }}>
            {!adding ? (
              <button onClick={() => setAdding(true)}
                style={{ width: "100%", padding: "10px 14px", background: "none", border: "none", color: t.accent, fontFamily: "DM Mono, monospace", fontSize: 12, cursor: "pointer", textAlign: "left" }}>
                + Tambah Akun
              </button>
            ) : (
              <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nama akun"
                  style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 6, padding: "7px 10px", fontFamily: "DM Mono, monospace", fontSize: 12, outline: "none" }}
                  autoFocus onKeyDown={e => e.key === "Enter" && handleAdd()} />
                <select value={newType} onChange={e => setNewType(e.target.value)}
                  style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 6, padding: "7px 10px", fontFamily: "DM Mono, monospace", fontSize: 12, outline: "none" }}>
                  {ACCOUNT_TYPES.map(tp => <option key={tp}>{tp}</option>)}
                </select>
                <div style={{ display: "flex", gap: 6 }}>
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setNewColor(c)}
                      style={{ width: 20, height: 20, borderRadius: "50%", background: c, border: newColor === c ? `2px solid ${t.text}` : "2px solid transparent", cursor: "pointer" }} />
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={handleAdd} style={{ flex: 1, padding: "7px 0", background: t.accent, border: "none", color: "#090e1a", borderRadius: 6, fontFamily: "DM Mono, monospace", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>Tambah</button>
                  <button onClick={() => setAdding(false)} style={{ flex: 1, padding: "7px 0", background: "transparent", border: `1px solid ${t.border}`, color: t.textMuted, borderRadius: 6, fontFamily: "DM Mono, monospace", fontSize: 12, cursor: "pointer" }}>Batal</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {open && <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} />}
    </div>
  );
}