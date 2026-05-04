import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import API_URL from "../api/config";

export default function ProfilePage({ onClose }) {
  const { user, authHeader, login, token } = useAuth();
  const [tab,     setTab]     = useState("profile");
  const [form,    setForm]    = useState({ bio: user?.bio || "", avatar_url: user?.avatar_url || "" });
  const [pwForm,  setPwForm]  = useState({ current_password: "", new_password: "", confirm: "" });
  const [msg,     setMsg]     = useState("");
  const [error,   setError]   = useState("");
  const [saving,  setSaving]  = useState(false);

  async function saveProfile(e) {
    e.preventDefault(); setMsg(""); setError(""); setSaving(true);
    try {
      const res  = await fetch(`${API_URL}/api/auth/profile`, {
        method: "PUT", headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ bio: form.bio, avatar_url: form.avatar_url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      login(token, { ...user, ...data });
      setMsg("Profile saved!");
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
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

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto" }}>
      <div className="win-panel" style={{ padding: 0 }}>
        <div className="win-title-bar">
          <span>👤</span>
          <span style={{ flex: 1 }}>Profile — {user?.username}</span>
          <button className="win-btn" style={{ minWidth: "18px", padding: "0 6px", fontSize: "11px" }} onClick={onClose}>✕</button>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: "2px solid #808080", background: "#C0C0C0" }}>
          {["profile", "password"].map(t => (
            <button key={t} className="win-btn" onClick={() => { setTab(t); setMsg(""); setError(""); }}
              style={{ border: "none", borderBottom: tab === t ? "2px solid #C0C0C0" : "none",
                background: tab === t ? "#C0C0C0" : "#a0a0a0", fontWeight: tab === t ? "bold" : "normal",
                padding: "4px 16px", fontSize: "12px" }}>
              {t === "profile" ? "👤 Profile" : "🔒 Password"}
            </button>
          ))}
        </div>

        <div style={{ padding: "16px" }}>
          {msg   && <div style={{ background: "#006400", color: "#fff", padding: "4px 8px", marginBottom: "10px", fontSize: "12px", fontWeight: "bold" }}>✓ {msg}</div>}
          {error && <div style={{ background: "#FF0000", color: "#fff", padding: "4px 8px", marginBottom: "10px", fontSize: "12px", fontWeight: "bold" }}>⚠ {error}</div>}

          {tab === "profile" && (
            <form onSubmit={saveProfile} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

              {/* Avatar preview */}
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div style={{ width: "64px", height: "64px", border: "2px inset #808080", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {form.avatar_url
                    ? <img src={form.avatar_url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: "28px" }}>👤</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "2px" }}>Username</div>
                  <div style={{ fontFamily: "Courier New", fontSize: "14px", color: "#000080" }}>{user?.username}</div>
                  <div style={{ fontSize: "10px", color: "#808080", marginTop: "2px" }}>{user?.email}</div>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Avatar URL</label>
                <input className="win-input" style={{ width: "100%" }} placeholder="https://i.imgur.com/yourimage.jpg"
                  value={form.avatar_url} onChange={e => setForm(f => ({ ...f, avatar_url: e.target.value }))} />
                <div style={{ fontSize: "10px", color: "#808080", marginTop: "2px" }}>Paste a direct image link (Imgur, etc.)</div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Bio</label>
                <textarea className="win-input" rows={4} style={{ width: "100%", resize: "vertical" }}
                  placeholder="Tell us about yourself and your cars..."
                  value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
              </div>

              <button type="submit" className="win-btn win-btn-primary" disabled={saving}>
                {saving ? "[ Saving... ]" : "[ Save Profile ]"}
              </button>
            </form>
          )}

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
