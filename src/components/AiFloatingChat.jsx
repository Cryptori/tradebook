import { useState, useRef, useEffect } from "react";

// ── Floating AI Chat button — muncul di semua halaman ─────────────
export default function AIFloatingChat({ aiHook, theme: t }) {
  const [open,  setOpen]  = useState(false);
  const [input, setInput] = useState("");
  const bottomRef         = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiHook.messages, aiHook.loading, open]);

  function handleSend() {
    if (!input.trim() || aiHook.loading) return;
    aiHook.sendMessage(input);
    setInput("");
  }

  const unread = aiHook.messages.filter(m => m.role === "assistant").length;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 200,
          width: 52, height: 52, borderRadius: "50%",
          background: "linear-gradient(135deg, #00d4aa, #00b4d8)",
          border: "none", cursor: "pointer", fontSize: 22,
          boxShadow: "0 4px 20px rgba(0,212,170,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform 0.2s",
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        title="AI Advisor">
        {open ? "✕" : "🤖"}
        {!open && unread > 0 && (
          <div style={{
            position: "absolute", top: -2, right: -2,
            width: 18, height: 18, borderRadius: "50%",
            background: "#ef4444", fontSize: 10, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 600,
          }}>
            {unread > 9 ? "9+" : unread}
          </div>
        )}
      </button>

      {/* Chat popup */}
      {open && (
        <div style={{
          position: "fixed", bottom: 86, right: 24, zIndex: 200,
          width: 340, maxHeight: 500,
          background: t.bgCard, border: `1px solid ${t.border}`,
          borderRadius: 16, boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            padding: "12px 16px", borderBottom: `1px solid ${t.border}`,
            background: "linear-gradient(135deg, rgba(0,212,170,0.08), rgba(0,180,216,0.08))",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, #00d4aa, #00b4d8)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
            }}>🤖</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: t.text }}>AI Advisor</div>
              <div style={{ fontSize: 10, color: "#00d4aa" }}>● Online</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
            {aiHook.messages.length === 0 && (
              <div style={{ textAlign: "center", padding: "20px 0", color: t.textDim, fontSize: 12 }}>
                Halo! Tanya apa saja tentang trading kamu 👋
              </div>
            )}
            {aiHook.messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                marginBottom: 8,
              }}>
                <div style={{
                  maxWidth: "85%",
                  background: msg.role === "user" ? "rgba(0,212,170,0.12)" : t.bgSubtle,
                  border: `1px solid ${msg.role === "user" ? "rgba(0,212,170,0.3)" : t.borderSubtle}`,
                  borderRadius: msg.role === "user" ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
                  padding: "8px 11px", fontSize: 12, color: t.text,
                  lineHeight: 1.6, whiteSpace: "pre-wrap",
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {aiHook.loading && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 8 }}>
                <div style={{
                  background: t.bgSubtle, border: `1px solid ${t.borderSubtle}`,
                  borderRadius: "12px 12px 12px 3px", padding: "8px 14px",
                  fontSize: 12, color: t.textDim,
                }}>
                  <span className="ai-typing">Menganalisis</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "10px 12px", borderTop: `1px solid ${t.border}`,
            display: "flex", gap: 8,
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleSend())}
              placeholder="Tanya AI..."
              disabled={aiHook.loading}
              style={{
                flex: 1, background: t.bgInput, border: `1px solid ${t.border}`,
                color: t.text, borderRadius: 8, padding: "7px 10px",
                fontSize: 12, outline: "none",
              }}
            />
            <button onClick={handleSend} disabled={aiHook.loading || !input.trim()}
              className="btn-primary" style={{ padding: "7px 12px", fontSize: 12 }}>
              ↑
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes typing { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .ai-typing::after { content: "..."; animation: typing 1.2s infinite; }
      `}</style>
    </>
  );
}