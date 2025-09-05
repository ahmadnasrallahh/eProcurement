# Overview

This is a cloud-based e-procurement system designed for NGOs, providing secure tender management with multi-language support (English and Arabic). The application uses a modern full-stack architecture with React frontend, Express backend, PostgreSQL database, and role-based access control for three user types: Admin, Procurement Officer, and Bidder.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **UI Components**: Radix UI primitives with shadcn/ui design system for consistent, accessible components
- **Styling**: Tailwind CSS with custom CSS variables for theming and dark mode support
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Internationalization**: Custom translation system supporting English and Arabic with RTL layout support

## Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **Authentication**: Passport.js with local strategy using scrypt for password hashing
- **Session Management**: Express sessions with PostgreSQL store for persistence
- **File Uploads**: Multer middleware with file type validation (PDF, Word, Excel)
- **API Design**: RESTful endpoints with role-based authorization middleware
- **Development Tools**: tsx for TypeScript execution and hot reloading

## Database Layer
- **Database**: PostgreSQL with Neon serverless connection pooling
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Schema**: Comprehensive schema covering users, tenders, bids, clarifications, documents, and audit logs
- **Migrations**: Drizzle-kit for database schema management and version control

## Authentication & Authorization
- **Role-Based Access**: Three distinct roles (admin, procurement_officer, bidder) with granular permissions
- **Session Security**: Secure session management with configurable session store
- **Password Security**: Scrypt-based password hashing with salt for enhanced security
- **Protected Routes**: Frontend route protection with authentication checks

## Core Business Logic
- **Tender Management**: Complete lifecycle from creation to evaluation with status tracking
- **Bid Submission**: Secure bid submission with file attachments and deadline enforcement
- **Clarification System**: Q&A system for tender clarifications with response tracking
- **Document Management**: File upload/download system for tender documents with access control
- **Audit Trail**: Comprehensive logging system for all user actions and system events

## UI/UX Design Patterns
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Component Architecture**: Reusable UI components with consistent styling
- **Accessibility**: ARIA-compliant components with keyboard navigation support
- **Multi-language Support**: Seamless switching between English and Arabic with proper RTL support
- **Theme System**: Light/dark mode support with CSS custom properties

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **connect-pg-simple**: PostgreSQL session store for Express sessions

## Authentication & Security
- **Passport.js**: Authentication middleware with local strategy
- **Node.js Crypto**: Built-in cryptographic functions for password hashing

## File Management
- **Multer**: Multipart/form-data handling for file uploads
- **File System**: Node.js fs module for file operations

## Development & Build Tools
- **Vite**: Frontend build tool and development server
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Fast JavaScript bundler for production builds
- **tsx**: TypeScript execution engine for development

## UI Component Libraries
- **Radix UI**: Headless UI primitives for accessible components
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography
- **React Hook Form**: Form state management and validation

## Data Management
- **TanStack Query**: Server state management and caching
- **Drizzle ORM**: Type-safe database operations
- **Zod**: Runtime type validation and schema definition

## Replit Integration
- **Replit Plugins**: Development environment integration for cartographer and error handling