import { formatCurrency, formatPct, formatDate } from "../utils/formatters";
import { useBreakpoint } from "../hooks/useBreakpoint";
import TargetTracker from "./TargetTracker";
import StreakWidget from "./StreakWidget";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";

const chartTooltip = (t) => ({
  contentStyle: {
    background: t.bgCard, border: `1px solid ${t.border}`,
    borderRadius: 10, fontFamily: "DM Mono, monospace",
    fontSize: 11, color: t.text,
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
  },
  cursor: { stroke: t.border, strokeWidth: 1 },
});

// ── Premium Stat Card ─────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon, trend, theme: t }) {
  return (
    <div style={{
      background: t.bgCard,
      border: `1px solid ${t.border}`,
      borderRadius: 14,
      padding: "20px 20px 16px",
      position: "relative",
      overflow: "hidden",
      transition: "border-color 0.2s, transform 0.2s",
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = color + "60"; e.currentTarget.style.transform = "translateY(-1px)"; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.transform = "translateY(0)"; }}>
      {/* Subtle glow */}
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: 80, height: 80,
        background: `radial-gradient(circle at top right, ${color}08, transparent)`,
        pointerEvents: "none",
      }} />

      <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 10, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{
        fontFamily: "DM Mono, monospace",
        fontSize: 24, fontWeight: 600,
        color, lineHeight: 1, marginBottom: 8,
        letterSpacing: "-0.02em",
      }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: t.textDim }}>{sub}</div>
    </div>
  );
}

// ── Mini progress bar ─────────────────────────────────────────────
function MiniProgress({ label, value, current, target, color, theme: t }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: t.textMuted }}>{label}</span>
        <span style={{ fontSize: 11, color, fontFamily: "DM Mono, monospace" }}>{pct.toFixed(0)}%</span>
      </div>
      <div style={{ height: 4, background: t.bgSubtle, borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}80, ${color})`,
          borderRadius: 2, transition: "width 0.8s ease",
        }} />
      </div>
      <div style={{ fontSize: 10, color: t.textDim, marginTop: 4 }}>
        {current} / {target}
      </div>
    </div>
  );
}

export default function Dashboard({
  stats, equityCurve, monthlyPnl, marketBreakdown,
  settings, currencyMeta, theme, onExportPdf,
  pdfMonth, onPdfMonthChange, trades, gamificationHook, streakHook,
}) {
  const t   = theme;
  const sym = currencyMeta?.symbol ?? "$";
  const { isMobile, md } = useBreakpoint();

  const capital        = settings?.capitalInitial ?? 10000;
  const equity         = capital + stats.totalPnl;
  const totalReturn    = capital > 0 ? (stats.totalPnl / capital) * 100 : 0;
  const targetProfit   = capital * ((settings?.targetProfitPct ?? 20) / 100);
  const maxDrawdown    = capital * ((settings?.maxDrawdownPct  ?? 10) / 100);
  const profitProgress = targetProfit > 0 ? (stats.totalPnl / targetProfit) * 100 : 0;
  const ddPct          = maxDrawdown  > 0 ? (Math.abs(Math.min(stats.worstTrade ?? 0, 0)) / maxDrawdown) * 100 : 0;
  const ddColor        = ddPct >= 80 ? "#ef4444" : ddPct >= 50 ? "#f59e0b" : "#00c896";

  const cols4 = isMobile ? "1fr 1fr" : "repeat(4, 1fr)";
  const cols2 = md ? "1fr 1fr" : "1fr";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Page header ─────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 3, color: t.text, lineHeight: 1 }}>
            DASHBOARD
          </div>
          <div style={{ fontSize: 11, color: t.textDim, marginTop: 4 }}>
            Overview performa trading kamu
          </div>
        </div>
        {onExportPdf && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="month" value={pdfMonth ?? ""} onChange={e => onPdfMonthChange?.(e.target.value)}
              style={{ width: "auto", padding: "6px 10px", fontSize: 11, background: t.bgInput, border: `1px solid ${t.border}`, color: t.text, borderRadius: 7 }} />
            <button onClick={() => onExportPdf(pdfMonth)} className="btn-ghost" style={{ fontSize: 11, padding: "6px 12px" }}>
              ↓ PDF
            </button>
          </div>
        )}
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: cols4, gap: 12 }}>
        <StatCard
          label="Total P&L" theme={t}
          value={formatCurrency(stats.totalPnl, false, sym)}
          sub={`${totalReturn >= 0 ? "+" : ""}${totalReturn.toFixed(2)}% return`}
          color={stats.totalPnl >= 0 ? "#00c896" : "#ef4444"}
        />
        <StatCard
          label="Win Rate" theme={t}
          value={`${stats.winRate.toFixed(1)}%`}
          sub={`${stats.wins}W · ${stats.losses}L · ${stats.totalTrades} total`}
          color={stats.winRate >= 50 ? "#00c896" : "#f59e0b"}
        />
        <StatCard
          label="Profit Factor" theme={t}
          value={stats.profitFactor >= 999 ? "∞" : stats.profitFactor.toFixed(2)}
          sub={`Avg R:R ${stats.avgRR.toFixed(2)}`}
          color={stats.profitFactor >= 1.5 ? "#00c896" : "#f59e0b"}
        />
        <StatCard
          label="Current Equity" theme={t}
          value={formatCurrency(equity, false, sym)}
          sub={`Capital: ${formatCurrency(capital, false, sym)}`}
          color="#0ea5e9"
        />
      </div>

      {/* ── Streak Widget ───────────────────────────────────────── */}
      {streakHook && (
        <StreakWidget streakData={streakHook.streakData} theme={t} />
      )}

      {/* ── Charts ───────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: cols2, gap: 16 }}>

        {/* Equity curve */}
        <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: "20px 20px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600 }}>
              Equity Curve
            </div>
            <div style={{ fontSize: 12, color: stats.totalPnl >= 0 ? "#00c896" : "#ef4444", fontFamily: "DM Mono, monospace" }}>
              {stats.totalPnl >= 0 ? "+" : ""}{formatCurrency(stats.totalPnl, false, sym)}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={equityCurve} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00c896" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00c896" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} vertical={false} />
              <XAxis dataKey="date" tick={{ fill: t.textDim, fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: t.textDim, fontSize: 9 }} tickLine={false} axisLine={false}
                tickFormatter={v => `${sym}${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`} width={44} />
              <Tooltip {...chartTooltip(t)} formatter={v => [formatCurrency(v, false, sym), "Equity"]} />
              <ReferenceLine y={capital} stroke={t.border} strokeDasharray="4 4" />
              {equityCurve?.length > 0 && (
                <Area type="monotone" dataKey="equity" stroke="#00c896" strokeWidth={1.5} fill="url(#eqGrad)" dot={false} />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly P&L */}
        <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: "20px 20px 12px" }}>
          <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 16 }}>
            Monthly P&L
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={monthlyPnl} barSize={isMobile ? 10 : 18} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} vertical={false} />
              <XAxis dataKey="month" tick={{ fill: t.textDim, fontSize: 9 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: t.textDim, fontSize: 9 }} tickLine={false} axisLine={false}
                tickFormatter={v => `${v >= 0 ? "+" : ""}${v}`} width={44} />
              <ReferenceLine y={0} stroke={t.border} />
              <Tooltip {...chartTooltip(t)} formatter={v => [formatCurrency(v, false, sym), "P&L"]} />
              <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                {(monthlyPnl || []).map((d, i) => (
                  <Cell key={i} fill={d.pnl >= 0 ? "#00c896" : "#ef4444"} fillOpacity={0.75} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Progress + Market ────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: cols2, gap: 16 }}>

        {/* Progress vs targets */}
        <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: "20px" }}>
          <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 20 }}>
            Progress vs Target
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <MiniProgress
              label="Profit Target"
              value={stats.totalPnl} target={targetProfit}
              current={formatCurrency(stats.totalPnl, false, sym)}
              target_str={formatCurrency(targetProfit, false, sym)}
              color="#00c896" theme={t}
            />
            <MiniProgress
              label="Drawdown Safety"
              value={Math.abs(Math.min(stats.worstTrade ?? 0, 0))} target={maxDrawdown}
              current={formatCurrency(Math.abs(Math.min(stats.worstTrade ?? 0, 0)), false, sym)}
              target_str={formatCurrency(maxDrawdown, false, sym)}
              color={ddColor} theme={t}
            />
            <div style={{ height: 1, background: t.borderSubtle }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Best Trade",  value: formatCurrency(stats.bestTrade  ?? 0, false, sym), color: "#00c896" },
                { label: "Worst Trade", value: formatCurrency(stats.worstTrade ?? 0, false, sym), color: "#ef4444" },
              ].map(s => (
                <div key={s.label} style={{ background: t.bgSubtle, borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 9, color: t.textDim, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 13, color: s.color, fontFamily: "DM Mono, monospace" }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Market breakdown */}
        <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: "20px" }}>
          <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 16 }}>
            Market Breakdown
          </div>
          {marketBreakdown?.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {marketBreakdown.slice(0, 5).map(m => {
                const maxPnl = marketBreakdown?.length > 0 ? Math.max(...marketBreakdown.map(x => Math.abs(x.pnl)), 1) : 1;
                return (
                  <div key={m.market} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 70, fontSize: 11, color: t.textMuted, flexShrink: 0 }}>{m.market}</div>
                    <div style={{ flex: 1, height: 4, background: t.bgSubtle, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(Math.abs(m.pnl) / maxPnl) * 100}%`, background: m.pnl >= 0 ? "#00c896" : "#ef4444", borderRadius: 2 }} />
                    </div>
                    <div style={{ width: 70, fontSize: 11, color: m.pnl >= 0 ? "#00c896" : "#ef4444", textAlign: "right", fontFamily: "DM Mono, monospace" }}>
                      {formatCurrency(m.pnl, true, sym)}
                    </div>
                    <div style={{ width: 30, fontSize: 10, color: t.textDim, textAlign: "right" }}>{m.count}x</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "30px 0", color: t.textDim, fontSize: 12 }}>
              Belum ada data market
            </div>
          )}
        </div>
      </div>

      {/* ── Gamification widget ──────────────────────────────────── */}
      {gamificationHook && (
        <div style={{
          background: `linear-gradient(135deg, ${t.bgCard}, ${t.bgCard2})`,
          border: `1px solid ${t.border}`,
          borderRadius: 14, padding: "18px 20px",
        }}>
          <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 16 }}>
            Trader Profile
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            {/* Level */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(0,200,150,0.12), rgba(0,200,150,0.25))",
                border: "2px solid rgba(0,200,150,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, flexShrink: 0,
              }}>
                {gamificationHook.level.current.icon}
              </div>
              <div>
                <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                  Level {gamificationHook.level.current.level}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#00c896", letterSpacing: "0.05em" }}>
                  {gamificationHook.level.current.name}
                </div>
                <div style={{ fontSize: 10, color: t.textDim }}>{gamificationHook.xp} XP</div>
              </div>
            </div>

            {/* Streaks */}
            <div style={{ display: "flex", gap: 20 }}>
              {[
                { icon: "📝", count: gamificationHook.journalStreak, label: "Journal" },
                { icon: "📅", count: gamificationHook.tradingStreak, label: "Trading" },
                { icon: "🔥", count: gamificationHook.maxWinStreak,  label: "Win Max" },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, marginBottom: 2 }}>{s.icon}</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: 18, color: s.count > 0 ? "#00c896" : t.textDim, fontWeight: 600, lineHeight: 1 }}>
                    {s.count}
                  </div>
                  <div style={{ fontSize: 9, color: t.textDim, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Badges + Level progress */}
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>Badges</div>
                <div style={{ fontFamily: "DM Mono, monospace", fontSize: 20, color: t.gold || "#c9a84c", fontWeight: 600 }}>
                  {gamificationHook.earnedBadges.filter(b => b.earned).length}/{gamificationHook.earnedBadges.length}
                </div>
              </div>
              {gamificationHook.level.next && (
                <div style={{ minWidth: 120 }}>
                  <div style={{ fontSize: 9, color: t.textDim, marginBottom: 5 }}>
                    → {gamificationHook.level.next.name} {gamificationHook.level.next.icon}
                  </div>
                  <div style={{ height: 5, background: t.bgSubtle, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${gamificationHook.level.progress}%`,
                      background: "linear-gradient(90deg, #00c89660, #00c896)",
                      borderRadius: 3, transition: "width 0.8s ease",
                    }} />
                  </div>
                  <div style={{ fontSize: 9, color: t.textDim, marginTop: 3 }}>
                    {gamificationHook.level.progress.toFixed(0)}%
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Recent Trades ────────────────────────────────────────── */}
      {trades?.length > 0 && (
        <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: "20px" }}>
          <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 16 }}>
            Recent Trades
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {[...trades]
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 5)
              .map(trade => (
                <div key={trade.id} style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "80px 1fr 80px" : "88px 1fr 70px 60px 90px",
                  gap: 8, alignItems: "center",
                  padding: "9px 12px",
                  borderRadius: 8,
                  fontSize: 12,
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = t.bgSubtle}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ color: t.textDim, fontSize: 10, fontFamily: "DM Mono, monospace" }}>{trade.date?.slice(5)}</span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontWeight: 500, color: t.text, fontSize: 12 }}>{trade.pair}</span>
                    <span style={{
                      fontSize: 8, padding: "2px 6px", borderRadius: 4, fontWeight: 600,
                      background: trade.side === "BUY" ? "rgba(0,200,150,0.1)" : "rgba(245,158,11,0.1)",
                      color: trade.side === "BUY" ? "#00c896" : "#f59e0b",
                      border: `1px solid ${trade.side === "BUY" ? "#00c89630" : "#f59e0b30"}`,
                      letterSpacing: "0.05em",
                    }}>{trade.side}</span>
                  </div>
                  {!isMobile && <span style={{ color: t.textDim, fontSize: 11 }}>{trade.strategy}</span>}
                  {!isMobile && <span style={{ color: t.textDim, fontSize: 11, fontFamily: "DM Mono, monospace" }}>
                    {(trade.rr ?? 0) >= 0 ? "+" : ""}{(trade.rr ?? 0).toFixed(1)}R
                  </span>}
                  <span style={{
                    color: trade.pnl >= 0 ? "#00c896" : "#ef4444",
                    fontWeight: 600, textAlign: "right",
                    fontFamily: "DM Mono, monospace", fontSize: 12,
                  }}>
                    {formatCurrency(trade.pnl, true, sym)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Target Tracker ───────────────────────────────────────── */}
      <TargetTracker stats={stats} settings={settings} currencyMeta={currencyMeta} theme={t} />

    </div>
  );
}