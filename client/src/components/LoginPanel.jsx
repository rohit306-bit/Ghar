import React, { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function LoginPanel({ session, onSessionChange }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(null);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const payload = await response.json();
      onSessionChange(payload);
      setEmail("");
      setPassword("");
    } catch (error) {
      setStatus("Unable to sign in. Check credentials.");
    }
  };

  if (session) {
    return (
      <div className="session-info">
        <div>
          <p className="eyebrow">Signed in</p>
          <strong>{session.user.fullName}</strong>
        </div>
        <button
          className="secondary"
          onClick={() => {
            onSessionChange(null);
          }}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <form className="login-panel" onSubmit={handleSubmit}>
      <div>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="owner@assetnest.local"
          required
        />
      </div>
      <div>
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="AssetNest123"
          required
        />
      </div>
      <button type="submit">Sign in</button>
      {status ? <p className="status">{status}</p> : null}
    </form>
  );
}
