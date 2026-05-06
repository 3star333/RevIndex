import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import API_URL from "../api/config";

export default function LoginPage({ onSuccess, onGoRegister }) {
  const { login } = useAuth();
  const [form,    setForm]    = useState({ login: "", password: "" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      login(data.token, data.user);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: "360px", margin: "0 auto" }}>
      <div className="win-panel" style={{ padding: 0 }}>
        <div className="win-title-bar">
          <span>🔐</span>
          <span style={{ flex: 1 }}>Login — RevIndex</span>
        </div>
        <div style={{ padding: "16px" }}>
          {error && (
            <div style={{ background: "#FF0000", color: "#fff", padding: "4px 8px", marginBottom: "10px", fontWeight: "bold", fontSize: "12px" }}>
              ⚠ {error}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Username or Email</label>
              <input className="win-input" style={{ width: "100%" }}
                autoFocus value={form.login}
                onChange={e => setForm(f => ({ ...f, login: e.target.value }))} required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>Password</label>
              <input className="win-input" type="password" style={{ width: "100%" }}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <button type="submit" className="win-btn win-btn-primary" disabled={loading} style={{ marginTop: "4px" }}>
              {loading ? "[ Logging in... ]" : "[ Login ]"}
            </button>
          </form>
          <div style={{ marginTop: "12px", textAlign: "center", fontSize: "11px", color: "#808080" }}>
            No account?{" "}
            <button className="win-btn" style={{ fontSize: "11px", padding: "1px 6px" }} onClick={onGoRegister}>
              Register here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

