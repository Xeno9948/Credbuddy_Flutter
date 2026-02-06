import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { computeCreditScore } from "./scoring";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import PDFDocument from "pdfkit";
import {
  buildExplainableBreakdown,
  renderForEntrepreneur,
  renderForLender,
  renderForLenderText,
  polishWithLLM,
  type ExplainableInput,
} from "@shared/explainability";

function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

function toExplainableInput(
  score: number,
  band: string,
  confidence: number,
  featureBreakdown: Record<string, number>,
  flags: string[],
  businessType: string
): ExplainableInput {
  return {
    score,
    band,
    confidence: confidence / 100,
    features: {
      data_discipline: featureBreakdown.dd ?? 0,
      revenue_stability: featureBreakdown.rs ?? 0,
      expense_pressure: featureBreakdown.ep ?? 0,
      buffer_behavior: featureBreakdown.bb ?? 0,
      trend_momentum: featureBreakdown.tm ?? 0,
      shock_recovery: featureBreakdown.sr ?? 0,
    },
    flags,
    context: { lookback_days: 14, business_type: businessType },
  };
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
        featureBreakdownJson: result.featureBreakdown as any,
      });

      const explInput = toExplainableInput(
        result.score, result.band, result.confidence,
        result.featureBreakdown as any, result.flags, "Unknown"
      );
      const explBreakdown = buildExplainableBreakdown(explInput, "en");
      const entrepreneurText = renderForEntrepreneur(explBreakdown);
      const lenderExpl = renderForLender(explBreakdown);

      const polished = await polishWithLLM(explBreakdown, entrepreneurText, renderForLenderText(explBreakdown));

      res.json({
        ...snapshot,
        featureBreakdown: result.featureBreakdown,
        flags: result.flags,
        explainability: {
          entrepreneur: polished.entrepreneurText,
          lender: lenderExpl,
          breakdown: explBreakdown,
          polished: polished.polished,
        },
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

      const fb = snapshot.featureBreakdownJson as Record<string, number>;
      const fl = (snapshot.flagsJson as string[]) ?? [];
      const explInput = toExplainableInput(snapshot.score, snapshot.band, snapshot.confidence, fb, fl, "Unknown");
      const explBreakdown = buildExplainableBreakdown(explInput, "en");

      res.json({
        ...snapshot,
        featureBreakdown: snapshot.featureBreakdownJson,
        flags: snapshot.flagsJson,
        explainability: {
          entrepreneur: renderForEntrepreneur(explBreakdown),
          lender: renderForLender(explBreakdown),
          breakdown: explBreakdown,
        },
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
        reply = `📊 *Weekly Status*\n\nRevenue: R${totalRev.toLocaleString()}\nRisk Band: ${band}\n\nRegular daily submissions help increase data coverage.\n\n_Decision-support only. Final decisions remain with you._`;
      } else if (lowerInput === "help") {
        reply = `🤖 *CredBuddy — Help*\n\nHere are all available commands:\n\n📊 *Track your finances:*\n• *R500* — Log today's revenue (e.g. R500, R1200)\n• *400 transport* — Log an expense with a note\n• *CASH 2000* — Update your cash on hand\n\n📈 *View your data:*\n• *STATUS* — See your weekly cashflow snapshot\n• *SCORE* — View your credit risk score with breakdown\n\n🔮 *Plan ahead:*\n• *SCENARIO* — View a hypothetical repayment scenario\n\n💡 *Data tips:*\n• Log your revenue and expenses every day\n• Even R0 days count — consistency increases data coverage\n• Your score updates each time you type SCORE\n\n_Decision-support only. Final decisions remain with you._`;
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
          featureBreakdownJson: result.featureBreakdown as any,
        });

        const profile2 = await storage.getBusinessProfile(body.userId);
        const explInput2 = toExplainableInput(
          result.score, result.band, result.confidence,
          result.featureBreakdown as any, result.flags,
          profile2?.businessType ?? "Unknown"
        );
        const explBreakdown2 = buildExplainableBreakdown(explInput2, "en");
        const entrepreneurExpl = renderForEntrepreneur(explBreakdown2);
        const polished2 = await polishWithLLM(explBreakdown2, entrepreneurExpl, "");
        reply = polished2.entrepreneurText;
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
      } else if (lowerInput.includes("scenario")) {
        reply = `🔮 *Scenario Engine*\n\nExample: If a *R1000* repayment were added over 3 months:\n• Estimated monthly repayment: ~R380/pm\n• Observed cashflow impact: Lower pressure indicated\n\nThis is a hypothetical estimate based on observed data only. It is not a credit offer, financial advice, or a recommendation.\n\n_Decision-support only. Final decisions remain with you._`;
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
        featureBreakdownJson: result.featureBreakdown as any,
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

  // GET /api/partner/dashboard - Aggregate risk dashboard stats
  app.get("/api/partner/dashboard", partnerAuth, async (req, res) => {
    try {
      const users = await storage.listUsers();
      const enriched = await Promise.all(users.map(async (u) => {
        const profile = await storage.getBusinessProfile(u.id);
        const score = await storage.getLatestScore(u.id);
        return { ...u, profile, score };
      }));

      const scored = enriched.filter(u => u.score);
      const totalApplicants = enriched.length;
      const avgScore = scored.length > 0
        ? Math.round(scored.reduce((sum, u) => sum + (u.score?.score ?? 0), 0) / scored.length)
        : 0;

      const bandDist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
      for (const u of scored) {
        const b = u.score?.band ?? "D";
        bandDist[b] = (bandDist[b] || 0) + 1;
      }

      const flaggedApplicants = scored
        .filter(u => {
          const flags = (u.score?.flagsJson as string[]) ?? [];
          return flags.length > 0 || (u.score?.band === "C" || u.score?.band === "D");
        })
        .map(u => ({
          id: u.id,
          phone: u.phone,
          businessName: u.profile?.businessName ?? null,
          businessType: u.profile?.businessType ?? null,
          score: u.score?.score ?? 0,
          band: u.score?.band ?? "D",
          confidence: u.score?.confidence ?? 0,
          flags: (u.score?.flagsJson as string[]) ?? [],
        }));

      const recentActivity = scored
        .sort((a, b) => new Date(b.score!.createdAt!).getTime() - new Date(a.score!.createdAt!).getTime())
        .slice(0, 10)
        .map(u => ({
          id: u.id,
          phone: u.phone,
          businessName: u.profile?.businessName ?? null,
          score: u.score?.score ?? 0,
          band: u.score?.band ?? "D",
          updatedAt: u.score?.createdAt ?? u.createdAt,
        }));

      const highRisk = scored.filter(u => u.score?.band === "C" || u.score?.band === "D").length;
      const lowRisk = scored.filter(u => u.score?.band === "A" || u.score?.band === "B").length;

      res.json({
        totalApplicants,
        avgScore,
        bandDist,
        highRisk,
        lowRisk,
        flaggedApplicants,
        recentActivity,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
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
      const userId = parseInt(req.params.id as string);
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const partner = (req as any).partner;
      await storage.createAuditLog({
        partnerId: partner.id,
        action: "view_applicant",
        targetId: String(userId),
        ip: (req.ip as string) ?? null,
      });

      const profile = await storage.getBusinessProfile(userId);
      const entries = await storage.getRecentEntries(userId, 14);
      const latestScore = await storage.getLatestScore(userId);
      const scoreHistory = await storage.getScoreHistory(userId, 12);
      const cashEstimate = await storage.getLatestCashEstimate(userId);

      let explainability = null;
      if (latestScore) {
        const fb = latestScore.featureBreakdownJson as Record<string, number>;
        const fl = (latestScore.flagsJson as string[]) ?? [];
        const explInput = toExplainableInput(
          latestScore.score, latestScore.band, latestScore.confidence,
          fb, fl, profile?.businessType ?? "Unknown"
        );
        const explBreakdown = buildExplainableBreakdown(explInput, "en");
        const lenderExpl = renderForLender(explBreakdown);
        const lenderText = renderForLenderText(explBreakdown);
        const entrepreneurText = renderForEntrepreneur(buildExplainableBreakdown(explInput, "en"));
        const polished = await polishWithLLM(explBreakdown, entrepreneurText, lenderText);

        explainability = {
          lender: lenderExpl,
          lenderText: polished.lenderText,
          entrepreneurText: polished.entrepreneurText,
          breakdown: explBreakdown,
          polished: polished.polished,
        };
      }

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
        explainability,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ══════════════════════════════════════════════════════
  //  CREDIT REPORT PDF
  // ══════════════════════════════════════════════════════

  function maskPhone(phone: string): string {
    if (phone.length <= 3) return phone;
    return "*".repeat(phone.length - 3) + phone.slice(-3);
  }

  function confidenceLabel(c: number): string {
    if (c >= 80) return "High";
    if (c >= 60) return "Moderate";
    if (c >= 40) return "Limited";
    return "Low";
  }

  function featureLevel(val: number): string {
    if (val >= 0.7) return "Higher";
    if (val >= 0.4) return "Moderate";
    return "Lower";
  }

  function trendLabel(val: number): string {
    if (val >= 0.6) return "Up";
    if (val >= 0.3) return "Flat";
    return "Down";
  }

  const DISCLAIMER_TEXT = "CredBuddy provides data-driven credit risk insights for informational purposes only. CredBuddy does not provide financial advice, credit decisions, or recommendations. The final decision remains entirely with the user or authorized partner. Score v1 is experimental and based on self-reported cashflow data.";

  app.get("/api/v1/users/:userId/credit-report.pdf", partnerAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId as string);
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const partner = (req as any).partner;
      const profile = await storage.getBusinessProfile(userId);
      const entries = await storage.getRecentEntries(userId, 14);
      const latestScore = await storage.getLatestScore(userId);
      const scoreHistory = await storage.getScoreHistory(userId, 90);
      const cashEstimateCount = await storage.getCashEstimateCount(userId);

      await storage.createAuditLog({
        partnerId: partner.id,
        action: "REPORT_PDF_DOWNLOADED",
        targetId: String(userId),
        ip: (req.ip as string) ?? null,
      });

      if (!latestScore) return res.status(404).json({ error: "No score data available" });

      const fb = latestScore.featureBreakdownJson as Record<string, number>;
      const fl = (latestScore.flagsJson as string[]) ?? [];
      const explInput = toExplainableInput(latestScore.score, latestScore.band, latestScore.confidence, fb, fl, profile?.businessType ?? "Unknown");
      const explBreakdown = buildExplainableBreakdown(explInput, "en");
      const lenderExpl = renderForLender(explBreakdown);

      const doc = new PDFDocument({ size: "A4", margins: { top: 50, bottom: 50, left: 50, right: 50 } });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="credit-report-${userId}.pdf"`);
      doc.pipe(res);

      // PAGE 1
      doc.fontSize(20).font("Helvetica-Bold").text("Credit Risk Assessment Report", { align: "center" });
      doc.moveDown(0.3);
      doc.fontSize(10).font("Helvetica").fillColor("#666666").text(`Generated: ${new Date().toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" })}`, { align: "center" });
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#e2e8f0").stroke();
      doc.moveDown(0.5);

      doc.fillColor("#000000").fontSize(12).font("Helvetica-Bold").text("Business Details");
      doc.moveDown(0.3);
      doc.fontSize(10).font("Helvetica");
      doc.text(`Business Name: ${profile?.businessName ?? "N/A"}`);
      doc.text(`Business Type: ${profile?.businessType ?? "N/A"}`);
      doc.text(`Phone: ${maskPhone(user.phone)}`);
      doc.text(`Assessment Period: Last 14 days`);
      doc.moveDown(0.8);

      doc.fontSize(12).font("Helvetica-Bold").text("Credit Score");
      doc.moveDown(0.3);
      doc.fontSize(28).font("Helvetica-Bold").text(`${latestScore.score} / 1000`, { continued: false });
      doc.fontSize(10).font("Helvetica");
      doc.text(`Band: ${latestScore.band}  |  Confidence: ${latestScore.confidence}% (${confidenceLabel(latestScore.confidence)})`);
      doc.moveDown(0.8);

      doc.fontSize(12).font("Helvetica-Bold").text("Explainable Summary");
      doc.moveDown(0.3);
      doc.fontSize(10).font("Helvetica");

      const strengths = lenderExpl.positiveDrivers.slice(0, 2);
      const risks = lenderExpl.negativeDrivers.slice(0, 2);

      if (strengths.length > 0) {
        doc.font("Helvetica-Bold").text("Strengths:");
        doc.font("Helvetica");
        strengths.forEach(s => doc.text(`  • ${s}`));
        doc.moveDown(0.3);
      }

      if (risks.length > 0) {
        doc.font("Helvetica-Bold").text("Risk Indicators:");
        doc.font("Helvetica");
        risks.forEach(r => doc.text(`  • ${r}`));
        doc.moveDown(0.3);
      }

      if (fl.length > 0) {
        doc.font("Helvetica-Bold").text("Flags:");
        doc.font("Helvetica");
        fl.forEach(f => doc.text(`  • ${f}`));
        doc.moveDown(0.3);
      }

      doc.moveDown(0.5);
      doc.fontSize(8).fillColor("#888888").text(DISCLAIMER_TEXT, { align: "left" });

      // PAGE 2
      doc.addPage();
      doc.fillColor("#000000").fontSize(12).font("Helvetica-Bold").text("Risk Indicators");
      doc.moveDown(0.3);
      doc.fontSize(10).font("Helvetica");

      const indicators = [
        { label: "Revenue Stability", value: featureLevel(fb.rs ?? 0) },
        { label: "Cash Buffer", value: featureLevel(fb.bb ?? 0) },
        { label: "Data Discipline", value: featureLevel(fb.dd ?? 0) },
        { label: "Trend Momentum", value: trendLabel(fb.tm ?? 0) },
        { label: "Expense Pressure", value: featureLevel(fb.ep ?? 0) },
        { label: "Shock Recovery", value: featureLevel(fb.sr ?? 0) },
      ];

      indicators.forEach(ind => {
        doc.text(`${ind.label}: ${ind.value}`);
      });
      doc.moveDown(0.8);

      doc.fontSize(12).font("Helvetica-Bold").text("Score History");
      doc.moveDown(0.3);
      doc.fontSize(10).font("Helvetica");

      const historyToShow = scoreHistory.slice(0, 15);
      if (historyToShow.length > 0) {
        doc.font("Helvetica-Bold").text("Date                    Score   Band   Confidence");
        doc.font("Helvetica");
        historyToShow.forEach(s => {
          doc.text(`${s.asOfDate}              ${s.score}     ${s.band}      ${s.confidence}%`);
        });
      } else {
        doc.text("No score history available.");
      }
      doc.moveDown(0.8);

      doc.fontSize(12).font("Helvetica-Bold").text("Data Coverage");
      doc.moveDown(0.3);
      doc.fontSize(10).font("Helvetica");
      const activeDays = entries.length;
      const hasExpenses = entries.filter(e => e.expenseCents > 0).length;
      const expenseLevel = hasExpenses >= 10 ? "Full" : hasExpenses >= 5 ? "Partial" : "None";
      doc.text(`Active days (last 14): ${activeDays}`);
      doc.text(`Expense tracking: ${expenseLevel}`);
      doc.text(`Cash estimates provided: ${cashEstimateCount}`);
      doc.moveDown(1);

      doc.fontSize(8).fillColor("#888888").text(DISCLAIMER_TEXT, { align: "left" });

      doc.end();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ══════════════════════════════════════════════════════
  //  SHARE LINK
  // ══════════════════════════════════════════════════════

  app.post("/api/partner/users/:id/share-link", partnerAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id as string);
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const partner = (req as any).partner;
      const token = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(token).digest("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await storage.createShareLink({
        userId,
        createdByPartnerId: partner.id,
        tokenHash,
        expiresAt,
      });

      await storage.createAuditLog({
        partnerId: partner.id,
        action: "REPORT_LINK_CREATED",
        targetId: String(userId),
        ip: (req.ip as string) ?? null,
      });

      res.json({ token, expiresAt: expiresAt.toISOString() });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Public share link data endpoint
  app.get("/api/share/:token", async (req, res) => {
    try {
      const token = req.params.token as string;
      const tokenHash = createHash("sha256").update(token).digest("hex");
      const link = await storage.getShareLinkByTokenHash(tokenHash);

      if (!link) return res.status(404).json({ error: "Link not found or expired" });
      if (new Date() > link.expiresAt) return res.status(410).json({ error: "This link has expired" });

      const user = await storage.getUser(link.userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const profile = await storage.getBusinessProfile(link.userId);
      const entries = await storage.getRecentEntries(link.userId, 14);
      const latestScore = await storage.getLatestScore(link.userId);
      const scoreHistory = await storage.getScoreHistory(link.userId, 30);
      const cashEstimateCount = await storage.getCashEstimateCount(link.userId);

      await storage.createAuditLog({
        partnerId: link.createdByPartnerId,
        action: "REPORT_LINK_VIEWED",
        targetId: String(link.userId),
        ip: (req.ip as string) ?? null,
      });

      let explainability = null;
      if (latestScore) {
        const fb = latestScore.featureBreakdownJson as Record<string, number>;
        const fl = (latestScore.flagsJson as string[]) ?? [];
        const explInput = toExplainableInput(latestScore.score, latestScore.band, latestScore.confidence, fb, fl, profile?.businessType ?? "Unknown");
        const explBreakdown = buildExplainableBreakdown(explInput, "en");
        explainability = {
          lender: renderForLender(explBreakdown),
          breakdown: explBreakdown,
        };
      }

      const fb = (latestScore?.featureBreakdownJson as Record<string, number>) ?? {};
      const activeDays = entries.length;
      const hasExpenses = entries.filter(e => e.expenseCents > 0).length;
      const expenseLevel = hasExpenses >= 10 ? "Full" : hasExpenses >= 5 ? "Partial" : "None";

      res.json({
        businessName: profile?.businessName ?? "N/A",
        businessType: profile?.businessType ?? "N/A",
        phone: maskPhone(user.phone),
        score: latestScore ? {
          score: latestScore.score,
          band: latestScore.band,
          confidence: latestScore.confidence,
        } : null,
        riskIndicators: {
          revenueStability: featureLevel(fb.rs ?? 0),
          cashBuffer: featureLevel(fb.bb ?? 0),
          dataDiscipline: featureLevel(fb.dd ?? 0),
          trendMomentum: trendLabel(fb.tm ?? 0),
          expensePressure: featureLevel(fb.ep ?? 0),
          shockRecovery: featureLevel(fb.sr ?? 0),
        },
        explainability,
        scoreHistory: scoreHistory.map(s => ({
          date: s.asOfDate,
          score: s.score,
          band: s.band,
          confidence: s.confidence,
        })),
        dataCoverage: {
          activeDays,
          expenseTracking: expenseLevel,
          cashEstimatesCount: cashEstimateCount,
        },
        expiresAt: link.expiresAt.toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ══════════════════════════════════════════════════════
  //  PARTNER RECALC
  // ══════════════════════════════════════════════════════

  app.post("/api/partner/users/:id/recalc", partnerAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id as string);
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const partner = (req as any).partner;
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
        featureBreakdownJson: result.featureBreakdown as any,
      });

      await storage.createAuditLog({
        partnerId: partner.id,
        action: "SCORE_RECALC_REQUESTED",
        targetId: String(userId),
        ip: (req.ip as string) ?? null,
      });

      const profile = await storage.getBusinessProfile(userId);
      const fb = result.featureBreakdown as Record<string, number>;
      const explInput = toExplainableInput(result.score, result.band, result.confidence, fb, result.flags, profile?.businessType ?? "Unknown");
      const explBreakdown = buildExplainableBreakdown(explInput, "en");

      res.json({
        ...snapshot,
        featureBreakdown: result.featureBreakdown,
        flags: result.flags,
        explainability: {
          lender: renderForLender(explBreakdown),
          breakdown: explBreakdown,
        },
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
        featureBreakdownJson: scoreResult.featureBreakdown as any,
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
