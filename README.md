# 💰 Finance Dashboard Backend

A production-ready REST API for a **Finance Data Processing and Access Control** system built with **Node.js**, **Express**, and **MongoDB**.

---

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Authentication](#authentication)
- [Role-Based Access Control](#role-based-access-control)
- [API Reference](#api-reference)
- [Running Tests](#running-tests)
- [Deployment](#deployment)
- [Assumptions & Tradeoffs](#assumptions--tradeoffs)

---

## 🛠 Tech Stack

| Layer       | Technology              |
|-------------|-------------------------|
| Runtime     | Node.js                 |
| Framework   | Express.js              |
| Database    | MongoDB + Mongoose      |
| Validation  | express-validator       |
| Rate Limit  | express-rate-limit      |
| Testing     | Jest + Supertest        |
| Logging     | Morgan                  |

---

## ✅ Features

- **User Management** — Create, read, update, delete users with roles
- **Financial Records** — Full CRUD with soft-delete and filtering
- **Dashboard Analytics** — Summary totals, category breakdowns, monthly/weekly trends
- **Role-Based Access Control** — Viewer / Analyst / Admin permissions enforced via middleware
- **Input Validation** — All inputs validated; descriptive error responses
- **Pagination** — All list endpoints support `page` and `limit`
- **Soft Delete** — Records are never hard-deleted; marked as `isDeleted: true`
- **Rate Limiting** — 100 requests / 15 min per IP
- **Seeding Script** — Instant test data with API keys printed to console
- **Test Suite** — Auth, RBAC, CRUD, validation, and dashboard tests

---

## 📁 Project Structure

```
finance-dashboard/
├── scripts/
│   └── seed.js               # Database seeder
├── src/
│   ├── config/
│   │   └── db.js             # MongoDB connection
│   ├── controllers/
│   │   ├── userController.js
│   │   ├── recordController.js
│   │   └── dashboardController.js
│   ├── middleware/
│   │   ├── auth.js           # Mock API-key authentication
│   │   ├── rbac.js           # Role-based access control
│   │   ├── validators.js     # Input validation rules
│   │   └── errorHandler.js   # Global error handler
│   ├── models/
│   │   ├── User.js
│   │   └── FinancialRecord.js
│   ├── routes/
│   │   ├── userRoutes.js
│   │   ├── recordRoutes.js
│   │   └── dashboardRoutes.js
│   ├── services/
│   │   ├── userService.js
│   │   ├── recordService.js
│   │   └── dashboardService.js
│   ├── app.js                # Express app setup
│   └── server.js             # Entry point
├── tests/
│   └── api.test.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas) — free tier)

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/finance-dashboard-backend.git
cd finance-dashboard-backend

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env and set your MONGO_URI

# 4. Seed the database (creates 3 users + 14 sample records)
node scripts/seed.js

# 5. Start the server
npm run dev      # development (auto-restart)
npm start        # production
```

The server starts at: `http://localhost:3000`

---

## 🔧 Environment Variables

Create a `.env` file based on `.env.example`:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/finance_dashboard
NODE_ENV=development
```

**For MongoDB Atlas:**
```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/finance_dashboard
```

---

## 🔐 Authentication

This API uses **mock API-key authentication** (no JWT for simplicity).

Every request must include an `Authorization` header:

```
Authorization: Bearer <your-api-key>
```

API keys are generated when a user is created. Run the seed script to get keys instantly:

```bash
node scripts/seed.js
```

Output example:
```
🔑 API Keys:
  ADMIN   — Alice Admin:  a3f9c2...
  ANALYST — Bob Analyst:  d7e1b4...
  VIEWER  — Carol Viewer: 9c3a71...
```

Admins can also retrieve any user's API key via:
```
GET /api/users/:id/apikey
```

---

## 🛡 Role-Based Access Control

| Action                        | Viewer | Analyst | Admin |
|-------------------------------|--------|---------|-------|
| View financial records        | ✅     | ✅      | ✅    |
| View dashboard summary        | ✅     | ✅      | ✅    |
| View monthly/weekly trends    | ❌     | ✅      | ✅    |
| Create financial records      | ❌     | ❌      | ✅    |
| Update financial records      | ❌     | ❌      | ✅    |
| Delete financial records      | ❌     | ❌      | ✅    |
| Manage users (CRUD)           | ❌     | ❌      | ✅    |

---

## 📡 API Reference

### Health Check

```
GET /health
```

---

### 👤 Users  *(Admin only)*

| Method | Endpoint                  | Description              |
|--------|---------------------------|--------------------------|
| POST   | `/api/users`              | Create a new user        |
| GET    | `/api/users`              | List all users           |
| GET    | `/api/users/:id`          | Get user by ID           |
| PUT    | `/api/users/:id`          | Update user              |
| DELETE | `/api/users/:id`          | Delete user              |
| GET    | `/api/users/:id/apikey`   | Get user's API key       |

**Create user body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "analyst",
  "status": "active"
}
```

---

### 💳 Financial Records

| Method | Endpoint            | Role Required       | Description               |
|--------|---------------------|---------------------|---------------------------|
| GET    | `/api/records`      | Any authenticated   | List records (paginated)  |
| GET    | `/api/records/:id`  | Any authenticated   | Get record by ID          |
| POST   | `/api/records`      | Admin               | Create a record           |
| PUT    | `/api/records/:id`  | Admin               | Update a record           |
| DELETE | `/api/records/:id`  | Admin               | Soft-delete a record      |

**Create record body:**
```json
{
  "amount": 50000,
  "type": "income",
  "category": "salary",
  "date": "2025-03-01",
  "notes": "March salary"
}
```

**Filter/pagination query params:**
```
GET /api/records?type=expense&category=food&startDate=2025-01-01&endDate=2025-03-31&page=1&limit=10
```

**Valid categories:** `salary`, `investment`, `freelance`, `rent`, `utilities`, `food`, `transport`, `healthcare`, `entertainment`, `other`

---

### 📊 Dashboard

| Method | Endpoint                          | Role Required        | Description            |
|--------|-----------------------------------|----------------------|------------------------|
| GET    | `/api/dashboard/summary`          | Any authenticated    | Totals + recent activity |
| GET    | `/api/dashboard/trends/monthly`   | Analyst / Admin      | Monthly breakdown      |
| GET    | `/api/dashboard/trends/weekly`    | Analyst / Admin      | Last 4 weeks           |

**Monthly trends query param:**
```
GET /api/dashboard/trends/monthly?year=2025
```

**Sample summary response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalIncome": 267000,
      "totalExpenses": 100200,
      "netBalance": 166800,
      "incomeTransactions": 5,
      "expenseTransactions": 9
    },
    "categoryBreakdown": [...],
    "recentActivity": [...]
  }
}
```

---

### ❌ Error Response Format

All errors follow this shape:

```json
{
  "success": false,
  "message": "Descriptive error message",
  "errors": [{ "field": "amount", "message": "Amount must be a positive number" }]
}
```

| Status | Meaning                |
|--------|------------------------|
| 400    | Validation error       |
| 401    | Missing / invalid key  |
| 403    | Insufficient role      |
| 404    | Resource not found     |
| 409    | Duplicate (e.g. email) |
| 429    | Rate limit exceeded    |
| 500    | Internal server error  |

---

## 🧪 Running Tests

```bash
npm test
```

Tests cover:
- ✅ Authentication (missing key, invalid key, valid key)
- ✅ RBAC (viewer/analyst/admin permission boundaries)
- ✅ Full CRUD for financial records
- ✅ Input validation edge cases
- ✅ Dashboard summary and trends

---

## ☁️ Deployment

### Option 1: Render (Recommended — Free)

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo
4. Set:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
5. Add environment variables:
   - `MONGO_URI` → your Atlas connection string
   - `NODE_ENV` → `production`
6. Click **Deploy** — you'll get a live URL like `https://finance-dashboard.onrender.com`

### Option 2: Railway

1. Go to [railway.app](https://railway.app) → **New Project**
2. Select **Deploy from GitHub repo**
3. Add `MONGO_URI` in the Variables tab
4. Railway auto-detects Node.js and deploys

### MongoDB Atlas (Free Cloud DB)

1. Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a **free M0 cluster**
3. Add a database user and whitelist `0.0.0.0/0` for IP access
4. Copy the connection string → paste as `MONGO_URI`

---

## 💡 Assumptions & Tradeoffs

| Decision | Reasoning |
|----------|-----------|
| **Mock API key auth** instead of JWT | Keeps the setup simple; easy to swap with JWT later by replacing `auth.js` middleware only |
| **Soft delete** for records | Preserves financial audit trail; `isDeleted` flag filters records from all queries |
| **Admin-only record creation** | Financial data integrity — only trusted roles should insert/modify monetary records |
| **Viewer can see summary** | Dashboard read access is useful even for basic roles |
| **MongoDB** | Flexible schema suits financial records with varying categories; Atlas free tier enables instant cloud deployment |
| **Category as enum** | Keeps data consistent for aggregation queries; easily extendable |
| **No pagination on users** | User count is expected to be small; can be added if needed |

---

## 📬 Testing with Postman / curl

```bash
# Health check
curl http://localhost:3000/health

# List records (as viewer)
curl -H "Authorization: Bearer YOUR_VIEWER_KEY" http://localhost:3000/api/records

# Create record (as admin)
curl -X POST http://localhost:3000/api/records \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"amount": 75000, "type": "income", "category": "salary", "notes": "Bonus"}'

# Dashboard summary
curl -H "Authorization: Bearer YOUR_VIEWER_KEY" http://localhost:3000/api/dashboard/summary

# Monthly trends (analyst or admin only)
curl -H "Authorization: Bearer YOUR_ANALYST_KEY" \
  "http://localhost:3000/api/dashboard/trends/monthly?year=2025"
```
