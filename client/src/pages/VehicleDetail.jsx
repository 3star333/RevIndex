import { useState, useEffect, useRef } from "react";
import API_URL from "../api/config";
import ImageUpload from "../components/ImageUpload";
import PhotoGallery from "../components/PhotoGallery";
import ModsTab from "../components/ModsTab";

const TABS = ["Overview", "Photos", "Mods", "Maintenance"];

export default function VehicleDetail({ vehicle: initialVehicle, onBack }) {
  const [vehicle, setVehicle] = useState(initialVehicle);
  const [tab, setTab]         = useState("Overview");
  const [logs, setLogs]       = useState([]);
  const [form, setForm]       = useState({ type: "", cost: "", mileage: "", notes: "", date: today() });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  // Log photos state
  const [logPhotos, setLogPhotos]               = useState({});
  const [expandedLogPhotos, setExpandedLogPhotos] = useState({});
  const [uploadingLogPhoto, setUploadingLogPhoto] = useState(null);
  const logPhotoRefs = useRef({});

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchLogs(); }, [vehicle.id]);

  async function fetchLogs() {
    try {
      const res  = await fetch(`${API_URL}/vehicles/${vehicle.id}/logs`);
      const data = await res.json();
      setLogs(data);
    } catch { setError("Failed to load logs."); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.type || !form.cost || !form.mileage || !form.date) {
      return setError("Type, cost, mileage, and date are required.");
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/logs`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_id: vehicle.id,
          type:       form.type,
          cost:       Number(form.cost),
          mileage:    Number(form.mileage),
          notes:      form.notes || null,
          date:       form.date,
        }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error);
      setLogs(prev => [data, ...prev]);
      setForm({ type: "", cost: "", mileage: "", notes: "", date: today() });
    } catch { setError("Failed to add log."); }
    finally { setLoading(false); }
  }

  async function toggleLogPhotos(logId) {
    setExpandedLogPhotos(prev => ({ ...prev, [logId]: !prev[logId] }));
    if (!logPhotos[logId]) {
      try {
        const res  = await fetch(`${API_URL}/photos/logs/${logId}/photos`);
        const data = await res.json();
        setLogPhotos(prev => ({ ...prev, [logId]: Array.isArray(data) ? data : [] }));
      } catch { /* silent */ }
    }
  }

  async function handleLogPhotoUpload(e, logId) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingLogPhoto(logId);
    const fd = new FormData();
    fd.append("image", file);
    try {
      const res  = await fetch(`${API_URL}/photos/logs/${logId}/photos`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLogPhotos(prev => ({ ...prev, [logId]: [...(prev[logId] || []), data] }));
    } catch (err) { setError(err.message); }
    finally {
      setUploadingLogPhoto(null);
      if (logPhotoRefs.current[logId]) logPhotoRefs.current[logId].value = "";
    }
  }

  async function handleDeleteLog(logId) {
    if (!confirm("Delete this log entry?")) return;
    try {
      const res = await fetch(`${API_URL}/logs/${logId}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setLogs(prev => prev.filter(l => l.id !== logId));
      setLogPhotos(prev => { const n = { ...prev }; delete n[logId]; return n; });
    } catch (err) { setError(err.message); }
  }

  const totalCost = logs.reduce((sum, l) => sum + Number(l.cost), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "860px" }}>

      {/* Back */}
      <div>
        <button className="win-btn" onClick={onBack}>← Back to Vehicles</button>
      </div>

      {/* Vehicle info header */}
      <div className="win-panel" style={{ padding: "0" }}>
        <div className="win-title-bar" style={{ justifyContent: "space-between" }}>
          <span>🚗 {vehicle.year} {vehicle.make} {vehicle.model}</span>
          {vehicle.nickname && (
            <span style={{ fontStyle: "italic", opacity: 0.9 }}>&quot;{vehicle.nickname}&quot;</span>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "0" }}>
          <div style={{ borderRight: "2px solid #808080", padding: "8px" }}>
            <ImageUpload
              vehicleId={vehicle.id}
              currentImage={vehicle.image}
              onUpload={(img) => setVehicle(v => ({ ...v, image: img }))}
            />
          </div>
          <div style={{ padding: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div>
              <div style={{ fontSize: "11px", color: "#808080", marginBottom: "2px" }}>VEHICLE ID</div>
              <span className="win-counter">#{String(vehicle.id).padStart(4, "0")}</span>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "#808080", marginBottom: "2px" }}>TOTAL LOGS</div>
              <span className="win-counter">{String(logs.length).padStart(4, "0")}</span>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "#808080", marginBottom: "2px" }}>TOTAL SPENT</div>
              <span className="win-counter">${totalCost.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab strip */}
      <div style={{ display: "flex", gap: "2px", borderBottom: "2px solid #808080" }}>
        {TABS.map(t => (
          <button
            key={t}
            className="win-btn"
            onClick={() => setTab(t)}
            style={{
              background: t === tab ? "#C0C0C0" : "#808080",
              color: t === tab ? "#000" : "#fff",
              fontWeight: t === tab ? "bold" : "normal",
              position: "relative", top: "2px",
              zIndex: t === tab ? 1 : 0,
            }}
          >
            {t === "Overview" ? "🏁 " : t === "Photos" ? "📷 " : t === "Mods" ? "🔧 " : "🛠 "}{t}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === "Overview" && (
        <div className="win-panel" style={{ padding: "10px", fontSize: "12px", lineHeight: "1.8" }}>
          <div><b>Make:</b> {vehicle.make}</div>
          <div><b>Model:</b> {vehicle.model}</div>
          <div><b>Year:</b> {vehicle.year}</div>
          {vehicle.nickname && <div><b>Nickname:</b> &quot;{vehicle.nickname}&quot;</div>}
          {vehicle.vin && <div><b>VIN:</b> <code style={{ fontSize: "11px" }}>{vehicle.vin}</code></div>}
          <div style={{ marginTop: "8px", color: "#808080", fontSize: "11px" }}>
            Use the tabs above to manage photos, mods, and maintenance.
          </div>
        </div>
      )}

      {/* ── Photos ── */}
      {tab === "Photos" && <PhotoGallery vehicleId={vehicle.id} />}

      {/* ── Mods ── */}
      {tab === "Mods" && <ModsTab vehicleId={vehicle.id} />}

      {/* ── Maintenance ── */}
      {tab === "Maintenance" && (
        <>
          <div className="win-panel" style={{ padding: "0" }}>
            <div className="win-title-bar"><span>🔧</span><span>Add Maintenance Log</span></div>
            <div style={{ padding: "10px" }}>
              {error && (
                <div style={{ background: "#FF0000", color: "#fff", padding: "3px 8px", fontWeight: "bold", fontSize: "12px", marginBottom: "8px" }}>
                  ⚠ {error}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ display: "block", marginBottom: "2px", fontSize: "12px" }}>Service Type * (e.g. Oil Change)</label>
                    <input className="win-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "2px", fontSize: "12px" }}>Cost ($) *</label>
                    <input className="win-input" type="number" min="0" step="0.01" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "2px", fontSize: "12px" }}>Mileage *</label>
                    <input className="win-input" type="number" min="0" value={form.mileage} onChange={e => setForm({ ...form, mileage: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "2px", fontSize: "12px" }}>Date *</label>
                    <input className="win-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "2px", fontSize: "12px" }}>Notes</label>
                    <input className="win-input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="optional" />
                  </div>
                </div>
                <div style={{ marginTop: "8px", textAlign: "right" }}>
                  <button type="submit" className="win-btn win-btn-primary" disabled={loading}>
                    {loading ? "Adding…" : "Add Log"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="win-panel" style={{ padding: "0" }}>
            <div className="win-title-bar"><span>🛠</span><span>Maintenance History ({logs.length} records)</span></div>
            {logs.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "#808080", fontSize: "12px" }}>
                No logs yet. Add your first maintenance record above.
              </div>
            ) : (
              <div className="win-inset" style={{ overflow: "auto" }}>
                <table className="win-table" style={{ width: "100%" }}>
                  <thead>
                    <tr><th>Date</th><th>Service</th><th>Mileage</th><th>Cost</th><th>Notes</th><th>📷</th><th>🗑</th></tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <>
                        <tr key={log.id}>
                          <td style={{ whiteSpace: "nowrap", fontFamily: "Courier New, monospace", fontSize: "12px" }}>{log.date}</td>
                          <td style={{ fontWeight: "bold" }}>{log.type}</td>
                          <td>{Number(log.mileage).toLocaleString()} mi</td>
                          <td style={{ fontWeight: "bold", color: "#CC0000" }}>${Number(log.cost).toFixed(2)}</td>
                          <td style={{ fontSize: "11px", color: "#808080", fontStyle: "italic" }}>{log.notes || "—"}</td>
                          <td>
                            <button
                              className="win-btn"
                              style={{ fontSize: "10px", padding: "1px 4px", minWidth: "auto" }}
                              onClick={() => toggleLogPhotos(log.id)}
                            >{expandedLogPhotos[log.id] ? "▲" : "📷"}</button>
                          </td>
                          <td>
                            <button
                              className="win-btn"
                              style={{ fontSize: "10px", padding: "1px 4px", minWidth: "auto", color: "#CC0000" }}
                              onClick={() => handleDeleteLog(log.id)}
                              title="Delete log entry"
                            >🗑</button>
                          </td>
                        </tr>
                        {expandedLogPhotos[log.id] && (
                          <tr key={`${log.id}-photos`}>
                            <td colSpan={7} style={{ padding: "4px 8px", background: "#e8e8e8" }}>
                              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center" }}>
                                {(logPhotos[log.id] || []).map(p => (
                                  <img key={p.id} src={`${API_URL}${p.path}`} alt="log"
                                    style={{ width: "60px", height: "60px", objectFit: "cover", border: "2px inset #808080" }} />
                                ))}
                                <input
                                  ref={el => { logPhotoRefs.current[log.id] = el; }}
                                  type="file" accept="image/*" style={{ display: "none" }}
                                  onChange={e => handleLogPhotoUpload(e, log.id)}
                                />
                                <button
                                  className="win-btn"
                                  style={{ fontSize: "10px", padding: "1px 5px", minWidth: "auto" }}
                                  disabled={uploadingLogPhoto === log.id}
                                  onClick={() => logPhotoRefs.current[log.id]?.click()}
                                >{uploadingLogPhoto === log.id ? "…" : "+ Photo"}</button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
