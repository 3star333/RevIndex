import { useState } from "react";
import API_URL from "../api/config";

/**
 * VinDecoder
 * Props:
 *   onDecode({ year, make, model, trim, engine, ... }) — called when a VIN is decoded
 */
export default function VinDecoder({ onDecode }) {
  const [vin, setVin]       = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  async function handleDecode(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    const clean = vin.trim().toUpperCase();
    if (clean.length !== 17) {
      return setError("VIN must be exactly 17 characters.");
    }
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/vin/decode?vin=${clean}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleApply() {
    if (result && onDecode) onDecode(result);
    setResult(null);
    setVin("");
  }

  const charCount = vin.trim().length;
  const countColor = charCount === 17 ? "#008000" : charCount > 17 ? "#FF0000" : "#808080";

  return (
    <div className="win-panel" style={{ padding: 0, marginBottom: "8px" }}>
      <div className="win-title-bar">
        <span>🔍 VIN Decoder</span>
        {result?.cached && (
          <span style={{ fontSize: "10px", background: "#008000", color: "#fff", padding: "1px 4px" }}>
            CACHED
          </span>
        )}
      </div>
      <div style={{ padding: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>

        {/* Input row */}
        <form onSubmit={handleDecode} style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          <input
            className="win-input"
            style={{ flex: 1, fontFamily: "Courier New, monospace", textTransform: "uppercase", letterSpacing: "1px" }}
            placeholder="Enter 17-character VIN..."
            maxLength={17}
            value={vin}
            onChange={e => setVin(e.target.value.toUpperCase())}
          />
          <span style={{ fontSize: "11px", color: countColor, minWidth: "28px", textAlign: "right", fontFamily: "monospace" }}>
            {charCount}/17
          </span>
          <button className="win-btn win-btn-primary" type="submit" disabled={loading || charCount !== 17}>
            {loading ? "Decoding…" : "[ Decode ]"}
          </button>
        </form>

        {error && (
          <div style={{ background: "#FF0000", color: "#fff", padding: "3px 8px", fontSize: "11px", fontWeight: "bold" }}>
            ⚠ {error}
          </div>
        )}

        {/* Results panel */}
        {result && (
          <div className="win-inset" style={{ padding: "6px 8px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 90px 1fr", gap: "2px 8px", fontSize: "12px" }}>
              <Field label="Year"       value={result.year} />
              <Field label="Make"       value={result.make} />
              <Field label="Model"      value={result.model} />
              <Field label="Trim"       value={result.trim} />
              <Field label="Engine"     value={result.engine} />
              <Field label="Body Style" value={result.body_style} />
              <Field label="Drive Type" value={result.drive_type} />
              <Field label="Fuel Type"  value={result.fuel_type} />
            </div>
            <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
              <button className="win-btn win-btn-primary" onClick={handleApply}>
                [ ✓ Use This Vehicle ]
              </button>
              <button className="win-btn" onClick={() => setResult(null)}>
                [ Cancel ]
              </button>
            </div>
          </div>
        )}

        <div style={{ fontSize: "10px", color: "#808080" }}>
          Powered by NHTSA vPIC API — USDM vehicles only. Results cached locally.
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <>
      <span style={{ color: "#808080", fontSize: "11px" }}>{label}:</span>
      <span style={{ fontWeight: value ? "bold" : "normal", color: value ? "#000" : "#808080" }}>
        {value || "—"}
      </span>
    </>
  );
}
