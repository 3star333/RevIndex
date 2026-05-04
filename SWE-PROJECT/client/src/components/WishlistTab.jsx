import { useState, useEffect } from "react";
import API_URL from "../api/config";

const PRIORITY_COLORS = { Low: "#808080", Medium: "#006400", High: "#000080", ASAP: "#8B0000" };
const CATEGORIES = ["Engine", "Suspension", "Brakes", "Exhaust", "Wheels/Tires", "Interior", "Exterior", "Electronics", "Safety", "Other"];

export default function WishlistTab({ vehicleId }) {
  const [items,    setItems]    = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error,    setError]    = useState("");
  const [filter,   setFilter]   = useState("All");
  const [form,     setForm]     = useState({ name: "", category: "Engine", est_cost: "", priority: "Medium", url: "", notes: "" });

  useEffect(() => {
    fetch(`${API_URL}/wishlist?vehicle_id=${vehicleId}`)
      .then(r => r.json()).then(d => setItems(Array.isArray(d) ? d : [])).catch(() => {});
  }, [vehicleId]);

  async function handleAdd(e) {
    e.preventDefault(); setError("");
    try {
      const res  = await fetch(`${API_URL}/wishlist`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicle_id: vehicleId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems(prev => [data, ...prev]);
      setForm({ name: "", category: "Engine", est_cost: "", priority: "Medium", url: "", notes: "" });
      setShowForm(false);
    } catch (err) { setError(err.message); }
  }

  async function handlePurchased(id, purchased) {
    const res  = await fetch(`${API_URL}/wishlist/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchased: !purchased }),
    });
    const data = await res.json();
    setItems(prev => prev.map(i => i.id === id ? { ...i, purchased: data.purchased } : i));
  }

  async function handleDelete(id) {
    if (!confirm("Remove this wishlist item?")) return;
    await fetch(`${API_URL}/wishlist/${id}`, { method: "DELETE" });
    setItems(prev => prev.filter(i => i.id !== id));
  }

  const totalCost     = items.reduce((s, i) => s + (i.est_cost || 0), 0);
  const purchasedCost = items.filter(i => i.purchased).reduce((s, i) => s + (i.est_cost || 0), 0);
  const remaining     = items.filter(i => !i.purchased).length;
  const priorityOptions = ["All", "ASAP", "High", "Medium", "Low", "Purchased"];
  const filtered = filter === "All" ? items
    : filter === "Purchased" ? items.filter(i => i.purchased)
    : items.filter(i => !i.purchased && i.priority === filter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>

      {/* Stats */}
      {items.length > 0 && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <StatBadge label="TOTAL EST COST" value={`$${totalCost.toLocaleString()}`} color="#000080" />
          <StatBadge label="PURCHASED" value={`$${purchasedCost.toLocaleString()}`} color="#006400" />
          <StatBadge label="REMAINING" value={remaining} color="#8B0000" />
          <StatBadge label="ITEMS" value={items.length} color="#4B0082" />
        </div>
      )}

      {/* War Chest progress */}
      {items.length > 0 && totalCost > 0 && (
        <div className="win-inset" style={{ padding: "6px 10px" }}>
          <div style={{ fontSize: "10px", color: "#808080", marginBottom: "4px" }}>WAR CHEST PROGRESS</div>
          <div style={{ background: "#c0c0c0", height: "14px", border: "1px inset #808080", position: "relative" }}>
            <div style={{
              background: "#006400", height: "100%",
              width: `${Math.min(100, (purchasedCost / totalCost) * 100).toFixed(1)}%`,
              transition: "width 0.3s"
            }} />
            <span style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", fontSize: "9px", lineHeight: "14px", fontWeight: "bold", color: "#000" }}>
              {((purchasedCost / totalCost) * 100).toFixed(0)}% acquired
            </span>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "2px", flexWrap: "wrap" }}>
        {priorityOptions.map(p => (
          <button key={p} className="win-btn" onClick={() => setFilter(p)}
            style={{ fontSize: "11px", padding: "2px 8px", background: filter === p ? "#000080" : undefined, color: filter === p ? "#fff" : undefined }}>
            {p === "ASAP" ? "🔥 ASAP" : p === "High" ? "🔴 High" : p === "Medium" ? "🔵 Med" : p === "Low" ? "⚪ Low" : p === "Purchased" ? "✅ Bought" : "All"}
          </button>
        ))}
      </div>

      {/* Add button */}
      <div style={{ textAlign: "right" }}>
        <button className="win-btn" onClick={() => setShowForm(f => !f)}>{showForm ? "[ Cancel ]" : "[ + Add Part ]"}</button>
      </div>

      {error && <div style={{ background: "#FF0000", color: "#fff", padding: "3px 8px", fontWeight: "bold", fontSize: "12px" }}>⚠ {error}</div>}

      {showForm && (
        <div className="win-panel" style={{ padding: 0 }}>
          <div className="win-title-bar"><span>🛒 Add to Wishlist</span></div>
          <form onSubmit={handleAdd} style={{ padding: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Part Name *</label>
              <input className="win-input" placeholder="e.g. Coilovers, Turbo kit..." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Category</label>
              <select className="win-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Priority</label>
              <select className="win-input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {["Low", "Medium", "High", "ASAP"].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Est. Cost ($)</label>
              <input className="win-input" type="number" min="0" step="0.01" placeholder="0.00" value={form.est_cost} onChange={e => setForm(f => ({ ...f, est_cost: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>URL / Link</label>
              <input className="win-input" type="url" placeholder="https://..." value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Notes</label>
              <input className="win-input" placeholder="Brand, part number, etc." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div style={{ gridColumn: "span 2", textAlign: "right" }}>
              <button type="submit" className="win-btn win-btn-primary">[ Add to Wishlist ]</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="win-panel" style={{ padding: 0 }}>
        <div className="win-title-bar"><span>🛒 Parts Wishlist ({filtered.length} items)</span></div>
        {filtered.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#808080", fontSize: "12px" }}>No items in this filter.</div>
        ) : (
          <div className="win-inset" style={{ overflowX: "auto" }}>
            <table className="win-table" style={{ width: "100%" }}>
              <thead>
                <tr><th>Part</th><th>Category</th><th>Est Cost</th><th>Priority</th><th>Link</th><th>Notes</th><th>✅</th><th>🗑</th></tr>
              </thead>
              <tbody>
                {filtered.sort((a, b) => {
                  const order = { ASAP: 0, High: 1, Medium: 2, Low: 3 };
                  if (a.purchased !== b.purchased) return a.purchased ? 1 : -1;
                  return (order[a.priority] || 2) - (order[b.priority] || 2);
                }).map(item => (
                  <tr key={item.id} style={{ opacity: item.purchased ? 0.55 : 1 }}>
                    <td style={{ fontWeight: "bold", textDecoration: item.purchased ? "line-through" : "none" }}>{item.name}</td>
                    <td style={{ fontSize: "11px" }}>{item.category}</td>
                    <td style={{ fontFamily: "Courier New", fontWeight: "bold", color: "#8B0000" }}>
                      {item.est_cost > 0 ? `$${Number(item.est_cost).toLocaleString()}` : "—"}
                    </td>
                    <td>
                      <span style={{
                        background: PRIORITY_COLORS[item.priority] || "#808080", color: "#fff",
                        padding: "1px 6px", fontSize: "10px", fontWeight: "bold"
                      }}>{item.priority}</span>
                    </td>
                    <td>
                      {item.url ? <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize: "10px" }}>Link 🔗</a> : "—"}
                    </td>
                    <td style={{ fontSize: "11px", color: "#808080", fontStyle: "italic" }}>{item.notes || "—"}</td>
                    <td>
                      <button className="win-btn" style={{ fontSize: "10px", padding: "1px 6px", minWidth: "auto" }} onClick={() => handlePurchased(item.id, item.purchased)}>
                        {item.purchased ? "↩" : "✅"}
                      </button>
                    </td>
                    <td><button className="win-btn" style={{ fontSize: "10px", padding: "1px 4px", minWidth: "auto", color: "#CC0000" }} onClick={() => handleDelete(item.id)}>🗑</button></td>
                  </tr>
                ))}
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
