# AssetNest

AssetNest is a full-stack property asset management platform for multi-property owners. It supports owner and admin roles, automated revenue split calculations, and integrated Razorpay payments.

## Tech stack

- React (Vite) frontend
- Node.js + Express backend
- PostgreSQL database
- Razorpay payments

## Setup

### Backend

```bash
cd server
npm install
```

Configure environment variables:

```bash
export DATABASE_URL=postgres://user:password@localhost:5432/assetnest
export JWT_SECRET=replace-me
export RAZORPAY_KEY_ID=rzp_test_key
export RAZORPAY_KEY_SECRET=rzp_test_secret
```

Load schema + seed data:

```bash
psql "$DATABASE_URL" -f db/schema.sql
psql "$DATABASE_URL" -f db/seed.sql
```

Start the API:

```bash
npm run dev
```

### Frontend

```bash
cd client
npm install
```

Optional API override:

```bash
export VITE_API_URL=http://localhost:4000
```

Start the UI:

```bash
npm run dev
```

### Demo accounts

- Owner: `owner@assetnest.local` / `AssetNest123`
- Admin: `admin@assetnest.local` / `AssetNest123`
