import { useEffect, useState } from "react";
import API_URL from "../api/config";

const CAR_FACTS = [
  "The first speeding ticket was issued in 1896 — at 8 mph.",
  "The average car has about 30,000 parts.",
  "Bugatti uses the same supplier as Louis Vuitton for leather.",
  "Ferrari produces fewer than 14,000 cars per year on purpose.",
  "The Ford GT40 won Le Mans 4 years in a row (1966–69).",
  "There are more cars than people in Los Angeles.",
  "The Porsche 911 has been in continuous production since 1963.",
  "A Formula 1 car generates enough downforce to drive upside-down at 100mph.",
  "The first car radio was introduced in 1930.",
  "Rolls-Royce hood ornaments are made by hand and take 5 hours each.",
  "The Toyota Corolla is the best-selling car of all time.",
  "Early Lamborghinis were farm tractors.",
  "The Dodge Viper's V10 engine was co-designed by Lamborghini.",
  "A NASCAR engine is rebuilt after every single race.",
  "The McLaren F1 used gold foil in its engine bay as a heat shield.",
];

const TAG_COLORS = {
  "General": "#808080", "Build Log": "#000080", "Question": "#006400",
  "For Sale": "#8B0000", "Tech": "#4B0082", "Help": "#CC2200", "Off Topic": "#8B4513",
};

export default function RightSidebar({ onOpenThread }) {
  const [stats, setStats] = useState(null);
  const [factIdx] = useState(() => Math.floor(Date.now() / 3600000) % CAR_FACTS.length);

  useEffect(() => {
    fetch(`${API_URL}/threads/stats`)
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "170px", flexShrink: 0 }}>

      {/* ── Car Fact of the Day ── */}
      <div className="win-panel" style={{ padding: 0 }}>
        <div className="win-title-bar" style={{ fontSize: "11px", padding: "2px 6px" }}>
          💡 Car Fact
        </div>
        <div style={{ padding: "8px", fontSize: "11px", lineHeight: 1.6, background: "#fff", borderTop: "1px solid #808080" }}>
          <div style={{ fontSize: "10px", color: "#808080", marginBottom: "4px", fontWeight: "bold" }}>
            Fact of the day:
          </div>
          <div style={{ fontStyle: "italic", color: "#000080" }}>
            &ldquo;{CAR_FACTS[factIdx]}&rdquo;
          </div>
        </div>
      </div>

      {/* ── Recent Threads ── */}
      <div className="win-panel" style={{ padding: 0 }}>
        <div className="win-title-bar" style={{ fontSize: "11px", padding: "2px 6px" }}>
          🔥 Latest Posts
        </div>
        <div style={{ padding: "4px 0", fontSize: "10px" }}>
          {stats?.latest?.length > 0 ? stats.latest.map(t => (
            <div key={t.id}
              onClick={() => onOpenThread(t)}
              style={{ padding: "4px 8px", cursor: "pointer", borderBottom: "1px solid #e0e0e0" }}
              onMouseEnter={e => e.currentTarget.style.background = "#e8e8ff"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}>
              {t.tag && (
                <span style={{ background: TAG_COLORS[t.tag] || "#808080", color: "#fff",
                  fontSize: "9px", padding: "0 3px", marginRight: "3px", fontWeight: "bold" }}>
                  {t.tag}
                </span>
              )}
              <div style={{ fontWeight: "bold", color: "#0000CC", lineHeight: 1.3, marginTop: "1px",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "140px" }}>
                {t.title}
              </div>
              <div style={{ color: "#808080", fontSize: "9px" }}>
                by {t.author_username || "Anonymous"}
              </div>
            </div>
          )) : (
            <div style={{ padding: "8px", color: "#808080", fontSize: "10px" }}>No threads yet.</div>
          )}
        </div>
      </div>

      {/* ── Retro banner ── */}
      <div className="win-panel" style={{ padding: 0 }}>
        <div className="win-title-bar" style={{ fontSize: "11px", padding: "2px 6px" }}>
          ⭐ Member Perks
        </div>
        <div style={{ padding: "8px", fontSize: "10px", lineHeight: 1.8 }}>
          <div>✅ Custom avatar</div>
          <div>✅ Profile GIF flair</div>
          <div>✅ Forum signature</div>
          <div>✅ Garage tracking</div>
          <div>✅ Lap time logs</div>
          <div>✅ Fuel economy log</div>
          <div style={{ marginTop: "6px", textAlign: "center" }}>
            <span className="rainbow-text" style={{ fontWeight: "bold", fontSize: "11px" }}>
              100% FREE!
            </span>
          </div>
        </div>
      </div>

      {/* ── Retro decoration ── */}
      <div style={{ textAlign: "center", fontSize: "10px", color: "#808080", lineHeight: 1.8 }}>
        <img
          src="https://media.giphy.com/media/3oEdv5e5Zd2gsczAFG/giphy.gif"
          alt=""
          style={{ width: "88px", marginBottom: "4px" }}
          onError={e => { e.target.style.display = "none"; }}
        />
        <div>🔧 Site Under</div>
        <div>Development 🔧</div>
        <div style={{ marginTop: "4px" }}>Best viewed in</div>
        <div>1024×768</div>
      </div>

    </div>
  );
}
