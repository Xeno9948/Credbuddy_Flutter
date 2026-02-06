import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { computeCreditScore } from "./scoring";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { format, subDays } from "date-fns";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function maskPhone(phone: string): string {
  if (phone.length <= 3) return phone;
  return "*".repeat(phone.length - 3) + phone.slice(-3);
}

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

export function registerWebLiteRoutes(app: Express) {

  // ══════════════════════════════════════════════════════
  //  AUTH — Magic Link
  // ══════════════════════════════════════════════════════

  app.post("/api/web/auth/request-link", async (req: Request, res: Response) => {
    try {
      const { email } = z.object({ email: z.string().email() }).parse(req.body);
      const normalizedEmail = email.toLowerCase();

      let account = await storage.getWebAccountByEmail(normalizedEmail);
      if (!account) {
        account = await storage.createWebAccount({ email: normalizedEmail });
      }

      const recentCount = await storage.countRecentMagicLinks(account.id, 15);
      if (recentCount >= 3) {
        return res.status(429).json({ error: "Too many requests. Please wait a few minutes." });
      }

      const token = randomBytes(32).toString("hex");
      const tokenHash = hashToken(token);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await storage.createMagicLinkToken({ webAccountId: account.id, tokenHash, expiresAt });

      await storage.createAuditLog({ action: "LOGIN_LINK_SENT", targetId: normalizedEmail });

      const magicUrl = `${req.protocol}://${req.get("host")}/web/auth/callback?token=${token}`;

      console.log(`[Web Lite] Magic link for ${normalizedEmail}: ${magicUrl}`);

      res.json({ ok: true, message: "Login link sent to your email." });
    } catch (err: any) {
      if (err?.name === "ZodError") return res.status(400).json({ error: "Invalid email address" });
      console.error("Magic link error:", err);
      res.status(500).json({ error: "Internal error" });
    }
  });

  app.post("/api/web/auth/verify-token", async (req: Request, res: Response) => {
    try {
      const { token } = z.object({ token: z.string().min(1) }).parse(req.body);
      const tokenHash = hashToken(token);

      const magicToken = await storage.getMagicLinkTokenByHash(tokenHash);
      if (!magicToken) {
        return res.status(400).json({ error: "Invalid or expired link" });
      }
      if (magicToken.usedAt) {
        return res.status(400).json({ error: "This link has already been used" });
      }

      await storage.markMagicLinkTokenUsed(magicToken.id);
      await storage.touchWebAccountLogin(magicToken.webAccountId);

      const sessionToken = randomBytes(32).toString("hex");
      const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await storage.createWebSession(magicToken.webAccountId, sessionToken, sessionExpiry);

      await storage.createAuditLog({ action: "LOGIN_SUCCESS", targetId: String(magicToken.webAccountId) });

      res.cookie("web_session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      res.json({ ok: true });
    } catch (err: any) {
      if (err?.name === "ZodError") return res.status(400).json({ error: "Invalid token" });
      console.error("Verify token error:", err);
      res.status(500).json({ error: "Internal error" });
    }
  });

  app.post("/api/web/auth/logout", async (req: Request, res: Response) => {
    const sessionToken = req.cookies?.web_session;
    if (sessionToken) {
      await storage.deleteWebSession(sessionToken);
    }
    res.clearCookie("web_session", { path: "/" });
    res.json({ ok: true });
  });

  app.get("/api/web/auth/me", webSessionAuth, async (req: Request, res: Response) => {
    try {
      const webAccountId = (req as any).webAccountId;
      const account = await storage.getWebAccount(webAccountId);
      if (!account) return res.status(404).json({ error: "Account not found" });

      const link = await storage.getLinkedUser(webAccountId);
      let linkedUserId: number | null = null;
      let linkedPhone: string | null = null;
      let profile: any = null;

      if (link) {
        linkedUserId = link.userId;
        const user = await storage.getUser(link.userId);
        if (user) linkedPhone = maskPhone(user.phone);
        profile = await storage.getBusinessProfile(link.userId);
      }

      res.json({
        email: account.email,
        linkedUserId,
        linkedPhone,
        businessName: profile?.businessName ?? null,
        businessType: profile?.businessType ?? null,
      });
    } catch (err) {
      console.error("Me error:", err);
      res.status(500).json({ error: "Internal error" });
    }
  });

  // ══════════════════════════════════════════════════════
  //  PHONE LINKING
  // ══════════════════════════════════════════════════════

  app.post("/api/web/phone/send-code", webSessionAuth, async (req: Request, res: Response) => {
    try {
      const webAccountId = (req as any).webAccountId;
      const { phone } = z.object({ phone: z.string().min(5) }).parse(req.body);

      const existingLink = await storage.getLinkedUser(webAccountId);
      if (existingLink) {
        return res.status(400).json({ error: "Account already linked to a phone number" });
      }

      const user = await storage.getUserByPhone(phone);
      if (!user) {
        return res.status(404).json({ error: "No CredBuddy profile found for this phone number. Please onboard via WhatsApp first." });
      }

      const code = generateCode();
      const codeHash = hashToken(code);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await storage.createPhoneLinkCode({ webAccountId, phone, codeHash, expiresAt, attempts: 0 });

      await storage.createAuditLog({ action: "PHONE_LINK_CODE_SENT", targetId: maskPhone(phone) });

      console.log(`[Web Lite] Phone link code for ${maskPhone(phone)}: ${code}`);

      res.json({ ok: true, message: "Verification code sent via WhatsApp." });
    } catch (err: any) {
      if (err?.name === "ZodError") return res.status(400).json({ error: "Invalid phone number" });
      console.error("Send code error:", err);
      res.status(500).json({ error: "Internal error" });
    }
  });

  app.post("/api/web/phone/verify-code", webSessionAuth, async (req: Request, res: Response) => {
    try {
      const webAccountId = (req as any).webAccountId;
      const { phone, code } = z.object({ phone: z.string().min(5), code: z.string().length(6) }).parse(req.body);

      const linkCode = await storage.getActivePhoneLinkCode(webAccountId, phone);
      if (!linkCode) {
        return res.status(400).json({ error: "No active verification code found. Please request a new one." });
      }

      if (linkCode.attempts >= 5) {
        return res.status(429).json({ error: "Too many attempts. Please request a new code." });
      }

      await storage.incrementPhoneLinkAttempts(linkCode.id);

      const codeHash = hashToken(code);
      if (codeHash !== linkCode.codeHash) {
        return res.status(400).json({ error: "Incorrect code. Please try again." });
      }

      const user = await storage.getUserByPhone(phone);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      await storage.createWebAccountUserLink({ webAccountId, userId: user.id, role: "OWNER" });

      await storage.createAuditLog({ action: "PHONE_LINK_SUCCESS", targetId: maskPhone(phone) });

      res.json({ ok: true, userId: user.id });
    } catch (err: any) {
      if (err?.name === "ZodError") return res.status(400).json({ error: "Invalid input" });
      console.error("Verify code error:", err);
      res.status(500).json({ error: "Internal error" });
    }
  });

  // ══════════════════════════════════════════════════════
  //  DATA — Score, Entries, History
  // ══════════════════════════════════════════════════════

  app.get("/api/web/score", webSessionAuth, async (req: Request, res: Response) => {
    try {
      const webAccountId = (req as any).webAccountId;
      const link = await storage.getLinkedUser(webAccountId);
      if (!link) return res.status(400).json({ error: "No linked profile" });

      const score = await storage.getLatestScore(link.userId);
      const profile = await storage.getBusinessProfile(link.userId);

      res.json({
        score: score ? {
          score: score.score,
          band: score.band,
          confidence: score.confidence,
          flags: score.flagsJson,
          featureBreakdown: score.featureBreakdownJson,
          asOfDate: score.asOfDate,
        } : null,
        businessName: profile?.businessName ?? null,
      });
    } catch (err) {
      console.error("Score error:", err);
      res.status(500).json({ error: "Internal error" });
    }
  });

  app.get("/api/web/entries", webSessionAuth, async (req: Request, res: Response) => {
    try {
      const webAccountId = (req as any).webAccountId;
      const link = await storage.getLinkedUser(webAccountId);
      if (!link) return res.status(400).json({ error: "No linked profile" });

      const days = Math.min(Number(req.query.days) || 30, 90);
      const entries = await storage.getRecentEntries(link.userId, days);

      res.json(entries.map(e => ({
        id: e.id,
        date: e.date,
        revenueCents: e.revenueCents,
        expenseCents: e.expenseCents,
        expenseNote: e.expenseNote,
      })));
    } catch (err) {
      console.error("Entries error:", err);
      res.status(500).json({ error: "Internal error" });
    }
  });

  app.post("/api/web/entries", webSessionAuth, async (req: Request, res: Response) => {
    try {
      const webAccountId = (req as any).webAccountId;
      const link = await storage.getLinkedUser(webAccountId);
      if (!link) return res.status(400).json({ error: "No linked profile" });

      const body = z.object({
        revenueCents: z.number().int().min(0),
        expenseCents: z.number().int().min(0).optional().default(0),
        expenseNote: z.string().optional(),
      }).parse(req.body);

      const today = format(new Date(), "yyyy-MM-dd");
      const entry = await storage.upsertDailyEntry({
        userId: link.userId,
        date: today,
        revenueCents: body.revenueCents,
        expenseCents: body.expenseCents,
        expenseNote: body.expenseNote,
      });

      await storage.touchUserActivity(link.userId);
      await storage.createAuditLog({ action: "ENTRY_CREATED", targetId: String(link.userId) });

      res.json({
        id: entry.id,
        date: entry.date,
        revenueCents: entry.revenueCents,
        expenseCents: entry.expenseCents,
      });
    } catch (err: any) {
      if (err?.name === "ZodError") return res.status(400).json({ error: "Invalid entry data" });
      console.error("Create entry error:", err);
      res.status(500).json({ error: "Internal error" });
    }
  });

  app.get("/api/web/history", webSessionAuth, async (req: Request, res: Response) => {
    try {
      const webAccountId = (req as any).webAccountId;
      const link = await storage.getLinkedUser(webAccountId);
      if (!link) return res.status(400).json({ error: "No linked profile" });

      const days = Math.min(Number(req.query.days) || 30, 90);
      const history = await storage.getScoreHistory(link.userId, days);

      res.json(history.map(s => ({
        id: s.id,
        asOfDate: s.asOfDate,
        score: s.score,
        band: s.band,
        confidence: s.confidence,
        flags: s.flagsJson,
      })));
    } catch (err) {
      console.error("History error:", err);
      res.status(500).json({ error: "Internal error" });
    }
  });

  app.post("/api/web/recalc", webSessionAuth, async (req: Request, res: Response) => {
    try {
      const webAccountId = (req as any).webAccountId;
      const link = await storage.getLinkedUser(webAccountId);
      if (!link) return res.status(400).json({ error: "No linked profile" });

      const entries = await storage.getRecentEntries(link.userId, 14);
      const cashEstimate = await storage.getLatestCashEstimate(link.userId);
      const profile = await storage.getBusinessProfile(link.userId);

      const result = computeCreditScore(entries, cashEstimate || null);

      const today = format(new Date(), "yyyy-MM-dd");
      const snapshot = await storage.createScoreSnapshot({
        userId: link.userId,
        asOfDate: today,
        score: result.score,
        confidence: result.confidence,
        band: result.band,
        flagsJson: result.flags,
        featureBreakdownJson: result.featureBreakdown as unknown as Record<string, number>,
      });

      await storage.createAuditLog({ action: "SCORE_RECALC", targetId: String(link.userId) });

      res.json({
        score: snapshot.score,
        band: snapshot.band,
        confidence: snapshot.confidence,
        flags: snapshot.flagsJson,
        featureBreakdown: snapshot.featureBreakdownJson,
        asOfDate: snapshot.asOfDate,
      });
    } catch (err) {
      console.error("Recalc error:", err);
      res.status(500).json({ error: "Internal error" });
    }
  });

  app.get("/api/web/report-status", webSessionAuth, async (req: Request, res: Response) => {
    try {
      const webAccountId = (req as any).webAccountId;
      const link = await storage.getLinkedUser(webAccountId);
      if (!link) return res.status(400).json({ error: "No linked profile" });

      const score = await storage.getLatestScore(link.userId);
      res.json({ available: !!score });
    } catch (err) {
      console.error("Report status error:", err);
      res.status(500).json({ error: "Internal error" });
    }
  });
}
