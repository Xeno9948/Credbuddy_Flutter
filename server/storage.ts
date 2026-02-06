import { eq, desc, and, gte, lte, sql, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import type {
  User, InsertUser,
  BusinessProfile, InsertBusinessProfile,
  ConversationState, InsertConversationState,
  DailyEntry, InsertDailyEntry,
  CashEstimate, InsertCashEstimate,
  ScoreSnapshot, InsertScoreSnapshot,
  Partner, InsertPartner,
  PartnerUserAccess, InsertPartnerUserAccess,
  DecisionRequest, InsertDecisionRequest,
  AuditLog, InsertAuditLog,
  MessageLog, InsertMessageLog,
  Job, InsertJob,
} from "@shared/schema";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listUsers(): Promise<User[]>;
  searchUsers(query: string): Promise<User[]>;
  touchUserActivity(id: number): Promise<void>;

  // Business Profiles
  getBusinessProfile(userId: number): Promise<BusinessProfile | undefined>;
  upsertBusinessProfile(profile: InsertBusinessProfile): Promise<BusinessProfile>;

  // Conversation State
  getConversationState(userId: number): Promise<ConversationState | undefined>;
  upsertConversationState(state: InsertConversationState): Promise<ConversationState>;

  // Daily Entries
  getDailyEntry(userId: number, date: string): Promise<DailyEntry | undefined>;
  upsertDailyEntry(entry: InsertDailyEntry): Promise<DailyEntry>;
  getDailyEntries(userId: number, fromDate: string, toDate: string): Promise<DailyEntry[]>;
  getRecentEntries(userId: number, days: number): Promise<DailyEntry[]>;

  // Cash Estimates
  getLatestCashEstimate(userId: number): Promise<CashEstimate | undefined>;
  createCashEstimate(estimate: InsertCashEstimate): Promise<CashEstimate>;

  // Score Snapshots
  getLatestScore(userId: number): Promise<ScoreSnapshot | undefined>;
  getScoreHistory(userId: number, limit?: number): Promise<ScoreSnapshot[]>;
  createScoreSnapshot(snapshot: InsertScoreSnapshot): Promise<ScoreSnapshot>;

  // Partners
  getPartner(id: number): Promise<Partner | undefined>;
  getPartnerByApiKeyHash(hash: string): Promise<Partner | undefined>;
  createPartner(partner: InsertPartner): Promise<Partner>;
  listPartners(): Promise<Partner[]>;

  // Partner User Access
  getPartnerAccess(partnerId: number, userId: number): Promise<PartnerUserAccess | undefined>;
  grantAccess(access: InsertPartnerUserAccess): Promise<PartnerUserAccess>;

  // Decision Requests
  createDecisionRequest(req: InsertDecisionRequest): Promise<DecisionRequest>;
  getDecisionRequests(partnerId: number): Promise<DecisionRequest[]>;
  updateDecisionStatus(id: number, status: string, notes?: string): Promise<DecisionRequest | undefined>;

  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;

  // Message Logs
  createMessageLog(log: InsertMessageLog): Promise<MessageLog>;
  getMessageLogs(userId: number, limit?: number): Promise<MessageLog[]>;

  // Jobs
  createJob(job: InsertJob): Promise<Job>;
  getNextPendingJob(): Promise<Job | undefined>;
  updateJobStatus(id: number, status: string, error?: string): Promise<void>;

  // Dashboard aggregates
  getUserCount(): Promise<number>;
  getActiveUserCount(days: number): Promise<number>;
  getAverageScore(): Promise<number>;
  getScoreBandDistribution(): Promise<Record<string, number>>;
}

export class DatabaseStorage implements IStorage {
  // ─── Users ────────────────────────────────────────────
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.phone, phone));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(schema.users).values(user).returning();
    return created;
  }

  async listUsers(): Promise<User[]> {
    return db.select().from(schema.users).orderBy(desc(schema.users.lastActiveAt));
  }

  async searchUsers(query: string): Promise<User[]> {
    return db.select().from(schema.users).where(like(schema.users.phone, `%${query}%`));
  }

  async touchUserActivity(id: number): Promise<void> {
    await db.update(schema.users).set({ lastActiveAt: new Date() }).where(eq(schema.users.id, id));
  }

  // ─── Business Profiles ────────────────────────────────
  async getBusinessProfile(userId: number): Promise<BusinessProfile | undefined> {
    const [profile] = await db.select().from(schema.businessProfiles).where(eq(schema.businessProfiles.userId, userId));
    return profile;
  }

  async upsertBusinessProfile(profile: InsertBusinessProfile): Promise<BusinessProfile> {
    const existing = await this.getBusinessProfile(profile.userId);
    if (existing) {
      const [updated] = await db.update(schema.businessProfiles).set(profile).where(eq(schema.businessProfiles.userId, profile.userId)).returning();
      return updated;
    }
    const [created] = await db.insert(schema.businessProfiles).values(profile).returning();
    return created;
  }

  // ─── Conversation State ───────────────────────────────
  async getConversationState(userId: number): Promise<ConversationState | undefined> {
    const [state] = await db.select().from(schema.conversationStates).where(eq(schema.conversationStates.userId, userId));
    return state;
  }

  async upsertConversationState(state: InsertConversationState): Promise<ConversationState> {
    const existing = await this.getConversationState(state.userId);
    if (existing) {
      const [updated] = await db.update(schema.conversationStates).set({ ...state, updatedAt: new Date() }).where(eq(schema.conversationStates.userId, state.userId)).returning();
      return updated;
    }
    const [created] = await db.insert(schema.conversationStates).values(state).returning();
    return created;
  }

  // ─── Daily Entries ────────────────────────────────────
  async getDailyEntry(userId: number, date: string): Promise<DailyEntry | undefined> {
    const [entry] = await db.select().from(schema.dailyEntries).where(
      and(eq(schema.dailyEntries.userId, userId), eq(schema.dailyEntries.date, date))
    );
    return entry;
  }

  async upsertDailyEntry(entry: InsertDailyEntry): Promise<DailyEntry> {
    const existing = await this.getDailyEntry(entry.userId, entry.date);
    if (existing) {
      const [updated] = await db.update(schema.dailyEntries)
        .set({ revenueCents: entry.revenueCents, expenseCents: entry.expenseCents, expenseNote: entry.expenseNote })
        .where(eq(schema.dailyEntries.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(schema.dailyEntries).values(entry).returning();
    return created;
  }

  async getDailyEntries(userId: number, fromDate: string, toDate: string): Promise<DailyEntry[]> {
    return db.select().from(schema.dailyEntries).where(
      and(
        eq(schema.dailyEntries.userId, userId),
        gte(schema.dailyEntries.date, fromDate),
        lte(schema.dailyEntries.date, toDate)
      )
    ).orderBy(desc(schema.dailyEntries.date));
  }

  async getRecentEntries(userId: number, days: number): Promise<DailyEntry[]> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    const fromStr = fromDate.toISOString().split("T")[0];
    return db.select().from(schema.dailyEntries).where(
      and(
        eq(schema.dailyEntries.userId, userId),
        gte(schema.dailyEntries.date, fromStr)
      )
    ).orderBy(desc(schema.dailyEntries.date));
  }

  // ─── Cash Estimates ───────────────────────────────────
  async getLatestCashEstimate(userId: number): Promise<CashEstimate | undefined> {
    const [est] = await db.select().from(schema.cashEstimates)
      .where(eq(schema.cashEstimates.userId, userId))
      .orderBy(desc(schema.cashEstimates.createdAt))
      .limit(1);
    return est;
  }

  async createCashEstimate(estimate: InsertCashEstimate): Promise<CashEstimate> {
    const [created] = await db.insert(schema.cashEstimates).values(estimate).returning();
    return created;
  }

  // ─── Score Snapshots ──────────────────────────────────
  async getLatestScore(userId: number): Promise<ScoreSnapshot | undefined> {
    const [snap] = await db.select().from(schema.scoreSnapshots)
      .where(eq(schema.scoreSnapshots.userId, userId))
      .orderBy(desc(schema.scoreSnapshots.createdAt))
      .limit(1);
    return snap;
  }

  async getScoreHistory(userId: number, limit = 30): Promise<ScoreSnapshot[]> {
    return db.select().from(schema.scoreSnapshots)
      .where(eq(schema.scoreSnapshots.userId, userId))
      .orderBy(desc(schema.scoreSnapshots.asOfDate))
      .limit(limit);
  }

  async createScoreSnapshot(snapshot: InsertScoreSnapshot): Promise<ScoreSnapshot> {
    const [created] = await db.insert(schema.scoreSnapshots).values(snapshot).returning();
    return created;
  }

  // ─── Partners ─────────────────────────────────────────
  async getPartner(id: number): Promise<Partner | undefined> {
    const [partner] = await db.select().from(schema.partners).where(eq(schema.partners.id, id));
    return partner;
  }

  async getPartnerByApiKeyHash(hash: string): Promise<Partner | undefined> {
    const [partner] = await db.select().from(schema.partners)
      .where(and(eq(schema.partners.apiKeyHash, hash), eq(schema.partners.isActive, true)));
    return partner;
  }

  async createPartner(partner: InsertPartner): Promise<Partner> {
    const [created] = await db.insert(schema.partners).values(partner).returning();
    return created;
  }

  async listPartners(): Promise<Partner[]> {
    return db.select().from(schema.partners).orderBy(desc(schema.partners.createdAt));
  }

  // ─── Partner User Access ──────────────────────────────
  async getPartnerAccess(partnerId: number, userId: number): Promise<PartnerUserAccess | undefined> {
    const [access] = await db.select().from(schema.partnerUserAccess).where(
      and(eq(schema.partnerUserAccess.partnerId, partnerId), eq(schema.partnerUserAccess.userId, userId))
    );
    return access;
  }

  async grantAccess(access: InsertPartnerUserAccess): Promise<PartnerUserAccess> {
    const [created] = await db.insert(schema.partnerUserAccess).values(access).returning();
    return created;
  }

  // ─── Decision Requests ────────────────────────────────
  async createDecisionRequest(req: InsertDecisionRequest): Promise<DecisionRequest> {
    const [created] = await db.insert(schema.decisionRequests).values(req).returning();
    return created;
  }

  async getDecisionRequests(partnerId: number): Promise<DecisionRequest[]> {
    return db.select().from(schema.decisionRequests)
      .where(eq(schema.decisionRequests.partnerId, partnerId))
      .orderBy(desc(schema.decisionRequests.requestedAt));
  }

  async updateDecisionStatus(id: number, status: string, notes?: string): Promise<DecisionRequest | undefined> {
    const [updated] = await db.update(schema.decisionRequests)
      .set({ status, notes })
      .where(eq(schema.decisionRequests.id, id))
      .returning();
    return updated;
  }

  // ─── Audit Logs ───────────────────────────────────────
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db.insert(schema.auditLogs).values(log).returning();
    return created;
  }

  async getAuditLogs(limit = 100): Promise<AuditLog[]> {
    return db.select().from(schema.auditLogs).orderBy(desc(schema.auditLogs.createdAt)).limit(limit);
  }

  // ─── Message Logs ─────────────────────────────────────
  async createMessageLog(log: InsertMessageLog): Promise<MessageLog> {
    const [created] = await db.insert(schema.messageLogs).values(log).returning();
    return created;
  }

  async getMessageLogs(userId: number, limit = 50): Promise<MessageLog[]> {
    return db.select().from(schema.messageLogs)
      .where(eq(schema.messageLogs.userId, userId))
      .orderBy(desc(schema.messageLogs.createdAt))
      .limit(limit);
  }

  // ─── Jobs ─────────────────────────────────────────────
  async createJob(job: InsertJob): Promise<Job> {
    const [created] = await db.insert(schema.jobs).values(job).returning();
    return created;
  }

  async getNextPendingJob(): Promise<Job | undefined> {
    const [job] = await db.select().from(schema.jobs)
      .where(and(eq(schema.jobs.status, "pending"), lte(schema.jobs.runAt, new Date())))
      .orderBy(schema.jobs.runAt)
      .limit(1);
    return job;
  }

  async updateJobStatus(id: number, status: string, error?: string): Promise<void> {
    await db.update(schema.jobs).set({
      status,
      lastError: error ?? null,
      attempts: sql`${schema.jobs.attempts} + 1`,
    }).where(eq(schema.jobs.id, id));
  }

  // ─── Dashboard Aggregates ─────────────────────────────
  async getUserCount(): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.users);
    return result?.count ?? 0;
  }

  async getActiveUserCount(days: number): Promise<number> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.users)
      .where(gte(schema.users.lastActiveAt, since));
    return result?.count ?? 0;
  }

  async getAverageScore(): Promise<number> {
    const [result] = await db.select({ avg: sql<number>`coalesce(round(avg(${schema.scoreSnapshots.score}))::int, 0)` })
      .from(schema.scoreSnapshots);
    return result?.avg ?? 0;
  }

  async getScoreBandDistribution(): Promise<Record<string, number>> {
    const rows = await db.select({
      band: schema.scoreSnapshots.band,
      count: sql<number>`count(*)::int`,
    }).from(schema.scoreSnapshots).groupBy(schema.scoreSnapshots.band);
    const dist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    for (const row of rows) {
      dist[row.band] = row.count;
    }
    return dist;
  }
}

export const storage = new DatabaseStorage();
