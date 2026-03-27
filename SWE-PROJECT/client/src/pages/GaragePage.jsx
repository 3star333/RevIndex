import { useState, useEffect } from "react";
import API_URL from "../api/config";

export default function GaragePage({ onOpenThread }) {
  const [threads, setThreads]   = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError]       = useState("");
  const [form, setForm]         = useState({ vehicle_id: "", title: "", description: "" });

  useEffect(() => { fetchThreads(); fetchVehicles(); }, []);

  async function fetchThreads() {
    try {
      const res  = await fetch(`${API_URL}/threads`);
      const data = await res.json();
      setThreads(Array.isArray(data) ? data : []);
    } catch { setError("Failed to load threads."); }
  }

  async function fetchVehicles() {
    try {
      const res  = await fetch(`${API_URL}/vehicles`);
      const data = await res.json();
      setVehicles(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    if (!form.vehicle_id || !form.title) return setError("Vehicle and title are required.");
    try {
      const res  = await fetch(`${API_URL}/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm({ vehicle_id: "", title: "", description: "" });
      setShowForm(false);
      fetchThreads();
    } catch (err) { setError(err.message); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

      {/* Board header */}
      <div className="win-panel" style={{ padding: 0 }}>
        <div className="win-title-bar" style={{ justifyContent: "space-between" }}>
          <span>🔧 THE GARAGE — Build Threads &amp; Discussion</span>
          <button className="win-btn" onClick={() => setShowForm(f => !f)}>
            {showForm ? "[ Cancel ]" : "[ + New Build Thread ]"}
          </button>
        </div>
        <div style={{ padding: "4px 8px", background: "#000080", color: "#fff", fontSize: "11px" }}>
          <span className="blink">★</span> Welcome to The Garage! Post your build threads, mods, and projects.
          <span className="blink"> ★</span>
        </div>
      </div>

      {error && (
        <div style={{ background: "#FF0000", color: "#fff", padding: "3px 8px", fontSize: "11px", fontWeight: "bold" }}>
          ⚠ {error}
        </div>
      )}

      {/* New thread form */}
      {showForm && (
        <div className="win-panel" style={{ padding: 0 }}>
          <div className="win-title-bar"><span>📝 Start a New Build Thread</span></div>
          <div style={{ padding: "10px" }}>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Vehicle *</label>
                <select
                  className="win-select"
                  style={{ width: "100%" }}
                  value={form.vehicle_id}
                  onChange={e => setForm(f => ({ ...f, vehicle_id: e.target.value }))}
                >
                  <option value="">-- Select Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.year} {v.make} {v.model}{v.nickname ? ` "${v.nickname}"` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Thread Title *</label>
                <input
                  className="win-input" style={{ width: "100%" }}
                  placeholder="e.g. My Civic Build — Road to 400whp"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Opening Post</label>
                <textarea
                  className="win-input"
                  rows={4}
                  style={{ width: "100%", resize: "vertical", fontFamily: "inherit" }}
                  placeholder="Describe your build, goals, mods so far..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div style={{ textAlign: "right" }}>
                <button type="submit" className="win-btn win-btn-primary">[ Post Thread ]</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Thread list table */}
      <div className="win-panel" style={{ padding: 0 }}>
        <div className="win-title-bar">
          <span>📋 Build Threads ({threads.length} total)</span>
        </div>
        {threads.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#808080", fontSize: "12px" }}>
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>🔧</div>
            No build threads yet. Be the first to post!
            <br />
            <button className="win-btn" style={{ marginTop: "10px" }} onClick={() => setShowForm(true)}>
              [ Start a Build Thread ]
            </button>
          </div>
        ) : (
          <div className="win-inset" style={{ overflow: "auto" }}>
            <table className="win-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ width: "40px" }}></th>
                  <th style={{ textAlign: "left" }}>Thread / Vehicle</th>
                  <th style={{ width: "70px" }}>Replies</th>
                  <th style={{ width: "120px" }}>Last Post</th>
                </tr>
              </thead>
              <tbody>
                {threads.map(t => (
                  <tr
                    key={t.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => onOpenThread(t)}
                  >
                    <td style={{ textAlign: "center" }}>
                      {t.vehicle_image ? (
                        <img
                          src={`${API_URL}${t.vehicle_image}`}
                          alt=""
                          style={{ width: "36px", height: "36px", objectFit: "cover", border: "2px inset #808080", display: "block" }}
                        />
                      ) : (
                        <div style={{ width: "36px", height: "36px", background: "#808080", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                          🚗
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: "bold", color: "#000080", textDecoration: "underline" }}>
                        {t.title}
                      </div>
                      <div style={{ fontSize: "11px", color: "#808080" }}>
                        {t.year} {t.make} {t.model}
                        {t.nickname ? ` "${t.nickname}"` : ""}
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className="win-counter" style={{ fontSize: "11px" }}>
                        {t.reply_count || 0}
                      </span>
                    </td>
                    <td style={{ fontSize: "11px", color: "#808080" }}>
                      {t.last_reply
                        ? new Date(t.last_reply).toLocaleDateString()
                        : new Date(t.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* phpBB-style footer */}
      <div style={{ textAlign: "center", fontSize: "11px", color: "#808080", padding: "4px" }}>
        Powered by GarageBoard™ v1.0 — Est. 2024 — All times UTC
      </div>
    </div>
  );
}
