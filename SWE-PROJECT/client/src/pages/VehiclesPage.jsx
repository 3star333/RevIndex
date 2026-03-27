import { useState, useEffect } from "react";
import API_URL from "../api/config";
import VinDecoder from "../components/VinDecoder";

export default function VehiclesPage({ onSelect }) {
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm]         = useState({ make: "", model: "", year: "", nickname: "", vin: "" });
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showForm, setShowForm] = useState(false);

  function handleVinDecode(decoded) {
    setForm(f => ({
      ...f,
      make:  decoded.make  || f.make,
      model: decoded.model || f.model,
      year:  decoded.year  ? String(decoded.year) : f.year,
      vin:   decoded.vin   || f.vin,
    }));
  }

  useEffect(() => { fetchVehicles(); }, []);

  async function fetchVehicles() {
    try {
      const res  = await fetch(`${API_URL}/vehicles`);
      const data = await res.json();
      setVehicles(data);
    } catch {
      setError("Failed to load vehicles.");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.make || !form.model || !form.year) {
      return setError("Make, model, and year are required.");
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/vehicles`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...form, year: Number(form.year) }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error);
      setVehicles((prev) => [data, ...prev]);
      setForm({ make: "", model: "", year: "", nickname: "", vin: "" });
      setShowForm(false);
    } catch {
      setError("Failed to add vehicle.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(vehicleId, e) {
    e.stopPropagation();
    if (!window.confirm("Delete this vehicle and ALL its data? This cannot be undone.")) return;
    try {
      await fetch(`${API_URL}/vehicles/${vehicleId}`, { method: "DELETE" });
      setVehicles(prev => prev.filter(v => v.id !== vehicleId));
    } catch {
      setError("Failed to delete vehicle.");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
        <h1 style={{ fontSize: "16px", fontWeight: "bold" }}>
          🚗&nbsp;
          <span className="rainbow-text">My Vehicles</span>
        </h1>
        <button
          className="win-btn win-btn-primary"
          onClick={() => setShowForm((f) => !f)}
        >
          {showForm ? "Cancel" : "[ + Add Vehicle ]"}
        </button>
      </div>

      {/* ── Add Vehicle form ─────────────────────────────────────────── */}
      {showForm && (
        <div className="win-panel" style={{ padding: "0" }}>
          <div className="win-title-bar">
            <span>📝</span>
            <span>Add New Vehicle</span>
          </div>
          <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <VinDecoder onDecode={handleVinDecode} />
            {error && (
              <div style={{ background: "#FF0000", color: "#ffffff", padding: "3px 8px", fontWeight: "bold", fontSize: "12px" }}>
                ⚠ {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "2px", fontSize: "12px" }}>Make *</label>
                  <input className="win-input" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} placeholder="e.g. Toyota" />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "2px", fontSize: "12px" }}>Model *</label>
                  <input className="win-input" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="e.g. Supra" />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "2px", fontSize: "12px" }}>Year *</label>
                  <input className="win-input" type="number" min="1900" max="2099" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="e.g. 1998" />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "2px", fontSize: "12px" }}>Nickname</label>
                  <input className="win-input" value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} placeholder="optional" />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", marginBottom: "2px", fontSize: "12px" }}>VIN (optional)</label>
                  <input
                    className="win-input"
                    style={{ fontFamily: "Courier New, monospace", textTransform: "uppercase", letterSpacing: "1px" }}
                    placeholder="17-character VIN (auto-filled by decoder above)"
                    maxLength={17}
                    value={form.vin}
                    onChange={e => setForm({ ...form, vin: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>
              <div style={{ marginTop: "8px", textAlign: "right" }}>
                <button type="submit" className="win-btn win-btn-primary" disabled={loading}>
                  {loading ? "Adding…" : "OK"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Vehicle grid ─────────────────────────────────────────────── */}
      {vehicles.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px", color: "#808080" }}>
          <div style={{ fontSize: "32px" }}>🚗</div>
          <div style={{ marginTop: "8px" }}>No vehicles yet. Click [+ Add Vehicle] to get started!</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "8px" }}>
          {vehicles.map((v, i) => (
            <div
              key={v.id}
              className="win-panel"
              style={{ padding: "0", cursor: "pointer" }}
              onClick={() => onSelect(v)}
            >
              {/* Title bar */}
              <div className="win-title-bar" style={{ justifyContent: "space-between" }}>
                <span>🚗 {v.year} {v.make} {v.model}</span>
                {i === 0 && (
                  <span className="pulse-badge" style={{ background: "#FF0000", color: "#fff", fontSize: "10px", padding: "0 4px", fontWeight: "bold" }}>
                    NEW!
                  </span>
                )}
              </div>

              {/* Image area */}
              <div style={{ background: "#000000", height: "120px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {v.image ? (
                  <img src={`${API_URL}${v.image}`} alt={`${v.make} ${v.model}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: "40px", opacity: 0.3 }}>🚗</span>
                )}
              </div>

              {/* Info bar */}
              <div style={{ padding: "6px 8px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #808080" }}>
                <div>
                  {v.nickname && (
                    <div style={{ fontSize: "11px", fontStyle: "italic", color: "#000080" }}>&quot;{v.nickname}&quot;</div>
                  )}
                  <div style={{ fontSize: "11px", color: "#808080" }}>Click to open →</div>
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                  <div className="win-btn" style={{ fontSize: "11px", padding: "2px 8px", minWidth: "auto" }}>Open</div>
                  <button
                    className="win-btn"
                    style={{ fontSize: "11px", padding: "2px 6px", minWidth: "auto", color: "#CC0000" }}
                    onClick={e => handleDelete(v.id, e)}
                    title="Delete vehicle"
                  >🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
