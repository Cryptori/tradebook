import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const t = this.props.theme ?? {
      bg: "#090e1a", bgCard: "#0d1526", border: "#1e3a5f",
      text: "#e2e8f0", textDim: "#64748b", accent: "#00d4aa",
    };

    return (
      <div style={{
        minHeight: "60vh", display: "flex", alignItems: "center",
        justifyContent: "center", padding: 40,
      }}>
        <div style={{
          background: t.bgCard, border: `1px solid ${t.border}`,
          borderRadius: 16, padding: "40px 48px", textAlign: "center",
          maxWidth: 480,
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 22,
            letterSpacing: 2, color: t.text, marginBottom: 10,
          }}>
            SOMETHING WENT WRONG
          </div>
          <div style={{ fontSize: 12, color: t.textDim, marginBottom: 8, lineHeight: 1.6 }}>
            Komponen ini mengalami error. Data kamu aman di Supabase.
          </div>
          <div style={{
            fontSize: 11, color: "#ef4444", background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8,
            padding: "8px 12px", marginBottom: 24, fontFamily: "monospace",
            textAlign: "left", wordBreak: "break-all",
          }}>
            {this.state.error?.message ?? "Unknown error"}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              background: "linear-gradient(135deg, #00d4aa, #00b4d8)",
              border: "none", color: "#090e1a", fontFamily: "DM Mono, monospace",
              fontSize: 13, fontWeight: 600, padding: "10px 28px",
              borderRadius: 10, cursor: "pointer", marginRight: 10,
            }}>
            Coba Lagi
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "transparent", border: `1px solid ${t.border}`,
              color: t.textDim, fontFamily: "DM Mono, monospace",
              fontSize: 13, padding: "10px 28px", borderRadius: 10, cursor: "pointer",
            }}>
            Reload
          </button>
        </div>
      </div>
    );
  }
}