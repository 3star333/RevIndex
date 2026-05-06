import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import API_URL from "../api/config";

// ── Preset profile GIFs ─────────────────────────────────────────────────────
// Only using self-hosted smilies + a few known-reliable external GIFs
const sm = (f) => `${API_URL}/smilies/${f}`;

const PRESET_GIFS = [
  // Self-hosted SVGs (always available)
  { label: "� Smile",     url: sm("icon_e_smile.svg")     },
  { label: "😎 Cool",      url: sm("icon_cool.svg")         },
  { label: "� LOL",       url: sm("icon_lol.svg")          },
  { label: "👍 Thumbs Up", url: sm("icon_thumbup.svg")      },
  { label: "🤔 Think",     url: sm("icon_think.svg")        },
  { label: "� Evil",      url: sm("icon_evil.svg")         },
  { label: "🤪 Crazy",     url: sm("icon_crazy.svg")        },
  { label: "👼 Angel",     url: sm("icon_angel.svg")        },
  { label: "� Clap",      url: sm("icon_clap.svg")         },
  { label: "� Mad",       url: sm("icon_mad.svg")          },
  { label: "🤫 Shh",       url: sm("icon_shh.svg")          },
  { label: "🙄 Rolleyes",  url: sm("icon_rolleyes.svg")     },
  // Reliable Tenor-hosted GIFs
  { label: "🔥 Fire",      url: "https://media.tenor.com/images/d3b3e30e4651a8b36f2f5d396a57b56f/tenor.gif" },
  { label: "🚗 Racing",    url: "https://media.tenor.com/images/da6f56fce80cd8df3484c4d0b40b41d4/tenor.gif" },
  { label: "⭐ Stars",     url: "https://media.tenor.com/images/47ffd7e2e44fe31cf3e36ab7a1bd6dc7/tenor.gif" },
];

export default function ProfilePage({ onClose }) {
  const { user, authHeader, login, token } = useAuth();
  const [tab,    setTab]    = useState("profile");
  const [form,   setForm]   = useState({
    bio:         user?.bio         || "",
    avatar_url:  user?.avatar_url  || "",
    profile_gif: user?.profile_gif || "",
    signature:   user?.signature   || "",
  });
  const [pwForm,     setPwForm]     = useState({ current_password: "", new_password: "", confirm: "" });
  const [msg,        setMsg]        = useState("");
  const [error,      setError]      = useState("");
  const [saving,     setSaving]     = useState(false);
  const [gifMode,    setGifMode]    = useState("preset"); // "preset" | "custom"
  const [uploading,  setUploading]  = useState(false);

  async function saveProfile(e) {
    e.preventDefault(); setMsg(""); setError(""); setSaving(true);
    try {
      const res  = await fetch(`${API_URL}/api/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      login(token, { ...user, ...data });
      setMsg("Profile saved!");
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function uploadAvatar(file) {
    setUploading(true); setMsg(""); setError("");
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res  = await fetch(`${API_URL}/api/auth/avatar`, {
        method: "POST",
        headers: authHeader(),
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm(f => ({ ...f, avatar_url: `${API_URL}${data.avatar_url}` }));
      login(token, { ...user, avatar_url: `${API_URL}${data.avatar_url}` });
      setMsg("Avatar uploaded!");
    } catch (err) { setError(err.message); }
    finally { setUploading(false); }
  }

  async function savePassword(e) {
    e.preventDefault(); setMsg(""); setError("");
    if (pwForm.new_password !== pwForm.confirm) return setError("Passwords do not match");
    setSaving(true);
    try {
      const res  = await fetch(`${API_URL}/api/auth/change-password`, {
        method: "PUT", headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ current_password: pwForm.current_password, new_password: pwForm.new_password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg("Password changed!");
      setPwForm({ current_password: "", new_password: "", confirm: "" });
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  const TABS = [
    { id: "profile",  label: "👤 Profile"  },
    { id: "flair",    label: "✨ Flair"    },
    { id: "password", label: "🔒 Password" },
  ];

  return (
    <div style={{ maxWidth: "520px", margin: "0 auto" }}>
      <div className="win-panel" style={{ padding: 0 }}>

        {/* Title bar */}
        <div className="win-title-bar">
          <span>👤</span>
          <span style={{ flex: 1 }}>Profile — {user?.username}</span>
          <button className="win-btn" style={{ minWidth: "18px", padding: "0 6px", fontSize: "11px" }} onClick={onClose}>✕</button>
        </div>

        {/* Rainbow divider */}
        <div style={{ height: "4px", background: "linear-gradient(to right,#FF0000,#FF7700,#FFFF00,#00CC00,#0000FF,#8800FF,#FF00FF)" }} />

        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: "2px solid #808080", background: "#C0C0C0" }}>
          {TABS.map(t => (
            <button key={t.id} className="win-btn"
              onClick={() => { setTab(t.id); setMsg(""); setError(""); }}
              style={{ border: "none", borderBottom: tab === t.id ? "2px solid #C0C0C0" : "none",
                background: tab === t.id ? "#C0C0C0" : "#a0a0a0",
                fontWeight: tab === t.id ? "bold" : "normal",
                padding: "4px 14px", fontSize: "12px", minWidth: "unset" }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: "16px" }}>
          {msg   && <div style={{ background: "#006400", color: "#fff", padding: "4px 8px", marginBottom: "10px", fontSize: "12px", fontWeight: "bold" }}>✓ {msg}</div>}
          {error && <div style={{ background: "#FF0000", color: "#fff", padding: "4px 8px", marginBottom: "10px", fontSize: "12px", fontWeight: "bold" }}>⚠ {error}</div>}

          {/* ══ PROFILE TAB ══ */}
          {tab === "profile" && (
            <form onSubmit={saveProfile} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

              {/* Live preview card */}
              <div style={{ border: "2px inset #808080", background: "#000080", color: "#fff", padding: "10px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                  <div style={{ width: "56px", height: "56px", border: "2px outset #fff", background: "#404040", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {form.avatar_url
                      ? <img src={form.avatar_url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontSize: "26px" }}>👤</span>}
                  </div>
                  {form.profile_gif && (
                    <img src={form.profile_gif} alt="flair" style={{ width: "56px", objectFit: "cover" }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: "bold", fontSize: "13px", color: "#FFD700" }}>{user?.username}</div>
                  <div style={{ fontSize: "11px", marginTop: "4px", fontStyle: "italic", color: "#ddd" }}>
                    {form.bio || <span style={{ opacity: 0.5 }}>No bio set.</span>}
                  </div>
                  {form.signature && (
                    <div style={{ marginTop: "6px", borderTop: "1px solid #4060a0", paddingTop: "4px", fontSize: "10px", color: "#a0c0ff", fontStyle: "italic" }}>
                      {form.signature}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Profile Picture</label>
                {/* File upload */}
                <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
                  <label className="win-btn" style={{ cursor: "pointer", fontSize: "11px", padding: "2px 10px", minWidth: "unset" }}>
                    {uploading ? "⏳ Uploading..." : "📁 Upload Image"}
                    <input type="file" accept="image/*" style={{ display: "none" }}
                      onChange={e => e.target.files[0] && uploadAvatar(e.target.files[0])} />
                  </label>
                  <span style={{ fontSize: "10px", color: "#808080", alignSelf: "center" }}>max 2MB · or paste URL below</span>
                </div>
                <input className="win-input" placeholder="https://i.imgur.com/yourimage.gif"
                  style={{ width: "100%" }}
                  value={form.avatar_url} onChange={e => setForm(f => ({ ...f, avatar_url: e.target.value }))} />
                <div style={{ fontSize: "10px", color: "#808080", marginTop: "2px" }}>GIFs & PNGs welcome.</div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Bio</label>
                <textarea className="win-input" rows={3} style={{ width: "100%", resize: "vertical" }}
                  placeholder="Tell us about yourself and your builds..."
                  value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
              </div>

              <button type="submit" className="win-btn win-btn-primary" disabled={saving}>
                {saving ? "[ Saving... ]" : "[ Save Profile ]"}
              </button>
            </form>
          )}

          {/* ══ FLAIR TAB ══ */}
          {tab === "flair" && (
            <form onSubmit={saveProfile} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

              <div className="bg-construction" style={{ padding: "3px 8px", textAlign: "center", fontSize: "11px", fontWeight: "bold", color: "#000", border: "2px outset #fff" }}>
                ⚠️ CUSTOMIZE YOUR PROFILE FLAIR ⚠️
              </div>

              {/* Profile GIF */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "6px" }}>
                  🎞️ Profile GIF <span style={{ fontWeight: "normal", color: "#808080" }}>(shows on your posts)</span>
                </label>

                <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
                  {["preset", "custom"].map(m => (
                    <button key={m} type="button" className="win-btn"
                      style={{ minWidth: "unset", padding: "2px 10px", fontSize: "11px",
                        background: gifMode === m ? "#000080" : "#C0C0C0",
                        color: gifMode === m ? "#fff" : "#000" }}
                      onClick={() => setGifMode(m)}>
                      {m === "preset" ? "🗂️ Presets" : "🔗 Custom URL"}
                    </button>
                  ))}
                  {form.profile_gif && (
                    <button type="button" className="win-btn"
                      style={{ minWidth: "unset", padding: "2px 10px", fontSize: "11px", background: "#8B0000", color: "#fff" }}
                      onClick={() => setForm(f => ({ ...f, profile_gif: "" }))}>
                      ✕ Remove
                    </button>
                  )}
                </div>

                {gifMode === "preset" && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "4px", border: "2px inset #808080", padding: "6px", background: "#1a1a1a", maxHeight: "220px", overflowY: "auto" }}>
                    {PRESET_GIFS.map(g => (
                      <button key={g.url} type="button"
                        onClick={() => setForm(f => ({ ...f, profile_gif: g.url }))}
                        style={{ border: form.profile_gif === g.url ? "3px solid #FFD700" : "2px outset #808080",
                          background: "#000", padding: "2px", cursor: "pointer",
                          display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                        <img src={g.url} alt={g.label} style={{ width: "52px", height: "38px", objectFit: "cover" }}
                          onError={e => { e.target.style.display = "none"; }} />
                        <span style={{ fontSize: "9px", color: "#ccc", textAlign: "center", lineHeight: 1.1 }}>{g.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {gifMode === "custom" && (
                  <div>
                    <input className="win-input" placeholder="https://media.giphy.com/... or any GIF URL"
                      style={{ width: "100%" }}
                      value={form.profile_gif} onChange={e => setForm(f => ({ ...f, profile_gif: e.target.value }))} />
                    <div style={{ fontSize: "10px", color: "#808080", marginTop: "2px" }}>
                      Tip: right-click any GIF → "Copy image address" and paste here.
                    </div>
                  </div>
                )}

                {form.profile_gif && (
                  <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "11px", color: "#808080" }}>Preview:</span>
                    <div style={{ border: "2px inset #808080", background: "#404040", padding: "4px", display: "inline-block" }}>
                      <img src={form.profile_gif} alt="preview" style={{ height: "48px", maxWidth: "96px", objectFit: "contain" }} />
                    </div>
                  </div>
                )}
              </div>

              <hr className="win-groove" />

              {/* Signature */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>
                  ✍️ Forum Signature <span style={{ fontWeight: "normal", color: "#808080" }}>(below every post)</span>
                </label>
                <textarea className="win-input" rows={3} style={{ width: "100%", resize: "vertical" }}
                  maxLength={200}
                  placeholder={`e.g. "Built not bought." | 2003 WRX STI | Daily driver 🚗`}
                  value={form.signature} onChange={e => setForm(f => ({ ...f, signature: e.target.value }))} />
                <div style={{ fontSize: "10px", color: form.signature.length > 180 ? "#FF0000" : "#808080", textAlign: "right", marginTop: "2px" }}>
                  {form.signature.length}/200
                </div>
              </div>

              <button type="submit" className="win-btn win-btn-primary" disabled={saving}>
                {saving ? "[ Saving... ]" : "[ Save Flair ]"}
              </button>
            </form>
          )}

          {/* ══ PASSWORD TAB ══ */}
          {tab === "password" && (
            <form onSubmit={savePassword} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Current Password</label>
                <input className="win-input" type="password" style={{ width: "100%" }}
                  value={pwForm.current_password} onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))} required />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>New Password</label>
                <input className="win-input" type="password" style={{ width: "100%" }}
                  value={pwForm.new_password} onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))} required />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Confirm New Password</label>
                <input className="win-input" type="password" style={{ width: "100%" }}
                  value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required />
              </div>
              <button type="submit" className="win-btn win-btn-primary" disabled={saving}>
                {saving ? "[ Saving... ]" : "[ Change Password ]"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
