import { useState, useEffect } from "react";
import API_URL from "../api/config";

function MpgBarChart({ data }) {
  if (data.length < 2) return null;
  const mpgValues = data.slice(1).map((d, i) => {
    const miles = d.mileage - data[i].mileage;
    return miles > 0 ? parseFloat((miles / d.gallons).toFixed(1)) : null;
  }).filter(v => v !== null && v > 0 && v < 150);
  if (!mpgValues.length) return null;

  const max = Math.max(...mpgValues);
  const H = 80, BAR_W = Math.max(28, Math.min(60, Math.floor(500 / mpgValues.length)));
  const avg = (mpgValues.reduce((a, b) => a + b, 0) / mpgValues.length).toFixed(1);
  const w = BAR_W * mpgValues.length;

  return (
    <div>
      <div style={{ fontSize: "11px", color: "#808080", marginBottom: "4px" }}>
        Avg MPG: <strong style={{ color: "#006400" }}>{avg}</strong>
      </div>
      <div style={{ overflowX: "auto" }}>
        <svg width={w} height={H + 36} style={{ display: "block", overflow: "visible" }}>
          {mpgValues.map((v, i) => {
            const bh = max > 0 ? (v / max) * H : 0;
            const x = i * BAR_W;
            const color = v >= avg * 1.1 ? "#006400" : v <= avg * 0.9 ? "#8B0000" : "#000080";
            return (
              <g key={i}>
                <rect x={x + 2} y={H - bh} width={BAR_W - 4} height={bh} fill={color} />
                <text x={x + BAR_W / 2} y={H - bh - 3} textAnchor="middle" fontSize="9" fill={color} fontWeight="bold">{v}</text>
                <text x={x + BAR_W / 2} y={H + 14} textAnchor="middle" fontSize="9" fill="#555">#{i + 2}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default function FuelTab({ vehicleId }) {
  const [logs,     setLogs]     = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error,    setError]    = useState("");
  const [form,     setForm]     = useState({ date: today(), gallons: "", price_per_gal: "", mileage: "", notes: "" });

  useEffect(() => {
    fetch(`${API_URL}/fuel?vehicle_id=${vehicleId}`)
      .then(r => r.json()).then(d => setLogs(Array.isArray(d) ? d : [])).catch(() => {});
  }, [vehicleId]);

  async function handleAdd(e) {
    e.preventDefault(); setError("");
    try {
      const res  = await fetch(`${API_URL}/fuel`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicle_id: vehicleId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // keep sorted by mileage ASC
      setLogs(prev => [...prev, data].sort((a, b) => a.mileage - b.mileage));
      setForm({ date: today(), gallons: "", price_per_gal: "", mileage: "", notes: "" });
      setShowForm(false);
    } catch (err) { setError(err.message); }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this fill-up entry?")) return;
    await fetch(`${API_URL}/fuel/${id}`, { method: "DELETE" });
    setLogs(prev => prev.filter(l => l.id !== id));
  }

  // Compute MPG for each row
  function getMpg(i) {
    if (i === 0) return null;
    const miles = logs[i].mileage - logs[i - 1].mileage;
    if (miles <= 0) return null;
    return (miles / logs[i].gallons).toFixed(1);
  }

  const totalGallons = logs.reduce((s, l) => s + l.gallons, 0);
  const totalSpent   = logs.reduce((s, l) => s + l.gallons * l.price_per_gal, 0);
  const totalMiles   = logs.length > 1 ? logs[logs.length - 1].mileage - logs[0].mileage : 0;
  const overallMpg   = totalMiles > 0 ? (totalMiles / totalGallons).toFixed(1) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>

      {/* Stats bar */}
      {logs.length > 1 && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {overallMpg && <StatBadge label="OVERALL MPG" value={overallMpg} color="#006400" />}
          <StatBadge label="TOTAL GALLONS" value={totalGallons.toFixed(1)} color="#000080" />
          <StatBadge label="TOTAL FUEL $" value={`$${totalSpent.toFixed(2)}`} color="#8B0000" />
          {totalMiles > 0 && <StatBadge label="MILES TRACKED" value={totalMiles.toLocaleString()} color="#4B0082" />}
        </div>
      )}

      {/* MPG chart */}
      {logs.length > 1 && (
        <div className="win-panel" style={{ padding: "8px" }}>
          <div style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "6px", color: "#006400" }}>⛽ MPG PER FILLUP</div>
          <MpgBarChart data={logs} />
        </div>
      )}

      {/* Add form */}
      <div style={{ textAlign: "right" }}>
        <button className="win-btn" onClick={() => setShowForm(f => !f)}>{showForm ? "[ Cancel ]" : "[ + Log Fill-Up ]"}</button>
      </div>

      {error && <div style={{ background: "#FF0000", color: "#fff", padding: "3px 8px", fontWeight: "bold", fontSize: "12px" }}>⚠ {error}</div>}

      {showForm && (
        <div className="win-panel" style={{ padding: 0 }}>
          <div className="win-title-bar"><span>⛽ Log Fill-Up</span></div>
          <form onSubmit={handleAdd} style={{ padding: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Date *</label>
              <input className="win-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Odometer (miles) *</label>
              <input className="win-input" type="number" min="0" placeholder="e.g. 52000" value={form.mileage} onChange={e => setForm(f => ({ ...f, mileage: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Gallons *</label>
              <input className="win-input" type="number" step="0.001" min="0.1" placeholder="e.g. 12.5" value={form.gallons} onChange={e => setForm(f => ({ ...f, gallons: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Price / Gallon ($)</label>
              <input className="win-input" type="number" step="0.001" min="0" placeholder="e.g. 3.49" value={form.price_per_gal} onChange={e => setForm(f => ({ ...f, price_per_gal: e.target.value }))} />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Notes</label>
              <input className="win-input" placeholder="Grade, station, etc." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div style={{ gridColumn: "span 2", textAlign: "right" }}>
              <button type="submit" className="win-btn win-btn-primary">[ Log Fill-Up ]</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="win-panel" style={{ padding: 0 }}>
        <div className="win-title-bar"><span>⛽ Fuel Log ({logs.length} entries)</span></div>
        {logs.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#808080", fontSize: "12px" }}>No fill-ups logged yet.</div>
        ) : (
          <div className="win-inset" style={{ overflowX: "auto" }}>
            <table className="win-table" style={{ width: "100%" }}>
              <thead>
                <tr><th>#</th><th>Date</th><th>Odometer</th><th>Gallons</th><th>$/Gal</th><th>Fillup Cost</th><th>MPG</th><th>Notes</th><th>🗑</th></tr>
              </thead>
              <tbody>
                {logs.map((l, i) => {
                  const mpg = getMpg(i);
                  return (
                    <tr key={l.id}>
                      <td style={{ color: "#808080", fontSize: "11px" }}>#{i + 1}</td>
                      <td style={{ fontFamily: "Courier New", fontSize: "11px", whiteSpace: "nowrap" }}>{l.date}</td>
                      <td>{Number(l.mileage).toLocaleString()} mi</td>
                      <td>{l.gallons} gal</td>
                      <td>{l.price_per_gal > 0 ? `$${Number(l.price_per_gal).toFixed(3)}` : "—"}</td>
                      <td style={{ color: "#CC0000", fontWeight: "bold" }}>
                        {l.price_per_gal > 0 ? `$${(l.gallons * l.price_per_gal).toFixed(2)}` : "—"}
                      </td>
                      <td style={{ fontWeight: "bold", color: mpg ? (mpg >= 25 ? "#006400" : mpg >= 18 ? "#000080" : "#8B0000") : "#808080" }}>
                        {mpg ? `${mpg} mpg` : "—"}
                      </td>
                      <td style={{ fontSize: "11px", color: "#808080", fontStyle: "italic" }}>{l.notes || "—"}</td>
                      <td><button className="win-btn" style={{ fontSize: "10px", padding: "1px 4px", minWidth: "auto", color: "#CC0000" }} onClick={() => handleDelete(l.id)}>🗑</button></td>
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

function StatBadge({ label, value, color }) {
  return (
    <div className="win-inset" style={{ padding: "6px 12px", textAlign: "center", background: "#fff", minWidth: "90px" }}>
      <div style={{ fontSize: "9px", color: "#808080", fontWeight: "bold", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontFamily: "Courier New", fontWeight: "bold", fontSize: "15px", color }}>{value}</div>
    </div>
  );
}

function today() { return new Date().toISOString().slice(0, 10); }
