/**
 * Seed script to create a test account with dummy data
 * Account: xeno@kiyoh.com / tes123
 */

import { storage } from "./storage";
import { computeCreditScore } from "./scoring";
import { createHash } from "crypto";

export async function seedTestAccount() {
  console.log("🌱 Seeding test account...");

  try {
    // 1. Create or get web account
    const email = "xeno@kiyoh.com";
    let webAccount = await storage.getWebAccountByEmail(email);

    if (!webAccount) {
      webAccount = await storage.createWebAccount({ email });
      console.log(`✅ Created web account: ${email}`);
    } else {
      console.log(`✅ Web account already exists: ${email}`);
    }

    // 2. Create or get user (phone-based)
    const phone = "+27810000001";
    let user = await storage.getUserByPhone(phone);

    if (!user) {
      user = await storage.createUser({ phone });
      console.log(`✅ Created user with phone: ${phone}`);
    } else {
      console.log(`✅ User already exists: ${phone}`);
    }

    // 3. Link web account to user
    const existingLink = await storage.getLinkedUser(webAccount.id);
    if (!existingLink) {
      await storage.createWebAccountUserLink({
        webAccountId: webAccount.id,
        userId: user.id,
      });
      console.log(`✅ Linked web account to user`);
    } else {
      console.log(`✅ Link already exists`);
    }

    // 4. Create business profile
    const existingProfile = await storage.getBusinessProfile(user.id);
    if (!existingProfile) {
      await storage.upsertBusinessProfile({
        userId: user.id,
        businessName: "Xeno's Convenience Store",
        businessType: "Retail",
        notificationPref: "daily",
        timezone: "Africa/Johannesburg",
        language: "en",
      });
      console.log(`✅ Created business profile`);
    } else {
      console.log(`✅ Business profile already exists`);
    }

    // 5. Create daily entries (last 14 days with realistic data)
    const now = Date.now();
    const msPerDay = 86400000;

    // Realistic revenue pattern (R800-R1500 per day for convenience store)
    const revenues = [
      120000, 145000, 95000, 135000, 150000, 110000, 125000,
      140000, 105000, 155000, 130000, 115000, 148000, 138000
    ];

    // Realistic expenses (R200-R600 per day)
    const expenses = [
      25000, 40000, 35000, 50000, 30000, 45000, 28000,
      38000, 42000, 32000, 48000, 35000, 40000, 30000
    ];

    const expenseNotes = [
      "Stock replenishment", "Electricity", "Transport", "Supplier payment",
      "Rent", "Stock", "Airtime purchase", "Cleaning supplies",
      "Inventory", "Utilities", "Stock restocking", "Maintenance",
      "Wholesale order", "Operational costs"
    ];

    for (let i = 0; i < 14; i++) {
      const date = new Date(now - (13 - i) * msPerDay).toISOString().split("T")[0];
      const existing = await storage.getDailyEntry(user.id, date);

      if (!existing) {
        await storage.upsertDailyEntry({
          userId: user.id,
          date,
          revenueCents: revenues[i],
          expenseCents: expenses[i],
          expenseNote: expenseNotes[i],
        });
      }
    }
    console.log(`✅ Created 14 days of daily entries`);

    // 6. Create cash estimate
    const existingCash = await storage.getLatestCashEstimate(user.id);
    if (!existingCash) {
      await storage.createCashEstimate({
        userId: user.id,
        asOfDate: new Date().toISOString().split("T")[0],
        cashAvailableCents: 285000, // R2,850
      });
      console.log(`✅ Created cash estimate`);
    } else {
      console.log(`✅ Cash estimate already exists`);
    }

    // 7. Calculate and create score snapshot
    const entries = await storage.getRecentEntries(user.id, 14);
    const cashEst = await storage.getLatestCashEstimate(user.id);
    const scoreResult = computeCreditScore(entries, cashEst ?? null);

    const today = new Date().toISOString().split("T")[0];
    await storage.createScoreSnapshot({
      userId: user.id,
      asOfDate: today,
      score: scoreResult.score,
      confidence: scoreResult.confidence,
      band: scoreResult.band,
      flagsJson: scoreResult.flags,
      featureBreakdownJson: scoreResult.featureBreakdown as any,
    });
    console.log(`✅ Created score snapshot (Score: ${scoreResult.score}, Band: ${scoreResult.band})`);

    // 8. Create a magic link token for easy login (valid for 7 days)
    const token = "test-login-token-xeno";
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await storage.createMagicLinkToken({
      webAccountId: webAccount.id,
      tokenHash,
      expiresAt,
    });
    console.log(`✅ Created magic link token`);

    console.log("\n🎉 Test account created successfully!");
    console.log(`\n📧 Email: ${email}`);
    console.log(`🔒 Quick login URL: /web/auth/callback?token=test-login-token-xeno`);
    console.log(`\n💡 Or use the normal login flow at /web/login with email: ${email}`);

  } catch (error) {
    console.error("❌ Error seeding test account:", error);
    throw error;
  }
}
