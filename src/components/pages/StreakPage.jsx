import { useBreakpoint } from "../../hooks/useBreakpoint";

// ── Calendar heatmap ──────────────────────────────────────────────
function StreakCalendar({ calendarData }) {
  const weeks = [];
  let week = [];
  const firstDate = new Date(calendarData[0]?.date + "T00:00:00");
  const dayOfWeek = (firstDate.getDay() + 6) % 7;
  for (let i = 0; i < dayOfWeek; i++) week.push(null);
  calendarData.forEach(day => {
    week.push(day);
    if (week.length === 7) { weeks.push(week); week = []; }
  });
  if (week.length > 0) { while (week.length < 7) week.push(null); weeks.push(week); }

  function getCellColor(day) {
    if (!day || day.isFuture) return "transparent";
    if (day.isToday) return "var(--accent)";
    if (day.hasTrading && day.hasJournal) return "var(--accent)";
    if (day.hasTrading) return "var(--accent2)";
    if (day.hasJournal) return "#8b5cf6";
    return "var(--bg-subtle)";
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
        {weeks.map((w, wi) => {
          const date = w.find(d => d)?.date;
          const month = date?.slice(5,7);
          const prev  = wi > 0 ? weeks[wi-1].find(d => d)?.date?.slice(5,7) : null;
          return (
            <div key={wi} style={{ width: 11, fontSize: 8, color: "var(--text-dim)", textAlign: "center" }}>
              {month !== prev ? month : ""}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 2 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginRight: 4 }}>
          {["S","M","T","W","T","F","S"].map((d, i) => (
            <div key={i} style={{ height: 11, fontSize: 8, color: "var(--text-dim)", lineHeight: "11px" }}>
              {i % 2 === 1 ? d : ""}
            </div>
          ))}
        </div>
        {weeks.map((w, wi) => (
          <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {w.map((day, di) => (
              <div key={di}
                title={day ? `${day.date}${day.hasTrading ? " 📊" : ""}${day.hasJournal ? " 📝" : ""}` : ""}
                style={{
                  width: 11, height: 11, borderRadius: 2,
                  background: getCellColor(day),
                  border: day?.isToday ? "1px solid var(--accent)" : "none",
                  opacity: day?.isFuture ? 0 : 1,
                  transition: "background 0.2s",
                }}/>
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>
        {[
          { color: "var(--accent)",  label: "Trading + Journal" },
          { color: "var(--accent2)", label: "Trading" },
          { color: "#8b5cf6",        label: "Journal" },
        ].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }}/>
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Monthly bars ──────────────────────────────────────────────────
function MonthlyBars({ monthlyData }) {
  const max = monthlyData.length > 0 ? Math.max(...monthlyData.map(m => m.total), 1) : 1;
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 76 }}>
      {monthlyData.map(m => {
        const tradePct   = m.total > 0 ? (m.trading / m.total) * 100 : 0;
        const journalPct = m.total > 0 ? ((m.journal - Math.min(m.trading, m.journal)) / m.total) * 100 : 0;
        const height     = Math.max(4, (m.active / max) * 68);
        return (
          <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <div style={{ width: "100%", height, display: "flex", flexDirection: "column", justifyContent: "flex-end", borderRadius: "3px 3px 0 0", overflow: "hidden" }}>
              <div style={{ background: "var(--accent2)", height: `${tradePct}%`, minHeight: m.trading > 0 ? 3 : 0 }}/>
              <div style={{ background: "#8b5cf6", height: `${journalPct}%`, minHeight: journalPct > 0 ? 2 : 0 }}/>
            </div>
            <div style={{ fontSize: 8, color: "var(--text-dim)" }}>{m.month.slice(5)}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Record card ───────────────────────────────────────────────────
function RecordCard({ icon, label, value, sub, color }) {
  return (
    <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "12px 14px" }}>
      <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
      <div className="kpi-label">{label}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 24, color, fontWeight: 700, lineHeight: 1, marginTop: 3 }}>{value}</div>
      {sub && <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// ── Main StreakPage ───────────────────────────────────────────────
export default function StreakPage({ streakHook, theme }) {
  const { isMobile } = useBreakpoint();
  const { streakData, calendarData, monthlyData, records, useFreeze } = streakHook;
  const {
    currentStreak, bestStreak, todayActive, streakAtRisk,
    freezesLeft, maxFreezes, weeklyActiveDays, weeklyGoal, weeklyProgress,
  } = streakData;

  const flameColor = currentStreak >= 30 ? "var(--gold)" : currentStreak >= 7 ? "#f97316" : currentStreak >= 3 ? "var(--danger)" : "var(--text-dim)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Hero streak */}
      <div style={{
        background: streakAtRisk ? "var(--danger-dim)" : "var(--bg-subtle)",
        border: `1px solid ${streakAtRisk ? "var(--danger)" : "var(--border)"}`,
        borderRadius: "var(--r-xl)", padding: "24px 20px",
        display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
      }}>
        {/* Flame */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 4 }}>
            {currentStreak === 0 ? "🌑" : streakAtRisk ? "⚠️" : "🔥"}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 44, fontWeight: 700, color: flameColor, lineHeight: 1 }}>
            {currentStreak}
          </div>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 3 }}>hari berturut-turut</div>
        </div>

        {/* Status */}
        <div style={{ flex: 1, minWidth: 180 }}>
          {streakAtRisk && (
            <div style={{ background: "var(--danger-dim)", border: "1px solid var(--danger)", borderRadius: "var(--r-md)", padding: "10px 14px", marginBottom: 12 }}>
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--danger)", fontWeight: 500, marginBottom: 4 }}>⚠️ Streak mau putus!</div>
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>Log trade atau isi jurnal hari ini untuk menjaga streak.</div>
              {freezesLeft > 0 && (
                <button onClick={useFreeze} className="btn-ghost" style={{ marginTop: 8, fontSize: "var(--fs-xs)", height: 28, borderColor: "var(--accent2)", color: "var(--accent2)" }}>
                  🧊 Gunakan Freeze ({freezesLeft} tersisa)
                </button>
              )}
            </div>
          )}
          {!streakAtRisk && todayActive && (
            <div style={{ background: "var(--success-dim)", border: "1px solid var(--success)", borderRadius: "var(--r-md)", padding: "10px 14px", marginBottom: 12 }}>
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--success)", fontWeight: 500 }}>✓ Streak aman hari ini!</div>
            </div>
          )}
          {!streakAtRisk && !todayActive && currentStreak > 0 && (
            <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-dim)", marginBottom: 12 }}>
              Belum ada aktivitas hari ini — log trade atau isi jurnal!
            </p>
          )}

          {/* Weekly goal */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginBottom: 5 }}>
              <span>Target Minggu Ini</span>
              <span style={{ color: weeklyActiveDays >= weeklyGoal ? "var(--success)" : "var(--text-dim)" }}>
                {weeklyActiveDays}/{weeklyGoal} hari
              </span>
            </div>
            <div style={{ height: 6, background: "var(--bg-card)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${weeklyProgress}%`, background: weeklyProgress >= 100 ? "var(--success)" : "var(--accent)", borderRadius: 3, transition: "width 0.5s" }}/>
            </div>
            {weeklyProgress >= 100 && (
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--success)", marginTop: 4 }}>🎯 Target minggu ini tercapai!</div>
            )}
          </div>
        </div>

        {/* Freeze */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>🧊</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, color: "var(--accent2)", fontWeight: 600 }}>
            {freezesLeft}/{maxFreezes}
          </div>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 2 }}>Streak Freeze</div>
        </div>
      </div>

      {/* Records */}
      <div>
        <div className="section-label" style={{ marginBottom: 10 }}>Personal Records</div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 8 }}>
          <RecordCard icon="🔥" label="Longest Streak"    value={records.longestStreak}   sub="hari berturut-turut" color={flameColor}/>
          <RecordCard icon="📅" label="Total Active Days" value={records.totalActiveDays}  sub="sepanjang waktu"     color="var(--success)"/>
          <RecordCard icon="📊" label="Trading Days"      value={records.totalTradingDays} sub="hari ada trade"      color="var(--accent2)"/>
          <RecordCard icon="📝" label="Journal Days"      value={records.totalJournalDays} sub="hari isi jurnal"     color="#8b5cf6"/>
        </div>
      </div>

      {/* Calendar */}
      <div className="stat-card">
        <div className="section-label" style={{ marginBottom: 14 }}>Activity Calendar — Last 365 Days</div>
        {calendarData?.length > 0 && <StreakCalendar calendarData={calendarData}/>}
      </div>

      {/* Monthly */}
      <div className="stat-card">
        <div className="section-label" style={{ marginBottom: 14 }}>Monthly Activity</div>
        {monthlyData?.length > 0 && <MonthlyBars monthlyData={monthlyData}/>}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(monthlyData?.length ?? 0, 6)}, 1fr)`, gap: 8, marginTop: 12 }}>
          {(monthlyData || []).slice(-6).map(m => (
            <div key={m.month} style={{ textAlign: "center", background: "var(--bg-subtle)", borderRadius: "var(--r-md)", padding: "8px 6px" }}>
              <div style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)", marginBottom: 3 }}>{m.month.slice(5)}</div>
              <div style={{ fontSize: "var(--fs-xl)", fontWeight: 600, color: "var(--accent)", fontFamily: "var(--font-mono)" }}>{m.active}</div>
              <div style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)" }}>/{m.total} hari</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "var(--r-lg)", padding: "14px 16px" }}>
        <div style={{ fontSize: "var(--fs-sm)", color: "#8b5cf6", fontWeight: 500, marginBottom: 8 }}>💡 Tips Menjaga Streak</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            "Log minimal 1 trade per hari untuk menjaga streak trading",
            "Isi daily journal setiap hari — bahkan di hari tidak trading",
            "Gunakan streak freeze dengan bijak — hanya untuk keadaan darurat",
            `Target ${weeklyGoal} hari aktif per minggu untuk konsistensi optimal`,
          ].map((tip, i) => (
            <div key={i} style={{ fontSize: "var(--fs-sm)", color: "var(--text-dim)", display: "flex", gap: 8 }}>
              <span style={{ color: "#8b5cf6", flexShrink: 0 }}>→</span>{tip}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}