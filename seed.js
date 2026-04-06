require("dotenv").config();
const mongoose = require("mongoose");
const crypto = require("crypto");
const User = require("../src/models/User");
const FinancialRecord = require("../src/models/FinancialRecord");

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");
};

const seed = async () => {
  await connectDB();

  // Clear existing data
  await User.deleteMany({});
  await FinancialRecord.deleteMany({});
  console.log("🗑️  Cleared existing data");

  // Create users
  const users = await User.create([
    {
      name: "Alice Admin",
      email: "admin@finance.dev",
      role: "admin",
      status: "active",
      apiKey: crypto.randomBytes(32).toString("hex"),
    },
    {
      name: "Bob Analyst",
      email: "analyst@finance.dev",
      role: "analyst",
      status: "active",
      apiKey: crypto.randomBytes(32).toString("hex"),
    },
    {
      name: "Carol Viewer",
      email: "viewer@finance.dev",
      role: "viewer",
      status: "active",
      apiKey: crypto.randomBytes(32).toString("hex"),
    },
  ]);

  const admin = users[0];

  console.log("\n🔑 API Keys (save these for testing):");
  users.forEach((u) => console.log(`  ${u.role.toUpperCase()} — ${u.name}: ${u.apiKey}`));

  // Create sample financial records
  const categories = ["salary", "investment", "freelance", "rent", "utilities", "food", "transport", "healthcare", "entertainment", "other"];
  const recordsData = [
    { amount: 85000, type: "income", category: "salary", date: new Date("2025-01-05"), notes: "January salary" },
    { amount: 85000, type: "income", category: "salary", date: new Date("2025-02-05"), notes: "February salary" },
    { amount: 85000, type: "income", category: "salary", date: new Date("2025-03-05"), notes: "March salary" },
    { amount: 12000, type: "income", category: "freelance", date: new Date("2025-01-20"), notes: "Freelance project" },
    { amount: 5000, type: "income", category: "investment", date: new Date("2025-02-15"), notes: "Dividend payout" },
    { amount: 25000, type: "expense", category: "rent", date: new Date("2025-01-01"), notes: "Monthly rent" },
    { amount: 25000, type: "expense", category: "rent", date: new Date("2025-02-01"), notes: "Monthly rent" },
    { amount: 25000, type: "expense", category: "rent", date: new Date("2025-03-01"), notes: "Monthly rent" },
    { amount: 4500, type: "expense", category: "utilities", date: new Date("2025-01-10"), notes: "Electricity + internet" },
    { amount: 8000, type: "expense", category: "food", date: new Date("2025-01-15"), notes: "Groceries and dining" },
    { amount: 3200, type: "expense", category: "transport", date: new Date("2025-02-08"), notes: "Fuel and cab" },
    { amount: 1500, type: "expense", category: "entertainment", date: new Date("2025-02-22"), notes: "Movies and subscriptions" },
    { amount: 6000, type: "expense", category: "healthcare", date: new Date("2025-03-12"), notes: "Checkup and medicines" },
    { amount: 2000, type: "expense", category: "other", date: new Date("2025-03-18"), notes: "Miscellaneous" },
  ];

  await FinancialRecord.create(recordsData.map((r) => ({ ...r, createdBy: admin._id })));

  console.log(`\n✅ Seeded ${recordsData.length} financial records`);
  console.log("\n🎉 Seeding complete! Use the API keys above in your requests.");
  mongoose.disconnect();
};

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  mongoose.disconnect();
  process.exit(1);
});
