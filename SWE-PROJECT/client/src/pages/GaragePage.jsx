import { useState, useEffect, useCallback } from "react";
import API_URL from "../api/config";
import { useAuth } from "../context/AuthContext";

const TAGS = ["All", "General", "Build Log", "Question", "For Sale", "Tech", "Help", "Off Topic"];
const SORTS = [
  { value: "latest",  label: "⏰ Latest" },
  { value: "replies", label: "💬 Most Replies" },
  { value: "oldest",  label: "📅 Oldest" },
];
const TAG_ICONS = {
  "General":   "💬", "Build Log": "🔧", "Question": "❓",
  "For Sale":  "💰", "Tech":      "⚙️", "Help":     "🆘", "Off Topic": "☕",
};
const TAG_COLORS = {
  "General":   "#808080", "Build Log": "#000080", "Question":  "#006400",
  "For Sale":  "#8B0000", "Tech":      "#4B0082", "Help":      "#CC2200", "Off Topic": "#8B4513",
};

function getLastSeen() {
  try { return JSON.parse(localStorage.getItem("revindex_lastseen") || "{}"); }
  catch { return {}; }
}
function markSeen(threadId) {
  const seen = getLastSeen();
  seen[threadId] = new Date().toISOString();
  localStorage.setItem("revindex_lastseen", JSON.stringify(seen));
}

export default function GaragePage({ onOpenThread }) {
  const { user, authHeader } = useAuth();
  const [threads,      setThreads]      = useState([]);
  const [myVehicles,   setMyVehicles]   = useState([]);
  const [allVehicles,  setAllVehicles]  = useState([]);
  const [stats,        setStats]        = useState({ thread_count: 0, post_count: 0 });
  const [showForm,     setShowForm]     = useState(false);
  const [showAddCar,   setShowAddCar]   = useState(false);
  const [addCarForm,   setAddCarForm]   = useState({ make: "", model: "", year: "", nickname: "" });
  const [addCarError,  setAddCarError]  = useState("");
  const [error,        setError]        = useState("");
  const [activeTag,    setActiveTag]    = useState("All");
  const [sort,         setSort]         = useState("latest");
  const [form,         setForm]         = useState({ vehicle_id: "", title: "", description: "", tag: "General" });

  const fetchThreads = useCallback(async () => {
    try {
      const params = new URLSearchParams({ sort });
      if (activeTag !== "All") params.set("tag", activeTag);
      const res  = await fetch(`${API_URL}/threads?${params}`);
      const data = await res.json();
      setThreads(Array.isArray(data) ? data : []);
    } catch { setError("Failed to load threads."); }
  }, [sort, activeTag]);

  useEffect(() => {
    fetchThreads();
    fetch(`${API_URL}/vehicles`).then(r => r.json()).then(d => setAllVehicles(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`${API_URL}/threads/stats`).then(r => r.json()).then(setStats).catch(() => {});
  }, [fetchThreads]);

  // Fetch the logged-in user's own vehicles separately
  useEffect(() => {
    if (!user) { setMyVehicles([]); return; }
    fetch(`${API_URL}/vehicles/mine`, { headers: authHeader() })
      .then(r => r.json())
      .then(d => setMyVehicles(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [user]); // eslint-disable-line

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    if (!form.vehicle_id || !form.title) return setError("Vehicle and title are required.");
    try {
      const res  = await fetch(`${API_URL}/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm({ vehicle_id: "", title: "", description: "", tag: "General" });
      setShowForm(false);
      fetchThreads();
      fetch(`${API_URL}/threads/stats`).then(r => r.json()).then(setStats).catch(() => {});
    } catch (err) { setError(err.message); }
  }

  async function handleAddVehicle(e) {
    e.preventDefault();
    setAddCarError("");
    const { make, model, year, nickname } = addCarForm;
    if (!make || !model || !year) return setAddCarError("Make, model, and year are required.");
    try {
      const res  = await fetch(`${API_URL}/vehicles`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ make, model, year: Number(year), nickname }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAddCarForm({ make: "", model: "", year: "", nickname: "" });
      setShowAddCar(false);
      // Refresh my vehicles list
      fetch(`${API_URL}/vehicles/mine`, { headers: authHeader() })
        .then(r => r.json()).then(d => setMyVehicles(Array.isArray(d) ? d : [])).catch(() => {});
      fetch(`${API_URL}/threads/stats`).then(r => r.json()).then(setStats).catch(() => {});
    } catch (err) { setAddCarError(err.message); }
  }

  function handleOpenThread(t) {
    markSeen(t.id);
    onOpenThread(t);
  }

  function isNew(t) {
    const seen = getLastSeen()[t.id];
    if (!seen) return false;
    return (t.last_reply || t.created_at) > seen;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>

      {/* Stats bar */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center", padding: "5px 10px", background: "#000080", color: "#fff", fontSize: "11px", flexWrap: "wrap" }}>
        <span>📋 <strong>{stats.thread_count}</strong> Threads</span>
        <span style={{ opacity: 0.5 }}>|</span>
        <span>💬 <strong>{stats.post_count}</strong> Posts</span>
        <span style={{ opacity: 0.5 }}>|</span>
        <span>🚗 <strong>{allVehicles.length}</strong> Vehicles Registered</span>
        <div style={{ flex: 1 }} />
        <span className="blink" style={{ color: "#FFFF00", fontWeight: "bold" }}>★ THE GARAGE ★</span>
      </div>

      {/* ── My Garage section (logged-in users only) ── */}
      {user && (
        <div className="win-panel" style={{ padding: 0 }}>
          <div className="win-title-bar">
            <span>🚗 My Garage — {user.username}</span>
            <div style={{ display: "flex", gap: "4px" }}>
              <button className="win-btn" style={{ fontSize: "11px", minWidth: "unset", padding: "1px 8px" }}
                onClick={() => { setShowAddCar(f => !f); setAddCarError(""); }}>
                {showAddCar ? "[ Cancel ]" : "[ + Add Vehicle ]"}
              </button>
              <button className="win-btn" style={{ fontSize: "11px", minWidth: "unset", padding: "1px 8px" }}
                onClick={() => setShowForm(f => !f)}>
                {showForm ? "[ Cancel ]" : "[ + New Thread ]"}
              </button>
            </div>
          </div>

          {/* Add Vehicle inline form */}
          {showAddCar && (
            <div style={{ padding: "10px", borderBottom: "2px solid #808080", background: "#D4D0C8" }}>
              <form onSubmit={handleAddVehicle} style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "flex-end" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "1px" }}>Make *</label>
                  <input className="win-input" style={{ width: "90px" }} placeholder="Toyota"
                    value={addCarForm.make} onChange={e => setAddCarForm(f => ({ ...f, make: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "1px" }}>Model *</label>
                  <input className="win-input" style={{ width: "90px" }} placeholder="Supra"
                    value={addCarForm.model} onChange={e => setAddCarForm(f => ({ ...f, model: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "1px" }}>Year *</label>
                  <input className="win-input" style={{ width: "60px" }} placeholder="1998" maxLength={4}
                    value={addCarForm.year} onChange={e => setAddCarForm(f => ({ ...f, year: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "1px" }}>Nickname</label>
                  <input className="win-input" style={{ width: "100px" }} placeholder={`"The Beast"`}
                    value={addCarForm.nickname} onChange={e => setAddCarForm(f => ({ ...f, nickname: e.target.value }))} />
                </div>
                <button type="submit" className="win-btn win-btn-primary" style={{ alignSelf: "flex-end" }}>
                  [ Save ]
                </button>
                {addCarError && <span style={{ color: "#CC0000", fontSize: "11px", alignSelf: "flex-end" }}>⚠ {addCarError}</span>}
              </form>
            </div>
          )}

          {myVehicles.length === 0 ? (
            <div style={{ padding: "12px 14px", fontSize: "12px", color: "#808080" }}>
              No vehicles in your garage yet. Click <strong>[ + Add Vehicle ]</strong> to add your first car!
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", padding: "10px" }}>
              {myVehicles.map(v => (
                <div key={v.id} style={{
                  background: "#fff", border: "2px inset #808080",
                  padding: "6px 10px", minWidth: "140px", fontSize: "11px",
                }}>
                  {v.image ? (
                    <img src={`${API_URL}${v.image}`} alt=""
                      style={{ width: "100%", height: "60px", objectFit: "cover", border: "1px solid #808080", display: "block", marginBottom: "4px" }} />
                  ) : (
                    <div style={{ width: "100%", height: "60px", background: "#C0C0C0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", marginBottom: "4px" }}>🚗</div>
                  )}
                  <div style={{ fontWeight: "bold" }}>{v.year} {v.make}</div>
                  <div>{v.model}</div>
                  {v.nickname && <div style={{ fontStyle: "italic", color: "#808080" }}>&quot;{v.nickname}&quot;</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Board header + filter bar */}
      <div className="win-panel" style={{ padding: 0 }}>
        <div className="win-title-bar" style={{ justifyContent: "space-between" }}>
          <span>🔧 THE GARAGE — Build Threads &amp; Discussion</span>
          {!user && (
            <span style={{ fontSize: "11px", color: "#FFFF00", padding: "0 8px" }}>Login to post</span>
          )}
        </div>
        {/* Tag filter — scrollable row, won't overflow into sidebar */}
        <div style={{ padding: "5px 8px", background: "#C0C0C0", borderBottom: "2px solid #808080", display: "flex", gap: "4px", alignItems: "center", overflowX: "auto", flexWrap: "nowrap" }}>
          {TAGS.map(tag => (
            <button key={tag} className="win-btn"
              style={{ minWidth: "unset", padding: "2px 7px", fontSize: "11px", whiteSpace: "nowrap", flexShrink: 0, background: activeTag === tag ? "#000080" : "#C0C0C0", color: activeTag === tag ? "#fff" : "#000" }}
              onClick={() => setActiveTag(tag)}>
              {tag !== "All" && TAG_ICONS[tag]} {tag}
            </button>
          ))}
          <div style={{ flex: 1, minWidth: "8px" }} />
          <select className="win-select" style={{ width: "auto", fontSize: "11px", flexShrink: 0 }}
            value={sort} onChange={e => setSort(e.target.value)}>
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div style={{ background: "#FF0000", color: "#fff", padding: "3px 8px", fontSize: "11px", fontWeight: "bold" }}>⚠ {error}</div>
      )}

      {/* New thread form — only shows user's own vehicles */}
      {showForm && user && (
        <div className="win-panel" style={{ padding: 0 }}>
          <div className="win-title-bar"><span>📝 Start a New Thread</span></div>
          <div style={{ padding: "10px" }}>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Vehicle *</label>
                  <select className="win-select" value={form.vehicle_id}
                    onChange={e => setForm(f => ({ ...f, vehicle_id: e.target.value }))}>
                    <option value="">-- Select Your Vehicle --</option>
                    {myVehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.year} {v.make} {v.model}{v.nickname ? ` "${v.nickname}"` : ""}
                      </option>
                    ))}
                  </select>
                  {myVehicles.length === 0 && (
                    <div style={{ fontSize: "10px", color: "#CC0000", marginTop: "2px" }}>
                      Add a vehicle to your garage first.
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Tag</label>
                  <select className="win-select" value={form.tag}
                    onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}>
                    {TAGS.filter(t => t !== "All").map(tag => (
                      <option key={tag} value={tag}>{TAG_ICONS[tag]} {tag}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Thread Title *</label>
                <input className="win-input" style={{ width: "100%" }}
                  placeholder="e.g. My Civic Build — Road to 400whp"
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Opening Post</label>
                <textarea className="win-input" rows={4}
                  style={{ width: "100%", resize: "vertical", fontFamily: "inherit" }}
                  placeholder="Describe your build, goals, mods so far..."
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div style={{ textAlign: "right" }}>
                <button type="submit" className="win-btn win-btn-primary">[ Post Thread ]</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Thread list */}
      <div className="win-panel" style={{ padding: 0 }}>
        <div className="win-title-bar">
          <span>📋 {activeTag === "All" ? "All Threads" : `[${activeTag}]`} ({threads.length})</span>
        </div>
        {threads.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#808080", fontSize: "12px" }}>
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>🔧</div>
            No threads here yet. Be the first to post!
          </div>
        ) : (
          <div className="win-inset" style={{ overflow: "auto" }}>
            <table className="win-table" style={{ width: "100%", minWidth: "420px" }}>
              <thead>
                <tr>
                  <th style={{ width: "36px" }}></th>
                  <th style={{ textAlign: "left" }}>Thread / Vehicle</th>
                  <th style={{ width: "90px" }}>Tag</th>
                  <th style={{ width: "60px" }}>Replies</th>
                  <th style={{ width: "110px" }}>Last Post</th>
                </tr>
              </thead>
              <tbody>
                {threads.map(t => (
                  <tr key={t.id} style={{ cursor: "pointer" }} onClick={() => handleOpenThread(t)}>
                    <td style={{ textAlign: "center", padding: "4px" }}>
                      {t.vehicle_image ? (
                        <img src={`${API_URL}${t.vehicle_image}`} alt=""
                          style={{ width: "32px", height: "32px", objectFit: "cover", border: "2px inset #808080", display: "block" }} />
                      ) : (
                        <div style={{ width: "32px", height: "32px", background: "#808080", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>🚗</div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
                        {isNew(t) && (
                          <span style={{ background: "#FF4500", color: "#fff", fontSize: "9px", padding: "1px 4px", fontWeight: "bold", flexShrink: 0 }}>NEW</span>
                        )}
                        <span style={{ fontWeight: "bold", color: "#000080", textDecoration: "underline" }}>{t.title}</span>
                      </div>
                      <div style={{ fontSize: "11px", color: "#808080" }}>
                        {t.year} {t.make} {t.model}{t.nickname ? ` "${t.nickname}"` : ""}
                      </div>
                      {/* Vehicle owner — avatar + username */}
                      {(t.owner_username || t.author_username) && (
                        <div style={{ fontSize: "10px", color: "#4B0082", display: "flex", alignItems: "center", gap: "3px", marginTop: "2px" }}>
                          <div style={{ width: "16px", height: "16px", border: "1px solid #808080", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#C0C0C0", flexShrink: 0 }}>
                            {(t.owner_avatar || t.author_avatar)
                              ? <img src={`${API_URL}${t.owner_avatar || t.author_avatar}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              : <span style={{ fontSize: "10px" }}>👤</span>}
                          </div>
                          <span style={{ fontWeight: "bold" }}>{t.owner_username || t.author_username}</span>
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ background: TAG_COLORS[t.tag] || "#808080", color: "#fff", fontSize: "10px", padding: "1px 5px", fontWeight: "bold", whiteSpace: "nowrap", display: "inline-block" }}>
                        {TAG_ICONS[t.tag]} {t.tag || "General"}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className="win-counter" style={{ fontSize: "11px" }}>{t.reply_count || 0}</span>
                    </td>
                    <td style={{ fontSize: "11px", color: "#808080", whiteSpace: "nowrap" }}>
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

      <div style={{ textAlign: "center", fontSize: "11px", color: "#808080", padding: "4px" }}>
        Powered by GarageBoard™ v2.0 — Est. 2024 — All times UTC
      </div>
    </div>
  );
}
