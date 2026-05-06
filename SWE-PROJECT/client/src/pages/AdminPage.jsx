import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import API_URL from "../api/config";

function Bar({ value, max, color = "#000080" }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <div style={{ flex: 1, height: "10px", background: "#808080", border: "1px inset #404040", position: "relative" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, transition: "width 0.4s" }} />
      </div>
      <span style={{ fontSize: "10px", minWidth: "28px", textAlign: "right" }}>{value}</span>
    </div>
  );
}

export default function AdminPage({ onClose }) {
  const { authHeader, user } = useAuth();
  const [data,    setData]    = useState(null);
  const [error,   setError]   = useState("");
  const [tab,     setTab]     = useState("overview");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/api/admin/analytics`, { headers: authHeader() })
      .then(r => r.ok ? r.json() : r.json().then(d => { throw new Error(d.error); }))
      .then(d => { setData(d); setError(""); })
      .catch(e => setError(e.message));
  }, [refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  const TABS = [
    { id: "overview",  label: "📊 Overview"  },
    { id: "activity",  label: "📈 Activity"  },
    { id: "members",   label: "👥 Members"   },
  ];

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto" }}>
      <div className="win-panel" style={{ padding: 0 }}>

        {/* Title bar */}
        <div className="win-title-bar">
          <span>🛠️</span>
          <span style={{ flex: 1 }}>Admin — Site Analytics</span>
          <button className="win-btn" style={{ fontSize: "10px", padding: "1px 6px", minWidth: "unset" }}
            onClick={() => setRefresh(r => r + 1)}>🔄 Refresh</button>
          <button className="win-btn" style={{ minWidth: "18px", padding: "0 6px", fontSize: "11px" }} onClick={onClose}>✕</button>
        </div>

        <div style={{ height: "4px", background: "linear-gradient(to right,#FF0000,#FF7700,#FFFF00,#00CC00,#0000FF,#8800FF,#FF00FF)" }} />

        {/* Access info */}
        <div style={{ background: "#800000", color: "#fff", padding: "2px 8px", fontSize: "10px" }}>
          🔐 Admin access — logged in as <strong>{user?.username}</strong>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: "2px solid #808080", background: "#C0C0C0" }}>
          {TABS.map(t => (
            <button key={t.id} className="win-btn"
              onClick={() => setTab(t.id)}
              style={{ border: "none", borderBottom: tab === t.id ? "2px solid #C0C0C0" : "none",
                background: tab === t.id ? "#C0C0C0" : "#a0a0a0",
                fontWeight: tab === t.id ? "bold" : "normal",
                padding: "4px 14px", fontSize: "12px", minWidth: "unset" }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: "14px" }}>
          {error && (
            <div style={{ background: "#FF0000", color: "#fff", padding: "6px 10px", marginBottom: "10px", fontSize: "12px" }}>
              ⚠ {error}
            </div>
          )}

          {!data && !error && (
            <div style={{ color: "#808080", fontSize: "12px", textAlign: "center", padding: "20px" }}>Loading analytics...</div>
          )}

          {data && (
            <>
              {/* ══ OVERVIEW ══ */}
              {tab === "overview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

                  {/* Big stat cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                    {[
                      { label: "Active Today",  value: data.activeToday,   icon: "🟢", color: "#006400" },
                      { label: "Active 7 Days", value: data.activeWeek,    icon: "📅", color: "#000080" },
                      { label: "Total Members", value: data.totalUsers,    icon: "👥", color: "#4B0082" },
                      { label: "Threads",       value: data.totalThreads,  icon: "💬", color: "#8B4513" },
                      { label: "Posts",         value: data.totalPosts,    icon: "📝", color: "#000080" },
                      { label: "Vehicles",      value: data.totalVehicles, icon: "🚗", color: "#006060" },
                    ].map(s => (
                      <div key={s.label} style={{ border: "2px inset #808080", background: s.color, color: "#fff", padding: "8px", textAlign: "center" }}>
                        <div style={{ fontSize: "20px" }}>{s.icon}</div>
                        <div style={{ fontSize: "20px", fontWeight: "bold" }}>{s.value.toLocaleString()}</div>
                        <div style={{ fontSize: "10px", color: "#ddd" }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Top posters */}
                  <div className="win-panel" style={{ padding: 0 }}>
                    <div className="win-title-bar" style={{ fontSize: "11px", padding: "2px 6px" }}>🏆 Top Posters</div>
                    <div style={{ padding: "6px 8px" }}>
                      {data.topPosters.slice(0, 5).map((p, i) => (
                        <div key={p.username} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", fontSize: "11px" }}>
                          <span style={{ color: i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "#808080", fontWeight: "bold", minWidth: "16px" }}>#{i+1}</span>
                          {p.avatar_url
                            ? <img src={p.avatar_url} alt="" style={{ width: "18px", height: "18px", objectFit: "cover", border: "1px solid #808080" }} />
                            : <span>👤</span>}
                          <span style={{ flex: 1 }}>{p.username}</span>
                          <Bar value={p.post_count} max={data.topPosters[0]?.post_count || 1} />
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* ══ ACTIVITY ══ */}
              {tab === "activity" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

                  {/* Posts per day */}
                  <div className="win-panel" style={{ padding: 0 }}>
                    <div className="win-title-bar" style={{ fontSize: "11px", padding: "2px 6px" }}>📝 Posts Per Day (last 14 days)</div>
                    <div style={{ padding: "8px" }}>
                      {data.postsByDay.length === 0 && <div style={{ color: "#808080", fontSize: "11px" }}>No post activity.</div>}
                      {data.postsByDay.map(d => {
                        const maxPosts = Math.max(...data.postsByDay.map(x => x.count), 1);
                        return (
                          <div key={d.day} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px", fontSize: "10px" }}>
                            <span style={{ minWidth: "68px", color: "#404040" }}>{d.day}</span>
                            <Bar value={d.count} max={maxPosts} color="#000080" />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Registrations per day */}
                  <div className="win-panel" style={{ padding: 0 }}>
                    <div className="win-title-bar" style={{ fontSize: "11px", padding: "2px 6px" }}>👥 New Members Per Day (last 14 days)</div>
                    <div style={{ padding: "8px" }}>
                      {data.registrations.length === 0 && <div style={{ color: "#808080", fontSize: "11px" }}>No registrations.</div>}
                      {data.registrations.map(d => {
                        const maxReg = Math.max(...data.registrations.map(x => x.count), 1);
                        return (
                          <div key={d.day} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px", fontSize: "10px" }}>
                            <span style={{ minWidth: "68px", color: "#404040" }}>{d.day}</span>
                            <Bar value={d.count} max={maxReg} color="#006400" />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hourly activity (last 24h) */}
                  <div className="win-panel" style={{ padding: 0 }}>
                    <div className="win-title-bar" style={{ fontSize: "11px", padding: "2px 6px" }}>🕐 Hourly Post Activity (last 24h)</div>
                    <div style={{ padding: "8px" }}>
                      {data.hourlyActivity.length === 0 && <div style={{ color: "#808080", fontSize: "11px" }}>No activity in last 24h.</div>}
                      <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: "60px" }}>
                        {Array.from({ length: 24 }, (_, h) => {
                          const hStr = String(h).padStart(2, "0");
                          const entry = data.hourlyActivity.find(x => x.hour === hStr);
                          const count = entry?.count || 0;
                          const maxH  = Math.max(...data.hourlyActivity.map(x => x.count), 1);
                          const height = Math.max(2, Math.round((count / maxH) * 56));
                          return (
                            <div key={h} title={`${hStr}:00 — ${count} posts`}
                              style={{ flex: 1, background: count > 0 ? "#000080" : "#C0C0C0",
                                height: `${height}px`, border: "1px solid #606060",
                                cursor: "default" }} />
                          );
                        })}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#808080", marginTop: "2px" }}>
                        <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* ══ MEMBERS ══ */}
              {tab === "members" && (
                <div>
                  <div style={{ fontSize: "11px", color: "#808080", marginBottom: "6px" }}>
                    Recent registrations (last 20)
                  </div>
                  <div style={{ border: "2px inset #808080", background: "#fff", maxHeight: "340px", overflowY: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                      <thead>
                        <tr style={{ background: "#000080", color: "#fff", position: "sticky", top: 0 }}>
                          <th style={{ padding: "4px 6px", textAlign: "left" }}>Username</th>
                          <th style={{ padding: "4px 6px", textAlign: "left" }}>Email</th>
                          <th style={{ padding: "4px 6px", textAlign: "left" }}>Joined</th>
                          <th style={{ padding: "4px 6px", textAlign: "left" }}>Last Seen</th>
                          <th style={{ padding: "4px 6px", textAlign: "center" }}>Admin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentUsers.map((u, i) => (
                          <tr key={u.username} style={{ background: i % 2 === 0 ? "#fff" : "#f0f0f0" }}>
                            <td style={{ padding: "3px 6px", fontWeight: "bold", color: u.is_admin ? "#800000" : "#000" }}>
                              {u.is_admin ? "⭐ " : ""}{u.username}
                            </td>
                            <td style={{ padding: "3px 6px", color: "#404080" }}>{u.email}</td>
                            <td style={{ padding: "3px 6px", color: "#606060" }}>{u.created_at?.slice(0, 10)}</td>
                            <td style={{ padding: "3px 6px", color: u.last_seen_at ? "#006400" : "#808080" }}>
                              {u.last_seen_at ? u.last_seen_at.slice(0, 16).replace("T", " ") : "Never"}
                            </td>
                            <td style={{ padding: "3px 6px", textAlign: "center" }}>{u.is_admin ? "✅" : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
