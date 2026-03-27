import { useState, useEffect } from "react";
import API_URL from "../api/config";

const CONDITIONS = ["excellent", "good", "fair", "poor"];

export default function ListingsPage() {
  const [listings, setListings] = useState([]);
  const [form, setForm]         = useState({ make: "", model: "", year: "", price: "", mileage: "", condition: "good", mod_adjustment: "0" });
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { fetchListings(); }, []);

  async function fetchListings() {
    try {
      const res  = await fetch(`${API_URL}/listings`);
      const data = await res.json();
      setListings(data);
    } catch {
      setError("Failed to load listings.");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.make || !form.model || !form.year || !form.price || !form.mileage) {
      return setError("Make, model, year, price, and mileage are required.");
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/listings`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          make:           form.make,
          model:          form.model,
          year:           Number(form.year),
          price:          Number(form.price),
          mileage:        Number(form.mileage),
          condition:      form.condition,
          mod_adjustment: Number(form.mod_adjustment) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error);
      await fetchListings();
      setForm({ make: "", model: "", year: "", price: "", mileage: "", condition: "good", mod_adjustment: "0" });
      setShowForm(false);
    } catch {
      setError("Failed to add listing.");
    } finally {
      setLoading(false);
    }
  }

  const rankColors = {
    1: { bg: "#FFFF00", color: "#000000", label: "🥇 #1" },
    2: { bg: "#C0C0C0", color: "#000000", label: "🥈 #2" },
    3: { bg: "#CD7F32", color: "#ffffff", label: "🥉 #3" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
        <h1 style={{ fontSize: "16px", fontWeight: "bold" }}>
          🏁&nbsp;
          <span className="rainbow-text">Car Listings</span>
        </h1>
        <button className="win-btn win-btn-primary" onClick={() => setShowForm((f) => !f)}>
          {showForm ? "Cancel" : "[ + Add Listing ]"}
        </button>
      </div>

      {/* ── Under construction banner (if top listing exists) ───────── */}
      {listings.length > 0 && (
        <div className="bg-construction" style={{ padding: "3px 0" }}>
          <div style={{ background: "#000080", margin: "2px", padding: "2px 8px", color: "#FFFF00", fontWeight: "bold", fontSize: "12px" }}>
            🏆 TOP DEAL: {listings[0].year} {listings[0].make} {listings[0].model} — ${Number(listings[0].price).toLocaleString()}
            &nbsp;&nbsp;<span className="blink">★ BEST VALUE ★</span>
          </div>
        </div>
      )}

      {/* ── Add Listing form ─────────────────────────────────────────── */}
      {showForm && (
        <div className="win-panel" style={{ padding: "0" }}>
          <div className="win-title-bar">
            <span>📝</span>
            <span>Add New Listing</span>
          </div>
          <div style={{ padding: "10px" }}>
            {error && (
              <div style={{ background: "#FF0000", color: "#ffffff", padding: "3px 8px", fontWeight: "bold", fontSize: "12px", marginBottom: "8px" }}>
                ⚠ {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "2px", fontSize: "12px" }}>Make *</label>
                  <input className="win-input" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "2px", fontSize: "12px" }}>Model *</label>
                  <input className="win-input" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "2px", fontSize: "12px" }}>Year *</label>
                  <input className="win-input" type="number" min="1900" max="2099" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "2px", fontSize: "12px" }}>Price ($) *</label>
                  <input className="win-input" type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "2px", fontSize: "12px" }}>Mileage *</label>
                  <input className="win-input" type="number" min="0" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "2px", fontSize: "12px" }}>Mod Adjustment ($)</label>
                  <input className="win-input" type="number" value={form.mod_adjustment} onChange={(e) => setForm({ ...form, mod_adjustment: e.target.value })} />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", marginBottom: "2px", fontSize: "12px" }}>Condition</label>
                  <select className="win-select" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
                    {CONDITIONS.map((c) => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
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

      {/* ── Listings table ───────────────────────────────────────────── */}
      {listings.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px", color: "#808080" }}>
          <div style={{ fontSize: "32px" }}>🏁</div>
          <div style={{ marginTop: "8px" }}>No listings yet. Click [+ Add Listing] above!</div>
        </div>
      ) : (
        <div className="win-inset" style={{ padding: "0", overflow: "hidden" }}>
          <table className="win-table">
            <thead>
              <tr>
                <th style={{ width: "48px" }}>Rank</th>
                <th>Vehicle</th>
                <th>Mileage</th>
                <th>Condition</th>
                <th>Price</th>
                <th>Deal Score</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => {
                const rank = rankColors[l.rank];
                const dealGood = l.deal_score >= 0;
                return (
                  <tr key={l.id}>
                    <td style={{ textAlign: "center" }}>
                      {rank ? (
                        <span
                          style={{ background: rank.bg, color: rank.color, padding: "1px 6px", fontWeight: "bold", fontSize: "11px", border: "1px solid #808080" }}
                        >
                          {rank.label}
                        </span>
                      ) : (
                        <span style={{ color: "#808080" }}>#{l.rank}</span>
                      )}
                    </td>
                    <td style={{ fontWeight: "bold" }}>
                      {l.year} {l.make} {l.model}
                      {l.mod_adjustment !== 0 && (
                        <span style={{ fontSize: "11px", color: l.mod_adjustment > 0 ? "#008000" : "#FF0000", marginLeft: "4px" }}>
                          (mods {l.mod_adjustment > 0 ? "+" : ""}{Number(l.mod_adjustment).toLocaleString()})
                        </span>
                      )}
                    </td>
                    <td>{Number(l.mileage).toLocaleString()} mi</td>
                    <td style={{ textTransform: "capitalize" }}>{l.condition}</td>
                    <td style={{ fontWeight: "bold" }}>${Number(l.price).toLocaleString()}</td>
                    <td style={{ color: dealGood ? "#008000" : "#FF0000", fontWeight: "bold" }}>
                      {dealGood ? "▲" : "▼"} ${Math.abs(Number(l.deal_score)).toLocaleString()}
                      <span style={{ color: "#808080", fontWeight: "normal", fontSize: "11px" }}>
                        {" "}{dealGood ? "under" : "over"}priced
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
