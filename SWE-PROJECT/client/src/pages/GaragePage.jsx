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
  const [threads,   setThreads]   = useState([]);
  const [vehicles,  setVehicles]  = useState([]);
  const [stats,     setStats]     = useState({ thread_count: 0, post_count: 0 });
  const [showForm,  setShowForm]  = useState(false);
  const [error,     setError]     = useState("");
  const [activeTag, setActiveTag] = useState("All");
  const [sort,      setSort]      = useState("latest");
  const [form,      setForm]      = useState({ vehicle_id: "", title: "", description: "", tag: "General" });

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
    fetch(`${API_URL}/vehicles`).then(r => r.json()).then(d => setVehicles(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`${API_URL}/threads/stats`).then(r => r.json()).then(setStats).catch(() => {});
  }, [fetchThreads]);

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
        <span>🚗 <strong>{vehicles.length}</strong> Vehicles Registered</span>
        <div style={{ flex: 1 }} />
        <span className="blink" style={{ color: "#FFFF00", fontWeight: "bold" }}>★ THE GARAGE ★</span>
      </div>

      {/* Board header + filter bar */}
      <div className="win-panel" style={{ padding: 0 }}>
        <div className="win-title-bar" style={{ justifyContent: "space-between" }}>
          <span>🔧 THE GARAGE — Build Threads &amp; Discussion</span>
          {user ? (
            <button className="win-btn" onClick={() => setShowForm(f => !f)}>
              {showForm ? "[ Cancel ]" : "[ + New Thread ]"}
            </button>
          ) : (
            <span style={{ fontSize: "11px", color: "#FFFF00", padding: "0 8px" }}>Login to post</span>
          )}
        </div>
        <div style={{ padding: "5px 8px", background: "#C0C0C0", borderBottom: "2px solid #808080", display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center" }}>
          {TAGS.map(tag => (
            <button key={tag} className="win-btn"
              style={{ minWidth: "unset", padding: "2px 8px", fontSize: "11px", background: activeTag === tag ? "#000080" : "#C0C0C0", color: activeTag === tag ? "#fff" : "#000" }}
              onClick={() => setActiveTag(tag)}>
              {tag !== "All" && TAG_ICONS[tag]} {tag}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <select className="win-select" style={{ width: "auto", fontSize: "11px" }}
            value={sort} onChange={e => setSort(e.target.value)}>
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div style={{ background: "#FF0000", color: "#fff", padding: "3px 8px", fontSize: "11px", fontWeight: "bold" }}>⚠ {error}</div>
      )}

      {/* New thread form */}
      {showForm && (
        <div className="win-panel" style={{ padding: 0 }}>
          <div className="win-title-bar"><span>📝 Start a New Thread</span></div>
          <div style={{ padding: "10px" }}>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Vehicle *</label>
                  <select className="win-select" value={form.vehicle_id}
                    onChange={e => setForm(f => ({ ...f, vehicle_id: e.target.value }))}>
                    <option value="">-- Select Vehicle --</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.year} {v.make} {v.model}{v.nickname ? ` "${v.nickname}"` : ""}
                      </option>
                    ))}
                  </select>
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
            No threads here yet. Be the first to post!<br />
            <button className="win-btn" style={{ marginTop: "10px" }} onClick={() => setShowForm(true)}>
              [ Start a Thread ]
            </button>
          </div>
        ) : (
          <div className="win-inset" style={{ overflow: "auto" }}>
            <table className="win-table" style={{ width: "100%" }}>
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
                      {t.author_username && (
                        <div style={{ fontSize: "10px", color: "#4B0082", display: "flex", alignItems: "center", gap: "3px", marginTop: "1px" }}>
                          {t.author_avatar
                            ? <img src={t.author_avatar} alt="" style={{ width: "12px", height: "12px", objectFit: "cover", borderRadius: "1px" }} />
                            : <span>👤</span>}
                          {t.author_username}
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

      <div style={{ textAlign: "center", fontSize: "11px", color: "#808080", padding: "4px" }}>
        Powered by GarageBoard™ v2.0 — Est. 2024 — All times UTC
      </div>
    </div>
  );
}
