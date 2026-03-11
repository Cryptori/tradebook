import { useState, useRef, useEffect } from "react";
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
export default function AIAdvisor({
  aiHook, theme,
}) {
  const t = theme;
  const { isMobile } = useBreakpoint();
  const [activePanel, setActivePanel] = useState("weekly"); // "weekly" | "chat"

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
            { id: "weekly", label: "📊 Weekly Report" },
            { id: "chat",   label: "💬 Chat" },
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