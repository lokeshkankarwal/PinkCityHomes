# PinkCityHomes — Real Estate Discovery & Transaction Platform

A modern, full-stack real-estate discovery, CRM, and property transaction platform dedicated to the residential property market in **Jaipur, Rajasthan (The Pink City)**.

---

## 1. Project Overview

**PinkCityHomes** bridges buyers, verified sellers, and platform administrators across Jaipur's key residential micro-markets—including Malviya Nagar, Mansarovar, Vaishali Nagar, C-Scheme, Jagatpura, and Tonk Road.

The platform provides:
- **Verified Property Discovery**: Accurate carpet area, super built-up measurements, furnishing status, and verified seller listings with photo galleries.
- **Role-Based Portals**: Dedicated workspaces for Customers (buyers/tenants), Vetted Sellers (agencies/brokers), and Super-Administrators (platform governance).
- **Secure Authentication & Email Verification**: Industry-standard cryptographic email verification via Resend HTTPS REST API with rate-limited OTP challenge/response flows.
- **Granular IP Rate Limiting**: Multi-tiered rate limiters protecting against credential stuffing, OTP flooding, and registration spam.
- **Seller CRM**: Complete lead pipeline, interaction logging (calls, visits, notes), tour scheduling, and portfolio analytics.
- **Purchase Closings**: Strict transaction workflow where only authorized platform super-administrators can transition inventory to official `SOLD` status.

---

## 2. Tech Stack & Architecture

### Frontend (`client/`)
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + Custom Typography (`Fraunces` editorial serif + `Source Sans 3`)
- **Routing**: React Router v7
- **Maps**: Leaflet + React-Leaflet + OpenStreetMap
- **State & Data Fetching**: TanStack React Query + Context-based Auth Provider

### Backend (`server/`)
- **Runtime**: Node.js (ESM) + Express 5 + TypeScript
- **Database**: MongoDB (Primary Application, Relational & 2dsphere Geospatial Search)
- **Authentication**: JWT with HTTP-only cookies (`token`) or Authorization Bearer header
- **Email Service**: Resend (HTTPS REST API over port 443 — Render Free compatible)
- **Security**: Helmet, CORS origin restriction, Bcrypt password hashing, and Express Rate Limit
- **File Uploads**: Multer with localized storage validation

---

## 3. Architecture & Data Flow

```text
[ Browser / Client ]
        │
   (HTTPS / JSON)
        ▼
[ Express API Gateway ] ─── Helmet + CORS + Per-Route Rate Limiters
        │
   ┌────┴──────────────────────────┐
   ▼                               ▼
[ Auth & Verification ]     [ Property & CRM Engine ]
   │ (Resend HTTPS / Bcrypt)       │ (Native MongoDB Driver)
   ▼                               ▼
[ Resend API (Port 443) ]   [ MongoDB Database ]
```

---

## 4. Roles & Authorization Rules

| Role | Permissions & Capabilities |
|---|---|
| **CUSTOMER** | • Self-register with mandatory email OTP verification.<br>• Search, filter, and view buy/rent properties in Jaipur.<br>• Save favourite properties.<br>• Add available properties to transactional cart.<br>• Schedule property inspection visits with seller representatives.<br>• Review personal orders and purchase closing status. |
| **SELLER** | • Agency registration with company profile.<br>• Must be reviewed and **APPROVED** by Superadmin before listings become active.<br>• Manage listings: add/edit specifications, upload photo galleries, set pricing.<br>• Seller CRM: track interested buyers (`HIGH`, `MEDIUM`, `LOW`), log client interactions, and manage upcoming site visits.<br>• **Strict Constraint**: Sellers *cannot* mark properties as `SOLD`—this is enforced server-side. |
| **SUPERADMIN** | • Platform management console.<br>• Review pending seller applications (Approve, Reject with reason, or Suspend).<br>• Exclusive authority to mark properties as `SOLD`, automatically creating official purchase order records and clearing active carts.<br>• View system-wide user directory and inspect immutable audit logs. |

---

## 5. Security & Rate Limiting

### IP-Based Rate Limiting Policy

PinkCityHomes applies separate, multi-tiered rate limiters using `express-rate-limit`:

| Scope | Window | Max Requests | Purpose |
|---|---|---|---|
| **Global API** | 1 minute | 300 | DoS and general traffic flood protection |
| **General Auth** (`/api/auth/*`) | 15 minutes | 30 | Auth endpoint abuse prevention |
| **Login** (`/api/auth/login`) | 15 minutes | 10 | Brute-force & credential stuffing defense |
| **Registration** (`/api/auth/register`) | 1 hour | 5 | Sybil attack & bot account creation defense |
| **Email OTP** (`/api/auth/resend-otp`, `/verify`) | 1 hour | 3 | Mail service quota exhaustion & SMS/email spam prevention |
| **Password Reset** | 1 hour | 5 | Account takeover defense |

When limits are exceeded, the server returns `429 Too Many Requests` with a descriptive JSON message.

### Email Verification Security
- OTPs are cryptographically generated 6-digit random codes.
- Hashes of OTPs (`bcrypt`) are stored in the database—never plaintext codes.
- OTPs expire after 15 minutes.
- Maximum 5 attempts allowed per OTP verification record before invalidation.
- OTPs are marked `usedAt` upon successful verification and cannot be reused.

---

## 6. Environment Variables

Create a `.env` file in the root directory following `.env.example`:

```env
# ── SERVER ───────────────────────────────────────────────────
PORT=4000
NODE_ENV=development
JWT_SECRET=your-secure-jwt-secret-key
CLIENT_ORIGIN=http://localhost:5173

# ── DATABASE ─────────────────────────────────────────────────
MONGODB_URI=mongodb://127.0.0.1:27017/pinkcityhomes

# ── SUPERADMIN BOOTSTRAP ─────────────────────────────────────
SUPERADMIN_EMAIL=lokeshkankarwal456@gmail.com
SUPERADMIN_PASSWORD=your-superadmin-password

# ── EMAIL (HTTPS API / Resend) ────────────────────────────────
# Render Free blocks outbound SMTP ports 25, 465, 587.
# Resend uses HTTPS port 443 with high deliverability.
EMAIL_API_KEY=re_your_resend_api_key_here
EMAIL_FROM=PinkCityHomes <onboarding@resend.dev>
# Or with your custom verified domain:
# EMAIL_FROM=PinkCityHomes <noreply@yourdomain.com>
EMAIL_VERIFICATION_URL=http://localhost:5173

# ── RATE LIMITING CONFIGURATION ──────────────────────────────
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=30
LOGIN_RATE_LIMIT_MAX=10
REGISTRATION_RATE_LIMIT_MAX=5
VERIFICATION_RATE_LIMIT_MAX=3
PASSWORD_RESET_RATE_LIMIT_MAX=5
```

---

## 7. Local Development Guide

### Prerequisites
- Node.js 18+ (Node 20+ recommended)
- MongoDB instance running locally or via MongoDB Atlas
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/lokeshkankarwal/PinkCityHomes.git
cd PinkCityHomes
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
```bash
cp .env.example .env
# Edit .env and supply your MONGODB_URI and SUPERADMIN_PASSWORD
```

### 5. Start Development Servers
Run backend and frontend concurrently:
```bash
npm run dev
```
Or run individually:
```bash
# Start backend API (http://localhost:4000)
npm run dev:server

# Start Vite client (http://localhost:5173)
npm run dev:client
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 8. Testing & Verification

```bash
# Typecheck both frontend and backend
npm run typecheck

# Production build test
npm run build
```

---

## 9. Deployment Notes

- **Backend**: Can be deployed to Render, Railway, Fly.io, or AWS ECS. Ensure environment variables (`MONGODB_URI`, `JWT_SECRET`, `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD`, `EMAIL_API_KEY`, `EMAIL_FROM`) are set in the platform dashboard.
- **Frontend**: Deployable to Vercel or Netlify. Set `VITE_API_URL` to point to the live backend domain.
- **Database**: Compatible with any MongoDB 6+ instance (MongoDB Atlas, self-hosted mongod).

---

## 10. License

Private & proprietary — PinkCityHomes Platform.
