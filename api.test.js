const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User");
const FinancialRecord = require("../src/models/FinancialRecord");
const crypto = require("crypto");

let adminKey, analystKey, viewerKey;
let adminUser, analystUser, viewerUser;
let recordId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/finance_test");
  await User.deleteMany({});
  await FinancialRecord.deleteMany({});

  adminUser = await User.create({ name: "Test Admin", email: "admin@test.com", role: "admin", status: "active", apiKey: crypto.randomBytes(16).toString("hex") });
  analystUser = await User.create({ name: "Test Analyst", email: "analyst@test.com", role: "analyst", status: "active", apiKey: crypto.randomBytes(16).toString("hex") });
  viewerUser = await User.create({ name: "Test Viewer", email: "viewer@test.com", role: "viewer", status: "active", apiKey: crypto.randomBytes(16).toString("hex") });

  adminKey = adminUser.apiKey;
  analystKey = analystUser.apiKey;
  viewerKey = viewerUser.apiKey;
});

afterAll(async () => {
  await User.deleteMany({});
  await FinancialRecord.deleteMany({});
  await mongoose.disconnect();
});

// ── Auth Tests ────────────────────────────────────────────────────────────────
describe("Authentication", () => {
  test("should reject request without API key", async () => {
    const res = await request(app).get("/api/records");
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("should reject invalid API key", async () => {
    const res = await request(app).get("/api/records").set("Authorization", "Bearer invalidkey");
    expect(res.statusCode).toBe(401);
  });

  test("should accept valid API key", async () => {
    const res = await request(app).get("/api/records").set("Authorization", `Bearer ${viewerKey}`);
    expect(res.statusCode).toBe(200);
  });
});

// ── RBAC Tests ────────────────────────────────────────────────────────────────
describe("Role-Based Access Control", () => {
  test("viewer cannot create a record", async () => {
    const res = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${viewerKey}`)
      .send({ amount: 100, type: "income", category: "salary" });
    expect(res.statusCode).toBe(403);
  });

  test("analyst cannot create a record", async () => {
    const res = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${analystKey}`)
      .send({ amount: 100, type: "income", category: "salary" });
    expect(res.statusCode).toBe(403);
  });

  test("admin can create a record", async () => {
    const res = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${adminKey}`)
      .send({ amount: 5000, type: "income", category: "salary", notes: "Test income" });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    recordId = res.body.data._id;
  });

  test("viewer cannot access monthly trends", async () => {
    const res = await request(app).get("/api/dashboard/trends/monthly").set("Authorization", `Bearer ${viewerKey}`);
    expect(res.statusCode).toBe(403);
  });

  test("analyst can access monthly trends", async () => {
    const res = await request(app).get("/api/dashboard/trends/monthly").set("Authorization", `Bearer ${analystKey}`);
    expect(res.statusCode).toBe(200);
  });

  test("viewer cannot manage users", async () => {
    const res = await request(app).get("/api/users").set("Authorization", `Bearer ${viewerKey}`);
    expect(res.statusCode).toBe(403);
  });
});

// ── Record CRUD Tests ──────────────────────────────────────────────────────────
describe("Financial Records", () => {
  test("should list records with pagination", async () => {
    const res = await request(app).get("/api/records?page=1&limit=5").set("Authorization", `Bearer ${viewerKey}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.pagination).toBeDefined();
  });

  test("should filter records by type", async () => {
    const res = await request(app).get("/api/records?type=income").set("Authorization", `Bearer ${viewerKey}`);
    expect(res.statusCode).toBe(200);
    res.body.records.forEach((r) => expect(r.type).toBe("income"));
  });

  test("should get record by id", async () => {
    const res = await request(app).get(`/api/records/${recordId}`).set("Authorization", `Bearer ${viewerKey}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data._id).toBe(recordId);
  });

  test("admin can update a record", async () => {
    const res = await request(app)
      .put(`/api/records/${recordId}`)
      .set("Authorization", `Bearer ${adminKey}`)
      .send({ notes: "Updated notes" });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.notes).toBe("Updated notes");
  });

  test("admin can soft-delete a record", async () => {
    const res = await request(app).delete(`/api/records/${recordId}`).set("Authorization", `Bearer ${adminKey}`);
    expect(res.statusCode).toBe(200);
    // Verify it's gone from list
    const check = await request(app).get(`/api/records/${recordId}`).set("Authorization", `Bearer ${adminKey}`);
    expect(check.statusCode).toBe(404);
  });
});

// ── Validation Tests ───────────────────────────────────────────────────────────
describe("Input Validation", () => {
  test("should reject record with missing amount", async () => {
    const res = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${adminKey}`)
      .send({ type: "income", category: "salary" });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  test("should reject record with invalid type", async () => {
    const res = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${adminKey}`)
      .send({ amount: 100, type: "random", category: "salary" });
    expect(res.statusCode).toBe(400);
  });

  test("should reject invalid mongo id", async () => {
    const res = await request(app).get("/api/records/not-an-id").set("Authorization", `Bearer ${adminKey}`);
    expect(res.statusCode).toBe(400);
  });
});

// ── Dashboard Tests ────────────────────────────────────────────────────────────
describe("Dashboard", () => {
  test("should return summary for all roles", async () => {
    const res = await request(app).get("/api/dashboard/summary").set("Authorization", `Bearer ${viewerKey}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.summary).toBeDefined();
    expect(res.body.data.summary).toHaveProperty("totalIncome");
    expect(res.body.data.summary).toHaveProperty("totalExpenses");
    expect(res.body.data.summary).toHaveProperty("netBalance");
  });

  test("should return monthly trends for admin", async () => {
    const res = await request(app).get("/api/dashboard/trends/monthly?year=2025").set("Authorization", `Bearer ${adminKey}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.monthly).toHaveLength(12);
  });
});
