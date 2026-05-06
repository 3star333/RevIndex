import { useState, useEffect } from "react";
import API_URL from "../api/config";
import VinDecoder from "../components/VinDecoder";
import { useAuth } from "../context/AuthContext";

// ── Shared vehicle card ───────────────────────────────────────────────────────
function VehicleCard({ v, onSelect, onDelete, showOwner = false }) {
  return (
    <div className="win-panel" style={{ padding: 0, cursor: "pointer", minWidth: 0 }}
      onClick={() => onSelect && onSelect(v)}>
      <div className="win-title-bar" style={{ justifyContent: "space-between" }}>
        <span style={{ fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          🚗 {v.year} {v.make} {v.model}
        </span>
      </div>
      <div style={{ background: "#000", height: "110px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {v.image
          ? <img src={`${API_URL}${v.image}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ fontSize: "36px", opacity: 0.3 }}>🚗</span>}
      </div>
      <div style={{ padding: "5px 8px", borderTop: "1px solid #808080", fontSize: "11px" }}>
        {v.nickname && <div style={{ fontStyle: "italic", color: "#000080" }}>&quot;{v.nickname}&quot;</div>}
        {showOwner && v.owner_username && (
          <div style={{ display: "flex", alignItems: "center", gap: "3px", color: "#4B0082", marginTop: "1px" }}>
            {v.owner_avatar
              ? <img src={`${API_URL}${v.owner_avatar}`} alt="" style={{ width: "12px", height: "12px", objectFit: "cover", border: "1px solid #808080" }} />
              : <span>👤</span>}
            <span style={{ fontWeight: "bold" }}>{v.owner_username}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "3px" }}>
          <span style={{ color: "#808080" }}>Click to open →</span>
          {onDelete && (
            <button className="win-btn" style={{ fontSize: "11px", padding: "1px 5px", minWidth: "auto", color: "#CC0000" }}
              onClick={e => { e.stopPropagation(); onDelete(v.id, e); }} title="Delete">🗑</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VehiclesPage({ onSelect }) {
  const { user, authHeader } = useAuth();
  const [allVehicles, setAllVehicles] = useState([]);
  const [allLoading,  setAllLoading]  = useState(true);
  const [myVehicles,  setMyVehicles]  = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm,     setAddForm]     = useState({ make: "", model: "", year: "", nickname: "", vin: "" });
  const [addError,    setAddError]    = useState("");
  const [addLoading,  setAddLoading]  = useState(false);
  const [error,       setError]       = useState("");

  function handleVinDecode(decoded) {
    setAddForm(f => ({
      ...f,
      make:  decoded.make  || f.make,
      model: decoded.model || f.model,
      year:  decoded.year  ? String(decoded.year) : f.year,
      vin:   decoded.vin   || f.vin,
    }));
  }

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { if (user) fetchMine(); else setMyVehicles([]); }, [user]); // eslint-disable-line

  async function fetchAll() {
    setAllLoading(true);
    try {
      const res  = await fetch(`${API_URL}/vehicles`);
      const data = await res.json();
      setAllVehicles(Array.isArray(data) ? data : []);
    } catch { setError("Failed to load vehicles."); }
    finally { setAllLoading(false); }
  }

  async function fetchMine() {
    try {
      const res  = await fetch(`${API_URL}/vehicles/mine`, { headers: authHeader() });
      const data = await res.json();
      setMyVehicles(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }

  async function handleAddVehicle(e) {
    e.preventDefault(); setAddError("");
    if (!addForm.make || !addForm.model || !addForm.year) return setAddError("Make, model, and year are required.");
    setAddLoading(true);
    try {
      const res = await fetch(`${API_URL}/vehicles`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ ...addForm, year: Number(addForm.year) }),
      });
      const data = await res.json();
      if (!res.ok) return setAddError(data.error);
      setAddForm({ make: "", model: "", year: "", nickname: "", vin: "" });
      setShowAddForm(false);
      fetchMine(); fetchAll();
    } catch { setAddError("Failed to add vehicle."); }
    finally { setAddLoading(false); }
  }

  async function handleDelete(vehicleId) {
    if (!window.confirm("Delete this vehicle and ALL its data? This cannot be undone.")) return;
    try {
      await fetch(`${API_URL}/vehicles/${vehicleId}`, { method: "DELETE" });
      setMyVehicles(prev => prev.filter(v => v.id !== vehicleId));
      setAllVehicles(prev => prev.filter(v => v.id !== vehicleId));
    } catch { setError("Failed to delete vehicle."); }
  }

  const myIds = new Set(myVehicles.map(v => v.id));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {error && <div style={{ background: "#FF0000", color: "#fff", padding: "3px 8px", fontSize: "11px", fontWeight: "bold" }}>⚠ {error}</div>}

      {/* ══ MY GARAGE ══════════════════════════════════════════════════════════ */}
      {user ? (
        <div className="win-panel" style={{ padding: 0 }}>
          <div className="win-title-bar" style={{ justifyContent: "space-between" }}>
            <span>🚗 My Garage — {user.username}</span>
            <button className="win-btn" style={{ fontSize: "11px", minWidth: "unset", padding: "1px 10px" }}
              onClick={() => { setShowAddForm(f => !f); setAddError(""); }}>
              {showAddForm ? "[ Cancel ]" : "[ + Add Vehicle ]"}
            </button>
          </div>

          {showAddForm && (
            <div style={{ padding: "10px", borderBottom: "2px solid #808080", background: "#D4D0C8" }}>
              <VinDecoder onDecode={handleVinDecode} />
              {addError && <div style={{ background: "#FF0000", color: "#fff", padding: "3px 8px", fontSize: "11px", fontWeight: "bold", marginTop: "6px" }}>⚠ {addError}</div>}
              <form onSubmit={handleAddVehicle} style={{ marginTop: "8px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Make *</label>
                    <input className="win-input" value={addForm.make} placeholder="Toyota" onChange={e => setAddForm(f => ({ ...f, make: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Model *</label>
                    <input className="win-input" value={addForm.model} placeholder="Supra" onChange={e => setAddForm(f => ({ ...f, model: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Year *</label>
                    <input className="win-input" type="number" min="1886" max="2099" value={addForm.year} placeholder="1998" onChange={e => setAddForm(f => ({ ...f, year: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Nickname</label>
                    <input className="win-input" value={addForm.nickname} placeholder="optional" onChange={e => setAddForm(f => ({ ...f, nickname: e.target.value }))} />
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>VIN (optional)</label>
                    <input className="win-input" style={{ fontFamily: "Courier New, monospace", textTransform: "uppercase", letterSpacing: "1px" }}
                      placeholder="17-character VIN" maxLength={17} value={addForm.vin}
                      onChange={e => setAddForm(f => ({ ...f, vin: e.target.value.toUpperCase() }))} />
                  </div>
                </div>
                <div style={{ marginTop: "8px", textAlign: "right" }}>
                  <button type="submit" className="win-btn win-btn-primary" disabled={addLoading}>
                    {addLoading ? "Adding…" : "[ Save Vehicle ]"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {myVehicles.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#808080", fontSize: "12px" }}>
              <div style={{ fontSize: "28px", marginBottom: "6px" }}>🚗</div>
              No vehicles yet. Click <strong>[ + Add Vehicle ]</strong> to get started!
            </div>
          ) : (
            <div style={{ padding: "10px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px" }}>
              {myVehicles.map(v => (
                <VehicleCard key={v.id} v={v} onSelect={onSelect} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="win-panel" style={{ padding: 0 }}>
          <div className="win-title-bar"><span>🚗 My Garage</span></div>
          <div style={{ padding: "16px", textAlign: "center", fontSize: "12px", color: "#808080" }}>
            <span style={{ color: "#000080", cursor: "pointer", textDecoration: "underline" }}>Login</span>
            {" "}or{" "}
            <span style={{ color: "#000080", cursor: "pointer", textDecoration: "underline" }}>Register</span>
            {" "}to manage your own garage.
          </div>
        </div>
      )}

      {/* ══ COMMUNITY GARAGE ══════════════════════════════════════════════════ */}
      <div className="win-panel" style={{ padding: 0 }}>
        <div className="win-title-bar">
          <span>🏁 Community Garage — All Vehicles ({allVehicles.length})</span>
        </div>
        {allLoading ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#808080", fontSize: "12px" }}>Loading…</div>
        ) : allVehicles.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#808080", fontSize: "12px" }}>No vehicles registered yet.</div>
        ) : (
          <div style={{ padding: "10px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px" }}>
            {allVehicles.map(v => (
              <VehicleCard key={v.id} v={v} onSelect={onSelect} showOwner
                onDelete={myIds.has(v.id) ? handleDelete : null} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
