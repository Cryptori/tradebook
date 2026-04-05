import { useMemo } from "react";
import { useBreakpoint } from "../hooks/useBreakpoint";
import {
  calcEmotionCorrelation, calcDailyPsychScore, detectPatterns,
  calcMoodStreak, calcMoodCalendar, generatePsychTips
} from "../utils/psychologyStats";

// ── Psychology Score Ring ─────────────────────────────────────────
function ScoreRing({ score, theme: t }) {
  const r   = 40;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 70 ? "#00c896" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ position: "relative", width: 100, height: 100, flexShrink: 0 }}>
      <svg width="100" height="100" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="50" cy="50" r={r} fill="none" stroke={"var(--bg-subtle)"} strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 0.8s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 9, color: "var(--text-dim)" }}>/ 100</div>
      </div>
    </div>
  );
}

// ── Mood Calendar ─────────────────────────────────────────────────
function MoodCalendar({ days, theme: t }) {
  const colorMap = {
    positive: "#00c896", negative: "#ef4444",
    neutral: "#f59e0b", empty: "var(--bg-subtle)",
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} style={{ fontSize: 9, color: "var(--text-dim)", textAlign: "center" }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {days.map(day => (
          <div key={day.date}
            title={`${day.date}\n${day.tradeCount} trade${day.pnl ? ` · $${day.pnl.toFixed(0)}` : ""}`}
            style={{
              height: 24, borderRadius: 4,
              background: colorMap[day.category] || "var(--bg-subtle)", border: `1px solid ${day.category === "empty" ? "var(--border-subtle)" : colorMap[day.category] + "50"}`,
              opacity: day.category === "empty" ? 0.4 : 1,
              position: "relative",
            }}>
            {day.hasJournal && (
              <div style={{ position: "absolute", top: 2, right: 2, width: 4, height: 4, borderRadius: "50%", background: "#fff", opacity: 0.8 }} />
            )}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
        {[{ color: "var(--accent)", label: "Positif" }, { color: "var(--danger)", label: "Negatif" }, { color: "var(--warning)", label: "Netral" }].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: "var(--text-dim)" }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />{l.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Emotion Correlation Table ─────────────────────────────────────
function EmotionTable({ data, theme: t }) {
  if (!data || data.length === 0) return <div style={{ fontSize: 12, color: "var(--text-dim)", textAlign: "center", padding: "20px 0" }}>Belum ada data emosi</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {data.slice(0, 6).map(row => {
        const barColor = row.category === "positive" ? "#00c896" : row.category === "negative" ? "#ef4444" : "#f59e0b";
        return (
          <div key={row.emotion} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 110, fontSize: 11, color: "var(--text)", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.emotion}</div>
            <div style={{ flex: 1, height: 6, background: "var(--bg-subtle)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: "${row.winRate}%", background: barColor, borderRadius: 3 }} />
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: barColor, width: 42, textAlign: "right" }}>{row.winRate.toFixed(0)}%</div>
            <div style={{ fontSize: 10, color: "var(--text-dim)", width: 30, textAlign: "right" }}>{row.total}x</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Pattern Warnings ──────────────────────────────────────────────
function PatternAlerts({ patterns, theme: t }) {
  if (!patterns || patterns.length === 0) return (
    <div style={{ fontSize: 12, color: "var(--accent)", textAlign: "center", padding: "12px 0" }}>✓ Tidak ada pattern berbahaya terdeteksi</div>
  );

  const colorMap = { high: "#ef4444", medium: "#f59e0b", low: "#3b82f6" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {patterns.slice(-5).map((p, i) => (
        <div key={i} style={{ display: "flex", gap: 10, padding: "9px 12px", background: "${colorMap[p.severity]}10`, border: `1px solid ${colorMap[p.severity]}25", borderRadius: 8 }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>
            {p.type === "overtrade" ? "📈" : p.type === "revenge" ? "😤" : "⚠️"}
          </span>
          <div>
            <div style={{ fontSize: 11, color: colorMap[p.severity], fontWeight: 500 }}>{p.type === "overtrade" ? "Overtrade" : p.type === "revenge" ? "Revenge Trade" : "Emotional Trade"}</div>
            <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>{p.message}</div>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 10, color: "var(--text-dim)", flexShrink: 0 }}>{p.date?.slice(5)}</div>
        </div>
      ))}
    </div>
  );
}

// ── Main PsychologyTracker ────────────────────────────────────────
export default function PsychologyTracker({ trades, journalEntries, theme: t }) {
  const { isMobile } = useBreakpoint();

  const emotionCorr  = useMemo(() => calcEmotionCorrelation(trades), [trades]);
  const patterns     = useMemo(() => detectPatterns(trades, journalEntries), [trades, journalEntries]);
  const moodStreak   = useMemo(() => calcMoodStreak(trades), [trades]);
  const moodCalendar = useMemo(() => calcMoodCalendar(trades, journalEntries), [trades, journalEntries]);
  const tips         = useMemo(() => generatePsychTips(emotionCorr, patterns, moodStreak), [emotionCorr, patterns, moodStreak]);

  // Today's score
  const today       = new Date().toISOString().slice(0, 10);
  const todayTrades = useMemo(() => (trades || []).filter(tr => tr.date === today), [trades, today]);
  const todayJournal = useMemo(() => (journalEntries || []).find(e => e.date === today), [journalEntries, today]);
  const todayScore  = useMemo(() => calcDailyPsychScore(todayTrades, todayJournal), [todayTrades, todayJournal]);

  const cols2 = isMobile ? "1fr" : "1fr 1fr";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 24, paddingTop: 24, borderTop: "1px solid var(--border-subtle)" }}>

      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, var(--border))" }} />
        <div style={{ fontSize: 9, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 600 }}>Psychology Tracker</div>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(270deg, transparent, var(--border))" }} />
      </div>

      {/* Today score + mood streak */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "auto 1fr", gap: 20, alignItems: "center" }}>
        {todayScore ? (
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <ScoreRing score={todayScore.score} theme={t} />
            <div>
              <div style={{ fontSize: 9, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>Skor Psikologi Hari Ini</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {[
                  { label: "Emosi",     val: todayScore.scores.emotion      },
                  { label: "Performa",  val: todayScore.scores.performance  },
                  { label: "Disiplin",  val: todayScore.scores.discipline   },
                  { label: "Konsisten", val: todayScore.scores.consistency  },
                ].map(s => (
                  <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 10, color: "var(--text-dim)", width: 65 }}>{s.label}</div>
                    <div style={{ flex: 1, height: 4, background: "var(--bg-subtle)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(s.val / 25) * 100}%`, background: "#00c896", borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-dim)", width: 24, textAlign: "right", fontFamily: "var(--font-mono)" }}>{s.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ background: "var(--bg-subtle)", borderRadius: 12, padding: "16px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "var(--text-dim)" }}>Log trade hari ini untuk lihat skor psikologi</div>
          </div>
        )}

        {/* Mood streak */}
        <div style={{ background: moodStreak >= 3 ? "rgba(0,200,150,0.06)" : "var(--bg-subtle)", border: `1px solid ${moodStreak >= 3 ? `rgba(0,200,150,0.2)` : "var(--border-subtle)"}`, borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 36 }}>{moodStreak >= 7 ? "🌟" : moodStreak >= 3 ? "😊" : moodStreak >= 1 ? "🙂" : "😐"}</div>
          <div>
            <div style={{ fontSize: 9, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Mood Streak</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 28, color: moodStreak >= 3 ? "#00c896" : "var(--text-dim)", fontWeight: 700, lineHeight: 1 }}>{moodStreak}</div>
            <div style={{ fontSize: 11, color: "var(--text-dim)" }}>hari emosi positif</div>
          </div>
        </div>
      </div>

      {/* Emotion correlation + mood calendar */}
      <div style={{ display: "grid", gridTemplateColumns: cols2, gap: 16 }}>
        <div className="stat-card">
          <div style={{ fontSize: 9, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 14 }}>Win Rate per Emosi</div>
          <EmotionTable data={emotionCorr} theme={t} />
        </div>
        <div className="stat-card">
          <div style={{ fontSize: 9, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 14 }}>Mood Calendar — 30 Hari</div>
          <MoodCalendar days={moodCalendar} theme={t} />
        </div>
      </div>

      {/* Pattern detection */}
      <div className="stat-card">
        <div style={{ fontSize: 9, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 14 }}>Pattern Detection</div>
        <PatternAlerts patterns={patterns} theme={t} />
      </div>

      {/* Tips & insights */}
      <div style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 12, padding: "16px 18px" }}>
        <div style={{ fontSize: 11, color: "#8b5cf6", fontWeight: 500, marginBottom: 12 }}>🧠 Psychology Insights</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tips.map((tip, i) => {
            const colorMap = { warning: "#f59e0b", danger: "#ef4444", success: "#00c896", insight: "#3b82f6", info: "var(--text-dim)" };
            return (
              <div key={i} style={{ display: "flex", gap: 10, fontSize: 12, color: colorMap[tip.type] || "var(--text-dim)" }}>
                <span style={{ flexShrink: 0 }}>{tip.icon}</span>
                {tip.text}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}