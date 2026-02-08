import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { geminiService } from "./geminiService";
import { z } from "zod";
import { format, subDays } from "date-fns";

// ─── Auth Middleware ────────────────────────────────────────────────

async function webSessionAuth(req: Request, res: Response, next: NextFunction) {
  const sessionToken = req.cookies?.web_session;
  if (!sessionToken) return res.status(401).json({ error: "Not authenticated" });

  const session = await storage.getWebSessionByToken(sessionToken);
  if (!session || session.expiresAt < new Date()) {
    return res.status(401).json({ error: "Session expired" });
  }

  (req as any).webAccountId = session.webAccountId;
  next();
}

// ─── Helper Function ────────────────────────────────────────────────

async function getUserIdFromWebAccount(webAccountId: number): Promise<number | null> {
  const link = await storage.getLinkedUser(webAccountId);
  return link?.userId || null;
}

// ─── Gemini API Routes ──────────────────────────────────────────────

export function registerGeminiRoutes(app: Express) {

  // ══════════════════════════════════════════════════════
  //  Feature 1: Explain Score
  // ══════════════════════════════════════════════════════

  app.post("/api/ai/explain-score", webSessionAuth, async (req: Request, res: Response) => {
    try {
      const webAccountId = (req as any).webAccountId;
      const userId = await getUserIdFromWebAccount(webAccountId);

      if (!userId) {
        return res.status(400).json({ error: "No linked profile found" });
      }

      const score = await storage.getLatestScore(userId);
      if (!score) {
        return res.status(404).json({ error: "No score found" });
      }

      const profile = await storage.getBusinessProfile(userId);

      const explanation = await geminiService.explainScore({
        score: score.score,
        band: score.band,
        features: score.featureBreakdownJson as Record<string, number>,
        flags: score.flagsJson as string[],
        businessType: profile?.businessType || "General",
      });

      res.json({ explanation });
    } catch (err) {
      console.error("[Gemini API] explain-score error:", err);
      res.status(500).json({ error: "Failed to generate explanation" });
    }
  });

  // ══════════════════════════════════════════════════════
  //  Feature 2: Natural Language Chat
  // ══════════════════════════════════════════════════════

  app.post("/api/ai/chat", webSessionAuth, async (req: Request, res: Response) => {
    try {
      const webAccountId = (req as any).webAccountId;
      const userId = await getUserIdFromWebAccount(webAccountId);

      if (!userId) {
        return res.status(400).json({ error: "No linked profile found" });
      }

      const { message, history } = z.object({
        message: z.string().min(1).max(1000),
        history: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })).optional().default([]),
      }).parse(req.body);

      // Get user context
      const score = await storage.getLatestScore(userId);
      const today = format(new Date(), "yyyy-MM-dd");
      const twoWeeksAgo = format(subDays(new Date(), 14), "yyyy-MM-dd");
      const entries = await storage.getDailyEntries(userId, twoWeeksAgo, today);

      const response = await geminiService.chat({
        userMessage: message,
        conversationHistory: history,
        context: { score, entries },
      });

      res.json({ response });
    } catch (err: any) {
      if (err?.name === "ZodError") {
        return res.status(400).json({ error: "Invalid request format" });
      }
      console.error("[Gemini API] chat error:", err);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  // ══════════════════════════════════════════════════════
  //  Feature 3: AI Insights & Recommendations
  // ══════════════════════════════════════════════════════

  app.post("/api/ai/insights", webSessionAuth, async (req: Request, res: Response) => {
    try {
      const webAccountId = (req as any).webAccountId;
      const userId = await getUserIdFromWebAccount(webAccountId);

      if (!userId) {
        return res.status(400).json({ error: "No linked profile found" });
      }

      const score = await storage.getLatestScore(userId);
      if (!score) {
        return res.status(404).json({ error: "No score found" });
      }

      const today = format(new Date(), "yyyy-MM-dd");
      const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
      const entries = await storage.getDailyEntries(userId, thirtyDaysAgo, today);
      const scoreHistory = await storage.getScoreHistory(userId, 10);

      const insights = await geminiService.generateInsights({
        score,
        entries,
        scoreHistory,
      });

      res.json({ insights });
    } catch (err) {
      console.error("[Gemini API] insights error:", err);
      res.status(500).json({ error: "Failed to generate insights" });
    }
  });

  // ══════════════════════════════════════════════════════
  //  Feature 4: Smart Data Entry Parser
  // ══════════════════════════════════════════════════════

  app.post("/api/ai/parse-entry", webSessionAuth, async (req: Request, res: Response) => {
    try {
      const { text } = z.object({
        text: z.string().min(1).max(500),
      }).parse(req.body);

      const parsed = await geminiService.parseNaturalLanguageEntry(text);

      res.json({ parsed });
    } catch (err: any) {
      if (err?.name === "ZodError") {
        return res.status(400).json({ error: "Invalid input" });
      }
      console.error("[Gemini API] parse-entry error:", err);
      res.status(500).json({ error: "Failed to parse entry" });
    }
  });

  console.log("[Gemini Routes] Registered 4 AI endpoints:");
  console.log("  POST /api/ai/explain-score");
  console.log("  POST /api/ai/chat");
  console.log("  POST /api/ai/insights");
  console.log("  POST /api/ai/parse-entry");
}
