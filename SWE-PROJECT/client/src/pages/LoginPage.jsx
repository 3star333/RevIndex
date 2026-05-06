import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import API_URL from "../api/config";

export default function LoginPage({ onSuccess, onGoRegister }) {
  const { login } = useAuth();
  const [form,       setForm]       = useState({ login: "", password: "" });
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resending,  setResending]  = useState(false);
  const [resendMsg,  setResendMsg]  = useState("");

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

  async function handleResend(e) {
    e.preventDefault();
    setResending(true); setResendMsg("");
    try {
      const res = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      });
      const d = await res.json();
      setResendMsg(res.ok ? d.message : d.error);
    } catch {
      setResendMsg("Failed to send. Please try again.");
    } finally {
      setResending(false);
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

          {/* Resend verification section */}
          <div style={{ marginTop: "12px", borderTop: "1px solid #808080", paddingTop: "10px" }}>
            <div style={{ textAlign: "center", fontSize: "11px", color: "#808080", marginBottom: "6px" }}>
              Didn't receive a verification email?
            </div>
            <form onSubmit={handleResend} style={{ display: "flex", gap: "4px" }}>
              <input
                className="win-input"
                type="email"
                placeholder="your@email.com"
                style={{ flex: 1, fontSize: "11px" }}
                value={resendEmail}
                onChange={e => setResendEmail(e.target.value)}
                required
              />
              <button type="submit" className="win-btn" style={{ fontSize: "11px", whiteSpace: "nowrap" }} disabled={resending}>
                {resending ? "Sending..." : "[ Resend ]"}
              </button>
            </form>
            {resendMsg && (
              <div style={{ fontSize: "11px", marginTop: "5px", color: resendMsg.toLowerCase().includes("sent") || resendMsg.toLowerCase().includes("resent") ? "#008000" : "#FF0000", textAlign: "center" }}>
                {resendMsg}
              </div>
            )}
          </div>

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
