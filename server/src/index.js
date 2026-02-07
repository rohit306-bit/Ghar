import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import Razorpay from "razorpay";
import { z } from "zod";

import { pool, query } from "./db.js";
import { authenticate, requireRole, signToken } from "./auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const razorpayClient = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_key",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "rzp_test_secret",
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/auth/login", async (req, res) => {
  const bodySchema = z.object({ email: z.string().email(), password: z.string() });
  const parseResult = bodySchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const { email, password } = parseResult.data;

  try {
    const result = await query(
      "SELECT id, email, role, password_hash, full_name FROM users WHERE email = $1",
      [email]
    );

    if (!result.rows.length) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const matches = await bcrypt.compare(password, user.password_hash);
    if (!matches) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken(user);
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to login" });
  }
});

app.get("/api/properties", authenticate, async (req, res) => {
  const values = [];
  let queryText =
    "SELECT p.*, u.full_name AS owner_name FROM properties p JOIN users u ON p.owner_id = u.id";
  if (req.user.role === "owner") {
    queryText += " WHERE p.owner_id = $1";
    values.push(req.user.id);
  }

  try {
    const result = await query(queryText, values);
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch properties" });
  }
});

app.post("/api/properties", authenticate, requireRole("owner"), async (req, res) => {
  const bodySchema = z.object({
    name: z.string(),
    location: z.string(),
    model: z.enum(["management_fee", "revenue_share"]),
    feePercent: z.number().min(0).max(100),
    revenueSharePercent: z.number().min(0).max(100),
  });
  const parseResult = bodySchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const { name, location, model, feePercent, revenueSharePercent } = parseResult.data;

  try {
    const result = await query(
      `INSERT INTO properties (owner_id, name, location, model, fee_percent, revenue_share_percent)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, name, location, model, feePercent, revenueSharePercent]
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: "Unable to create property" });
  }
});

app.get("/api/reports/summary", authenticate, async (req, res) => {
  const values = [];
  let baseQuery = `
    SELECT
      p.id,
      p.name,
      p.location,
      p.model,
      p.fee_percent,
      p.revenue_share_percent,
      COALESCE(SUM(b.revenue), 0) AS total_revenue,
      COALESCE(SUM(e.amount), 0) AS total_expenses,
      COALESCE(SUM(b.revenue), 0) - COALESCE(SUM(e.amount), 0) AS gross_profit,
      CASE
        WHEN p.model = 'management_fee'
          THEN (COALESCE(SUM(b.revenue), 0) * (p.fee_percent / 100.0))
        ELSE (COALESCE(SUM(b.revenue), 0) * (p.revenue_share_percent / 100.0))
      END AS owner_earnings,
      CASE
        WHEN p.model = 'management_fee'
          THEN (COALESCE(SUM(b.revenue), 0) - (COALESCE(SUM(b.revenue), 0) * (p.fee_percent / 100.0)))
        ELSE (COALESCE(SUM(b.revenue), 0) - (COALESCE(SUM(b.revenue), 0) * (p.revenue_share_percent / 100.0)))
      END AS company_share
    FROM properties p
    LEFT JOIN bookings b ON p.id = b.property_id
    LEFT JOIN expenses e ON p.id = e.property_id
  `;

  if (req.user.role === "owner") {
    baseQuery += " WHERE p.owner_id = $1";
    values.push(req.user.id);
  }

  baseQuery += " GROUP BY p.id ORDER BY p.name";

  try {
    const result = await query(baseQuery, values);
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch report" });
  }
});

app.post(
  "/api/bookings",
  authenticate,
  requireRole("admin"),
  async (req, res) => {
    const bodySchema = z.object({
      propertyId: z.string().uuid(),
      guestName: z.string(),
      checkIn: z.string(),
      checkOut: z.string(),
      revenue: z.number().min(0),
    });
    const parseResult = bodySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const { propertyId, guestName, checkIn, checkOut, revenue } = parseResult.data;

    try {
      const result = await query(
        `INSERT INTO bookings (property_id, guest_name, check_in, check_out, revenue)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [propertyId, guestName, checkIn, checkOut, revenue]
      );
      return res.status(201).json(result.rows[0]);
    } catch (error) {
      return res.status(500).json({ error: "Unable to create booking" });
    }
  }
);

app.post(
  "/api/expenses",
  authenticate,
  requireRole("admin"),
  async (req, res) => {
    const bodySchema = z.object({
      propertyId: z.string().uuid(),
      description: z.string(),
      amount: z.number().min(0),
      category: z.string(),
      incurredOn: z.string(),
    });
    const parseResult = bodySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const { propertyId, description, amount, category, incurredOn } = parseResult.data;

    try {
      const result = await query(
        `INSERT INTO expenses (property_id, description, amount, category, incurred_on)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [propertyId, description, amount, category, incurredOn]
      );
      return res.status(201).json(result.rows[0]);
    } catch (error) {
      return res.status(500).json({ error: "Unable to create expense" });
    }
  }
);

app.post(
  "/api/payouts",
  authenticate,
  requireRole("admin"),
  async (req, res) => {
    const bodySchema = z.object({
      propertyId: z.string().uuid(),
      amount: z.number().min(0),
      paidOn: z.string(),
      notes: z.string().optional(),
    });
    const parseResult = bodySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const { propertyId, amount, paidOn, notes } = parseResult.data;

    try {
      const result = await query(
        `INSERT INTO payouts (property_id, amount, paid_on, notes)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [propertyId, amount, paidOn, notes || null]
      );
      return res.status(201).json(result.rows[0]);
    } catch (error) {
      return res.status(500).json({ error: "Unable to create payout" });
    }
  }
);

app.post("/api/payments/razorpay/order", authenticate, async (req, res) => {
  const bodySchema = z.object({
    amount: z.number().min(1),
    currency: z.string().default("INR"),
    receipt: z.string().optional(),
  });
  const parseResult = bodySchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  try {
    const order = await razorpayClient.orders.create({
      amount: Math.round(parseResult.data.amount * 100),
      currency: parseResult.data.currency,
      receipt: parseResult.data.receipt || `assetnest-${Date.now()}`,
    });
    return res.json(order);
  } catch (error) {
    return res.status(500).json({ error: "Unable to create Razorpay order" });
  }
});

app.get("/api/admin/overview", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const [properties, bookings, expenses, payouts] = await Promise.all([
      query("SELECT COUNT(*)::int AS total FROM properties"),
      query("SELECT COUNT(*)::int AS total FROM bookings"),
      query("SELECT COALESCE(SUM(amount), 0) AS total FROM expenses"),
      query("SELECT COALESCE(SUM(amount), 0) AS total FROM payouts"),
    ]);

    return res.json({
      properties: properties.rows[0].total,
      bookings: bookings.rows[0].total,
      expenses: expenses.rows[0].total,
      payouts: payouts.rows[0].total,
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch overview" });
  }
});

process.on("SIGTERM", async () => {
  await pool.end();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`AssetNest API running on port ${PORT}`);
});
