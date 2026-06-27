import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function sanitizeUser(user: SelectUser) {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

async function createBootstrapAdmin() {
  const username = process.env.BOOTSTRAP_ADMIN_USERNAME;
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!username && !email && !password) {
    return;
  }

  if (!username || !email || !password) {
    throw new Error(
      "BOOTSTRAP_ADMIN_USERNAME, BOOTSTRAP_ADMIN_EMAIL, and BOOTSTRAP_ADMIN_PASSWORD must be set together.",
    );
  }

  if (password.length < 12) {
    throw new Error("BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters.");
  }

  try {
    const adminUser = await storage.getUserByUsername(username);
    if (!adminUser) {
      const bootstrapAdmin = {
        username,
        email,
        password: await hashPassword(password),
        role: 'admin' as const,
        organizationName: 'System Administration',
        contactPerson: 'System Administrator',
        address: 'System',
        isActive: true
      };
      
      await storage.createUser(bootstrapAdmin);
      console.log(`Bootstrap administrator created for ${username}. Remove its password from the environment.`);
    }
  } catch (error) {
    console.error('Error creating bootstrap administrator:', error);
  }
}

export function setupAuth(app: Express) {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret || sessionSecret.length < 32) {
    throw new Error("SESSION_SECRET must be set and contain at least 32 characters.");
  }

  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  createBootstrapAdmin();

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(String(id));
    done(null, user);
  });

  

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    if (!req.user) return res.sendStatus(401);
    res.status(200).json(sanitizeUser(req.user));
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    const user = req.user;
    if (!req.isAuthenticated() || !user) return res.sendStatus(401);
    res.json(sanitizeUser(user));
  });
}
