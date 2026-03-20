import { useState, useRef, useEffect, useMemo } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";

// ── Message bubble ────────────────────────────────────────────────
function MessageBubble({ msg, theme: t }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex", justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 12,
    }}>
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #00d4aa, #00b4d8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, marginRight: 8, marginTop: 2,
        }}>🤖</div>
      )}
      <div style={{
        maxWidth: "80%",
        background: isUser ? "rgba(0,212,170,0.12)" : t.bgSubtle,
        border: `1px solid ${isUser ? "rgba(0,212,170,0.3)" : t.borderSubtle}`,
        borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        padding: "10px 14px",
        fontSize: 13,
        color: t.text,
        lineHeight: 1.7,
        whiteSpace: "pre-wrap",
      }}>
        {msg.content}
        <div style={{ fontSize: 9, color: t.textDim, marginTop: 4, textAlign: isUser ? "right" : "left" }}>
          {new Date(msg.ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}

// ── Weekly Report Panel ───────────────────────────────────────────
function WeeklyReport({ report, loading, onGenerate, theme: t }) {
  return (
    <div className="stat-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Weekly Analysis
          </div>
          {report?.generatedAt && (
            <div style={{ fontSize: 10, color: t.textDim, marginTop: 2 }}>
              Generated: {new Date(report.generatedAt).toLocaleString("id-ID")}
            </div>
          )}
        </div>
        <button className="btn-primary" onClick={onGenerate} disabled={loading}
          style={{ fontSize: 11, padding: "7px 14px" }}>
          {loading ? "Generating..." : report ? "↺ Refresh" : "Generate Laporan"}
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>🤖</div>
          <div style={{ fontSize: 13, color: t.textDim }}>AI sedang menganalisis trading kamu...</div>
          <div style={{ fontSize: 11, color: t.textDim, marginTop: 4 }}>Biasanya 10-20 detik</div>
        </div>
      )}

      {!loading && report && (
        <div style={{
          fontSize: 13, color: t.text, lineHeight: 1.8,
          whiteSpace: "pre-wrap",
          background: t.bgSubtle, border: `1px solid ${t.borderSubtle}`,
          borderRadius: 10, padding: "16px 18px",
        }}>
          {report.content}
        </div>
      )}

      {!loading && !report && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 14, color: t.text, marginBottom: 6 }}>Belum ada laporan</div>
          <div style={{ fontSize: 12, color: t.textDim }}>
            Klik "Generate Laporan" untuk analisis mingguan trading kamu
          </div>
        </div>
      )}
    </div>
  );
}

// ── Quick prompts ─────────────────────────────────────────────────
const QUICK_PROMPTS = [
  "Apa pattern kesalahan terbesar dalam trading saya?",
  "Strategy mana yang paling profitable untuk saya?",
  "Bagaimana win rate saya di setiap sesi trading?",
  "Apakah mood saya mempengaruhi hasil trade?",
  "Apa yang harus saya perbaiki minggu depan?",
  "Bandingkan eksekusi saya dengan playbook yang ada",
];

// ── Chat Panel ────────────────────────────────────────────────────
function ChatPanel({ messages, loading, error, onSend, onClear, theme: t }) {
  const [input, setInput]   = useState("");
  const bottomRef           = useRef(null);
  const inputRef            = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function handleSend() {
    if (!input.trim() || loading) return;
    onSend(input);
    setInput("");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Chat header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Chat dengan AI Advisor
        </div>
        {messages.length > 0 && (
          <button onClick={onClear} className="btn-ghost" style={{ fontSize: 11, padding: "4px 10px" }}>
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto", paddingRight: 4,
        minHeight: 300, maxHeight: 480,
      }}>
        {messages.length === 0 && (
          <div style={{ padding: "20px 0" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🤖</div>
              <div style={{ fontSize: 13, color: t.text, marginBottom: 4 }}>AI Trading Advisor</div>
              <div style={{ fontSize: 11, color: t.textDim }}>
                Tanya apa saja tentang trading kamu
              </div>
            </div>
            {/* Quick prompts */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {QUICK_PROMPTS.map(p => (
                <button key={p} onClick={() => { onSend(p); }}
                  style={{
                    background: t.bgSubtle, border: `1px solid ${t.borderSubtle}`,
                    borderRadius: 8, padding: "8px 12px", cursor: "pointer",
                    fontSize: 11, color: t.textMuted, textAlign: "left",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = t.accent}
                  onMouseLeave={e => e.currentTarget.style.borderColor = t.borderSubtle}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} theme={t} />
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "linear-gradient(135deg, #00d4aa, #00b4d8)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
            }}>🤖</div>
            <div style={{
              background: t.bgSubtle, border: `1px solid ${t.borderSubtle}`,
              borderRadius: "16px 16px 16px 4px", padding: "10px 16px",
              fontSize: 13, color: t.textDim,
            }}>
              <span className="ai-typing">Sedang menganalisis</span>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#ef4444", marginTop: 8,
          }}>
            ⚠️ {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
          placeholder="Tanya tentang trading kamu... (Enter untuk kirim)"
          style={{
            flex: 1, background: t.bgInput, border: `1px solid ${t.border}`,
            color: t.text, borderRadius: 10, padding: "10px 14px",
            fontSize: 12, outline: "none", fontFamily: "DM Mono, monospace",
          }}
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading || !input.trim()}
          className="btn-primary" style={{ padding: "10px 16px", fontSize: 13 }}>
          ↑
        </button>
      </div>
    </div>
  );
}

// ── Main AIAdvisor Page ───────────────────────────────────────────

// ── Setup Validator ───────────────────────────────────────────────
function SetupValidator({ aiHook, trades, playbookSetups, theme: t }) {
  const [form, setForm] = useState({
    pair: "", direction: "BUY", entry: "", sl: "", tp: "",
    session: "London", strategy: "", reasoning: "", marketContext: "",
  });
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [saved,    setSaved]    = useState([]);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  // Auto calculate R:R
  const rr = useMemo(() => {
    const entry = parseFloat(form.entry);
    const sl    = parseFloat(form.sl);
    const tp    = parseFloat(form.tp);
    if (!entry || !sl || !tp) return null;
    const risk   = Math.abs(entry - sl);
    const reward = Math.abs(tp - entry);
    return risk > 0 ? (reward / risk).toFixed(2) : null;
  }, [form.entry, form.sl, form.tp]);

  // Confidence from history
  const confidence = useMemo(() => {
    if (!form.pair || !form.direction || !trades?.length) return null;
    const similar = trades.filter(tr =>
      tr.pair === form.pair && tr.side === form.direction &&
      (!form.strategy || tr.strategy === form.strategy)
    );
    if (similar.length < 3) return null;
    const wins = similar.filter(tr => tr.pnl >= 0).length;
    return { winRate: (wins / similar.length) * 100, count: similar.length };
  }, [form.pair, form.direction, form.strategy, trades]);

  // Check playbook match
  const playbookMatch = useMemo(() => {
    if (!playbookSetups?.length || !form.strategy) return null;
    return playbookSetups.find(s => s.name?.toLowerCase().includes(form.strategy.toLowerCase()));
  }, [playbookSetups, form.strategy]);

  async function validate() {
    if (!form.pair || !form.entry) return;
    setLoading(true);
    setResult(null);

    const rrVal = rr ?? "N/A";
    const historyContext = confidence
      ? `History: ${confidence.count} trade serupa, win rate ${confidence.winRate.toFixed(0)}%.`
      : "Belum ada history trade serupa.";
    const playbookCtx = playbookMatch
      ? `Setup cocok dengan playbook: "${playbookMatch.name}".`
      : form.strategy ? "Setup tidak cocok dengan playbook yang ada." : "";

    const prompt = `Kamu adalah trading coach profesional. Evaluasi setup trade berikut:

Pair: ${form.pair}
Direction: ${form.direction}
Entry: ${form.entry}
Stop Loss: ${form.sl || "N/A"}
Take Profit: ${form.tp || "N/A"}
R:R Ratio: ${rrVal}
Session: ${form.session}
Strategy: ${form.strategy || "N/A"}
Market Context: ${form.marketContext || "N/A"}
Reasoning: ${form.reasoning || "N/A"}

${historyContext}
${playbookCtx}

Berikan evaluasi singkat dalam format:
SCORE: [0-100]
VERDICT: [VALID/RISKY/INVALID]
FEEDBACK: [2-3 kalimat feedback spesifik]
IMPROVEMENTS: [1-2 saran improvement jika ada]

Fokus pada: R:R ratio, kejelasan alasan, kesesuaian dengan session, dan potensi berdasarkan history.`;

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, context: "" }),
      });
      const data = await res.json();
      const text = data.response || data.content || "";

      // Parse response
      const scoreMatch   = text.match(/SCORE:\s*(\d+)/i);
      const verdictMatch = text.match(/VERDICT:\s*(\w+)/i);
      const feedbackMatch = text.match(/FEEDBACK:\s*(.+?)(?=\nIMPROVEMENTS:|$)/si);
      const improvMatch   = text.match(/IMPROVEMENTS:\s*(.+?)(?=$)/si);

      setResult({
        score:        scoreMatch   ? parseInt(scoreMatch[1])   : 50,
        verdict:      verdictMatch ? verdictMatch[1].toUpperCase() : "RISKY",
        feedback:     feedbackMatch ? feedbackMatch[1].trim() : text,
        improvements: improvMatch   ? improvMatch[1].trim() : "",
        rr:           rrVal,
        confidence,
        playbookMatch: !!playbookMatch,
        timestamp:    new Date().toISOString(),
        form:         { ...form },
      });
    } catch {
      setResult({ score: 0, verdict: "ERROR", feedback: "Gagal menghubungi AI. Cek koneksi internet.", improvements: "" });
    }
    setLoading(false);
  }

  function saveResult() {
    if (!result) return;
    setSaved(prev => [{ ...result, id: Date.now() }, ...prev.slice(0, 9)]);
  }

  const verdictColor = { VALID: "#00c896", RISKY: "#f59e0b", INVALID: "#ef4444", ERROR: t.textDim };
  const verdictIcon  = { VALID: "✅", RISKY: "⚠️", INVALID: "❌", ERROR: "⚠️" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Form */}
      <div className="stat-card">
        <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 16 }}>Setup Trade</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div>
            <label>Pair</label>
            <input value={form.pair} onChange={e => set("pair", e.target.value.toUpperCase())} placeholder="EUR/USD"
              style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, fontFamily: "DM Mono, monospace", textTransform: "uppercase" }} />
          </div>
          <div>
            <label>Direction</label>
            <div style={{ display: "flex", gap: 4 }}>
              {["BUY", "SELL"].map(d => (
                <button key={d} onClick={() => set("direction", d)}
                  style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${form.direction === d ? (d === "BUY" ? "#00c896" : "#f59e0b") : t.border}`, background: form.direction === d ? (d === "BUY" ? "rgba(0,200,150,0.1)" : "rgba(245,158,11,0.1)") : "transparent", color: form.direction === d ? (d === "BUY" ? "#00c896" : "#f59e0b") : t.textDim, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label>Session</label>
            <select value={form.session} onChange={e => set("session", e.target.value)}
              style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8 }}>
              {["Asian", "London", "New York"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label>Entry</label>
            <input type="number" step="any" value={form.entry} onChange={e => set("entry", e.target.value)} placeholder="0.00"
              style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, fontFamily: "DM Mono, monospace" }} />
          </div>
          <div>
            <label>Stop Loss</label>
            <input type="number" step="any" value={form.sl} onChange={e => set("sl", e.target.value)} placeholder="0.00"
              style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, fontFamily: "DM Mono, monospace" }} />
          </div>
          <div>
            <label>Take Profit</label>
            <input type="number" step="any" value={form.tp} onChange={e => set("tp", e.target.value)} placeholder="0.00"
              style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, fontFamily: "DM Mono, monospace" }} />
          </div>
          <div>
            <label>Strategy</label>
            <input value={form.strategy} onChange={e => set("strategy", e.target.value)} placeholder="Breakout, ICT, dll"
              style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8 }} />
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <label>Market Context</label>
            <input value={form.marketContext} onChange={e => set("marketContext", e.target.value)} placeholder="Trend, level penting, news..."
              style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8 }} />
          </div>
        </div>

        {/* R:R display */}
        {rr && (
          <div style={{ display: "flex", gap: 16, marginBottom: 12, padding: "8px 12px", background: parseFloat(rr) >= 1.5 ? "rgba(0,200,150,0.08)" : "rgba(245,158,11,0.08)", borderRadius: 8, border: `1px solid ${parseFloat(rr) >= 1.5 ? "rgba(0,200,150,0.2)" : "rgba(245,158,11,0.2)"}` }}>
            <span style={{ fontSize: 12, color: t.textDim }}>R:R Ratio:</span>
            <span style={{ fontFamily: "DM Mono, monospace", fontSize: 14, color: parseFloat(rr) >= 1.5 ? "#00c896" : "#f59e0b", fontWeight: 600 }}>{rr}R</span>
            {parseFloat(rr) < 1 && <span style={{ fontSize: 11, color: "#ef4444" }}>⚠️ R:R di bawah 1:1</span>}
            {parseFloat(rr) >= 2 && <span style={{ fontSize: 11, color: "#00c896" }}>✓ R:R bagus</span>}
          </div>
        )}

        {/* Confidence */}
        {confidence && (
          <div style={{ marginBottom: 12, padding: "8px 12px", background: t.bgSubtle, borderRadius: 8, fontSize: 12, color: t.textDim }}>
            📊 History: {confidence.count} trade {form.pair} {form.direction} — win rate <span style={{ color: confidence.winRate >= 50 ? "#00c896" : "#f59e0b", fontWeight: 600 }}>{confidence.winRate.toFixed(0)}%</span>
          </div>
        )}

        {/* Playbook match */}
        {playbookMatch && (
          <div style={{ marginBottom: 12, padding: "8px 12px", background: "rgba(0,200,150,0.06)", border: "1px solid rgba(0,200,150,0.2)", borderRadius: 8, fontSize: 12, color: "#00c896" }}>
            ✓ Cocok dengan playbook: "{playbookMatch.name}"
          </div>
        )}

        <div>
          <label>Reasoning (opsional)</label>
          <textarea value={form.reasoning} onChange={e => set("reasoning", e.target.value)} rows={2}
            placeholder="Kenapa kamu ambil setup ini? Konfluensi apa yang ada?"
            style={{ background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, resize: "vertical", fontSize: 12 }} />
        </div>

        <button onClick={validate} className="btn-primary" disabled={loading || !form.pair || !form.entry}
          style={{ width: "100%", justifyContent: "center", marginTop: 14 }}>
          {loading ? "🤖 AI sedang menganalisis..." : "🔍 Validasi Setup dengan AI"}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="stat-card" style={{ border: `1px solid ${verdictColor[result.verdict] || t.border}30` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              {/* Score ring */}
              <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
                <svg width="72" height="72" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="36" cy="36" r="28" fill="none" stroke={t.bgSubtle} strokeWidth="6" />
                  <circle cx="36" cy="36" r="28" fill="none" stroke={verdictColor[result.verdict] || "#00c896"} strokeWidth="6"
                    strokeDasharray={`${(result.score / 100) * 2 * Math.PI * 28} ${2 * Math.PI * 28}`} strokeLinecap="round" />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: 18, fontWeight: 700, color: verdictColor[result.verdict], lineHeight: 1 }}>{result.score}</div>
                  <div style={{ fontSize: 8, color: t.textDim }}>/ 100</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.12em" }}>AI Score</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: verdictColor[result.verdict] }}>
                  {verdictIcon[result.verdict]} {result.verdict}
                </div>
                <div style={{ fontSize: 10, color: t.textDim, marginTop: 2 }}>
                  {result.form?.pair} {result.form?.direction} · R:R {result.rr}
                </div>
              </div>
            </div>
            <button onClick={saveResult} className="btn-ghost" style={{ fontSize: 11, padding: "6px 12px" }}>💾 Simpan</button>
          </div>

          <div style={{ background: t.bgSubtle, borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
            <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Feedback AI</div>
            <div style={{ fontSize: 12, color: t.text, lineHeight: 1.7 }}>{result.feedback}</div>
          </div>

          {result.improvements && (
            <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 9, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Saran Improvement</div>
              <div style={{ fontSize: 12, color: t.text, lineHeight: 1.7 }}>{result.improvements}</div>
            </div>
          )}
        </div>
      )}

      {/* Saved validations */}
      {saved.length > 0 && (
        <div>
          <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 10 }}>Validasi Tersimpan</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {saved.map(s => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: t.bgSubtle, borderRadius: 10, border: `1px solid ${verdictColor[s.verdict] || t.border}20` }}>
                <span style={{ fontSize: 16 }}>{verdictIcon[s.verdict]}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: t.text }}>{s.form?.pair} {s.form?.direction}</div>
                  <div style={{ fontSize: 10, color: t.textDim }}>{new Date(s.timestamp).toLocaleString("id-ID")}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: 16, color: verdictColor[s.verdict], fontWeight: 600 }}>{s.score}</div>
                  <div style={{ fontSize: 10, color: t.textDim }}>R:R {s.rr}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AIAdvisor({
  aiHook, trades, playbookSetups, theme,
}) {
  const t = theme;
  const { isMobile } = useBreakpoint();
  const [activePanel, setActivePanel] = useState("weekly"); // "weekly" | "chat" | "validator"

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2, color: t.text }}>
            AI ADVISOR
          </div>
          <div style={{ fontSize: 11, color: t.textDim }}>
            Analisis trading berbasis AI — powered by Claude
          </div>
        </div>

        {/* Panel switcher */}
        <div style={{ display: "flex", gap: 4, background: t.bgSubtle, border: `1px solid ${t.border}`, borderRadius: 10, padding: 3 }}>
          {[
            { id: "weekly",    label: "📊 Weekly" },
            { id: "validator", label: "🔍 Setup Validator" },
            { id: "chat",      label: "💬 Chat" },
          ].map(p => (
            <button key={p.id} onClick={() => setActivePanel(p.id)}
              style={{
                padding: "6px 14px", borderRadius: 7, border: "none", cursor: "pointer",
                fontFamily: "DM Mono, monospace", fontSize: 11,
                background: activePanel === p.id ? t.accent : "transparent",
                color: activePanel === p.id ? "#090e1a" : t.textDim,
                fontWeight: activePanel === p.id ? 600 : 400,
                transition: "all 0.15s", whiteSpace: "nowrap",
              }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activePanel === "weekly" && (
        <WeeklyReport
          report={aiHook.weeklyReport}
          loading={aiHook.weeklyLoading}
          onGenerate={aiHook.generateWeeklyReport}
          theme={t}
        />
      )}

      {activePanel === "validator" && (
        <SetupValidator aiHook={aiHook} trades={trades} playbookSetups={playbookSetups} theme={t} />
      )}

      {activePanel === "chat" && (
        <div className="stat-card">
          <ChatPanel
            messages={aiHook.messages}
            loading={aiHook.loading}
            error={aiHook.error}
            onSend={aiHook.sendMessage}
            onClear={aiHook.clearChat}
            theme={t}
          />
        </div>
      )}

      <style>{`
        @keyframes typing { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .ai-typing::after { content: "..."; animation: typing 1.2s infinite; }
      `}</style>
    </div>
  );
}