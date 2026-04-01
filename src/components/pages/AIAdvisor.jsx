import { useState, useRef, useEffect, useMemo } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";

// ── Message bubble ────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 12 }}>
      {!isUser && (
        <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, var(--accent), var(--accent2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, marginRight: 8, marginTop: 2 }}>
          🤖
        </div>
      )}
      <div style={{
        maxWidth: "80%",
        background: isUser ? "var(--accent-dim)" : "var(--bg-subtle)",
        border: `1px solid ${isUser ? "var(--accent)" : "var(--border)"}`,
        borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        padding: "10px 14px", fontSize: "var(--fs-sm)", color: "var(--text)", lineHeight: 1.7, whiteSpace: "pre-wrap",
      }}>
        {msg.content}
        <div style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)", marginTop: 4, textAlign: isUser ? "right" : "left" }}>
          {new Date(msg.ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}

// ── Weekly report ─────────────────────────────────────────────────
function WeeklyReport({ report, loading, onGenerate }) {
  return (
    <div className="stat-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div className="section-label">Weekly Analysis</div>
          {report?.generatedAt && (
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 2 }}>
              Generated: {new Date(report.generatedAt).toLocaleString("id-ID")}
            </div>
          )}
        </div>
        <button className="btn-primary" onClick={onGenerate} disabled={loading} style={{ height: 30, fontSize: "var(--fs-sm)" }}>
          {loading ? "Generating..." : report ? "↺ Refresh" : "Generate Laporan"}
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>🤖</div>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-dim)" }}>AI sedang menganalisis trading kamu...</div>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 4 }}>Biasanya 10–20 detik</div>
        </div>
      )}

      {!loading && report && (
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--text)", lineHeight: 1.8, whiteSpace: "pre-wrap", background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "14px 16px" }}>
          {report.content}
        </div>
      )}

      {!loading && !report && (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <div className="empty-title">Belum ada laporan</div>
          <div className="empty-desc">Klik "Generate Laporan" untuk analisis mingguan trading kamu</div>
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

// ── Chat panel ────────────────────────────────────────────────────
function ChatPanel({ messages, loading, error, onSend, onClear }) {
  const [input,  setInput]  = useState("");
  const bottomRef           = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  function handleSend() {
    if (!input.trim() || loading) return;
    onSend(input); setInput("");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div className="section-label">Chat dengan AI Advisor</div>
        {messages.length > 0 && (
          <button onClick={onClear} className="btn-ghost" style={{ height: 26, fontSize: "var(--fs-xs)", padding: "0 10px" }}>Clear</button>
        )}
      </div>

      <div style={{ minHeight: 300, maxHeight: 480, overflowY: "auto", paddingRight: 4 }}>
        {messages.length === 0 && (
          <div style={{ padding: "16px 0" }}>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>🤖</div>
              <div style={{ fontSize: "var(--fs-base)", color: "var(--text)", marginBottom: 3 }}>AI Trading Advisor</div>
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>Tanya apa saja tentang trading kamu</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {QUICK_PROMPTS.map(p => (
                <button key={p} onClick={() => onSend(p)} style={{
                  background: "var(--bg-subtle)", border: "1px solid var(--border)",
                  borderRadius: "var(--r-md)", padding: "8px 12px", cursor: "pointer",
                  fontSize: "var(--fs-xs)", color: "var(--text-muted)", textAlign: "left",
                  transition: "border-color var(--t-fast)",
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => <MessageBubble key={i} msg={msg}/>)}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), var(--accent2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🤖</div>
            <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "16px 16px 16px 4px", padding: "10px 16px", fontSize: "var(--fs-sm)", color: "var(--text-dim)" }}>
              Sedang menganalisis<span className="ai-typing"/>
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: "var(--danger-dim)", border: "1px solid var(--danger)", borderRadius: "var(--r-md)", padding: "8px 12px", fontSize: "var(--fs-sm)", color: "var(--danger)", marginTop: 8 }}>
            ⚠️ {error}
          </div>
        )}

        <div ref={bottomRef}/>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
          placeholder="Tanya tentang trading kamu... (Enter untuk kirim)"
          style={{ flex: 1, fontFamily: "var(--font-mono)" }}
          disabled={loading}/>
        <button onClick={handleSend} disabled={loading || !input.trim()} className="btn-primary" style={{ padding: "0 16px", fontSize: "var(--fs-lg)" }}>↑</button>
      </div>
    </div>
  );
}

// ── Setup validator ───────────────────────────────────────────────
function SetupValidator({ aiHook, trades, playbookSetups }) {
  const [form, setForm] = useState({ pair: "", direction: "BUY", entry: "", sl: "", tp: "", session: "London", strategy: "", reasoning: "", marketContext: "" });
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved,   setSaved]   = useState([]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const rr = useMemo(() => {
    const e = parseFloat(form.entry), s = parseFloat(form.sl), p = parseFloat(form.tp);
    if (!e || !s || !p) return null;
    const risk = Math.abs(e-s), reward = Math.abs(p-e);
    return risk > 0 ? (reward/risk).toFixed(2) : null;
  }, [form.entry, form.sl, form.tp]);

  const confidence = useMemo(() => {
    if (!form.pair || !trades?.length) return null;
    const similar = trades.filter(tr => tr.pair === form.pair && tr.side === form.direction && (!form.strategy || tr.strategy === form.strategy));
    if (similar.length < 3) return null;
    const wins = similar.filter(tr => (tr.pnl ?? 0) >= 0).length;
    return { winRate: (wins / similar.length) * 100, count: similar.length };
  }, [form.pair, form.direction, form.strategy, trades]);

  const playbookMatch = useMemo(() => {
    if (!playbookSetups?.length || !form.strategy) return null;
    return playbookSetups.find(s => s.name?.toLowerCase().includes(form.strategy.toLowerCase()));
  }, [playbookSetups, form.strategy]);

  async function validate() {
    if (!form.pair || !form.entry) return;
    setLoading(true); setResult(null);
    const histCtx = confidence ? `History: ${confidence.count} trade serupa, win rate ${confidence.winRate.toFixed(0)}%.` : "Belum ada history trade serupa.";
    const pbCtx   = playbookMatch ? `Setup cocok dengan playbook: "${playbookMatch.name}".` : form.strategy ? "Setup tidak cocok dengan playbook yang ada." : "";
    const prompt  = `Kamu adalah trading coach profesional. Evaluasi setup trade berikut:\n\nPair: ${form.pair}\nDirection: ${form.direction}\nEntry: ${form.entry}\nSL: ${form.sl||"N/A"}\nTP: ${form.tp||"N/A"}\nR:R: ${rr??""}\nSession: ${form.session}\nStrategy: ${form.strategy||"N/A"}\nContext: ${form.marketContext||"N/A"}\nReasoning: ${form.reasoning||"N/A"}\n\n${histCtx}\n${pbCtx}\n\nBerikan evaluasi dalam format:\nSCORE: [0-100]\nVERDICT: [VALID/RISKY/INVALID]\nFEEDBACK: [2-3 kalimat]\nIMPROVEMENTS: [1-2 saran]`;
    try {
      const res  = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, context: "" }) });
      const data = await res.json();
      const text = data.response || data.content || "";
      const sm   = text.match(/SCORE:\s*(\d+)/i);
      const vm   = text.match(/VERDICT:\s*(\w+)/i);
      const fm   = text.match(/FEEDBACK:\s*(.+?)(?=\nIMPROVEMENTS:|$)/si);
      const im   = text.match(/IMPROVEMENTS:\s*(.+?)(?=$)/si);
      setResult({ score: sm ? parseInt(sm[1]) : 50, verdict: vm ? vm[1].toUpperCase() : "RISKY", feedback: fm ? fm[1].trim() : text, improvements: im ? im[1].trim() : "", rr: rr??"N/A", confidence, playbookMatch: !!playbookMatch, timestamp: new Date().toISOString(), form: { ...form } });
    } catch {
      setResult({ score: 0, verdict: "ERROR", feedback: "Gagal menghubungi AI. Cek koneksi internet.", improvements: "" });
    }
    setLoading(false);
  }

  const VC = { VALID: "var(--success)", RISKY: "var(--warning)", INVALID: "var(--danger)", ERROR: "var(--text-dim)" };
  const VI = { VALID: "✅", RISKY: "⚠️", INVALID: "❌", ERROR: "⚠️" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="stat-card">
        <div className="section-label" style={{ marginBottom: 14 }}>Setup Trade</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div><label>Pair</label><input value={form.pair} onChange={e => set("pair", e.target.value.toUpperCase())} placeholder="EUR/USD" style={{ fontFamily: "var(--font-mono)", textTransform: "uppercase" }}/></div>
          <div>
            <label>Direction</label>
            <div style={{ display: "flex", gap: 5 }}>
              {["BUY","SELL"].map(d => {
                const active = form.direction === d;
                const color  = d === "BUY" ? "var(--success)" : "var(--warning)";
                return (
                  <button key={d} onClick={() => set("direction", d)} style={{ flex: 1, padding: "7px 0", borderRadius: "var(--r-md)", border: `1px solid ${active ? color : "var(--border)"}`, background: active ? (d === "BUY" ? "var(--success-dim)" : "var(--warning-dim)") : "transparent", color: active ? color : "var(--text-dim)", fontSize: "var(--fs-sm)", fontWeight: 700, cursor: "pointer" }}>{d}</button>
                );
              })}
            </div>
          </div>
          <div><label>Session</label><select value={form.session} onChange={e => set("session", e.target.value)}>{["Asian","London","New York"].map(s => <option key={s}>{s}</option>)}</select></div>
          <div><label>Entry</label><input type="number" step="any" value={form.entry} onChange={e => set("entry", e.target.value)} style={{ fontFamily: "var(--font-mono)" }}/></div>
          <div><label>Stop Loss</label><input type="number" step="any" value={form.sl} onChange={e => set("sl", e.target.value)} style={{ fontFamily: "var(--font-mono)" }}/></div>
          <div><label>Take Profit</label><input type="number" step="any" value={form.tp} onChange={e => set("tp", e.target.value)} style={{ fontFamily: "var(--font-mono)" }}/></div>
          <div><label>Strategy</label><input value={form.strategy} onChange={e => set("strategy", e.target.value)} placeholder="Breakout, ICT, dll"/></div>
          <div style={{ gridColumn: "span 2" }}><label>Market Context</label><input value={form.marketContext} onChange={e => set("marketContext", e.target.value)} placeholder="Trend, level penting, news..."/></div>
        </div>

        {rr && (
          <div style={{ display: "flex", gap: 14, marginBottom: 10, padding: "7px 12px", background: parseFloat(rr) >= 1.5 ? "var(--success-dim)" : "var(--warning-dim)", borderRadius: "var(--r-md)", border: `1px solid ${parseFloat(rr) >= 1.5 ? "var(--success)" : "var(--warning)"}` }}>
            <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-dim)" }}>R:R Ratio:</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-base)", color: parseFloat(rr) >= 1.5 ? "var(--success)" : "var(--warning)", fontWeight: 600 }}>{rr}R</span>
            {parseFloat(rr) < 1 && <span style={{ fontSize: "var(--fs-xs)", color: "var(--danger)" }}>⚠️ R:R di bawah 1:1</span>}
            {parseFloat(rr) >= 2 && <span style={{ fontSize: "var(--fs-xs)", color: "var(--success)" }}>✓ R:R bagus</span>}
          </div>
        )}

        {confidence && (
          <div style={{ marginBottom: 10, padding: "7px 12px", background: "var(--bg-subtle)", borderRadius: "var(--r-md)", fontSize: "var(--fs-sm)", color: "var(--text-dim)" }}>
            📊 History: {confidence.count} trade {form.pair} {form.direction} — win rate{" "}
            <span style={{ color: confidence.winRate >= 50 ? "var(--success)" : "var(--warning)", fontWeight: 600 }}>{confidence.winRate.toFixed(0)}%</span>
          </div>
        )}

        {playbookMatch && (
          <div style={{ marginBottom: 10, padding: "7px 12px", background: "var(--success-dim)", border: "1px solid var(--success)", borderRadius: "var(--r-md)", fontSize: "var(--fs-sm)", color: "var(--success)" }}>
            ✓ Cocok dengan playbook: "{playbookMatch.name}"
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label>Reasoning (opsional)</label>
          <textarea value={form.reasoning} onChange={e => set("reasoning", e.target.value)} rows={2} placeholder="Kenapa ambil setup ini? Konfluensi apa yang ada?" style={{ lineHeight: 1.6 }}/>
        </div>

        <button onClick={validate} className="btn-primary" disabled={loading || !form.pair || !form.entry} style={{ width: "100%", justifyContent: "center" }}>
          {loading ? "🤖 AI sedang menganalisis..." : "🔍 Validasi Setup dengan AI"}
        </button>
      </div>

      {result && (
        <div className="stat-card" style={{ border: `1px solid ${VC[result.verdict] || "var(--border)"}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ position: "relative", width: 68, height: 68, flexShrink: 0 }}>
                <svg width="68" height="68" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="34" cy="34" r="26" fill="none" stroke="var(--bg-subtle)" strokeWidth="5"/>
                  <circle cx="34" cy="34" r="26" fill="none" stroke={VC[result.verdict]} strokeWidth="5"
                    strokeDasharray={`${(result.score / 100) * 2 * Math.PI * 26} ${2 * Math.PI * 26}`} strokeLinecap="round"/>
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-lg)", fontWeight: 700, color: VC[result.verdict], lineHeight: 1 }}>{result.score}</div>
                  <div style={{ fontSize: "var(--fs-2xs)", color: "var(--text-dim)" }}>/ 100</div>
                </div>
              </div>
              <div>
                <div className="kpi-label">AI Score</div>
                <div style={{ fontSize: "var(--fs-xl)", fontWeight: 600, color: VC[result.verdict] }}>{VI[result.verdict]} {result.verdict}</div>
                <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", marginTop: 2 }}>{result.form?.pair} {result.form?.direction} · R:R {result.rr}</div>
              </div>
            </div>
            <button onClick={() => setSaved(p => [{ ...result, id: Date.now() }, ...p.slice(0, 9)])} className="btn-ghost" style={{ height: 28, fontSize: "var(--fs-xs)" }}>💾 Simpan</button>
          </div>

          <div style={{ background: "var(--bg-subtle)", borderRadius: "var(--r-md)", padding: "10px 14px", marginBottom: 10 }}>
            <div className="section-label" style={{ marginBottom: 5 }}>Feedback AI</div>
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--text)", lineHeight: 1.7 }}>{result.feedback}</div>
          </div>

          {result.improvements && (
            <div style={{ background: "var(--warning-dim)", border: "1px solid var(--warning)", borderRadius: "var(--r-md)", padding: "10px 14px" }}>
              <div className="section-label" style={{ marginBottom: 5, color: "var(--warning)" }}>Saran Improvement</div>
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--text)", lineHeight: 1.7 }}>{result.improvements}</div>
            </div>
          )}
        </div>
      )}

      {saved.length > 0 && (
        <div>
          <div className="section-label" style={{ marginBottom: 8 }}>Validasi Tersimpan</div>
          {saved.map(s => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "var(--bg-subtle)", border: `1px solid ${VC[s.verdict]}30`, borderRadius: "var(--r-md)", marginBottom: 6 }}>
              <span style={{ fontSize: 16 }}>{VI[s.verdict]}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "var(--fs-sm)", fontWeight: 500, color: "var(--text)" }}>{s.form?.pair} {s.form?.direction}</div>
                <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>{new Date(s.timestamp).toLocaleString("id-ID")}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-xl)", color: VC[s.verdict], fontWeight: 600 }}>{s.score}</div>
                <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>R:R {s.rr}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main AIAdvisor ────────────────────────────────────────────────
export default function AIAdvisor({ aiHook, trades, playbookSetups, theme }) {
  const [activePanel, setActivePanel] = useState("weekly");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">AI Advisor</h1>
          <p className="page-subtitle">Analisis trading berbasis AI — powered by Claude</p>
        </div>
        <div style={{ display: "flex", gap: 2, background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 2 }}>
          {[{ id: "weekly", l: "📊 Weekly" }, { id: "validator", l: "🔍 Validator" }, { id: "chat", l: "💬 Chat" }].map(p => (
            <button key={p.id} onClick={() => setActivePanel(p.id)} style={{
              padding: "5px 12px", borderRadius: "var(--r-sm)", border: "none", cursor: "pointer",
              fontSize: "var(--fs-xs)",
              background: activePanel === p.id ? "var(--accent)"      : "transparent",
              color:      activePanel === p.id ? "var(--text-inverse)" : "var(--text-dim)",
              fontWeight: activePanel === p.id ? 600 : 400, whiteSpace: "nowrap",
            }}>{p.l}</button>
          ))}
        </div>
      </div>

      {activePanel === "weekly"    && <WeeklyReport report={aiHook.weeklyReport} loading={aiHook.weeklyLoading} onGenerate={aiHook.generateWeeklyReport}/>}
      {activePanel === "validator" && <SetupValidator aiHook={aiHook} trades={trades} playbookSetups={playbookSetups}/>}
      {activePanel === "chat"      && (
        <div className="stat-card">
          <ChatPanel messages={aiHook.messages} loading={aiHook.loading} error={aiHook.error} onSend={aiHook.sendMessage} onClear={aiHook.clearChat}/>
        </div>
      )}

      <style>{`
        @keyframes typing { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .ai-typing::after { content: "..."; animation: typing 1.2s infinite; }
      `}</style>
    </div>
  );
}