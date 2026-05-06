import { useEffect, useState } from "react";
import API_URL from "../api/config";

const RULES = [
  "Be respectful to all members.",
  "No spam or self-promotion.",
  "Keep threads on-topic.",
  "No illegal mods discussion.",
  "Search before posting.",
  "Photos encouraged! 📷",
];

export default function LeftSidebar({ onNavigate }) {
  const [stats,       setStats]       = useState(null);
  const [activeToday, setActiveToday] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/threads/stats`)
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
    fetch(`${API_URL}/api/auth/active-count`)
      .then(r => r.json())
      .then(d => setActiveToday(d.active))
      .catch(() => {});
  }, []);

  const [online] = useState(() => 3 + ((Math.floor(Date.now() / 300000) * 7) % 12));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "170px", flexShrink: 0 }}>

      {/* ── Welcome panel ── */}
      <div className="win-panel" style={{ padding: 0 }}>
        <div className="win-title-bar" style={{ fontSize: "11px", padding: "2px 6px" }}>
          <span>🚗</span> RevIndex
        </div>
        <div style={{ padding: "8px", fontSize: "11px", lineHeight: 1.6, background: "#fff", borderTop: "1px solid #808080" }}>
          <div style={{ textAlign: "center", marginBottom: "6px", display: "flex", justifyContent: "center", gap: "4px" }}>
            <img src="/smilies/icon_cool.svg"      alt="cool"  style={{ width: "28px", height: "28px" }} />
            <img src="/smilies/icon_thumbup.svg"   alt="+1"    style={{ width: "28px", height: "28px" }} />
            <img src="/smilies/icon_e_biggrin.svg" alt="grin"  style={{ width: "28px", height: "28px" }} />
            <img src="/smilies/icon_clap.svg"      alt="clap"  style={{ width: "28px", height: "28px" }} />
          </div>
          <div style={{ textAlign: "center", fontSize: "10px", color: "#808080" }}>
            Est. 2025 — For car people,<br />by car people.
          </div>
        </div>
      </div>

      {/* ── Forum stats ── */}
      <div className="win-panel" style={{ padding: 0 }}>
        <div className="win-title-bar" style={{ fontSize: "11px", padding: "2px 6px" }}>
          📊 Board Stats
        </div>
        <div style={{ padding: "6px 8px", fontSize: "11px" }}>
          {stats ? (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {[
                  ["👥 Members",  stats.members],
                  ["💬 Threads",  stats.threads],
                  ["📝 Posts",    stats.posts],
                  ["🚗 Vehicles", stats.vehicles],
                ].map(([label, val]) => (
                  <tr key={label}>
                    <td style={{ padding: "2px 0", color: "#404040" }}>{label}</td>
                    <td style={{ padding: "2px 0", textAlign: "right", fontWeight: "bold", color: "#000080" }}>{val.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ color: "#808080", fontSize: "10px" }}>Loading...</div>
          )}
        </div>
      </div>

      {/* ── Online now ── */}
      <div className="win-panel" style={{ padding: 0 }}>
        <div className="win-title-bar" style={{ fontSize: "11px", padding: "2px 6px" }}>
          🟢 Online Now
        </div>
        <div style={{ padding: "6px 8px", fontSize: "11px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span className="blink" style={{ color: "#00AA00", fontWeight: "bold" }}>●</span>
            <span><strong>{online}</strong> user{online !== 1 ? "s" : ""} online</span>
          </div>
          <div style={{ fontSize: "10px", color: "#808080", marginTop: "2px" }}>
            Members + Guests
          </div>
          {activeToday !== null && (
            <div style={{ marginTop: "4px", padding: "2px 4px", background: "#000080", color: "#FFD700", fontSize: "10px", textAlign: "center", fontWeight: "bold" }}>
              👤 {activeToday} active today
            </div>
          )}
        </div>
      </div>

      {/* ── Quick links ── */}
      <div className="win-panel" style={{ padding: 0 }}>
        <div className="win-title-bar" style={{ fontSize: "11px", padding: "2px 6px" }}>
          🔗 Quick Links
        </div>
        <div style={{ padding: "4px 0", fontSize: "11px" }}>
          {[
            { icon: "💬", label: "Forum",   page: "Forum"  },
            { icon: "🚗", label: "My Garage", page: "Garage" },
          ].map(({ icon, label, page }) => (
            <button key={page}
              onClick={() => onNavigate(page)}
              style={{ display: "flex", alignItems: "center", gap: "6px", width: "100%",
                background: "none", border: "none", padding: "3px 8px", cursor: "pointer",
                fontSize: "11px", textAlign: "left", color: "#0000CC" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#000080"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#0000CC"; }}>
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Rules ── */}
      <div className="win-panel" style={{ padding: 0 }}>
        <div className="win-title-bar" style={{ fontSize: "11px", padding: "2px 6px" }}>
          📋 Board Rules
        </div>
        <div style={{ padding: "6px 8px", fontSize: "10px", lineHeight: 1.7 }}>
          {RULES.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: "4px" }}>
              <span style={{ color: "#000080", fontWeight: "bold", flexShrink: 0 }}>{i + 1}.</span>
              <span>{r}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
