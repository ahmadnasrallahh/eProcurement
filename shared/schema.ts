import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: ["admin", "procurement_officer", "bidder"] }).notNull(),
  organizationName: text("organization_name"),
  contactPerson: text("contact_person"),
  phone: text("phone"),
  address: text("address"),
  isActive: boolean("is_active").default(true),
  language: text("language", { enum: ["en", "ar"] }).default("en"),
  timezone: text("timezone").default("UTC"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tenders = pgTable("tenders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referenceNumber: text("reference_number").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["draft", "active", "closed", "evaluation", "completed", "cancelled"] }).default("draft"),
  category: text("category"),
  estimatedValue: text("estimated_value"),
  currency: text("currency").default("USD"),
  publishDate: timestamp("publish_date"),
  submissionDeadline: timestamp("submission_deadline"),
  openingDate: timestamp("opening_date"),
  language: text("language", { enum: ["en", "ar"] }).default("en"),
  requirements: jsonb("requirements"),
  evaluationCriteria: jsonb("evaluation_criteria"),
  createdById: text("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tenderDocuments = pgTable("tender_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenderId: text("tender_id").references(() => tenders.id),
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  downloadCount: integer("download_count").default(0),
  uploadedById: text("uploaded_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bids = pgTable("bids", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenderId: text("tender_id").references(() => tenders.id),
  bidderId: text("bidder_id").references(() => users.id),
  bidAmount: text("bid_amount"),
  currency: text("currency").default("USD"),
  technicalScore: integer("technical_score"),
  financialScore: integer("financial_score"),
  totalScore: integer("total_score"),
  status: text("status", { enum: ["submitted", "under_review", "accepted", "rejected"] }).default("submitted"),
  documents: jsonb("documents"),
  notes: text("notes"),
  isEncrypted: boolean("is_encrypted").default(true),
  submittedAt: timestamp("submitted_at").defaultNow(),
  evaluatedAt: timestamp("evaluated_at"),
  evaluatedById: text("evaluated_by_id").references(() => users.id),
});

export const clarifications = pgTable("clarifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenderId: text("tender_id").references(() => tenders.id),
  requesterId: text("requester_id").references(() => users.id),
  question: text("question").notNull(),
  answer: text("answer"),
  status: text("status", { enum: ["pending", "answered", "published"] }).default("pending"),
  isPublic: boolean("is_public").default(true),
  answeredById: text("answered_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  answeredAt: timestamp("answered_at"),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").references(() => users.id),
  action: text("action").notNull(),
  resourceType: text("resource_type"),
  resourceId: text("resource_id"),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  tenders: many(tenders),
  bids: many(bids),
  clarifications: many(clarifications),
  auditLogs: many(auditLogs),
}));

export const tendersRelations = relations(tenders, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [tenders.createdById],
    references: [users.id],
  }),
  documents: many(tenderDocuments),
  bids: many(bids),
  clarifications: many(clarifications),
}));

export const tenderDocumentsRelations = relations(tenderDocuments, ({ one }) => ({
  tender: one(tenders, {
    fields: [tenderDocuments.tenderId],
    references: [tenders.id],
  }),
  uploadedBy: one(users, {
    fields: [tenderDocuments.uploadedById],
    references: [users.id],
  }),
}));

export const bidsRelations = relations(bids, ({ one }) => ({
  tender: one(tenders, {
    fields: [bids.tenderId],
    references: [tenders.id],
  }),
  bidder: one(users, {
    fields: [bids.bidderId],
    references: [users.id],
  }),
  evaluatedBy: one(users, {
    fields: [bids.evaluatedById],
    references: [users.id],
  }),
}));

export const clarificationsRelations = relations(clarifications, ({ one }) => ({
  tender: one(tenders, {
    fields: [clarifications.tenderId],
    references: [tenders.id],
  }),
  requester: one(users, {
    fields: [clarifications.requesterId],
    references: [users.id],
  }),
  answeredBy: one(users, {
    fields: [clarifications.answeredById],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTenderSchema = createInsertSchema(tenders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  referenceNumber: true,
});

export const insertBidSchema = createInsertSchema(bids).omit({
  id: true,
  submittedAt: true,
  evaluatedAt: true,
});

export const insertClarificationSchema = createInsertSchema(clarifications).omit({
  id: true,
  createdAt: true,
  answeredAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTender = z.infer<typeof insertTenderSchema>;
export type Tender = typeof tenders.$inferSelect;
export type InsertBid = z.infer<typeof insertBidSchema>;
export type Bid = typeof bids.$inferSelect;
export type InsertClarification = z.infer<typeof insertClarificationSchema>;
export type Clarification = typeof clarifications.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type TenderDocument = typeof tenderDocuments.$inferSelect;
