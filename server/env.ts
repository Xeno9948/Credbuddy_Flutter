/**
 * Environment variable validation for Railway deployment
 */

import { execSync } from "child_process";
import { seedTestAccount } from "./seedTestAccount";

export async function runDatabaseMigrations() {
  try {
    console.log("🔄 Running database migrations...");
    execSync("npx drizzle-kit push", {
      stdio: "inherit",
      env: process.env
    });
    console.log("✅ Database migrations completed successfully\n");
  } catch (error) {
    console.error("❌ Database migration failed:", error);
    console.error("Please run 'npm run db:push' manually\n");
    // Don't exit - allow app to start even if migrations fail
    // (in case tables already exist)
  }
}

export async function seedTestAccountIfNeeded() {
  try {
    // Only seed in development or if explicitly requested
    if (process.env.NODE_ENV === "production" && !process.env.SEED_TEST_ACCOUNT) {
      return;
    }

    console.log("🌱 Checking for test account...");
    await seedTestAccount();
  } catch (error) {
    console.error("⚠️  Test account seeding failed (non-critical):", error);
    // Don't crash the app if seeding fails
  }
}

export function validateEnvironment() {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Critical: Database URL
  if (!process.env.DATABASE_URL) {
    errors.push("❌ DATABASE_URL is required. Add a PostgreSQL database in Railway.");
  } else {
    console.log("✅ DATABASE_URL is set");
  }

  // Critical: Gemini API Key
  if (!process.env.GEMINI_API_KEY) {
    warnings.push("⚠️  GEMINI_API_KEY is not set. AI features will use fallback responses.");
    warnings.push("   Get your API key from: https://aistudio.google.com/apikey");
  } else {
    console.log("✅ GEMINI_API_KEY is set");
  }

  // Optional: Node environment
  const nodeEnv = process.env.NODE_ENV || "development";
  console.log(`✅ NODE_ENV: ${nodeEnv}`);

  // Optional: Port
  const port = process.env.PORT || "5000";
  console.log(`✅ PORT: ${port}`);

  // Optional: WhatsApp verify token
  if (process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("✅ WHATSAPP_VERIFY_TOKEN is set");
  }

  // Display warnings
  if (warnings.length > 0) {
    console.log("\n⚠️  WARNINGS:");
    warnings.forEach(w => console.log(w));
    console.log("");
  }

  // Display errors and exit if critical errors exist
  if (errors.length > 0) {
    console.error("\n❌ CRITICAL ERRORS:");
    errors.forEach(e => console.error(e));
    console.error("\nPlease fix these errors before starting the application.\n");
    process.exit(1);
  }

  console.log("✅ Environment validation complete\n");
}
