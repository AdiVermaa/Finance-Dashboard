# Zorvyn — Finance Data Processing & Access Control Backend

A full-stack **MERN** application for finance dashboard management with JWT authentication, role-based access control, analytics APIs, and a clean React frontend.

---

## Tech Stack

| Layer     | Technology                      |
|-----------|----------------------------------|
| Backend   | Node.js, Express.js              |
| Database  | MongoDB + Mongoose               |
| Auth      | JWT (jsonwebtoken + bcryptjs)    |
| Frontend  | React (Vite), Recharts           |
| Styling   | Vanilla CSS (dark design system) |

---

## Project Structure

```
Zorvyn/
├── server/
│   ├── config/        # DB connection
│   ├── controllers/   # authController, userController, transactionController, dashboardController
│   ├── middleware/    # auth (JWT + RBAC), validate, errorHandler
│   ├── models/        # User, Transaction (Mongoose schemas)
│   ├── routes/        # auth, users, transactions, dashboard
│   ├── utils/         # seed.js (DB seeder)
│   ├── index.js       # Express app entry point
│   └── .env           # Environment variables
└── client/
    └── src/
        ├── api/        # Axios instance with interceptors
        ├── components/ # Sidebar, ProtectedRoute, StatCard
        ├── context/    # AuthContext (React Context)
        └── pages/      # Login, Dashboard, Transactions, Users
```

---

## Setup & Run

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally (`mongodb://localhost:27017`)

### 1. Backend

```bash
cd server
npm install
# Optional: seed demo data
node utils/seed.js
# Start dev server
npm run dev
```
Server runs on **http://localhost:5000**

### 2. Frontend

```bash
cd client
npm install
npm run dev
```
Frontend runs on **http://localhost:5173** (proxies `/api` → port 5000)

---

## Test Credentials (after seeding)

| Role    | Email                  | Password    |
|---------|------------------------|-------------|
| Admin   | admin@zorvyn.com       | admin123    |
| Analyst | analyst@zorvyn.com     | analyst123  |
| Viewer  | viewer@zorvyn.com      | viewer123   |

---

## API Reference

### Auth  `POST /api/auth/...`

| Method | Endpoint           | Description           | Auth |
|--------|--------------------|-----------------------|------|
| POST   | `/auth/register`   | Register a new user   | No   |
| POST   | `/auth/login`      | Login, returns JWT    | No   |
| GET    | `/auth/me`         | Get current user      | Yes  |

### Transactions  `GET/POST/PATCH/DELETE /api/transactions/...`

| Method | Endpoint              | Roles allowed          |
|--------|-----------------------|------------------------|
| GET    | `/transactions`       | viewer, analyst, admin |
| GET    | `/transactions/:id`   | viewer, analyst, admin |
| POST   | `/transactions`       | analyst, admin         |
| PATCH  | `/transactions/:id`   | analyst (own), admin   |
| DELETE | `/transactions/:id`   | admin (soft delete)    |

Supports query filters: `type`, `category`, `startDate`, `endDate`, `page`, `limit`, `sortBy`, `order`.

### Dashboard Analytics  `GET /api/dashboard/...`

| Endpoint                       | Description                          | Roles          |
|-------------------------------|--------------------------------------|----------------|
| `/dashboard/summary`          | Total income, expenses, net balance  | analyst, admin |
| `/dashboard/trends`           | Monthly/weekly income vs expense     | analyst, admin |
| `/dashboard/category-totals`  | Per-category aggregated totals       | analyst, admin |

### Users  `GET/PATCH/DELETE /api/users/...`

| Method | Endpoint       | Description            | Roles |
|--------|----------------|------------------------|-------|
| GET    | `/users`       | List users (paginated) | admin |
| GET    | `/users/:id`   | Get single user        | admin |
| PATCH  | `/users/:id`   | Update role/status     | admin |
| DELETE | `/users/:id`   | Hard delete user       | admin |

---

## Role-Based Access Control

```
viewer   → Read transactions only
analyst  → Read + Create + Edit own transactions + Access dashboard analytics
admin    → Full access: all of the above + Delete + User management
```

Implemented via `authorize(...roles)` middleware applied at the route level.

---

## Key Design Decisions & Assumptions

1. **Soft Delete for Transactions** — Transactions are never hard-deleted; `isDeleted: true` hides them from all standard queries (via Mongoose pre-query hook). This preserves audit trails.

2. **Analyst Ownership Guard** — Analysts can only PATCH transactions they themselves created. Admins can edit any.

3. **Dashboard restricted to analyst+** — Viewers only see the transactions list; aggregated analytics require at least `analyst` role.

4. **Rate Limiting** — Global 100 req/15 min per IP via `express-rate-limit` to protect public auth endpoints.

5. **Password Security** — Passwords are hashed with `bcryptjs` (cost factor 12). The password field is excluded from all query results via `select: false`.

6. **Input Validation** — All mutating endpoints use `express-validator` chains. A centralized `validate` middleware returns structured `{ field, message }` error arrays.

7. **JWT Expiry** — Tokens expire in 7 days. The Axios interceptor redirects to `/login` on any 401 globally.

8. **No external auth provider** — JWT-based local auth is used for simplicity, as allowed by the assignment.

---

## Environment Variables (`server/.env`)

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/zorvyn_finance
JWT_SECRET=zorvyn_super_secret_jwt_key_2024
JWT_EXPIRES_IN=7d
NODE_ENV=development
```
