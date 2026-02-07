import React, { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const emptyForm = {
  name: "",
  location: "",
  model: "management_fee",
  feePercent: 12,
  revenueSharePercent: 20,
};

export default function Properties({ role, token }) {
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const fetchProperties = async () => {
      if (!token) {
        setProperties([
          {
            id: "offline-1",
            name: "Seabreeze Villas",
            location: "Goa",
            model: "management_fee",
            fee_percent: 12,
            revenue_share_percent: 0,
            owner_name: "Demo Owner",
          },
          {
            id: "offline-2",
            name: "Skyline Residences",
            location: "Bengaluru",
            model: "revenue_share",
            fee_percent: 0,
            revenue_share_percent: 18,
            owner_name: "Demo Owner",
          },
        ]);
        return;
      }

      const response = await fetch(`${API_URL}/api/properties`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const payload = await response.json();
        setProperties(payload);
      }
    };

    fetchProperties();
  }, [token]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({
      ...prev,
      [field]: field.includes("Percent") ? Number(value) : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(null);

    if (!token) {
      setStatus("Sign in to save new properties.");
      return;
    }

    const response = await fetch(`${API_URL}/api/properties`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    if (response.ok) {
      const payload = await response.json();
      setProperties((prev) => [payload, ...prev]);
      setForm(emptyForm);
      setStatus("Property created.");
    } else {
      setStatus("Unable to create property.");
    }
  };

  return (
    <div className="two-column">
      <section className="card">
        <h3>Properties</h3>
        <p>
          {role === "admin"
            ? "Full inventory of managed properties with ownership and fee models."
            : "Track each asset and configure management fee or revenue share."}
        </p>
        <div className="list">
          {properties.map((property) => (
            <article key={property.id} className="list-item">
              <div>
                <h4>{property.name}</h4>
                <p>{property.location}</p>
                <small>{property.owner_name ?? "Owner"}</small>
              </div>
              <div className="badge">
                {property.model === "management_fee"
                  ? `${property.fee_percent}% fee`
                  : `${property.revenue_share_percent}% share`}
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="card">
        <h3>Add property</h3>
        <p>Owners can add properties and choose the revenue model.</p>
        <form className="form" onSubmit={handleSubmit}>
          <label>
            Property name
            <input value={form.name} onChange={handleChange("name")} required />
          </label>
          <label>
            Location
            <input
              value={form.location}
              onChange={handleChange("location")}
              required
            />
          </label>
          <label>
            Revenue model
            <select value={form.model} onChange={handleChange("model")}>
              <option value="management_fee">Management fee</option>
              <option value="revenue_share">Revenue share</option>
            </select>
          </label>
          <div className="form-grid">
            <label>
              Management fee %
              <input
                type="number"
                value={form.feePercent}
                onChange={handleChange("feePercent")}
                min="0"
                max="100"
              />
            </label>
            <label>
              Revenue share %
              <input
                type="number"
                value={form.revenueSharePercent}
                onChange={handleChange("revenueSharePercent")}
                min="0"
                max="100"
              />
            </label>
          </div>
          <button type="submit">Save property</button>
          {status ? <p className="status">{status}</p> : null}
        </form>
      </section>
    </div>
  );
}
