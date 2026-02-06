import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { computeCreditScore, generateExplanations } from "./scoring";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";

function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

// ─── Middleware: Partner auth via X-API-KEY ──────────────────
async function partnerAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers["x-api-key"] as string | undefined;
  if (!apiKey) return res.status(401).json({ error: "Missing X-API-KEY header" });

  const hash = hashApiKey(apiKey);
  const partner = await storage.getPartnerByApiKeyHash(hash);
  if (!partner) return res.status(403).json({ error: "Invalid API key" });

  (req as any).partner = partner;
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ══════════════════════════════════════════════════════
  //  CORE API - Users & Entries
  // ══════════════════════════════════════════════════════

  // POST /api/users - Create or get user by phone
  app.post("/api/users", async (req, res) => {
    try {
      const body = z.object({ phone: z.string().min(1) }).parse(req.body);
      let user = await storage.getUserByPhone(body.phone);
      if (!user) {
        user = await storage.createUser({ phone: body.phone });
      }
      const profile = await storage.getBusinessProfile(user.id);
      const latestScore = await storage.getLatestScore(user.id);
      const entries = await storage.getRecentEntries(user.id, 14);
      const cashEstimate = await storage.getLatestCashEstimate(user.id);

      res.json({
        user,
        profile,
        score: latestScore ? {
          ...latestScore,
          featureBreakdown: latestScore.featureBreakdownJson,
          flags: latestScore.flagsJson,
        } : null,
        entries,
        cashEstimate,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // GET /api/users - List all users
  app.get("/api/users", async (_req, res) => {
    try {
      const users = await storage.listUsers();
      const enriched = await Promise.all(users.map(async (u) => {
        const profile = await storage.getBusinessProfile(u.id);
        const score = await storage.getLatestScore(u.id);
        return {
          ...u,
          profile,
          score: score ? { score: score.score, band: score.band, confidence: score.confidence } : null,
        };
      }));
      res.json(enriched);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/users/:id - Get user detail
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) return res.status(404).json({ error: "User not found" });

      const profile = await storage.getBusinessProfile(id);
      const entries = await storage.getRecentEntries(id, 14);
      const latestScore = await storage.getLatestScore(id);
      const cashEstimate = await storage.getLatestCashEstimate(id);
      const scoreHistory = await storage.getScoreHistory(id, 30);

      res.json({
        user,
        profile,
        entries,
        score: latestScore ? {
          ...latestScore,
          featureBreakdown: latestScore.featureBreakdownJson,
          flags: latestScore.flagsJson,
        } : null,
        scoreHistory: scoreHistory.map(s => ({
          ...s,
          featureBreakdown: s.featureBreakdownJson,
          flags: s.flagsJson,
        })),
        cashEstimate,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/users/:id/profile - Update business profile
  app.put("/api/users/:id/profile", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const body = z.object({
        businessName: z.string().min(1),
        businessType: z.enum(["Retail", "Service", "Food", "Transport"]),
      }).parse(req.body);

      const profile = await storage.upsertBusinessProfile({
        userId,
        businessName: body.businessName,
        businessType: body.businessType,
        notificationPref: "daily",
        timezone: "Africa/Johannesburg",
        language: "en",
      });
      res.json(profile);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ══════════════════════════════════════════════════════
  //  DAILY ENTRIES
  // ══════════════════════════════════════════════════════

  // POST /api/users/:id/entries - Upsert a daily entry
  app.post("/api/users/:id/entries", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const body = z.object({
        date: z.string(),
        revenueCents: z.number().int().min(0),
        expenseCents: z.number().int().min(0).default(0),
        expenseNote: z.string().optional(),
      }).parse(req.body);

      const entry = await storage.upsertDailyEntry({
        userId,
        date: body.date,
        revenueCents: body.revenueCents,
        expenseCents: body.expenseCents,
        expenseNote: body.expenseNote ?? null,
      });

      await storage.touchUserActivity(userId);
      res.json(entry);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // GET /api/users/:id/entries?from=&to= - Get entries range
  app.get("/api/users/:id/entries", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const from = (req.query.from as string) || new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0];
      const to = (req.query.to as string) || new Date().toISOString().split("T")[0];
      const entries = await storage.getDailyEntries(userId, from, to);
      res.json(entries);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ══════════════════════════════════════════════════════
  //  CASH ESTIMATE
  // ══════════════════════════════════════════════════════

  app.post("/api/users/:id/cash-estimate", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const body = z.object({
        cashAvailableCents: z.number().int().min(0),
      }).parse(req.body);

      const est = await storage.createCashEstimate({
        userId,
        asOfDate: new Date().toISOString().split("T")[0],
        cashAvailableCents: body.cashAvailableCents,
      });
      res.json(est);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ══════════════════════════════════════════════════════
  //  SCORING
  // ══════════════════════════════════════════════════════

  // POST /api/users/:id/score - Recalculate and store score
  app.post("/api/users/:id/score", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const entries = await storage.getRecentEntries(userId, 14);
      const cashEstimate = await storage.getLatestCashEstimate(userId);

      const result = computeCreditScore(entries, cashEstimate ?? null);
      const today = new Date().toISOString().split("T")[0];

      const snapshot = await storage.createScoreSnapshot({
        userId,
        asOfDate: today,
        score: result.score,
        confidence: result.confidence,
        band: result.band,
        flagsJson: result.flags,
        featureBreakdownJson: result.featureBreakdown,
      });

      const explanations = generateExplanations(
        result.featureBreakdown,
        result.flags,
        "entrepreneur"
      );

      res.json({
        ...snapshot,
        featureBreakdown: result.featureBreakdown,
        flags: result.flags,
        explanations,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/users/:id/score - Get latest score
  app.get("/api/users/:id/score", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const snapshot = await storage.getLatestScore(userId);
      if (!snapshot) return res.status(404).json({ error: "No score available" });

      const explanations = generateExplanations(
        snapshot.featureBreakdownJson as any,
        (snapshot.flagsJson as string[]) ?? [],
        "entrepreneur"
      );

      res.json({
        ...snapshot,
        featureBreakdown: snapshot.featureBreakdownJson,
        flags: snapshot.flagsJson,
        explanations,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/users/:id/score/history - Get score history
  app.get("/api/users/:id/score/history", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const limit = parseInt((req.query.limit as string) || "30");
      const history = await storage.getScoreHistory(userId, limit);
      res.json(history.map(s => ({
        ...s,
        featureBreakdown: s.featureBreakdownJson,
        flags: s.flagsJson,
      })));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ══════════════════════════════════════════════════════
  //  CHAT / WHATSAPP SIMULATION
  // ══════════════════════════════════════════════════════

  // POST /api/chat - Process a chat message (simulates WhatsApp bot logic)
  app.post("/api/chat", async (req, res) => {
    try {
      const body = z.object({
        userId: z.number(),
        text: z.string().min(1),
      }).parse(req.body);

      const user = await storage.getUser(body.userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      await storage.createMessageLog({
        userId: body.userId,
        direction: "inbound",
        text: body.text,
        rawJson: null,
      });

      const lowerInput = body.text.toLowerCase().trim();
      let reply = "";

      const profile = await storage.getBusinessProfile(body.userId);
      const displayName = profile?.businessName ?? user.phone;

      if (lowerInput === "status" || lowerInput.includes("status")) {
        const entries = await storage.getRecentEntries(body.userId, 7);
        const totalRev = entries.reduce((a, b) => a + b.revenueCents, 0) / 100;
        const latestScore = await storage.getLatestScore(body.userId);
        const band = latestScore?.band ?? "N/A";
        reply = `📊 *Weekly Status*\n\nRevenue: R${totalRev.toLocaleString()}\nRisk Level: ${band}\n\nKeep submitting daily to improve your score.`;
      } else if (lowerInput === "help") {
        reply = `🤖 *Commands:*\n\n• *STATUS*: See your cashflow\n• *R500*: Log revenue\n• *500 transport*: Log expense\n• *CASH 2000*: Update cash on hand\n• *SCORE*: View your credit score\n• *SCENARIO*: Test a loan`;
      } else if (lowerInput === "score") {
        const entries = await storage.getRecentEntries(body.userId, 14);
        const cashEst = await storage.getLatestCashEstimate(body.userId);
        const result = computeCreditScore(entries, cashEst ?? null);
        const today = new Date().toISOString().split("T")[0];

        await storage.createScoreSnapshot({
          userId: body.userId,
          asOfDate: today,
          score: result.score,
          confidence: result.confidence,
          band: result.band,
          flagsJson: result.flags,
          featureBreakdownJson: result.featureBreakdown,
        });

        const explanations = generateExplanations(result.featureBreakdown, result.flags, "entrepreneur");
        reply = `📊 *Credit Score: ${result.score}/1000*\nBand: ${result.band} | Confidence: ${result.confidence}%\n\n${explanations.reasons.join("\n")}\n\n💡 ${explanations.tips[0] ?? ""}`;
      } else if (lowerInput.match(/^r\s*\d+/i)) {
        const amount = parseInt(lowerInput.replace(/\D/g, ""));
        if (amount > 0) {
          const today = new Date().toISOString().split("T")[0];
          await storage.upsertDailyEntry({
            userId: body.userId,
            date: today,
            revenueCents: amount * 100,
            expenseCents: 0,
            expenseNote: null,
          });
          await storage.touchUserActivity(body.userId);
          reply = `✅ Recorded R${amount} revenue for today.\n\nAny expenses to add? (e.g. "400 transport")`;
        } else {
          reply = "Please enter a valid amount, e.g. R500.";
        }
      } else if (lowerInput.match(/^\d+\s+\w+/)) {
        const match = lowerInput.match(/^(\d+)\s+(.+)/);
        if (match) {
          const amount = parseInt(match[1]);
          const note = match[2];
          const today = new Date().toISOString().split("T")[0];
          const existing = await storage.getDailyEntry(body.userId, today);
          await storage.upsertDailyEntry({
            userId: body.userId,
            date: today,
            revenueCents: existing?.revenueCents ?? 0,
            expenseCents: (existing?.expenseCents ?? 0) + amount * 100,
            expenseNote: note,
          });
          await storage.touchUserActivity(body.userId);
          reply = `✅ Recorded R${amount} expense (${note}).`;
        }
      } else if (lowerInput.startsWith("cash")) {
        const amount = parseInt(lowerInput.replace(/\D/g, ""));
        if (amount > 0) {
          await storage.createCashEstimate({
            userId: body.userId,
            asOfDate: new Date().toISOString().split("T")[0],
            cashAvailableCents: amount * 100,
          });
          reply = `✅ Cash on hand updated to R${amount}. This helps calculate your buffer score.`;
        } else {
          reply = "Please enter a valid amount, e.g. CASH 2000.";
        }
      } else if (lowerInput.includes("scenario") || lowerInput.includes("loan")) {
        reply = `🔮 *Scenario Engine*\n\nIf you borrow *R1000* for 3 months:\n• Repayment: ~R380/pm\n• Cashflow Impact: Low Risk\n\n*Disclaimer:* This is an estimate, not an offer.`;
      } else {
        reply = "I didn't quite catch that. Try *HELP* for available commands.";
      }

      await storage.createMessageLog({
        userId: body.userId,
        direction: "outbound",
        text: reply,
        rawJson: null,
      });

      res.json({ reply });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ══════════════════════════════════════════════════════
  //  ADMIN API
  // ══════════════════════════════════════════════════════

  // GET /api/admin/dashboard - Aggregate stats
  app.get("/api/admin/dashboard", async (_req, res) => {
    try {
      const [userCount, activeUsers, avgScore, bandDist] = await Promise.all([
        storage.getUserCount(),
        storage.getActiveUserCount(7),
        storage.getAverageScore(),
        storage.getScoreBandDistribution(),
      ]);
      res.json({ userCount, activeUsers, avgScore, bandDist });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/users/:id/messages - Get message logs
  app.get("/api/admin/users/:id/messages", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const messages = await storage.getMessageLogs(userId, 100);
      res.json(messages);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/admin/users/:id/recalc - Force score recalculation
  app.post("/api/admin/users/:id/recalc", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const entries = await storage.getRecentEntries(userId, 14);
      const cashEstimate = await storage.getLatestCashEstimate(userId);
      const result = computeCreditScore(entries, cashEstimate ?? null);
      const today = new Date().toISOString().split("T")[0];

      const snapshot = await storage.createScoreSnapshot({
        userId,
        asOfDate: today,
        score: result.score,
        confidence: result.confidence,
        band: result.band,
        flagsJson: result.flags,
        featureBreakdownJson: result.featureBreakdown,
      });

      res.json({ ...snapshot, featureBreakdown: result.featureBreakdown, flags: result.flags });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ══════════════════════════════════════════════════════
  //  PARTNER API (X-API-KEY protected)
  // ══════════════════════════════════════════════════════

  // POST /api/partners - Create a new partner (admin action)
  app.post("/api/partners", async (req, res) => {
    try {
      const body = z.object({ name: z.string().min(1) }).parse(req.body);
      const rawKey = `pk_${randomBytes(24).toString("hex")}`;
      const hash = hashApiKey(rawKey);

      const partner = await storage.createPartner({
        name: body.name,
        apiKeyHash: hash,
        isActive: true,
      });

      res.json({ partner, apiKey: rawKey });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // GET /api/partners - List all partners
  app.get("/api/partners", async (_req, res) => {
    try {
      const partners = await storage.listPartners();
      res.json(partners);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/partner/login - Validate API key and return partner info
  app.post("/api/partner/login", async (req, res) => {
    try {
      const body = z.object({ apiKey: z.string().min(1) }).parse(req.body);
      const hash = hashApiKey(body.apiKey);
      const partner = await storage.getPartnerByApiKeyHash(hash);
      if (!partner) return res.status(403).json({ error: "Invalid API key" });

      await storage.createAuditLog({
        partnerId: partner.id,
        action: "login",
        targetId: null,
        ip: req.ip ?? null,
      });

      res.json({ partner });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // GET /api/partner/search?q= - Search users (partner-authenticated)
  app.get("/api/partner/search", partnerAuth, async (req, res) => {
    try {
      const q = (req.query.q as string) || "";
      const users = await storage.searchUsers(q);
      const enriched = await Promise.all(users.map(async (u) => {
        const profile = await storage.getBusinessProfile(u.id);
        const score = await storage.getLatestScore(u.id);
        return {
          ...u,
          profile,
          score: score ? { score: score.score, band: score.band, confidence: score.confidence } : null,
        };
      }));
      res.json(enriched);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/partner/applicant/:id - Get full decision packet
  app.get("/api/partner/applicant/:id", partnerAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const partner = (req as any).partner;
      await storage.createAuditLog({
        partnerId: partner.id,
        action: "view_applicant",
        targetId: String(userId),
        ip: req.ip ?? null,
      });

      const profile = await storage.getBusinessProfile(userId);
      const entries = await storage.getRecentEntries(userId, 14);
      const latestScore = await storage.getLatestScore(userId);
      const scoreHistory = await storage.getScoreHistory(userId, 12);
      const cashEstimate = await storage.getLatestCashEstimate(userId);

      const explanations = latestScore
        ? generateExplanations(latestScore.featureBreakdownJson as any, (latestScore.flagsJson as string[]) ?? [], "lender")
        : { reasons: [], tips: [] };

      res.json({
        user,
        profile,
        entries,
        score: latestScore ? {
          ...latestScore,
          featureBreakdown: latestScore.featureBreakdownJson,
          flags: latestScore.flagsJson,
        } : null,
        scoreHistory: scoreHistory.map(s => ({
          ...s,
          featureBreakdown: s.featureBreakdownJson,
          flags: s.flagsJson,
        })),
        cashEstimate,
        explanations,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ══════════════════════════════════════════════════════
  //  WHATSAPP WEBHOOK (for future use)
  // ══════════════════════════════════════════════════════

  app.get("/api/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "credit-score-v1";
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    res.sendStatus(403);
  });

  app.post("/api/webhook", async (req, res) => {
    try {
      res.sendStatus(200);
    } catch {
      res.sendStatus(500);
    }
  });

  // ══════════════════════════════════════════════════════
  //  SEED DEMO DATA
  // ══════════════════════════════════════════════════════

  app.post("/api/seed", async (_req, res) => {
    try {
      let demoUser = await storage.getUserByPhone("+27725551234");
      if (!demoUser) {
        demoUser = await storage.createUser({ phone: "+27725551234" });
      }

      await storage.upsertBusinessProfile({
        userId: demoUser.id,
        businessName: "Thabo's Spaza",
        businessType: "Retail",
        notificationPref: "daily",
        timezone: "Africa/Johannesburg",
        language: "en",
      });

      const now = Date.now();
      const msPerDay = 86400000;
      const revenues = [120000, 85000, 150000, 90000, 110000, 95000, 130000, 105000, 80000, 140000, 115000, 100000, 125000, 90000];
      const expenses = [40000, 10000, 80000, 20000, 30000, 15000, 45000, 25000, 35000, 50000, 20000, 10000, 30000, 15000];

      for (let i = 0; i < 14; i++) {
        const date = new Date(now - (i + 1) * msPerDay).toISOString().split("T")[0];
        await storage.upsertDailyEntry({
          userId: demoUser.id,
          date,
          revenueCents: revenues[i],
          expenseCents: expenses[i],
          expenseNote: i === 2 ? "Rent partial" : i === 0 ? "Stock" : null,
        });
      }

      await storage.createCashEstimate({
        userId: demoUser.id,
        asOfDate: new Date().toISOString().split("T")[0],
        cashAvailableCents: 250000,
      });

      const entries = await storage.getRecentEntries(demoUser.id, 14);
      const cashEst = await storage.getLatestCashEstimate(demoUser.id);
      const scoreResult = computeCreditScore(entries, cashEst ?? null);

      const snapshot = await storage.createScoreSnapshot({
        userId: demoUser.id,
        asOfDate: new Date().toISOString().split("T")[0],
        score: scoreResult.score,
        confidence: scoreResult.confidence,
        band: scoreResult.band,
        flagsJson: scoreResult.flags,
        featureBreakdownJson: scoreResult.featureBreakdown,
      });

      // Create demo partner
      const rawKey = "pk_demo_nedbank_key_12345";
      const hash = hashApiKey(rawKey);
      let existingPartners = await storage.listPartners();
      let partner = existingPartners.find(p => p.name === "Nedbank Innovate");
      if (!partner) {
        partner = await storage.createPartner({
          name: "Nedbank Innovate",
          apiKeyHash: hash,
          isActive: true,
        });
      }

      res.json({
        message: "Demo data seeded",
        userId: demoUser.id,
        score: scoreResult.score,
        band: scoreResult.band,
        demoApiKey: rawKey,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return httpServer;
}
