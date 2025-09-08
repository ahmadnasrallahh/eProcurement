import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertTenderSchema, insertBidSchema, insertClarificationSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Setup multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, and Excel files are allowed.'));
    }
  },
});

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
}

function requireRole(roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
}

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // Tender routes
  app.get('/api/tenders', requireAuth, async (req, res) => {
    try {
      const filters: any = {};
      
      if (req.user.role === 'procurement_officer') {
        filters.createdById = req.user.id;
      } else if (req.user.role === 'bidder') {
        filters.status = 'active';
      }
      
      const tenders = await storage.getTenders(filters);
      res.json(tenders);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch tenders' });
    }
  });

  app.get('/api/tenders/:id', requireAuth, async (req, res) => {
    try {
      const tender = await storage.getTender(req.params.id);
      if (!tender) {
        return res.status(404).json({ message: 'Tender not found' });
      }
      
      // Check permissions
      if (req.user.role === 'procurement_officer' && tender.createdById !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.json(tender);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch tender' });
    }
  });

  app.post('/api/tenders', requireRole(['admin', 'procurement_officer']), async (req, res) => {
    try {
      const validatedData = insertTenderSchema.parse({
        ...req.body,
        createdById: req.user.id,
      });
      
      const tender = await storage.createTender(validatedData);
      
      // Log audit
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'CREATE_TENDER',
        resourceType: 'tender',
        resourceId: tender.id,
        details: { title: tender.title },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      res.status(201).json(tender);
    } catch (error) {
      res.status(400).json({ message: 'Invalid tender data', error: error.message });
    }
  });

  app.patch('/api/tenders/:id', requireRole(['admin', 'procurement_officer']), async (req, res) => {
    try {
      const tender = await storage.getTender(req.params.id);
      if (!tender) {
        return res.status(404).json({ message: 'Tender not found' });
      }
      
      if (req.user.role === 'procurement_officer' && tender.createdById !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const updatedTender = await storage.updateTender(req.params.id, req.body);
      
      // Log audit
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'UPDATE_TENDER',
        resourceType: 'tender',
        resourceId: req.params.id,
        details: req.body,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      res.json(updatedTender);
    } catch (error) {
      res.status(400).json({ message: 'Failed to update tender' });
    }
  });

  // Document routes (e-Distribution)
  app.get('/api/tenders/:id/documents', requireAuth, async (req, res) => {
    try {
      const documents = await storage.getTenderDocuments(req.params.id);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch documents' });
    }
  });

  app.post('/api/tenders/:id/documents', requireRole(['admin', 'procurement_officer']), upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const document = await storage.createTenderDocument({
        tenderId: req.params.id,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedById: req.user.id,
      });
      
      res.status(201).json(document);
    } catch (error) {
      res.status(500).json({ message: 'Failed to upload document' });
    }
  });

  app.get('/api/documents/:id/download', requireAuth, async (req, res) => {
    try {
      const document = await storage.getTenderDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      const filePath = path.join('uploads', document.fileName);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found on disk' });
      }
      
      // Update download count
      await storage.updateDocumentDownloadCount(req.params.id);
      
      // Log audit
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'DOWNLOAD_DOCUMENT',
        resourceType: 'document',
        resourceId: req.params.id,
        details: { fileName: document.originalName },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      res.download(filePath, document.originalName);
    } catch (error) {
      res.status(500).json({ message: 'Failed to download document' });
    }
  });

  // Bid routes (e-Opening)
  app.get('/api/tenders/:id/bids', requireRole(['admin', 'procurement_officer']), async (req, res) => {
    try {
      const bids = await storage.getBidsByTender(req.params.id);
      res.json(bids);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch bids' });
    }
  });

  app.post('/api/tenders/:id/bids', requireRole(['bidder']), async (req, res) => {
    try {
      const validatedData = insertBidSchema.parse({
        ...req.body,
        tenderId: req.params.id,
        bidderId: req.user.id,
      });
      
      const bid = await storage.createBid(validatedData);
      
      // Log audit
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'SUBMIT_BID',
        resourceType: 'bid',
        resourceId: bid.id,
        details: { tenderId: req.params.id, amount: bid.bidAmount },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      res.status(201).json(bid);
    } catch (error) {
      res.status(400).json({ message: 'Invalid bid data', error: error.message });
    }
  });

  app.get('/api/my-bids', requireRole(['bidder']), async (req, res) => {
    try {
      const bids = await storage.getBidsByBidder(req.user.id);
      res.json(bids);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch bids' });
    }
  });

  app.patch('/api/bids/:id', requireRole(['admin', 'procurement_officer']), async (req, res) => {
    try {
      const bid = await storage.getBid(req.params.id);
      if (!bid) {
        return res.status(404).json({ message: 'Bid not found' });
      }
      
      // Check permissions - procurement officer can only evaluate their own tender's bids
      if (req.user.role === 'procurement_officer') {
        const tender = await storage.getTender(bid.tenderId);
        if (!tender || tender.createdById !== req.user.id) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }
      
      const updatedBid = await storage.updateBid(req.params.id, req.body);
      
      // Log audit
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'EVALUATE_BID',
        resourceType: 'bid',
        resourceId: req.params.id,
        details: req.body,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      res.json(updatedBid);
    } catch (error) {
      res.status(400).json({ message: 'Failed to update bid' });
    }
  });

  app.post('/api/bids/:id/documents', requireRole(['bidder']), upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      // Verify bid belongs to the bidder
      const bid = await storage.getBid(req.params.id);
      if (!bid || bid.bidderId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const document = await storage.createBidDocument({
        bidId: req.params.id,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedById: req.user.id,
      });
      
      res.status(201).json(document);
    } catch (error) {
      res.status(500).json({ message: 'Failed to upload document' });
    }
  });

  // Bid documents listing
  app.get('/api/bids/:id/documents', requireRole(['admin', 'procurement_officer']), async (req, res) => {
    try {
      const docs = await storage.getBidDocuments(req.params.id);
      res.json(docs);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch bid documents' });
    }
  });

  // Bid document download
  app.get('/api/bids/:bidId/documents/:docId/download', requireRole(['admin', 'procurement_officer']), async (req, res) => {
    try {
      const bid = await storage.getBid(req.params.bidId);
      if (!bid) {
        return res.status(404).json({ message: 'Bid not found' });
      }

      const documents = bid.documents ? JSON.parse(JSON.stringify(bid.documents)) : [];
      const document = documents.find((d: any) => d.id === req.params.docId);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      const filePath = path.join('uploads', document.fileName);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found on disk' });
      }

      // Log audit
      await storage.createAuditLog({
        userId: (req as any).user.id,
        action: 'DOWNLOAD_BID_DOCUMENT',
        resourceType: 'bid_document',
        resourceId: req.params.docId,
        details: { bidId: req.params.bidId, fileName: document.originalName },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.download(filePath, document.originalName);
    } catch (error) {
      res.status(500).json({ message: 'Failed to download bid document' });
    }
  });

  // Clarification routes (e-Clarifications)
  app.get('/api/clarifications', requireAuth, async (req, res) => {
    try {
      const clarifications = req.user.role === 'procurement_officer' 
        ? await storage.getPendingClarifications()
        : await storage.getClarificationsByTender(req.query.tenderId as string);
      res.json(clarifications);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch clarifications' });
    }
  });

  app.post('/api/clarifications', requireAuth, async (req, res) => {
    try {
      const validatedData = insertClarificationSchema.parse({
        ...req.body,
        requesterId: req.user.id,
      });
      
      const clarification = await storage.createClarification(validatedData);
      
      // Log audit
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'CREATE_CLARIFICATION',
        resourceType: 'clarification',
        resourceId: clarification.id,
        details: { tenderId: clarification.tenderId },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      res.status(201).json(clarification);
    } catch (error) {
      res.status(400).json({ message: 'Invalid clarification data', error: error.message });
    }
  });

  app.patch('/api/clarifications/:id', requireRole(['admin', 'procurement_officer']), async (req, res) => {
    try {
      const clarification = await storage.updateClarification(req.params.id, {
        ...req.body,
        answeredById: req.user.id,
        answeredAt: new Date(),
      });
      
      // Log audit
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'ANSWER_CLARIFICATION',
        resourceType: 'clarification',
        resourceId: req.params.id,
        details: { answer: req.body.answer },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      res.json(clarification);
    } catch (error) {
      res.status(400).json({ message: 'Failed to update clarification' });
    }
  });

  // User management routes (Admin only)
  app.get('/api/users', requireRole(['admin']), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.post('/api/admin/create-user', requireRole(['admin']), async (req, res) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      // Log audit
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'CREATE_USER',
        resourceType: 'user',
        resourceId: user.id,
        details: { username: user.username, role: user.role },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: 'Failed to create user', error: error.message });
    }
  });

  app.patch('/api/users/:id', requireRole(['admin']), async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Log audit
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'UPDATE_USER',
        resourceType: 'user',
        resourceId: req.params.id,
        details: req.body,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: 'Failed to update user' });
    }
  });

  // Dashboard statistics
  app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
    try {
      const stats: any = {};
      
      if (req.user.role === 'admin' || req.user.role === 'procurement_officer') {
        const allTenders = await storage.getTenders();
        stats.activeTenders = allTenders.filter(t => t.status === 'active').length;
        stats.completedTenders = allTenders.filter(t => t.status === 'completed').length;
        stats.pendingClarifications = (await storage.getPendingClarifications()).length;
        
        if (req.user.role === 'admin') {
          const allUsers = await storage.getAllUsers();
          stats.totalBidders = allUsers.filter(u => u.role === 'bidder').length;
        }
      }
      
      if (req.user.role === 'bidder') {
        const myBids = await storage.getBidsByBidder(req.user.id);
        stats.submittedBids = myBids.length;
        stats.acceptedBids = myBids.filter(b => b.status === 'accepted').length;
      }
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
