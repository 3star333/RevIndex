import { useState, useEffect } from "react";
import API_URL from "../api/config";

const SPEC_FIELDS = [
  { key: "hp_stock",          label: "Stock HP",            group: "Power" },
  { key: "tq_stock",          label: "Stock TQ (lb-ft)",    group: "Power" },
  { key: "curb_weight",       label: "Curb Weight (lbs)",   group: "Power" },
  { key: "tire_front",        label: "Front Tires",         group: "Wheels" },
  { key: "tire_rear",         label: "Rear Tires",          group: "Wheels" },
  { key: "wheel_size",        label: "Wheel Size",          group: "Wheels" },
  { key: "suspension_front",  label: "Front Suspension",    group: "Suspension" },
  { key: "suspension_rear",   label: "Rear Suspension",     group: "Suspension" },
  { key: "gear_ratios",       label: "Gear Ratios",         group: "Drivetrain" },
  { key: "notes",             label: "Notes",               group: "Other" },
];

const EMPTY = SPEC_FIELDS.reduce((o, f) => { o[f.key] = ""; return o; }, {});

export default function SpecsTab({ vehicleId }) {
  const [specs,    setSpecs]    = useState(null);
  const [edit,     setEdit]     = useState(false);
  const [form,     setForm]     = useState(EMPTY);
  const [mods,     setMods]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/specs/${vehicleId}`).then(r => r.ok ? r.json() : null),
      fetch(`${API_URL}/mods?vehicle_id=${vehicleId}`).then(r => r.json()).catch(() => []),
    ]).then(([s, m]) => {
      setSpecs(s);
      setForm(s ? { ...EMPTY, ...s } : EMPTY);
      setMods(Array.isArray(m) ? m : []);
      setLoading(false);
    });
  }, [vehicleId]);

  async function handleSave(e) {
    e.preventDefault(); setError("");
    try {
      const res  = await fetch(`${API_URL}/specs/${vehicleId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSpecs(data); setEdit(false);
    } catch (err) { setError(err.message); }
  }

  const modTotal  = mods.reduce((s, m) => s + (m.cost || 0), 0);
  const hp_stock  = specs?.hp_stock  ? Number(specs.hp_stock)  : null;
  const tq_stock  = specs?.tq_stock  ? Number(specs.tq_stock)  : null;
  const curb_w    = specs?.curb_weight ? Number(specs.curb_weight) : null;
  const groups    = [...new Set(SPEC_FIELDS.map(f => f.group))];

  if (loading) return <div style={{ padding: "20px", color: "#808080", fontSize: "12px" }}>Loading specs...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>

      {/* Stock vs Now */}
      {(hp_stock || tq_stock || modTotal > 0) && (
        <div className="win-panel" style={{ padding: 0 }}>
          <div className="win-title-bar"><span>📊 STOCK vs NOW</span></div>
          <div style={{ padding: "10px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {hp_stock && (
              <CompareCard label="HP" stock={hp_stock} modCount={mods.length} />
            )}
            {tq_stock && (
              <CompareCard label="TQ (lb-ft)" stock={tq_stock} modCount={mods.length} />
            )}
            {curb_w && modTotal > 0 && (
              <div className="win-inset" style={{ padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#808080", marginBottom: "4px" }}>MODS INVESTED</div>
                <div style={{ fontFamily: "Courier New", fontSize: "18px", fontWeight: "bold", color: "#8B0000" }}>${modTotal.toLocaleString()}</div>
                <div style={{ fontSize: "10px", color: "#808080" }}>{mods.length} mod{mods.length !== 1 ? "s" : ""}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit button */}
      <div style={{ textAlign: "right" }}>
        <button className="win-btn" onClick={() => { setEdit(e => !e); setError(""); setForm(specs ? { ...EMPTY, ...specs } : EMPTY); }}>
          {edit ? "[ Cancel ]" : "[ ✏ Edit Specs ]"}
        </button>
      </div>

      {error && <div style={{ background: "#FF0000", color: "#fff", padding: "3px 8px", fontWeight: "bold", fontSize: "12px" }}>⚠ {error}</div>}

      {edit ? (
        <div className="win-panel" style={{ padding: 0 }}>
          <div className="win-title-bar"><span>📋 Edit Spec Sheet</span></div>
          <form onSubmit={handleSave} style={{ padding: "10px" }}>
            {groups.map(group => (
              <div key={group} style={{ marginBottom: "10px" }}>
                <div style={{ fontSize: "10px", fontWeight: "bold", color: "#808080", letterSpacing: "0.1em", marginBottom: "4px", borderBottom: "1px solid #808080" }}>{group.toUpperCase()}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  {SPEC_FIELDS.filter(f => f.group === group).map(f => (
                    <div key={f.key}>
                      <label style={{ display: "block", fontSize: "11px", marginBottom: "2px" }}>{f.label}</label>
                      {f.key === "notes"
                        ? <textarea className="win-input" rows={3} style={{ width: "100%", resize: "vertical" }} value={form[f.key] || ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                        : <input className="win-input" value={form[f.key] || ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                      }
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ textAlign: "right" }}>
              <button type="submit" className="win-btn win-btn-primary">[ Save Specs ]</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="win-panel" style={{ padding: 0 }}>
          <div className="win-title-bar"><span>📋 Spec Sheet</span></div>
          {!specs ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#808080", fontSize: "12px" }}>No specs entered yet. Click ✏ Edit Specs to add them.</div>
          ) : (
            <div style={{ padding: "10px" }}>
              {groups.map(group => {
                const groupFields = SPEC_FIELDS.filter(f => f.group === group && specs[f.key]);
                if (!groupFields.length) return null;
                return (
                  <div key={group} style={{ marginBottom: "10px" }}>
                    <div style={{ fontSize: "10px", fontWeight: "bold", color: "#808080", letterSpacing: "0.1em", marginBottom: "4px", borderBottom: "1px solid #808080" }}>{group.toUpperCase()}</div>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <tbody>
                        {groupFields.map(f => (
                          <tr key={f.key}>
                            <td style={{ padding: "3px 6px", fontSize: "12px", color: "#808080", width: "45%", borderBottom: "1px dotted #c0c0c0" }}>{f.label}</td>
                            <td style={{ padding: "3px 6px", fontSize: "12px", fontFamily: f.key.endsWith("_stock") ? "Courier New" : undefined, fontWeight: f.key.endsWith("_stock") ? "bold" : undefined, borderBottom: "1px dotted #c0c0c0" }}>{specs[f.key]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CompareCard({ label, stock, modCount }) {
  return (
    <div className="win-inset" style={{ padding: "8px 14px", textAlign: "center", minWidth: "110px" }}>
      <div style={{ fontSize: "10px", color: "#808080", marginBottom: "4px" }}>{label}</div>
      <div style={{ display: "flex", gap: "10px", justifyContent: "center", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: "9px", color: "#808080" }}>STOCK</div>
          <div style={{ fontFamily: "Courier New", fontSize: "16px", fontWeight: "bold", color: "#000" }}>{stock}</div>
        </div>
        {modCount > 0 && (
          <>
            <div style={{ fontSize: "18px", color: "#006400", lineHeight: 1 }}>→</div>
            <div>
              <div style={{ fontSize: "9px", color: "#006400" }}>MODIFIED</div>
              <div style={{ fontFamily: "Courier New", fontSize: "16px", fontWeight: "bold", color: "#006400" }}>{stock}+</div>
            </div>
          </>
        )}
      </div>
      {modCount > 0 && <div style={{ fontSize: "9px", color: "#808080", marginTop: "2px" }}>{modCount} mod{modCount !== 1 ? "s" : ""} installed</div>}
    </div>
  );
}
