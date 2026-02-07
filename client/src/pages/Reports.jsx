import React, { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const fallback = [
  {
    id: "1",
    name: "Seabreeze Villas",
    location: "Goa",
    model: "management_fee",
    fee_percent: 12,
    revenue_share_percent: 0,
    total_revenue: 820000,
    total_expenses: 210000,
    gross_profit: 610000,
    owner_earnings: 98400,
    company_share: 721600,
  },
];

export default function Reports({ role, token }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const fetchReports = async () => {
      if (!token) {
        setRows(fallback);
        return;
      }
      const response = await fetch(`${API_URL}/api/reports/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const payload = await response.json();
        setRows(payload);
      }
    };

    fetchReports();
  }, [token]);

  return (
    <section className="card">
      <h3>Revenue & profit reports</h3>
      <p>
        {role === "admin"
          ? "Monitor portfolio-wide revenue splits, costs, and profit per property."
          : "Track earnings and payout-ready profits for each property."}
      </p>
      <div className="table">
        <div className="table-row header">
          <span>Property</span>
          <span>Revenue</span>
          <span>Expenses</span>
          <span>Gross profit</span>
          <span>Owner earnings</span>
          <span>Company share</span>
        </div>
        {rows.map((row) => (
          <div key={row.id} className="table-row">
            <span>
              {row.name}
              <small>{row.location}</small>
            </span>
            <span>₹{Number(row.total_revenue).toLocaleString()}</span>
            <span>₹{Number(row.total_expenses).toLocaleString()}</span>
            <span>₹{Number(row.gross_profit).toLocaleString()}</span>
            <span>₹{Number(row.owner_earnings).toLocaleString()}</span>
            <span>₹{Number(row.company_share).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
