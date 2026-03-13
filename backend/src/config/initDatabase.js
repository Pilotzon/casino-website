const bcrypt = require("bcrypt");
const {
  db,
  initializeDatabase,
  initializeGames,
  initializeSettings,
  addColumnIfNotExists,
} = require("./config/database");
require("dotenv").config();

/**
 * Initialize the entire database with schema and owner account
 */
async function initDB() {
  try {
    console.log("🚀 Starting database initialization...\n");

    // Initialize schema + defaults
    initializeDatabase();
    initializeGames();
    initializeSettings();

    // Ensure moderation columns exist (safe if already added)
    addColumnIfNotExists("users", "banned_until", "DATETIME");
    addColumnIfNotExists("users", "rr_attempt_index", "INTEGER NOT NULL DEFAULT 0");
    addColumnIfNotExists("users", "timed_out_until", "DATETIME");

    // Create owner account
    await createOwnerAccount();

    console.log("\n✅ Database initialization completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("1. Start the backend: npm run dev");
    console.log("2. Start the frontend: cd ../frontend && npm start");
    console.log("3. Login with owner credentials from your .env file\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
}

/**
 * Create the owner account from environment variables
 */
async function createOwnerAccount() {
  const ownerEmail = process.env.OWNER_EMAIL || "owner@casino.local";
  const ownerPassword = process.env.OWNER_PASSWORD || "ChangeThisPassword123!";

  // Check if owner already exists
  const existingOwner = db.prepare("SELECT id FROM users WHERE role = ?").get("owner");

  if (existingOwner) {
    console.log("⚠️  Owner account already exists, skipping creation");
    return;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(ownerPassword, 12);

  // Generate username from email
  const username = ownerEmail.split("@")[0] + "_owner";

  // Insert owner
  const result = db
    .prepare(
      `
    INSERT INTO users (email, password_hash, username, balance, role)
    VALUES (?, ?, ?, ?, ?)
  `
    )
    .run(ownerEmail, passwordHash, username, 100.0, "owner");

  console.log("✅ Owner account created:");
  console.log(`   Email: ${ownerEmail}`);
  console.log(`   Password: ${ownerPassword}`);
  console.log(`   ⚠️  CHANGE THE PASSWORD AFTER FIRST LOGIN!`);

  // Log the creation
  db.prepare(
    `
    INSERT INTO audit_logs (user_id, action_type, action_details)
    VALUES (?, ?, ?)
  `
  ).run(
    result.lastInsertRowid,
    "ACCOUNT_CREATED",
    JSON.stringify({
      role: "owner",
      method: "database_initialization",
    })
  );
}

// Run initialization
initDB();