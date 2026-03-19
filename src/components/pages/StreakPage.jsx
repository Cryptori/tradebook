import { useBreakpoint } from "../../hooks/useBreakpoint";

// ── Calendar heatmap ──────────────────────────────────────────────
function StreakCalendar({ calendarData, theme: t }) {
  // Group by week (columns)
  const weeks = [];
  let week = [];
  
  // Pad to start on Monday
  const firstDay = calendarData[0];
  const firstDate = new Date(firstDay.date + "T00:00:00");
  const dayOfWeek = (firstDate.getDay() + 6) % 7; // Mon=0
  for (let i = 0; i < dayOfWeek; i++) week.push(null);
  
  calendarData.forEach(day => {
    week.push(day);
    if (week.length === 7) { weeks.push(week); week = []; }
  });
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

  function getCellColor(day) {
    if (!day || day.isFuture) return "transparent";
    if (day.isToday) return "#00c896";
    if (day.hasTrading && day.hasJournal) return "#00c896";
    if (day.hasTrading) return "#0ea5e9";
    if (day.hasJournal) return "#8b5cf6";
    return t.bgSubtle;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "flex", gap: 3, marginBottom: 8 }}>
        {weeks.map((_, wi) => {
          const date = weeks[wi].find(d => d)?.date;
          const month = date?.slice(5, 7);
          const prevMonth = wi > 0 ? weeks[wi-1].find(d => d)?.date?.slice(5, 7) : null;
          return (
            <div key={wi} style={{ width: 11, fontSize: 8, color: t.textDim, textAlign: "center" }}>
              {month !== prevMonth ? month : ""}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 2 }}>
        {/* Day labels */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginRight: 4 }}>
          {DAYS.map((d, i) => (
            <div key={i} style={{ height: 11, fontSize: 8, color: t.textDim, lineHeight: "11px" }}>{i % 2 === 1 ? d : ""}</div>
          ))}
        </div>
        {/* Grid */}
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {week.map((day, di) => (
              <div
                key={di}
                title={day ? `${day.date}${day.hasTrading ? " 📊" : ""}${day.hasJournal ? " 📝" : ""}` : ""}
                style={{
                  width: 11, height: 11, borderRadius: 2,
                  background: getCellColor(day),
                  border: day?.isToday ? "1px solid #00c896" : "none",
                  opacity: day?.isFuture ? 0 : 1,
                  transition: "background 0.2s",
                }}
              />
            ))}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 10, color: t.textDim }}>
        {[
          { color: "#00c896", label: "Trading + Journal" },
          { color: "#0ea5e9", label: "Trading" },
          { color: "#8b5cf6", label: "Journal" },
        ].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Monthly bars ──────────────────────────────────────────────────
function MonthlyBars({ monthlyData, theme: t }) {
  const max = Math.max(...monthlyData.map(m => m.total), 1);
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 80 }}>
      {monthlyData.map(m => {
        const tradePct   = (m.trading / m.total) * 100;
        const journalPct = ((m.journal - Math.min(m.trading, m.journal)) / m.total) * 100;
        const height     = Math.max(4, (m.active / max) * 72);
        return (
          <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div style={{ width: "100%", height, display: "flex", flexDirection: "column", justifyContent: "flex-end", borderRadius: "3px 3px 0 0", overflow: "hidden" }}>
              <div style={{ background: "#0ea5e9", height: `${tradePct}%`, minHeight: m.trading > 0 ? 3 : 0 }} />
              <div style={{ background: "#8b5cf6", height: `${journalPct}%`, minHeight: journalPct > 0 ? 2 : 0 }} />
            </div>
            <div style={{ fontSize: 8, color: t.textDim }}>{m.month.slice(5)}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Personal records ──────────────────────────────────────────────
function RecordCard({ icon, label, value, sub, color, theme: t }) {
  return (
    <div style={{ background: t.bgSubtle, borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "DM Mono, monospace", fontSize: 24, color, fontWeight: 700, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: t.textDim, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ── Main StreakPage ────────────────────────────────────────────────
export default function StreakPage({ streakHook, theme: t }) {
  const { isMobile } = useBreakpoint();
  const { streakData, calendarData, monthlyData, records, useFreeze } = streakHook;
  const {
    currentStreak, bestStreak, todayActive, streakAtRisk,
    freezesLeft, maxFreezes, weeklyActiveDays, weeklyGoal, weeklyProgress,
  } = streakData;

  const flameColor = currentStreak >= 30 ? "#c9a84c" : currentStreak >= 7 ? "#f97316" : currentStreak >= 3 ? "#ef4444" : "#64748b";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Current Streak Hero ──────────────────────────────── */}
      <div style={{
        background: streakAtRisk
          ? "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.04))"
          : `linear-gradient(135deg, ${flameColor}10, ${flameColor}04)`,
        border: `1px solid ${streakAtRisk ? "rgba(239,68,68,0.25)" : flameColor + "30"}`,
        borderRadius: 16, padding: "28px 24px",
        display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap",
      }}>
        {/* Flame + count */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 4 }}>
            {currentStreak === 0 ? "🌑" : streakAtRisk ? "⚠️" : "🔥"}
          </div>
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: 48, fontWeight: 700, color: flameColor, lineHeight: 1 }}>
            {currentStreak}
          </div>
          <div style={{ fontSize: 12, color: t.textDim, marginTop: 4 }}>hari berturut-turut</div>
        </div>

        {/* Status */}
        <div style={{ flex: 1, minWidth: 200 }}>
          {streakAtRisk && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "12px 16px", marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: "#ef4444", fontWeight: 500, marginBottom: 4 }}>⚠️ Streak mau putus!</div>
              <div style={{ fontSize: 12, color: t.textDim }}>Log minimal 1 trade atau isi jurnal hari ini untuk menjaga streak.</div>
              {freezesLeft > 0 && (
                <button onClick={useFreeze} className="btn-ghost" style={{ marginTop: 10, fontSize: 11, padding: "6px 12px", borderColor: "#0ea5e9", color: "#0ea5e9" }}>
                  🧊 Gunakan Freeze ({freezesLeft} tersisa)
                </button>
              )}
            </div>
          )}
          {!streakAtRisk && todayActive && (
            <div style={{ background: "rgba(0,200,150,0.08)", border: "1px solid rgba(0,200,150,0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: "#00c896", fontWeight: 500 }}>✓ Streak aman hari ini!</div>
            </div>
          )}
          {!streakAtRisk && !todayActive && currentStreak > 0 && (
            <div style={{ fontSize: 12, color: t.textDim, marginBottom: 12 }}>Belum ada aktivitas hari ini — log trade atau isi jurnal!</div>
          )}

          {/* Weekly goal */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: t.textDim, marginBottom: 6 }}>
              <span>Target Minggu Ini</span>
              <span style={{ color: weeklyActiveDays >= weeklyGoal ? "#00c896" : t.textDim }}>{weeklyActiveDays}/{weeklyGoal} hari</span>
            </div>
            <div style={{ height: 8, background: t.bgSubtle, borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${weeklyProgress}%`, background: weeklyProgress >= 100 ? "#00c896" : "linear-gradient(90deg, #00c89660, #00c896)", borderRadius: 4, transition: "width 0.5s" }} />
            </div>
            {weeklyProgress >= 100 && <div style={{ fontSize: 10, color: "#00c896", marginTop: 4 }}>🎯 Target minggu ini tercapai!</div>}
          </div>
        </div>

        {/* Freeze status */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>🧊</div>
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: 20, color: "#0ea5e9", fontWeight: 600 }}>{freezesLeft}/{maxFreezes}</div>
          <div style={{ fontSize: 10, color: t.textDim, marginTop: 2 }}>Streak Freeze</div>
        </div>
      </div>

      {/* ── Personal Records ─────────────────────────────────── */}
      <div>
        <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 12 }}>Personal Records</div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10 }}>
          <RecordCard icon="🔥" label="Longest Streak"     value={records.longestStreak}    sub="hari berturut-turut" color={flameColor}  theme={t} />
          <RecordCard icon="📅" label="Total Active Days"  value={records.totalActiveDays}   sub="sepanjang waktu"     color="#00c896"     theme={t} />
          <RecordCard icon="📊" label="Trading Days"       value={records.totalTradingDays}  sub="hari ada trade"      color="#0ea5e9"     theme={t} />
          <RecordCard icon="📝" label="Journal Days"       value={records.totalJournalDays}  sub="hari isi jurnal"     color="#8b5cf6"     theme={t} />
        </div>
      </div>

      {/* ── Activity Calendar ────────────────────────────────── */}
      <div className="stat-card">
        <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 16 }}>Activity Calendar — Last 365 Days</div>
        <StreakCalendar calendarData={calendarData} theme={t} />
      </div>

      {/* ── Monthly Activity ─────────────────────────────────── */}
      <div className="stat-card">
        <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 16 }}>Monthly Activity</div>
        <MonthlyBars monthlyData={monthlyData} theme={t} />
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(monthlyData.length, 6)}, 1fr)`, gap: 8, marginTop: 12 }}>
          {monthlyData.slice(-6).map(m => (
            <div key={m.month} style={{ textAlign: "center", background: t.bgSubtle, borderRadius: 8, padding: "8px 6px" }}>
              <div style={{ fontSize: 9, color: t.textDim, marginBottom: 4 }}>{m.month.slice(5)}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#00c896", fontFamily: "DM Mono, monospace" }}>{m.active}</div>
              <div style={{ fontSize: 9, color: t.textDim }}>/{m.total} hari</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tips ─────────────────────────────────────────────── */}
      <div style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 12, padding: "16px 18px" }}>
        <div style={{ fontSize: 11, color: "#8b5cf6", fontWeight: 500, marginBottom: 8 }}>💡 Tips Menjaga Streak</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            "Log minimal 1 trade per hari untuk menjaga streak trading",
            "Isi daily journal setiap hari — bahkan di hari tidak trading",
            "Gunakan streak freeze dengan bijak — hanya untuk keadaan darurat",
            `Target ${streakData.weeklyGoal} hari aktif per minggu untuk konsistensi optimal`,
          ].map((tip, i) => (
            <div key={i} style={{ fontSize: 12, color: t.textDim, display: "flex", gap: 8 }}>
              <span style={{ color: "#8b5cf6", flexShrink: 0 }}>→</span>
              {tip}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}