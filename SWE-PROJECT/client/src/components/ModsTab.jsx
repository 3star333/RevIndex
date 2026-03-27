import { useState, useEffect, useRef } from "react";
import API_URL from "../api/config";

const CATEGORIES = ["Engine","Suspension","Exhaust","Wheels","Brakes","Interior","Exterior","Audio","Lighting","Other"];

const CAT_ICON = {
  Engine:"⚙️", Suspension:"🔩", Exhaust:"💨", Wheels:"🛞",
  Brakes:"🔴", Interior:"🪑", Exterior:"🎨", Audio:"🔊",
  Lighting:"💡", Other:"📦"
};

export default function ModsTab({ vehicleId }) {
  const [mods, setMods]           = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [error, setError]         = useState("");
  const [imgUploading, setImgUploading] = useState(null); // modId
  const imgRefs                   = useRef({});

  const [form, setForm] = useState({
    name: "", category: "Engine", cost: "", install_date: "", notes: ""
  });

  useEffect(() => { fetchMods(); }, [vehicleId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchMods() {
    try {
      const res  = await fetch(`${API_URL}/mods?vehicle_id=${vehicleId}`);
      const data = await res.json();
      setMods(Array.isArray(data) ? data : []);
    } catch { setError("Failed to load mods."); }
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    try {
      const res  = await fetch(`${API_URL}/mods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, vehicle_id: vehicleId,
          cost: form.cost ? parseFloat(form.cost) : null })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMods(prev => [...prev, data]);
      setForm({ name: "", category: "Engine", cost: "", install_date: "", notes: "" });
      setShowForm(false);
    } catch (err) { setError(err.message); }
  }

  async function handleDelete(modId) {
    try {
      await fetch(`${API_URL}/mods/${modId}`, { method: "DELETE" });
      setMods(prev => prev.filter(m => m.id !== modId));
    } catch { setError("Failed to delete mod."); }
  }

  async function handleImageUpload(e, modId) {
    const file = e.target.files[0];
    if (!file) return;
    setImgUploading(modId);
    const form = new FormData();
    form.append("image", file);
    try {
      const res  = await fetch(`${API_URL}/mods/${modId}/image`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMods(prev => prev.map(m => m.id === modId ? { ...m, image: data.image } : m));
    } catch (err) { setError(err.message); }
    finally { setImgUploading(null); if (imgRefs.current[modId]) imgRefs.current[modId].value = ""; }
  }

  const totalCost = mods.reduce((s, m) => s + (parseFloat(m.cost) || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>

      {/* Header bar */}
      <div className="win-panel" style={{ padding: 0 }}>
        <div className="win-title-bar" style={{ justifyContent: "space-between" }}>
          <span>🔧 Modifications ({mods.length} installed)</span>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {totalCost > 0 && (
              <span className="win-counter" style={{ fontSize: "12px" }}>
                💰 Total: ${totalCost.toFixed(2)}
              </span>
            )}
            <button className="win-btn" onClick={() => setShowForm(f => !f)}>
              {showForm ? "[ Cancel ]" : "[ + Add Mod ]"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: "#FF0000", color: "#fff", padding: "3px 8px", fontSize: "11px", fontWeight: "bold" }}>
          ⚠ {error}
        </div>
      )}

      {/* Add mod form */}
      {showForm && (
        <div className="win-panel win-inset" style={{ padding: "8px" }}>
          <div style={{ fontWeight: "bold", marginBottom: "6px", fontSize: "12px" }}>📦 Add Modification</div>
          <form onSubmit={handleAdd} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <label style={{ fontSize: "11px" }}>Mod Name *</label>
              <input className="win-input" required
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <label style={{ fontSize: "11px" }}>Category</label>
              <select className="win-select"
                value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <label style={{ fontSize: "11px" }}>Cost ($)</label>
              <input className="win-input" type="number" step="0.01" min="0"
                value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <label style={{ fontSize: "11px" }}>Install Date</label>
              <input className="win-input" type="date"
                value={form.install_date} onChange={e => setForm(f => ({ ...f, install_date: e.target.value }))} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", gridColumn: "span 2" }}>
              <label style={{ fontSize: "11px" }}>Notes</label>
              <textarea className="win-input" rows={2}
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                style={{ resize: "vertical", fontFamily: "inherit" }} />
            </div>
            <div style={{ gridColumn: "span 2", textAlign: "right" }}>
              <button className="win-btn win-btn-primary" type="submit">[ Save Mod ]</button>
            </div>
          </form>
        </div>
      )}

      {/* Mod cards grid */}
      {mods.length === 0 ? (
        <div className="win-inset" style={{ padding: "20px", textAlign: "center", color: "#808080", fontSize: "12px" }}>
          No mods added yet. Click [+ Add Mod] to get started!
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "8px" }}>
          {mods.map(mod => (
            <div key={mod.id} className="win-panel" style={{ padding: 0 }}>
              {/* Card title bar */}
              <div className="win-title-bar" style={{ justifyContent: "space-between", fontSize: "11px" }}>
                <span>{CAT_ICON[mod.category] ?? "📦"} {mod.category}</span>
                <button
                  className="win-btn"
                  style={{ minWidth: "auto", padding: "0 5px", fontSize: "10px", color: "#FF0000", fontWeight: "bold" }}
                  onClick={() => handleDelete(mod.id)}
                >✕</button>
              </div>

              {/* Mod image */}
              <div
                className="win-inset"
                style={{
                  margin: "4px", height: "100px", background: "#000", overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", position: "relative"
                }}
                onClick={() => !imgUploading && imgRefs.current[mod.id]?.click()}
              >
                {mod.image ? (
                  <img
                    src={`${API_URL}${mod.image}`}
                    alt={mod.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ color: "#808080", fontSize: "11px" }}>
                    {imgUploading === mod.id ? "Uploading…" : "📷 Add Photo"}
                  </span>
                )}
                {mod.image && (
                  <div style={{
                    position: "absolute", bottom: 0, right: 0,
                    background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: "10px", padding: "1px 4px"
                  }}>✏️</div>
                )}
                <input
                  ref={el => { imgRefs.current[mod.id] = el; }}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={e => handleImageUpload(e, mod.id)}
                />
              </div>

              {/* Mod info */}
              <div style={{ padding: "4px 6px", fontSize: "11px", display: "flex", flexDirection: "column", gap: "2px" }}>
                <div style={{ fontWeight: "bold", fontSize: "12px" }}>{mod.name}</div>
                {mod.cost && (
                  <div>💰 <span style={{ color: "#008000", fontWeight: "bold" }}>${parseFloat(mod.cost).toFixed(2)}</span></div>
                )}
                {mod.install_date && (
                  <div>📅 {new Date(mod.install_date).toLocaleDateString()}</div>
                )}
                {mod.notes && (
                  <div style={{ color: "#555", marginTop: "2px", borderTop: "1px solid #808080", paddingTop: "2px" }}>
                    {mod.notes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
