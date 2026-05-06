import { useState, useEffect } from "react";
import API_URL from "../api/config";

const EVENT_TYPES = ["Track Day", "Autocross", "Drag", "Canyon Run", "Other"];
const CONDITIONS   = ["Dry", "Wet", "Mixed", "Damp", "Cold", "Hot"];

export default function TrackDaysTab({ vehicleId, isOwner }) {
  const [days,     setDays]     = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error,    setError]    = useState("");
  const [form,     setForm]     = useState({ event_type: "Track Day", track_name: "", date: today(), best_lap: "", conditions: "Dry", notes: "" });

  useEffect(() => {
    fetch(`${API_URL}/trackdays?vehicle_id=${vehicleId}`)
      .then(r => r.json()).then(d => setDays(Array.isArray(d) ? d : [])).catch(() => {});
  }, [vehicleId]);

  async function handleAdd(e) {
    e.preventDefault(); setError("");
    try {
      const res  = await fetch(`${API_URL}/trackdays`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicle_id: vehicleId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDays(prev => [data, ...prev]);
      setForm({ event_type: "Track Day", track_name: "", date: today(), best_lap: "", conditions: "Dry", notes: "" });
      setShowForm(false);
    } catch (err) { setError(err.message); }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this track day entry?")) return;
    await fetch(`${API_URL}/trackdays/${id}`, { method: "DELETE" });
    setDays(prev => prev.filter(d => d.id !== id));
  }

  // Best lap across all sessions (fastest time = lowest string sort for mm:ss.ms format)
  const withLap = days.filter(d => d.best_lap);
  const bestLap = withLap.length ? withLap.reduce((b, d) => d.best_lap < b.best_lap ? d : b, withLap[0]) : null;

  const EVENT_ICONS = { "Track Day": "🏁", "Autocross": "🚧", "Drag": "🚦", "Canyon Run": "🏔", "Other": "🔵" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>

      {/* Stats */}
      {days.length > 0 && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <StatBadge label="SESSIONS" value={days.length} color="#000080" />
          {bestLap && (
            <StatBadge label="BEST LAP" value={bestLap.best_lap} color="#006400" sub={bestLap.track_name || ""} />
          )}
          <StatBadge label="TRACKS" value={new Set(days.map(d => d.track_name).filter(Boolean)).size} color="#4B0082" />
        </div>
      )}

      {/* Add button */}
      {isOwner && (
      <div style={{ textAlign: "right" }}>
        <button className="win-btn" onClick={() => setShowForm(f => !f)}>{showForm ? "[ Cancel ]" : "[ + Log Session ]"}</button>
      </div>
      )}

      {error && <div style={{ background: "#FF0000", color: "#fff", padding: "3px 8px", fontWeight: "bold", fontSize: "12px" }}>⚠ {error}</div>}

      {showForm && (
        <div className="win-panel" style={{ padding: 0 }}>
          <div className="win-title-bar"><span>🏁 Log Track Day</span></div>
          <form onSubmit={handleAdd} style={{ padding: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Event Type *</label>
              <select className="win-input" value={form.event_type} onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))}>
                {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Date *</label>
              <input className="win-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Track / Venue Name</label>
              <input className="win-input" placeholder="e.g. Watkins Glen" value={form.track_name} onChange={e => setForm(f => ({ ...f, track_name: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Best Lap / Time</label>
              <input className="win-input" placeholder="e.g. 1:43.250 or 11.8s" value={form.best_lap} onChange={e => setForm(f => ({ ...f, best_lap: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Conditions</label>
              <select className="win-input" value={form.conditions} onChange={e => setForm(f => ({ ...f, conditions: e.target.value }))}>
                {CONDITIONS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Notes</label>
              <input className="win-input" placeholder="Setup changes, tires, etc." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div style={{ gridColumn: "span 2", textAlign: "right" }}>
              <button type="submit" className="win-btn win-btn-primary">[ Log Session ]</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="win-panel" style={{ padding: 0 }}>
        <div className="win-title-bar"><span>🏁 Track Day Log ({days.length} sessions)</span></div>
        {days.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#808080", fontSize: "12px" }}>No sessions logged yet.</div>
        ) : (
          <div className="win-inset" style={{ overflowX: "auto" }}>
            <table className="win-table" style={{ width: "100%" }}>
              <thead>
                <tr><th>Date</th><th>Event</th><th>Track / Venue</th><th>Best Time</th><th>Conditions</th><th>Notes</th><th>🗑</th></tr>
              </thead>
              <tbody>
                {days.map(day => {
                  const isBest = bestLap && day.id === bestLap.id && day.best_lap;
                  return (
                    <tr key={day.id}>
                      <td style={{ fontFamily: "Courier New", fontSize: "11px", whiteSpace: "nowrap" }}>{day.date}</td>
                      <td>
                        <span>{EVENT_ICONS[day.event_type] || "🔵"} {day.event_type}</span>
                      </td>
                      <td style={{ fontWeight: "bold" }}>{day.track_name || "—"}</td>
                      <td style={{ fontFamily: "Courier New", fontWeight: "bold", color: isBest ? "#006400" : "#000080" }}>
                        {day.best_lap || "—"} {isBest && <span title="Best lap!" style={{ color: "#006400" }}>★</span>}
                      </td>
                      <td>
                        <ConditionBadge cond={day.conditions} />
                      </td>
                      <td style={{ fontSize: "11px", color: "#808080", fontStyle: "italic" }}>{day.notes || "—"}</td>
                      {isOwner && <td><button className="win-btn" style={{ fontSize: "10px", padding: "1px 4px", minWidth: "auto", color: "#CC0000" }} onClick={() => handleDelete(day.id)}>🗑</button></td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ConditionBadge({ cond }) {
  const colors = { Dry: "#006400", Wet: "#000080", Mixed: "#4B0082", Damp: "#005580", Cold: "#8B0000", Hot: "#CC5500" };
  return (
    <span style={{ background: colors[cond] || "#808080", color: "#fff", padding: "1px 6px", fontSize: "10px", fontWeight: "bold" }}>
      {cond || "—"}
    </span>
  );
}

function StatBadge({ label, value, color, sub }) {
  return (
    <div className="win-inset" style={{ padding: "6px 12px", textAlign: "center", background: "#fff", minWidth: "90px" }}>
      <div style={{ fontSize: "9px", color: "#808080", fontWeight: "bold", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontFamily: "Courier New", fontWeight: "bold", fontSize: "15px", color }}>{value}</div>
      {sub && <div style={{ fontSize: "9px", color: "#808080" }}>{sub}</div>}
    </div>
  );
}

function today() { return new Date().toISOString().slice(0, 10); }
