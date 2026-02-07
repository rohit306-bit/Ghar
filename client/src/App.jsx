import React, { useMemo, useState } from "react";
import Dashboard from "./pages/Dashboard.jsx";
import Properties from "./pages/Properties.jsx";
import Reports from "./pages/Reports.jsx";
import Payments from "./pages/Payments.jsx";
import LoginPanel from "./components/LoginPanel.jsx";

const navItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "properties", label: "Properties" },
  { id: "reports", label: "Reports" },
  { id: "payments", label: "Payments" },
];

export default function App() {
  const [active, setActive] = useState("dashboard");
  const [session, setSession] = useState(null);

  const role = session?.user?.role ?? "owner";
  const page = useMemo(() => {
    switch (active) {
      case "properties":
        return <Properties role={role} token={session?.token} />;
      case "reports":
        return <Reports role={role} token={session?.token} />;
      case "payments":
        return <Payments role={role} token={session?.token} />;
      default:
        return <Dashboard role={role} token={session?.token} />;
    }
  }, [active, role, session]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">🏡</span>
          <div>
            <h1>AssetNest</h1>
            <p>Multi-property asset command</p>
          </div>
        </div>
        <nav>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-link ${active === item.id ? "active" : ""}`}
              onClick={() => setActive(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="role-card">
          <p className="eyebrow">Current role</p>
          <h3>{role === "admin" ? "Administrator" : "Owner"}</h3>
          <p>{session?.user?.email ?? "Sign in to sync data"}</p>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div>
            <h2>{navItems.find((item) => item.id === active)?.label}</h2>
            <p>Automated earnings, payouts, and operational control.</p>
          </div>
          <LoginPanel session={session} onSessionChange={setSession} />
        </header>
        <section className="content">{page}</section>
      </main>
    </div>
  );
}
