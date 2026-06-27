# eProcurement

**Status: prototype**

A full-stack procurement workflow prototype for managing tenders, bids, clarifications, documents, and role-based access. The project supports English and Arabic interfaces and models the core workflows used by administrators, procurement officers, and bidders.

## What it does

- Creates and manages tenders through their lifecycle
- Accepts bidder submissions and supporting documents
- Supports bid review and evaluation workflows
- Tracks tender clarifications and responses
- Provides role-based administration for users and access
- Records audit events for important actions
- Supports English, Arabic, and right-to-left layouts

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Wouter, TanStack Query |
| UI | Tailwind CSS, Radix UI, React Hook Form, Zod |
| API | Node.js, Express, TypeScript |
| Auth | Passport local strategy, scrypt password hashing, PostgreSQL sessions |
| Data | PostgreSQL, Drizzle ORM, Neon serverless driver |
| Files | Multer with type and size validation |

## Architecture

```text
React client
    |
    | JSON / multipart HTTP
    v
Express API ---- Passport + role checks
    |                    |
    |                    +---- PostgreSQL session store
    v
Drizzle ORM ---- PostgreSQL
    |
    +---- local upload directory (prototype only)
```

The frontend and API share TypeScript schema definitions. Authentication uses server-side sessions, and API routes enforce administrator, procurement-officer, or bidder roles where required.

## Local setup

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- npm

### Install and configure

```bash
git clone https://github.com/ahmadnasrallahh/eProcurement.git
cd eProcurement
npm ci
cp .env.example .env
```

Edit `.env` with a local PostgreSQL connection string and a newly generated session secret. For example, generate a secret with:

```bash
openssl rand -hex 32
```

Create the schema and start the development server:

```bash
npm run db:push
npm run dev
```

The app defaults to `http://localhost:5000`.

### Bootstrap the first administrator

The app does not ship with a default credential. For a new database, temporarily set all three `BOOTSTRAP_ADMIN_*` variables described in `.env.example`, start the app once, then remove the password from `.env` after the account is created.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Random secret used to sign sessions; use at least 32 characters |
| `PORT` | No | HTTP port; defaults to `5000` |
| `BOOTSTRAP_ADMIN_USERNAME` | First run only | Username for initial administrator provisioning |
| `BOOTSTRAP_ADMIN_EMAIL` | First run only | Email for initial administrator provisioning |
| `BOOTSTRAP_ADMIN_PASSWORD` | First run only | Initial password; minimum 12 characters |

## Useful commands

```bash
npm run dev       # run the development server
npm run check     # TypeScript type-check
npm run build     # build client and server
npm start         # run the production build
npm run db:push   # apply the Drizzle schema
```

## What this demonstrates

- End-to-end product delivery across a typed React frontend and Express API
- Authentication, role-based authorization, and persistent sessions
- Relational workflow modeling with Drizzle and PostgreSQL
- File-handling, audit-trail, localization, and administrative workflows

## Limitations

- This is a prototype, not a production-ready procurement platform.
- Uploaded documents use local disk storage; production deployment needs private object storage, malware scanning, retention rules, and stronger authorization tests.
- The project does not yet have meaningful automated test coverage.
- Production use would require a formal threat model, rate limiting, CSRF review, observability, backup/restore procedures, and an independent security review.

## Security

Never commit `.env`, database exports, uploaded documents, or local runtime state. See [SECURITY-NOTE.md](SECURITY-NOTE.md) for the cleanup and rotation notice relevant to earlier revisions.
