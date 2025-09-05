import { users, tenders, bids, clarifications, auditLogs, tenderDocuments, type User, type InsertUser, type Tender, type InsertTender, type Bid, type InsertBid, type Clarification, type InsertClarification, type TenderDocument } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Tender management
  getTender(id: string): Promise<Tender | undefined>;
  getTenderByReference(referenceNumber: string): Promise<Tender | undefined>;
  createTender(tender: InsertTender): Promise<Tender>;
  updateTender(id: string, updates: Partial<Tender>): Promise<Tender | undefined>;
  getTenders(filters?: { status?: string; createdById?: string }): Promise<Tender[]>;
  
  // Bid management
  getBid(id: string): Promise<Bid | undefined>;
  createBid(bid: InsertBid): Promise<Bid>;
  updateBid(id: string, updates: Partial<Bid>): Promise<Bid | undefined>;
  getBidsByTender(tenderId: string): Promise<Bid[]>;
  getBidsByBidder(bidderId: string): Promise<Bid[]>;
  
  // Clarification management
  getClarification(id: string): Promise<Clarification | undefined>;
  createClarification(clarification: InsertClarification): Promise<Clarification>;
  updateClarification(id: string, updates: Partial<Clarification>): Promise<Clarification | undefined>;
  getClarificationsByTender(tenderId: string): Promise<Clarification[]>;
  getPendingClarifications(): Promise<Clarification[]>;
  
  // Document management
  createTenderDocument(document: Omit<TenderDocument, 'id' | 'createdAt'>): Promise<TenderDocument>;
  getTenderDocuments(tenderId: string): Promise<TenderDocument[]>;
  updateDocumentDownloadCount(id: string): Promise<void>;
  deleteTenderDocument(id: string): Promise<boolean>;
  
  // Audit logs
  createAuditLog(log: Omit<typeof auditLogs.$inferInsert, 'id' | 'createdAt'>): Promise<void>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.username));
  }

  async getTender(id: string): Promise<Tender | undefined> {
    const [tender] = await db.select().from(tenders).where(eq(tenders.id, id));
    return tender || undefined;
  }

  async getTenderByReference(referenceNumber: string): Promise<Tender | undefined> {
    const [tender] = await db.select().from(tenders).where(eq(tenders.referenceNumber, referenceNumber));
    return tender || undefined;
  }

  async createTender(insertTender: InsertTender): Promise<Tender> {
    // Generate reference number
    const year = new Date().getFullYear();
    const count = await db.select().from(tenders).where(eq(tenders.referenceNumber, `REF-${year}-%`));
    const referenceNumber = `REF-${year}-${String(count.length + 1).padStart(3, '0')}`;
    
    const [tender] = await db
      .insert(tenders)
      .values({ ...insertTender, referenceNumber })
      .returning();
    return tender;
  }

  async updateTender(id: string, updates: Partial<Tender>): Promise<Tender | undefined> {
    const [tender] = await db
      .update(tenders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tenders.id, id))
      .returning();
    return tender || undefined;
  }

  async getTenders(filters?: { status?: string; createdById?: string }): Promise<Tender[]> {
    let query = db.select().from(tenders);
    
    if (filters?.status) {
      query = query.where(eq(tenders.status, filters.status));
    }
    
    if (filters?.createdById) {
      query = query.where(eq(tenders.createdById, filters.createdById));
    }
    
    return await query.orderBy(desc(tenders.createdAt));
  }

  async getBid(id: string): Promise<Bid | undefined> {
    const [bid] = await db.select().from(bids).where(eq(bids.id, id));
    return bid || undefined;
  }

  async createBid(insertBid: InsertBid): Promise<Bid> {
    const [bid] = await db
      .insert(bids)
      .values(insertBid)
      .returning();
    return bid;
  }

  async updateBid(id: string, updates: Partial<Bid>): Promise<Bid | undefined> {
    const [bid] = await db
      .update(bids)
      .set(updates)
      .where(eq(bids.id, id))
      .returning();
    return bid || undefined;
  }

  async getBidsByTender(tenderId: string): Promise<Bid[]> {
    return await db.select().from(bids).where(eq(bids.tenderId, tenderId)).orderBy(desc(bids.submittedAt));
  }

  async getBidsByBidder(bidderId: string): Promise<Bid[]> {
    return await db.select().from(bids).where(eq(bids.bidderId, bidderId)).orderBy(desc(bids.submittedAt));
  }

  async getClarification(id: string): Promise<Clarification | undefined> {
    const [clarification] = await db.select().from(clarifications).where(eq(clarifications.id, id));
    return clarification || undefined;
  }

  async createClarification(insertClarification: InsertClarification): Promise<Clarification> {
    const [clarification] = await db
      .insert(clarifications)
      .values(insertClarification)
      .returning();
    return clarification;
  }

  async updateClarification(id: string, updates: Partial<Clarification>): Promise<Clarification | undefined> {
    const [clarification] = await db
      .update(clarifications)
      .set(updates)
      .where(eq(clarifications.id, id))
      .returning();
    return clarification || undefined;
  }

  async getClarificationsByTender(tenderId: string): Promise<Clarification[]> {
    return await db.select().from(clarifications).where(eq(clarifications.tenderId, tenderId)).orderBy(desc(clarifications.createdAt));
  }

  async getPendingClarifications(): Promise<Clarification[]> {
    return await db.select().from(clarifications).where(eq(clarifications.status, 'pending')).orderBy(asc(clarifications.createdAt));
  }

  async createTenderDocument(document: Omit<TenderDocument, 'id' | 'createdAt'>): Promise<TenderDocument> {
    const [doc] = await db
      .insert(tenderDocuments)
      .values(document)
      .returning();
    return doc;
  }

  async getTenderDocuments(tenderId: string): Promise<TenderDocument[]> {
    return await db.select().from(tenderDocuments).where(eq(tenderDocuments.tenderId, tenderId)).orderBy(asc(tenderDocuments.originalName));
  }

  async updateDocumentDownloadCount(id: string): Promise<void> {
    await db
      .update(tenderDocuments)
      .set({ downloadCount: db.select().from(tenderDocuments).where(eq(tenderDocuments.id, id)) })
      .where(eq(tenderDocuments.id, id));
  }

  async deleteTenderDocument(id: string): Promise<boolean> {
    const result = await db.delete(tenderDocuments).where(eq(tenderDocuments.id, id));
    return result.rowCount > 0;
  }

  async createAuditLog(log: Omit<typeof auditLogs.$inferInsert, 'id' | 'createdAt'>): Promise<void> {
    await db.insert(auditLogs).values(log);
  }
}

export const storage = new DatabaseStorage();
