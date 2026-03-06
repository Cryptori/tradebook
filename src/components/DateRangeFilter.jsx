export default function DateRangeFilter({ dateFrom, dateTo, onFromChange, onToChange, onClear, theme }) {
  const t = theme;
  const hasFilter = dateFrom || dateTo;

  const dateInputStyle = {
    background: "transparent", border: "none",
    color: t.text, fontFamily: "DM Mono, monospace",
    fontSize: 12, padding: "4px 0", width: 120, outline: "none",
  };

  const wrapStyle = {
    display: "flex", alignItems: "center", gap: 6,
    background: t.bgCard, border: `1px solid ${t.border}`,
    borderRadius: 8, padding: "4px 10px",
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <div style={wrapStyle}>
        <span style={{ fontSize: 10, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>From</span>
        <input type="date" value={dateFrom} onChange={e => onFromChange(e.target.value)} style={dateInputStyle} />
      </div>
      <div style={wrapStyle}>
        <span style={{ fontSize: 10, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>To</span>
        <input type="date" value={dateTo} onChange={e => onToChange(e.target.value)} style={dateInputStyle} />
      </div>
      {hasFilter && (
        <button onClick={onClear} className="btn-ghost" style={{ fontSize: 11, padding: "6px 10px" }}>
          ✕ Clear
        </button>
      )}
    </div>
  );
}