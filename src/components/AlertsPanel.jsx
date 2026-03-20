import { ALERT_TYPES } from "../hooks/useCustomAlerts";

const DAYS_LABEL = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function AlertForm({ form, setField, onSave, onClose, editId, theme: t }) {
  const typeInfo = ALERT_TYPES.find(a => a.id === form.type) || ALERT_TYPES[0];

  function toggleDay(day) {
    const days = form.days || [1,2,3,4,5];
    setField("days", days.includes(day) ? days.filter(d => d !== day) : [...days, day].sort());
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(8,12,20,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(6px)" }}>
      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24, width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2, color: t.text }}>
            {editId ? "EDIT ALERT" : "TAMBAH ALERT"}
          </div>
          <button onClick={onClose} style={{ background: t.bgSubtle, border: `1px solid ${t.border}`, color: t.textDim, cursor: "pointer", borderRadius: 7, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Type */}
          <div>
            <label>Tipe Alert</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 4 }}>
              {ALERT_TYPES.map(at => (
                <button key={at.id} onClick={() => setField("type", at.id)}
                  style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${form.type === at.id ? t.accent : t.border}`, background: form.type === at.id ? "rgba(0,200,150,0.08)" : "transparent", color: form.type === at.id ? "#00c896" : t.textDim, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                  <span>{at.icon}</span>{at.label}
                </button>
              ))}
            </div>
          </div>

          {/* Label */}
          <div>
            <label>Nama Alert</label>
            <input value={form.label} onChange={e => setField("label", e.target.value)} placeholder="Nama alert ini..."
              style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8 }} />
          </div>

          {/* Type-specific fields */}
          {(form.type === "daily" || form.type === "weekly") && (
            <>
              <div>
                <label>Waktu</label>
                <input type="time" value={form.time || "08:00"} onChange={e => setField("time", e.target.value)}
                  style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8 }} />
              </div>
              {form.type === "daily" && (
                <div>
                  <label>Hari</label>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                    {DAYS_LABEL.map((d, i) => (
                      <button key={i} onClick={() => toggleDay(i)}
                        style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${(form.days||[]).includes(i) ? t.accent : t.border}`, background: (form.days||[]).includes(i) ? "rgba(0,200,150,0.08)" : "transparent", color: (form.days||[]).includes(i) ? "#00c896" : t.textDim, cursor: "pointer", fontSize: 11 }}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {form.type === "price" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div>
                <label>Pair</label>
                <input value={form.pair || ""} onChange={e => setField("pair", e.target.value.toUpperCase())} placeholder="EUR/USD"
                  style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, fontFamily: "DM Mono, monospace" }} />
              </div>
              <div>
                <label>Kondisi</label>
                <select value={form.direction || "above"} onChange={e => setField("direction", e.target.value)}
                  style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8 }}>
                  <option value="above">Di atas</option>
                  <option value="below">Di bawah</option>
                </select>
              </div>
              <div>
                <label>Harga</label>
                <input type="number" step="any" value={form.price || ""} onChange={e => setField("price", e.target.value)} placeholder="0.00"
                  style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, fontFamily: "DM Mono, monospace" }} />
              </div>
            </div>
          )}

          {form.type === "drawdown" && (
            <div>
              <label>Alert saat drawdown mencapai (% dari limit)</label>
              <input type="number" min="50" max="100" value={form.ddPercent || 80} onChange={e => setField("ddPercent", e.target.value)}
                style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, fontFamily: "DM Mono, monospace" }} />
            </div>
          )}

          {form.type === "streak" && (
            <div>
              <label>Alert saat win streak mencapai</label>
              <input type="number" min="1" value={form.streakTarget || 5} onChange={e => setField("streakTarget", e.target.value)}
                style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, fontFamily: "DM Mono, monospace" }} />
            </div>
          )}

          {form.type === "custom" && (
            <div>
              <label>Kondisi / Catatan</label>
              <textarea value={form.condition || ""} onChange={e => setField("condition", e.target.value)} rows={2}
                placeholder="Deskripsikan kondisi alert ini..."
                style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, resize: "vertical", fontSize: 12 }} />
            </div>
          )}

          {/* Custom message */}
          <div>
            <label>Pesan Notifikasi (opsional)</label>
            <input value={form.message || ""} onChange={e => setField("message", e.target.value)} placeholder="Teks notifikasi custom..."
              style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8 }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>Batal</button>
          <button onClick={onSave} className="btn-primary" style={{ flex: 2, justifyContent: "center" }} disabled={!form.label.trim()}>
            {editId ? "Update Alert" : "Tambah Alert"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Alert row ─────────────────────────────────────────────────────
function AlertRow({ alert, onToggle, onEdit, onDelete, theme: t }) {
  const typeInfo = ALERT_TYPES.find(a => a.id === alert.type) || ALERT_TYPES[0];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: alert.enabled ? t.bgSubtle : "transparent", border: `1px solid ${alert.enabled ? t.borderSubtle : t.border}`, borderRadius: 10, opacity: alert.enabled ? 1 : 0.6, transition: "all 0.2s" }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>{typeInfo.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: t.text }}>{alert.label}</div>
        <div style={{ fontSize: 10, color: t.textDim, marginTop: 2 }}>
          {typeInfo.label}
          {alert.type === "price" && alert.pair && ` · ${alert.pair} ${alert.direction === "above" ? "↑" : "↓"} ${alert.price}`}
          {alert.type === "drawdown" && ` · ${alert.ddPercent}% threshold`}
          {alert.type === "streak" && ` · ${alert.streakTarget}x target`}
          {(alert.type === "daily" || alert.type === "weekly") && alert.time && ` · ${alert.time}`}
          {alert.lastTriggered && ` · Last: ${new Date(alert.lastTriggered).toLocaleDateString("id-ID")}`}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <button onClick={() => onEdit(alert)} style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 13, padding: "3px 5px" }}>✎</button>
        <button onClick={() => onDelete(alert.id)} style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 13, padding: "3px 5px" }}>🗑</button>
        <button onClick={() => onToggle(alert.id)}
          style={{ width: 36, height: 20, borderRadius: 10, background: alert.enabled ? "#00c896" : t.bgCard, border: `1px solid ${alert.enabled ? "#00c896" : t.border}`, cursor: "pointer", position: "relative", transition: "all 0.2s", flexShrink: 0 }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: alert.enabled ? 18 : 2, transition: "left 0.2s" }} />
        </button>
      </div>
    </div>
  );
}

// ── Main AlertsPanel ──────────────────────────────────────────────
export default function AlertsPanel({ alertsHook, theme: t }) {
  const { alerts, showForm, form, editId, openAdd, openEdit, closeForm, saveAlert, deleteAlert, toggleAlert, setField, requestPermission, pushEnabled } = alertsHook;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 9, color: t.accent, textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 600 }}>Custom Alerts & Reminders</div>

      {/* Push permission */}
      {!pushEnabled && (
        <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontSize: 12, color: "#f59e0b", fontWeight: 500 }}>Push Notification Belum Aktif</div>
            <div style={{ fontSize: 11, color: t.textDim, marginTop: 2 }}>Aktifkan untuk menerima alert di browser</div>
          </div>
          <button onClick={requestPermission} className="btn-ghost" style={{ fontSize: 11, padding: "6px 12px", borderColor: "#f59e0b", color: "#f59e0b", whiteSpace: "nowrap" }}>
            Aktifkan
          </button>
        </div>
      )}

      {/* Alerts list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {alerts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: t.textDim, fontSize: 12 }}>
            Belum ada alert. Tambah alert pertamamu!
          </div>
        ) : (
          alerts.map(alert => (
            <AlertRow key={alert.id} alert={alert} onToggle={toggleAlert} onEdit={openEdit} onDelete={deleteAlert} theme={t} />
          ))
        )}
      </div>

      <button onClick={openAdd} className="btn-primary" style={{ justifyContent: "center" }}>
        + Tambah Alert
      </button>

      {showForm && (
        <AlertForm form={form} setField={setField} onSave={saveAlert} onClose={closeForm} editId={editId} theme={t} />
      )}
    </div>
  );
}