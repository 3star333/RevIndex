import { useState } from "react";
import API_URL from "../api/config";

export default function RegisterPage({ onGoLogin }) {
  const [form,    setForm]    = useState({ username: "", email: "", password: "", confirm: "" });
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm)
      return setError("Passwords do not match");
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.username, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) return (
    <div style={{ maxWidth: "360px", margin: "0 auto" }}>
      <div className="win-panel" style={{ padding: 0 }}>
        <div className="win-title-bar"><span>✅</span><span style={{ flex: 1 }}>Registration Successful</span></div>
        <div style={{ padding: "20px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>🎉</div>
          <div style={{ fontWeight: "bold", marginBottom: "8px" }}>Account created!</div>
          <div style={{ fontSize: "12px", color: "#808080", marginBottom: "16px" }}>
            You can log in now.
          </div>
          <button className="win-btn win-btn-primary" onClick={onGoLogin}>[ Go to Login ]</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: "360px", margin: "0 auto" }}>
      <div className="win-panel" style={{ padding: 0 }}>
        <div className="win-title-bar">
          <span>📝</span>
          <span style={{ flex: 1 }}>Register — RevIndex</span>
        </div>
        <div style={{ padding: "16px" }}>
          {error && (
            <div style={{ background: "#FF0000", color: "#fff", padding: "4px 8px", marginBottom: "10px", fontWeight: "bold", fontSize: "12px" }}>
              ⚠ {error}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Username <span style={{ color: "#808080" }}>(3–20 chars, letters/numbers/_)</span></label>
              <input className="win-input" style={{ width: "100%" }} autoFocus
                value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Email Address</label>
              <input className="win-input" type="email" style={{ width: "100%" }}
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Password <span style={{ color: "#808080" }}>(min 6 chars)</span></label>
              <input className="win-input" type="password" style={{ width: "100%" }}
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Confirm Password</label>
              <input className="win-input" type="password" style={{ width: "100%" }}
                value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} required />
            </div>
            <button type="submit" className="win-btn win-btn-primary" disabled={loading} style={{ marginTop: "4px" }}>
              {loading ? "[ Creating account... ]" : "[ Create Account ]"}
            </button>
          </form>
          <div style={{ marginTop: "12px", textAlign: "center", fontSize: "11px", color: "#808080" }}>
            Already have an account?{" "}
            <button className="win-btn" style={{ fontSize: "11px", padding: "1px 6px" }} onClick={onGoLogin}>
              Login here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
