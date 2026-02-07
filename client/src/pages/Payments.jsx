import React, { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function Payments({ token }) {
  const [amount, setAmount] = useState(25000);
  const [status, setStatus] = useState(null);
  const [order, setOrder] = useState(null);

  const createOrder = async () => {
    setStatus(null);
    if (!token) {
      setStatus("Sign in to create a Razorpay order.");
      return;
    }
    const response = await fetch(`${API_URL}/api/payments/razorpay/order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount, currency: "INR" }),
    });

    if (response.ok) {
      const payload = await response.json();
      setOrder(payload);
      setStatus("Order created in Razorpay.");
    } else {
      setStatus("Unable to create order.");
    }
  };

  return (
    <div className="two-column">
      <section className="card">
        <h3>Razorpay payouts</h3>
        <p>
          Create payout-ready Razorpay orders for owner disbursements, security
          deposits, or vendor payments.
        </p>
        <div className="form">
          <label>
            Amount (INR)
            <input
              type="number"
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
              min="1"
            />
          </label>
          <button onClick={createOrder}>Create Razorpay order</button>
          {status ? <p className="status">{status}</p> : null}
        </div>
      </section>
      <section className="card">
        <h3>Payment audit log</h3>
        <p>Keep audit-ready metadata for every payout and booking.</p>
        {order ? (
          <div className="order-box">
            <div>
              <span>Order ID</span>
              <strong>{order.id}</strong>
            </div>
            <div>
              <span>Amount</span>
              <strong>₹{(order.amount / 100).toLocaleString()}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{order.status}</strong>
            </div>
          </div>
        ) : (
          <p className="empty">No order created yet.</p>
        )}
      </section>
    </div>
  );
}
