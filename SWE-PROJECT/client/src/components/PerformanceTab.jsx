import { useState, useEffect } from "react";
import API_URL from "../api/config";

const RUN_TYPES = ["Dyno", "Drag", "Autocross", "Street"];

function MiniBarChart({ data, valueKey, labelKey, color = "#000080", unit = "" }) {
  if (!data.length) return null;
  const vals = data.map(d => Number(d[valueKey]) || 0).filter(v => v > 0);
  if (!vals.length) return null;
  const max = Math.max(...vals);
  const H = 80, BAR_W = Math.max(28, Math.min(60, Math.floor(500 / data.length)));
  const w = BAR_W * data.length;
  return (
    <svg width={w} height={H + 36} style={{ display: "block", overflow: "visible" }}>
      {data.map((d, i) => {
        const val = Number(d[valueKey]) || 0;
        const bh = max > 0 ? (val / max) * H : 0;
        const x = i * BAR_W;
        return (
          <g key={i}>
            <rect x={x + 2} y={H - bh} width={BAR_W - 4} height={bh} fill={color} />
            {val > 0 && <text x={x + BAR_W / 2} y={H - bh - 3} textAnchor="middle" fontSize="9" fill={color} fontWeight="bold">{val}{unit}</text>}
            <text x={x + BAR_W / 2} y={H + 14} textAnchor="middle" fontSize="9" fill="#555">{d[labelKey]}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function PerformanceTab({ vehicleId, isOwner }) {
  const [runs,     setRuns]     = useState([]);
  const [tracks,   setTracks]   = useState([]);
  const [section,  setSection]  = useState("dyno"); // "dyno" | "track"
  const [error,    setError]    = useState("");
  const [showForm, setShowForm] = useState(false);

  const [runForm, setRunForm] = useState({
    run_type: "Dyno", date: today(), hp: "", tq: "", zero_sixty: "", quarter_et: "", quarter_mph: "", boost_psi: "", notes: "",
  });
  const [trackForm, setTrackForm] = useState({
    date: today(), track: "", event_type: "Track Day", best_lap: "", conditions: "Dry", notes: "",
  });

  useEffect(() => {
    fetch(`${API_URL}/performance?vehicle_id=${vehicleId}`).then(r => r.json()).then(d => setRuns(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`${API_URL}/trackdays?vehicle_id=${vehicleId}`).then(r => r.json()).then(d => setTracks(Array.isArray(d) ? d : [])).catch(() => {});
  }, [vehicleId]);

  async function handleAddRun(e) {
    e.preventDefault(); setError("");
    try {
      const res  = await fetch(`${API_URL}/performance`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicle_id: vehicleId, ...runForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRuns(prev => [data, ...prev]);
      setRunForm({ run_type: "Dyno", date: today(), hp: "", tq: "", zero_sixty: "", quarter_et: "", quarter_mph: "", boost_psi: "", notes: "" });
      setShowForm(false);
    } catch (err) { setError(err.message); }
  }

  async function handleAddTrack(e) {
    e.preventDefault(); setError("");
    try {
      const res  = await fetch(`${API_URL}/trackdays`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicle_id: vehicleId, ...trackForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTracks(prev => [data, ...prev]);
      setTrackForm({ date: today(), track: "", event_type: "Track Day", best_lap: "", conditions: "Dry", notes: "" });
      setShowForm(false);
    } catch (err) { setError(err.message); }
  }

  async function deleteRun(id) {
    if (!confirm("Delete this run?")) return;
    await fetch(`${API_URL}/performance/${id}`, { method: "DELETE" });
    setRuns(prev => prev.filter(r => r.id !== id));
  }

  async function deleteTrack(id) {
    if (!confirm("Delete this event?")) return;
    await fetch(`${API_URL}/trackdays/${id}`, { method: "DELETE" });
    setTracks(prev => prev.filter(t => t.id !== id));
  }

  // Best stats
  const bestHP  = runs.filter(r => r.hp).reduce((m, r) => Math.max(m, r.hp), 0);
  const bestTQ  = runs.filter(r => r.tq).reduce((m, r) => Math.max(m, r.tq), 0);
  const best060 = runs.filter(r => r.zero_sixty).reduce((m, r) => Math.min(m, r.zero_sixty), 999);
  const bestQET = runs.filter(r => r.quarter_et).reduce((m, r) => Math.min(m, r.quarter_et), 999);

  const chartRuns = [...runs].reverse().slice(-8); // oldest→newest, last 8

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>

      {/* Sub-nav */}
      <div style={{ display: "flex", gap: "4px", borderBottom: "2px solid #808080", paddingBottom: "2px" }}>
        {[["dyno", "🏎 Dyno & Drag"], ["track", "🏁 Track Days"]].map(([k, l]) => (
          <button key={k} className="win-btn"
            style={{ minWidth: "unset", padding: "3px 12px", background: section === k ? "#000080" : "#C0C0C0", color: section === k ? "#fff" : "#000" }}
            onClick={() => { setSection(k); setShowForm(false); }}>
            {l}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {isOwner && (
        <button className="win-btn" style={{ minWidth: "unset", padding: "3px 10px" }}
          onClick={() => setShowForm(f => !f)}>
          {showForm ? "[ Cancel ]" : "[ + Add ]"}
        </button>
        )}
      </div>

      {error && <div style={{ background: "#FF0000", color: "#fff", padding: "3px 8px", fontWeight: "bold", fontSize: "12px" }}>⚠ {error}</div>}

      {/* ── DYNO / DRAG ── */}
      {section === "dyno" && (
        <>
          {/* Best numbers strip */}
          {runs.length > 0 && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {bestHP  > 0 && <StatBadge label="PEAK HP"   value={`${bestHP} hp`}  color="#000080" />}
              {bestTQ  > 0 && <StatBadge label="PEAK TQ"   value={`${bestTQ} lb-ft`} color="#006400" />}
              {best060 < 999 && <StatBadge label="BEST 0-60" value={`${best060}s`}  color="#8B0000" />}
              {bestQET < 999 && <StatBadge label="BEST ¼ MI" value={`${bestQET}s`}  color="#4B0082" />}
            </div>
          )}

          {/* HP chart */}
          {chartRuns.some(r => r.hp) && (
            <div className="win-panel" style={{ padding: "8px" }}>
              <div style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "6px", color: "#000080" }}>📈 HP PROGRESSION</div>
              <div style={{ overflowX: "auto" }}>
                <MiniBarChart data={chartRuns} valueKey="hp" labelKey="date" color="#000080" unit="hp" />
              </div>
            </div>
          )}

          {showForm && (
            <div className="win-panel" style={{ padding: 0 }}>
              <div className="win-title-bar"><span>➕ Log Performance Run</span></div>
              <form onSubmit={handleAddRun} style={{ padding: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Type</label>
                  <select className="win-select" value={runForm.run_type} onChange={e => setRunForm(f => ({ ...f, run_type: e.target.value }))}>
                    {RUN_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Date *</label>
                  <input className="win-input" type="date" value={runForm.date} onChange={e => setRunForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>HP (whp)</label>
                  <input className="win-input" type="number" step="0.1" placeholder="e.g. 320" value={runForm.hp} onChange={e => setRunForm(f => ({ ...f, hp: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>TQ (lb-ft)</label>
                  <input className="win-input" type="number" step="0.1" placeholder="e.g. 280" value={runForm.tq} onChange={e => setRunForm(f => ({ ...f, tq: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>0-60 (sec)</label>
                  <input className="win-input" type="number" step="0.01" placeholder="e.g. 5.2" value={runForm.zero_sixty} onChange={e => setRunForm(f => ({ ...f, zero_sixty: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>¼ Mile ET (sec)</label>
                  <input className="win-input" type="number" step="0.01" placeholder="e.g. 13.4" value={runForm.quarter_et} onChange={e => setRunForm(f => ({ ...f, quarter_et: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>¼ Mile MPH</label>
                  <input className="win-input" type="number" step="0.1" placeholder="e.g. 105" value={runForm.quarter_mph} onChange={e => setRunForm(f => ({ ...f, quarter_mph: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Boost (psi)</label>
                  <input className="win-input" type="number" step="0.1" placeholder="e.g. 18" value={runForm.boost_psi} onChange={e => setRunForm(f => ({ ...f, boost_psi: e.target.value }))} />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Notes</label>
                  <input className="win-input" placeholder="Conditions, tune, etc." value={runForm.notes} onChange={e => setRunForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <div style={{ gridColumn: "span 2", textAlign: "right" }}>
                  <button type="submit" className="win-btn win-btn-primary">[ Log Run ]</button>
                </div>
              </form>
            </div>
          )}

          <div className="win-panel" style={{ padding: 0 }}>
            <div className="win-title-bar"><span>📊 Performance Runs ({runs.length})</span></div>
            {runs.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#808080", fontSize: "12px" }}>No runs logged yet.</div>
            ) : (
              <div className="win-inset" style={{ overflowX: "auto" }}>
                <table className="win-table" style={{ width: "100%" }}>
                  <thead>
                    <tr><th>Date</th><th>Type</th><th>HP</th><th>TQ</th><th>0-60</th><th>¼ ET</th><th>¼ MPH</th><th>Boost</th><th>Notes</th><th>🗑</th></tr>
                  </thead>
                  <tbody>
                    {runs.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontFamily: "Courier New", fontSize: "11px", whiteSpace: "nowrap" }}>{r.date}</td>
                        <td><span style={{ background: "#000080", color: "#fff", fontSize: "10px", padding: "1px 4px" }}>{r.run_type}</span></td>
                        <td style={{ fontWeight: "bold", color: "#000080" }}>{r.hp ? `${r.hp}hp` : "—"}</td>
                        <td>{r.tq ? `${r.tq} lb-ft` : "—"}</td>
                        <td>{r.zero_sixty ? `${r.zero_sixty}s` : "—"}</td>
                        <td>{r.quarter_et ? `${r.quarter_et}s` : "—"}</td>
                        <td>{r.quarter_mph ? `${r.quarter_mph} mph` : "—"}</td>
                        <td>{r.boost_psi ? `${r.boost_psi} psi` : "—"}</td>
                        <td style={{ fontSize: "11px", color: "#808080", fontStyle: "italic" }}>{r.notes || "—"}</td>
                        {isOwner && <td><button className="win-btn" style={{ fontSize: "10px", padding: "1px 4px", minWidth: "auto", color: "#CC0000" }} onClick={() => deleteRun(r.id)}>🗑</button></td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── TRACK DAYS ── */}
      {section === "track" && (
        <>
          {showForm && (
            <div className="win-panel" style={{ padding: 0 }}>
              <div className="win-title-bar"><span>➕ Log Track Event</span></div>
              <form onSubmit={handleAddTrack} style={{ padding: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Date *</label>
                  <input className="win-input" type="date" value={trackForm.date} onChange={e => setTrackForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Track / Venue *</label>
                  <input className="win-input" placeholder="e.g. Laguna Seca" value={trackForm.track} onChange={e => setTrackForm(f => ({ ...f, track: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Event Type</label>
                  <select className="win-select" value={trackForm.event_type} onChange={e => setTrackForm(f => ({ ...f, event_type: e.target.value }))}>
                    {["Track Day", "Autocross", "Drag", "Road Course", "Hill Climb", "Drift"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Best Lap Time</label>
                  <input className="win-input" placeholder="e.g. 1:23.456" value={trackForm.best_lap} onChange={e => setTrackForm(f => ({ ...f, best_lap: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Conditions</label>
                  <select className="win-select" value={trackForm.conditions} onChange={e => setTrackForm(f => ({ ...f, conditions: e.target.value }))}>
                    {["Dry", "Wet", "Mixed", "Hot", "Cold"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Notes</label>
                  <input className="win-input" placeholder="Setup, impressions..." value={trackForm.notes} onChange={e => setTrackForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <div style={{ gridColumn: "span 2", textAlign: "right" }}>
                  <button type="submit" className="win-btn win-btn-primary">[ Log Event ]</button>
                </div>
              </form>
            </div>
          )}

          <div className="win-panel" style={{ padding: 0 }}>
            <div className="win-title-bar"><span>🏁 Track Events ({tracks.length})</span></div>
            {tracks.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#808080", fontSize: "12px" }}>No track events logged yet.</div>
            ) : (
              <div className="win-inset" style={{ overflowX: "auto" }}>
                <table className="win-table" style={{ width: "100%" }}>
                  <thead>
                    <tr><th>Date</th><th>Track</th><th>Type</th><th>Best Lap</th><th>Conditions</th><th>Notes</th><th>🗑</th></tr>
                  </thead>
                  <tbody>
                    {tracks.map(t => (
                      <tr key={t.id}>
                        <td style={{ fontFamily: "Courier New", fontSize: "11px", whiteSpace: "nowrap" }}>{t.date}</td>
                        <td style={{ fontWeight: "bold" }}>{t.track}</td>
                        <td><span style={{ background: "#4B0082", color: "#fff", fontSize: "10px", padding: "1px 4px" }}>{t.event_type}</span></td>
                        <td style={{ fontWeight: "bold", color: "#000080", fontFamily: "Courier New" }}>{t.best_lap || "—"}</td>
                        <td>{t.conditions}</td>
                        <td style={{ fontSize: "11px", color: "#808080", fontStyle: "italic" }}>{t.notes || "—"}</td>
                        {isOwner && <td><button className="win-btn" style={{ fontSize: "10px", padding: "1px 4px", minWidth: "auto", color: "#CC0000" }} onClick={() => deleteTrack(t.id)}>🗑</button></td>}
                      </tr>
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

function StatBadge({ label, value, color }) {
  return (
    <div className="win-inset" style={{ padding: "6px 12px", textAlign: "center", background: "#fff", minWidth: "90px" }}>
      <div style={{ fontSize: "9px", color: "#808080", fontWeight: "bold", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontFamily: "Courier New", fontWeight: "bold", fontSize: "15px", color }}>{value}</div>
    </div>
  );
}

function today() { return new Date().toISOString().slice(0, 10); }
