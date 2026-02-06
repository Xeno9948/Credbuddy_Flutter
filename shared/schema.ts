import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, serial, timestamp, date, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Users ──────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, lastActiveAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ─── Business Profile ───────────────────────────────────────
export const businessProfiles = pgTable("business_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  businessName: text("business_name").notNull(),
  businessType: text("business_type").notNull(), // Retail | Service | Food | Transport
  notificationPref: text("notification_pref").notNull().default("daily"), // risk_only | daily | weekly
  timezone: text("timezone").notNull().default("Africa/Johannesburg"),
  language: text("language").notNull().default("en"),
});

export const insertBusinessProfileSchema = createInsertSchema(businessProfiles).omit({ id: true });
export type InsertBusinessProfile = z.infer<typeof insertBusinessProfileSchema>;
export type BusinessProfile = typeof businessProfiles.$inferSelect;

// ─── Conversation State ─────────────────────────────────────
export const conversationStates = pgTable("conversation_states", {
  userId: integer("user_id").primaryKey().references(() => users.id),
  state: text("state").notNull().default("idle"),
  stateDataJson: jsonb("state_data_json").$type<Record<string, any>>().default({}),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertConversationStateSchema = createInsertSchema(conversationStates).omit({ updatedAt: true });
export type InsertConversationState = z.infer<typeof insertConversationStateSchema>;
export type ConversationState = typeof conversationStates.$inferSelect;

// ─── Daily Entry ────────────────────────────────────────────
export const dailyEntries = pgTable("daily_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: date("date").notNull(),
  revenueCents: integer("revenue_cents").notNull().default(0),
  expenseCents: integer("expense_cents").notNull().default(0),
  expenseNote: text("expense_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("daily_entries_user_date_idx").on(table.userId, table.date),
]);

export const insertDailyEntrySchema = createInsertSchema(dailyEntries).omit({ id: true, createdAt: true });
export type InsertDailyEntry = z.infer<typeof insertDailyEntrySchema>;
export type DailyEntry = typeof dailyEntries.$inferSelect;

// ─── Cash Estimate ──────────────────────────────────────────
export const cashEstimates = pgTable("cash_estimates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  asOfDate: date("as_of_date").notNull(),
  cashAvailableCents: integer("cash_available_cents").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCashEstimateSchema = createInsertSchema(cashEstimates).omit({ id: true, createdAt: true });
export type InsertCashEstimate = z.infer<typeof insertCashEstimateSchema>;
export type CashEstimate = typeof cashEstimates.$inferSelect;

// ─── Score Snapshot ─────────────────────────────────────────
export const scoreSnapshots = pgTable("score_snapshots", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  asOfDate: date("as_of_date").notNull(),
  score: integer("score").notNull(),
  confidence: integer("confidence").notNull(), // stored as 0-100
  band: varchar("band", { length: 1 }).notNull(), // A | B | C | D
  flagsJson: jsonb("flags_json").$type<string[]>().default([]),
  featureBreakdownJson: jsonb("feature_breakdown_json").$type<Record<string, number>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("score_snapshots_user_date_idx").on(table.userId, table.asOfDate),
]);

export const insertScoreSnapshotSchema = createInsertSchema(scoreSnapshots).omit({ id: true, createdAt: true });
export type InsertScoreSnapshot = z.infer<typeof insertScoreSnapshotSchema>;
export type ScoreSnapshot = typeof scoreSnapshots.$inferSelect;

// ─── Partner ────────────────────────────────────────────────
export const partners = pgTable("partners", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  apiKeyHash: text("api_key_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertPartnerSchema = createInsertSchema(partners).omit({ id: true, createdAt: true });
export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type Partner = typeof partners.$inferSelect;

// ─── Partner User Access ────────────────────────────────────
export const partnerUserAccess = pgTable("partner_user_access", {
  id: serial("id").primaryKey(),
  partnerId: integer("partner_id").notNull().references(() => partners.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPartnerUserAccessSchema = createInsertSchema(partnerUserAccess).omit({ id: true, createdAt: true });
export type InsertPartnerUserAccess = z.infer<typeof insertPartnerUserAccessSchema>;
export type PartnerUserAccess = typeof partnerUserAccess.$inferSelect;

// ─── Decision Request ───────────────────────────────────────
export const decisionRequests = pgTable("decision_requests", {
  id: serial("id").primaryKey(),
  partnerId: integer("partner_id").notNull().references(() => partners.id),
  userId: integer("user_id").notNull().references(() => users.id),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  status: text("status").notNull().default("pending"), // pending | approved | declined
  notes: text("notes"),
});

export const insertDecisionRequestSchema = createInsertSchema(decisionRequests).omit({ id: true, requestedAt: true });
export type InsertDecisionRequest = z.infer<typeof insertDecisionRequestSchema>;
export type DecisionRequest = typeof decisionRequests.$inferSelect;

// ─── Audit Log ──────────────────────────────────────────────
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  partnerId: integer("partner_id"),
  action: text("action").notNull(),
  targetId: text("target_id"),
  ip: text("ip"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// ─── Message Log ────────────────────────────────────────────
export const messageLogs = pgTable("message_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  direction: text("direction").notNull(), // inbound | outbound
  text: text("text").notNull(),
  rawJson: jsonb("raw_json").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("message_logs_user_idx").on(table.userId),
]);

export const insertMessageLogSchema = createInsertSchema(messageLogs).omit({ id: true, createdAt: true });
export type InsertMessageLog = z.infer<typeof insertMessageLogSchema>;
export type MessageLog = typeof messageLogs.$inferSelect;

// ─── Job (DB-backed queue) ──────────────────────────────────
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  payloadJson: jsonb("payload_json").$type<Record<string, any>>().default({}),
  status: text("status").notNull().default("pending"), // pending | running | completed | failed
  runAt: timestamp("run_at").defaultNow().notNull(),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertJobSchema = createInsertSchema(jobs).omit({ id: true, createdAt: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;
