import React, { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const cards = [
  {
    title: "Live Portfolio Profit",
    value: "₹1.42M",
    detail: "Auto-calculated across all properties.",
  },
  {
    title: "Upcoming Payouts",
    value: "₹286K",
    detail: "Scheduled via Razorpay disbursements.",
  },
  {
    title: "Occupancy Health",
    value: "87%",
    detail: "Based on current booking pipeline.",
  },
];

export default function Dashboard({ role, token }) {
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    const fetchOverview = async () => {
      if (!token || role !== "admin") {
        return;
      }
      const response = await fetch(`${API_URL}/api/admin/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const payload = await response.json();
        setOverview(payload);
      }
    };

    fetchOverview();
  }, [role, token]);

  return (
    <div className="grid">
      <section className="card">
        <h3>Portfolio Insights</h3>
        <p>
          Track real-time revenue, costs, and earnings splits. AssetNest
          automatically computes management fees or revenue share models per
          property.
        </p>
        <div className="card-grid">
          {cards.map((card) => (
            <div key={card.title} className="mini-card">
              <h4>{card.title}</h4>
              <strong>{card.value}</strong>
              <p>{card.detail}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="card">
        <h3>Role-based Control Center</h3>
        <p>
          {role === "admin"
            ? "Admins oversee properties, bookings, expenses, and payouts with consolidated analytics."
            : "Owners can monitor individual property earnings and payout timelines."}
        </p>
        <div className="timeline">
          <div>
            <span>Revenue split calculated</span>
            <small>Automated nightly closing</small>
          </div>
          <div>
            <span>Expense approvals</span>
            <small>Centralized vendor ledger</small>
          </div>
          <div>
            <span>Owner payout scheduled</span>
            <small>Razorpay payout API</small>
          </div>
        </div>
      </section>
      <section className="card">
        <h3>Admin Snapshot</h3>
        <p>High-level operational stats for governance and audit readiness.</p>
        <div className="stat-grid">
          <div>
            <p>Properties</p>
            <strong>{overview?.properties ?? 42}</strong>
          </div>
          <div>
            <p>Bookings</p>
            <strong>{overview?.bookings ?? 318}</strong>
          </div>
          <div>
            <p>Expenses Logged</p>
            <strong>₹{overview?.expenses ?? "640K"}</strong>
          </div>
          <div>
            <p>Payouts</p>
            <strong>₹{overview?.payouts ?? "512K"}</strong>
          </div>
        </div>
      </section>
    </div>
  );
}
