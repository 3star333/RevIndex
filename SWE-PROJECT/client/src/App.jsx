import { useState } from "react";
import MarqueeLib from "react-fast-marquee";
const Marquee = MarqueeLib.default ?? MarqueeLib;
import VehiclesPage  from "./pages/VehiclesPage";
import VehicleDetail from "./pages/VehicleDetail";
import GaragePage    from "./pages/GaragePage";
import ThreadPage    from "./pages/ThreadPage";
import LoginPage     from "./pages/LoginPage";
import RegisterPage  from "./pages/RegisterPage";
import ProfilePage   from "./pages/ProfilePage";
import { useAuth }   from "./context/AuthContext";

const NAV = ["Forum", "Garage"];

export default function App() {
  const { user, logout, loading } = useAuth();
  const [page,            setPage]            = useState("Forum");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedThread,  setSelectedThread]  = useState(null);
  const [authPage,        setAuthPage]        = useState(null); // "login" | "register" | "profile" | null

  function navigate(dest, vehicle = null) {
    setSelectedVehicle(vehicle);
    setSelectedThread(null);
    setAuthPage(null);
    setPage(dest);
  }

  function openThread(thread) {
    setSelectedThread(thread);
    setPage("Forum");
    setSelectedVehicle(null);
    setAuthPage(null);
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#C0C0C0", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="win-panel" style={{ padding: "20px 40px", fontSize: "14px" }}>Loading RevIndex...</div>
    </div>
  );

  const activePage = authPage ? authPage : selectedVehicle ? "VehicleDetail" : page;

  return (
    <div style={{ minHeight: "100vh", background: "#C0C0C0" }}>
      <div className="app-container">

      {/* ── Title bar ──────────────────────────────────────────────── */}
      <div className="win-title-bar" style={{ padding: "4px 8px", fontSize: "14px" }}>
        <span>🚗</span>
        <span style={{ flex: 1 }}>
          RevIndex — Vehicle Tracking System v1.0
        </span>
        <button
          className="win-btn"
          style={{ minWidth: "18px", padding: "0 6px", fontSize: "11px", lineHeight: "16px" }}
        >_</button>
        <button
          className="win-btn"
          style={{ minWidth: "18px", padding: "0 6px", fontSize: "11px", lineHeight: "16px" }}
        >□</button>
        <button
          className="win-btn"
          style={{ minWidth: "18px", padding: "0 6px", fontSize: "11px", lineHeight: "16px" }}
        >✕</button>
      </div>

      {/* ── Menu bar ───────────────────────────────────────────────── */}
      <div
        className="win-outset"
        style={{ background: "#C0C0C0", padding: "2px 4px", display: "flex", gap: "2px", alignItems: "center" }}
      >
        {NAV.map((n) => (
          <button
            key={n}
            onClick={() => navigate(n)}
            className="win-btn"
            style={{
              minWidth: "80px",
              background: activePage === n ? "#000080" : "#C0C0C0",
              color:      activePage === n ? "#ffffff"  : "#000000",
              fontWeight: activePage === n ? "bold"     : "normal",
            }}
          >
            {n}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        {/* Auth area */}
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {user.avatar_url && (
              <img src={user.avatar_url} alt="avatar"
                style={{ width: "20px", height: "20px", objectFit: "cover", border: "1px solid #808080" }} />
            )}
            <span style={{ fontSize: "11px", fontWeight: "bold", color: "#000080", cursor: "pointer" }}
              onClick={() => setAuthPage("profile")}>
              {user.username}
            </span>
            <button className="win-btn" style={{ fontSize: "10px", padding: "1px 6px" }} onClick={logout}>
              Logout
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "2px" }}>
            <button className="win-btn" style={{ fontSize: "11px" }} onClick={() => setAuthPage("login")}>Login</button>
            <button className="win-btn" style={{ fontSize: "11px", background: "#000080", color: "#fff" }} onClick={() => setAuthPage("register")}>Register</button>
          </div>
        )}

        {/* Hit counter */}
        <span style={{ fontSize: "11px", marginLeft: "8px", marginRight: "4px" }}>Visitors:</span>
        <span className="win-counter">001337</span>
      </div>

      {/* ── Marquee announcement ────────────────────────────────────── */}
      <div
        className="bg-construction"
        style={{ padding: "2px 0" }}
      >
        <div style={{ background: "#000080", margin: "2px", padding: "2px 0" }}>
          <Marquee speed={40} gradient={false} style={{ color: "#FFFF00", fontWeight: "bold", fontSize: "12px" }}>
            &nbsp;&nbsp;&nbsp;★ WELCOME TO REVINDEX ★ Track your vehicles! Score car deals! Upload photos! &nbsp;&nbsp;&nbsp;
            ★ Best viewed in 800×600 resolution ★ &nbsp;&nbsp;&nbsp;
            ★ FREE to use! No registration required! ★ &nbsp;&nbsp;&nbsp;
          </Marquee>
        </div>
      </div>

      {/* ── Main window ────────────────────────────────────────────── */}
      <div style={{ padding: "8px", maxWidth: "960px", margin: "0 auto" }}>
        <div className="win-panel" style={{ padding: "0" }}>
          <div className="win-title-bar">
            <span>📁</span>
            <span style={{ flex: 1 }}>
              {authPage === "login"    ? "Login"
                : authPage === "register" ? "Register"
                : authPage === "profile"  ? "My Profile"
                : selectedVehicle
                ? `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model} — Detail`
                : selectedThread
                ? `Forum › ${selectedThread.title}`
                : page}
            </span>
          </div>

          <div style={{ padding: "12px", background: "#C0C0C0" }}>
            {authPage === "login" ? (
              <LoginPage
                onSuccess={() => setAuthPage(null)}
                onGoRegister={() => setAuthPage("register")}
              />
            ) : authPage === "register" ? (
              <RegisterPage onGoLogin={() => setAuthPage("login")} />
            ) : authPage === "profile" ? (
              <ProfilePage onClose={() => setAuthPage(null)} />
            ) : selectedVehicle ? (
              <VehicleDetail vehicle={selectedVehicle} onBack={() => navigate("Garage")} />
            ) : page === "Forum" && selectedThread ? (
              <ThreadPage thread={selectedThread} onBack={() => setSelectedThread(null)} />
            ) : page === "Forum" ? (
              <GaragePage onOpenThread={openThread} />
            ) : (
              <VehiclesPage onSelect={(v) => navigate("VehicleDetail", v)} />
            )}
          </div>
        </div>
      </div>

      {/* ── Status bar ─────────────────────────────────────────────── */}
      <div
        className="win-inset"
        style={{ margin: "0 8px 8px", padding: "2px 8px", fontSize: "11px", display: "flex", gap: "16px" }}
      >
        <span>Ready</span>
        <span>|</span>
        <span>RevIndex v1.0</span>
        <span>|</span>
        <span className="blink" style={{ color: "#FF0000", fontWeight: "bold" }}>● LIVE</span>
      </div>
      </div>{/* app-container */}
    </div>
  );
}
