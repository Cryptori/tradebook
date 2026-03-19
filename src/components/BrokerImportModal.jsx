import { useState, useRef, useCallback } from "react";
import { importBrokerCSV } from "../utils/brokerImport";
import { formatCurrency } from "../utils/formatters";

export default function BrokerImportModal({ onImport, existingTrades, theme: t, onClose }) {
  const [step,        setStep]        = useState("upload"); // upload | preview | done
  const [result,      setResult]      = useState(null);
  const [selected,    setSelected]    = useState(new Set());
  const [dragOver,    setDragOver]    = useState(false);
  const [error,       setError]       = useState("");
  const fileRef = useRef(null);

  const processFile = useCallback(async (file) => {
    if (!file) return;
    setError("");
    try {
      const text = await file.text();
      const res  = importBrokerCSV(text, existingTrades || []);
      setResult(res);
      setSelected(new Set(res.trades.map(t => t.id)));
      setStep("preview");
    } catch (err) {
      setError("Gagal membaca file: " + err.message);
    }
  }, [existingTrades]);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  function handleImport() {
    const toImport = result.trades.filter(t => selected.has(t.id));
    onImport(toImport);
    setStep("done");
  }

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === result.trades.length) setSelected(new Set());
    else setSelected(new Set(result.trades.map(t => t.id)));
  }

  const sym = "$";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(8,12,20,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(8px)" }}>
      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 700, maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2, color: t.text }}>IMPORT BROKER CSV</div>
            <div style={{ fontSize: 11, color: t.textDim, marginTop: 3 }}>MT4/MT5, Exness, IC Markets, dan broker lainnya</div>
          </div>
          <button onClick={onClose} style={{ background: t.bgSubtle, border: `1px solid ${t.border}`, color: t.textDim, cursor: "pointer", borderRadius: 7, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✕</button>
        </div>

        {/* Step: Upload */}
        {step === "upload" && (
          <div>
            {/* Drop zone */}
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragOver ? t.accent : t.border}`,
                borderRadius: 12, padding: "48px 24px", textAlign: "center",
                cursor: "pointer", transition: "all 0.2s",
                background: dragOver ? "rgba(0,200,150,0.04)" : t.bgSubtle,
              }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
              <div style={{ fontSize: 15, color: t.text, marginBottom: 6 }}>Drop file CSV di sini</div>
              <div style={{ fontSize: 12, color: t.textDim }}>atau klik untuk pilih file</div>
              <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} style={{ display: "none" }} />
            </div>

            {error && (
              <div style={{ marginTop: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#ef4444" }}>
                ⚠️ {error}
              </div>
            )}

            {/* Instructions */}
            <div style={{ marginTop: 20, background: t.bgSubtle, borderRadius: 10, padding: "16px 18px" }}>
              <div style={{ fontSize: 11, color: t.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Cara Export dari MT4/MT5</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  "MT4: Account History → klik kanan → Save as Report (Detail) → pilih periode → Save",
                  "MT5: History → klik kanan pada tabel → Export to .csv",
                  "Exness: My Accounts → Trading History → Export CSV",
                  "Broker lain: Cari menu Trade History / Account History → Export / Download CSV",
                ].map((tip, i) => (
                  <div key={i} style={{ fontSize: 12, color: t.textDim, display: "flex", gap: 8 }}>
                    <span style={{ color: t.accent, flexShrink: 0 }}>{i+1}.</span>
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === "preview" && result && (
          <div>
            {/* Result summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Broker Terdeteksi", value: result.broker,         color: t.text    },
                { label: "Total Baris",        value: result.total,          color: t.text    },
                { label: "Siap Import",        value: result.trades.length,  color: "#00c896" },
                { label: "Duplicate Skip",     value: result.skipped,        color: "#f59e0b" },
              ].map(s => (
                <div key={s.label} style={{ background: t.bgSubtle, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 16, color: s.color, fontFamily: "DM Mono, monospace", fontWeight: 600 }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Errors */}
            {result.errors.length > 0 && (
              <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 12 }}>
                <div style={{ color: "#f59e0b", marginBottom: 6 }}>⚠️ {result.errors.length} baris dengan error (akan diskip):</div>
                {result.errors.slice(0, 5).map((e, i) => (
                  <div key={i} style={{ color: t.textDim, marginBottom: 2 }}>• {e}</div>
                ))}
                {result.errors.length > 5 && <div style={{ color: t.textDim }}>... dan {result.errors.length - 5} lainnya</div>}
              </div>
            )}

            {result.trades.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 24px", color: t.textDim }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🤷</div>
                <div style={{ fontSize: 14, color: t.text }}>Tidak ada trade yang bisa diimport</div>
                <div style={{ fontSize: 12, marginTop: 6 }}>Semua baris sudah ada atau tidak valid</div>
                <button onClick={() => setStep("upload")} className="btn-ghost" style={{ marginTop: 16 }}>← Coba File Lain</button>
              </div>
            ) : (
              <>
                {/* Select all */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: t.textDim }}>{selected.size} dari {result.trades.length} dipilih</div>
                  <button onClick={toggleAll} className="btn-ghost" style={{ fontSize: 11, padding: "5px 12px" }}>
                    {selected.size === result.trades.length ? "Deselect All" : "Select All"}
                  </button>
                </div>

                {/* Trade list */}
                <div style={{ maxHeight: 320, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                  {result.trades.map(trade => (
                    <div key={trade.id} onClick={() => toggleSelect(trade.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                        background: selected.has(trade.id) ? "rgba(0,200,150,0.06)" : t.bgSubtle,
                        border: `1px solid ${selected.has(trade.id) ? "rgba(0,200,150,0.25)" : t.borderSubtle}`,
                        transition: "all 0.15s",
                      }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${selected.has(trade.id) ? "#00c896" : t.border}`, background: selected.has(trade.id) ? "#00c896" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {selected.has(trade.id) && <span style={{ fontSize: 10, color: "#090e1a", fontWeight: 700 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 10, color: t.textDim, width: 80, flexShrink: 0, fontFamily: "DM Mono, monospace" }}>{trade.date}</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: t.text, width: 70, flexShrink: 0 }}>{trade.pair}</span>
                      <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 4, background: trade.side === "BUY" ? "rgba(0,200,150,0.1)" : "rgba(245,158,11,0.1)", color: trade.side === "BUY" ? "#00c896" : "#f59e0b", flexShrink: 0 }}>{trade.side}</span>
                      <span style={{ fontSize: 11, color: t.textDim, flexShrink: 0 }}>{trade.size} lot</span>
                      <span style={{ fontSize: 11, color: t.textDim, flex: 1 }}>{trade.market}</span>
                      <span style={{ fontSize: 13, color: trade.pnl >= 0 ? "#00c896" : "#ef4444", fontFamily: "DM Mono, monospace", fontWeight: 600, flexShrink: 0 }}>
                        {trade.pnl >= 0 ? "+" : ""}{formatCurrency(trade.pnl, false, sym)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Step: Done */}
        {step === "done" && (
          <div style={{ textAlign: "center", padding: "32px 24px" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <div style={{ fontSize: 18, fontWeight: 500, color: t.text, marginBottom: 8 }}>Import Berhasil!</div>
            <div style={{ fontSize: 13, color: t.textDim }}>{selected.size} trade berhasil diimport ke Journal</div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 16, borderTop: `1px solid ${t.borderSubtle}` }}>
          {step === "preview" && result?.trades.length > 0 && (
            <>
              <button onClick={() => setStep("upload")} className="btn-ghost">← Ganti File</button>
              <button onClick={handleImport} className="btn-primary" disabled={selected.size === 0} style={{ justifyContent: "center", minWidth: 140 }}>
                ✓ Import {selected.size} Trade
              </button>
            </>
          )}
          {(step === "done" || (step === "preview" && result?.trades.length === 0)) && (
            <button onClick={onClose} className="btn-primary" style={{ justifyContent: "center" }}>Selesai</button>
          )}
          {step === "upload" && (
            <button onClick={onClose} className="btn-ghost">Batal</button>
          )}
        </div>
      </div>
    </div>
  );
}