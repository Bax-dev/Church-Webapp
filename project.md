# Product Requirements Document (PRD)
## Church Member Portal

| | |
|---|---|
| **Version** | 1.0 |
| **Status** | Draft |
| **Stack** | Next.js (full-stack), PostgreSQL, Redis, JWT |
| **Owner** | Church Administration / Product |

---

## 1. Summary

A secure member portal inside the church website. Members sign up, log in, and maintain their own records (name, email, birthday, marital status, address, church department, district). A Super Admin can view, search, filter, edit, and export all member data. The entire app (UI and API) is built in **one Next.js project**.

## 2. Goals and Non-Goals

### Goals
- Self-service signup and profile updates for members.
- One central, searchable member database for leadership.
- Strong security: hashed passwords, JWT auth, role-based access, rate limiting, audit trail.
- Mobile-first interface.

### Non-Goals (v1)
- Online giving, attendance tracking, SMS/WhatsApp broadcasts, native mobile app, family linking.

## 3. Users and Roles

| Role | Access |
|---|---|
| **Visitor** | Public pages, signup, login |
| **Member** | View and edit own profile only |
| **Super Admin** | All member data, departments, districts, admins, exports, audit log |

## 4. Tech Stack and Architecture

| Layer | Choice | Purpose |
|---|---|---|
| Framework | Next.js 14+ (App Router, TypeScript) | UI pages, Route Handlers (`app/api/*`), middleware |
| Database | PostgreSQL | Primary data store |
| ORM | Prisma (or Drizzle) | Schema, migrations, queries |
| Cache / Store | Redis | Refresh-token store, token blacklist, rate limiting, email verification and reset tokens, dashboard cache |
| Auth | JWT (`jose` library) | Short-lived access token + long-lived refresh token |
| Password hashing | Argon2id (or bcrypt) | Credential protection |
| Validation | Zod | Shared client/server schemas |
| Email | Nodemailer / Resend / SendGrid | Verification, reset, notifications |
| Styling | Tailwind CSS + shadcn/ui | Responsive UI |
| Forms/Data | React Hook Form, TanStack Query | Forms and fetching |
| Export | `exceljs` / `papaparse`, `pdfkit` | CSV, Excel, PDF |

### Architecture

```
Browser
  |
  v
Next.js (Vercel / VPS / Docker)
  |-- middleware.ts      -> verifies JWT, enforces role-based route access
  |-- app/(public)       -> login, signup, set-password, reset
  |-- app/(member)       -> dashboard, profile
  |-- app/(admin)        -> members, departments, districts, reports, audit
  |-- app/api/*          -> Route Handlers (business logic)
  |-- lib/               -> db, redis, auth, email, validators, rbac
  |
  |--> PostgreSQL  (persistent data)
  |--> Redis       (sessions, tokens, rate limits, cache)
```

## 5. Authentication and Session Design (JWT + Redis)

- **Access token:** JWT, expires in **15 minutes**, payload: `sub` (user id), `role`, `jti`. Stored in an **httpOnly, Secure, SameSite=Lax** cookie.
- **Refresh token:** JWT, expires in **7 days**, stored in a separate httpOnly cookie. Its `jti` is saved in Redis (`refresh:{userId}:{jti}`) with a matching TTL.
- **Refresh flow:** on expired access token, call `POST /api/auth/refresh`; server checks Redis, issues a new pair, **rotates** the refresh token (old `jti` deleted).
- **Logout:** delete refresh `jti` from Redis; add access `jti` to a blacklist (`blacklist:{jti}`) until it expires; clear cookies.
- **Logout everywhere / password change:** delete all `refresh:{userId}:*` keys.
- **Sign-up link token:** random 32-byte token, stored hashed in Redis (`setup:{hash}`), TTL 24 hours, single use. Opening it verifies the email; setting the password activates the account and issues the token pair.
- **Password reset token:** same pattern, TTL 1 hour, single use.
- **Rate limiting (Redis):** login 5 attempts / 15 min per IP + email; signup 10 / hour per IP; reset requests 3 / hour per email. Temporary lockout after repeated failures.
- **Role check:** Next.js `middleware.ts` verifies the JWT and blocks `/admin/*` and `/api/admin/*` for non-admins. Every API handler **also** re-checks the role server-side (never trust the UI or middleware alone).

## 6. Functional Requirements

### 6.1 Member

| ID | Requirement | Priority |
|---|---|---|
| M-01 | Sign up from the shared sign-up link with first name, last name, email and consent checkbox only; the rest of the profile is completed from the dashboard | Must |
| M-02 | Receive an emailed sign-up link; opening it verifies the email, asks for password and confirm password, then signs the member in and redirects to the dashboard | Must |
| M-03 | Log in with email and password | Must |
| M-04 | Forgot and reset password via emailed link | Must |
| M-05 | View own profile | Must |
| M-06 | Edit own profile (all fields except role and status) | Must |
| M-07 | Change password (requires current password) | Must |
| M-08 | Changing email requires re-verification | Should |
| M-09 | Upload profile photo (JPG/PNG, max 2 MB) | Could |
| M-10 | Request account deletion | Should |

### 6.2 Super Admin

| ID | Requirement | Priority |
|---|---|---|
| A-01 | Dashboard: total members, new this month, by department, by district, upcoming birthdays | Must |
| A-02 | Members table with server-side pagination, sorting, search (name, email, phone) | Must |
| A-03 | Filters: department, district, marital status, status, birthday month | Must |
| A-04 | View, edit, deactivate, reactivate, delete any member | Must |
| A-05 | Add a member manually | Should |
| A-06 | Trigger password reset for a member | Should |
| A-07 | CRUD for departments and districts | Must |
| A-08 | Export filtered list to CSV, Excel, PDF | Must |
| A-09 | Reports: birthdays by month, members by department/district, marital status summary | Should |
| A-10 | Manage admin accounts | Should |
| A-11 | Audit log of all changes (who, what, when, old/new value) | Must |
| A-12 | Settings: auto-approve vs manual approval of new signups | Should |

## 7. Data Model (PostgreSQL / Prisma)

```prisma
enum Role { MEMBER SUPER_ADMIN }
enum Status { PENDING ACTIVE INACTIVE }
enum MaritalStatus { SINGLE MARRIED WIDOWED DIVORCED SEPARATED }

model User {
  id             String        @id @default(cuid())
  firstName      String
  lastName       String
  email          String        @unique
  phone          String?
  passwordHash   String
  dateOfBirth    DateTime
  gender         String?
  maritalStatus  MaritalStatus
  addressLine    String
  city           String
  state          String
  country        String        @default("Nigeria")
  photoUrl       String?
  role           Role          @default(MEMBER)
  status         Status        @default(PENDING)
  emailVerified  Boolean       @default(false)
  consentGivenAt DateTime?
  departmentId   String?
  districtId     String?
  department     Department?   @relation(fields: [departmentId], references: [id])
  district       District?     @relation(fields: [districtId], references: [id])
  auditLogs      AuditLog[]    @relation("Target")
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  @@index([lastName, firstName])
  @@index([departmentId])
  @@index([districtId])
  @@index([status])
}

model Department {
  id       String  @id @default(cuid())
  name     String  @unique
  isActive Boolean @default(true)
  users    User[]
}

model District {
  id       String  @id @default(cuid())
  name     String  @unique
  isActive Boolean @default(true)
  users    User[]
}

model AuditLog {
  id        String   @id @default(cuid())
  actorId   String
  targetId  String?
  target    User?    @relation("Target", fields: [targetId], references: [id])
  action    String
  oldValue  Json?
  newValue  Json?
  ip        String?
  createdAt DateTime @default(now())

  @@index([actorId])
  @@index([createdAt])
}

model Setting {
  key   String @id
  value Json
}
```

### Redis Key Map

| Key | Value | TTL |
|---|---|---|
| `refresh:{userId}:{jti}` | `1` | 7 days |
| `blacklist:{jti}` | `1` | remaining access-token life |
| `setup:{tokenHash}` | userId | 24 h, single use |
| `reset:{tokenHash}` | userId | 1 h |
| `rl:login:{ip}:{email}` | counter | 15 min |
| `rl:signup:{ip}` | counter | 1 h |
| `cache:admin:stats` | JSON | 5 min |

## 8. API Specification

All responses are JSON: `{ success, data?, error? }`. All inputs validated with Zod.

### Auth

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/auth/signup` | Create pending account (name, email), email a sign-up link | Public |
| POST | `/api/auth/set-password` | Consume sign-up token, verify email, set password, issue cookies | Public (token) |
| POST | `/api/auth/login` | Issue access and refresh cookies | Public |
| POST | `/api/auth/refresh` | Rotate tokens | Cookie |
| POST | `/api/auth/logout` | Revoke tokens | Auth |
| POST | `/api/auth/forgot-password` | Send reset email | Public |
| POST | `/api/auth/reset-password` | Set new password | Public (token) |
| POST | `/api/auth/change-password` | Change password | Auth |

### Member

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/me` | Get own profile |
| PATCH | `/api/me` | Update own profile |
| POST | `/api/me/photo` | Upload photo |
| POST | `/api/me/delete-request` | Request deletion |
| GET | `/api/lookups` | Active departments and districts for dropdowns |

### Super Admin (`/api/admin/*`, role = SUPER_ADMIN)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/stats` | Dashboard statistics (Redis cached) |
| GET | `/api/admin/members` | List with `page, limit, q, department, district, marital, status, birthMonth, sort` |
| POST | `/api/admin/members` | Add member |
| GET | `/api/admin/members/:id` | Member detail |
| PATCH | `/api/admin/members/:id` | Edit member |
| DELETE | `/api/admin/members/:id` | Delete member |
| POST | `/api/admin/members/:id/reset-password` | Trigger reset email |
| GET/POST/PATCH/DELETE | `/api/admin/departments` | Manage departments |
| GET/POST/PATCH/DELETE | `/api/admin/districts` | Manage districts |
| GET | `/api/admin/export?format=csv\|xlsx\|pdf` | Export filtered members |
| GET | `/api/admin/audit-logs` | Paginated audit log |
| GET/PATCH | `/api/admin/settings` | App settings |

**Critical rule:** `/api/me` must derive the user id **from the JWT**, never from a URL or body parameter, to prevent members editing other members' data (IDOR).

## 9. Pages and Routes

| Route | Page | Access |
|---|---|---|
| `/login`, `/signup`, `/set-password`, `/forgot-password`, `/reset-password` | Auth pages | Public |
| `/dashboard` | Member home | Member |
| `/profile`, `/profile/edit`, `/settings` | Profile, edit, password, delete request | Member |
| `/admin` | Admin dashboard | Super Admin |
| `/admin/members`, `/admin/members/[id]` | List, detail | Super Admin |
| `/admin/departments`, `/admin/districts` | Lookup management | Super Admin |
| `/admin/reports`, `/admin/audit-log`, `/admin/users`, `/admin/settings` | Reports, audit, admins, settings | Super Admin |

## 10. Validation Rules

- Email: valid, unique, lowercased.
- Password: min 8 chars, upper, lower, number; confirm must match.
- Phone: digits with optional `+` country code.
- Date of birth: valid, not in the future, age 0-120.
- Department, district, marital status: must exist in lookup/enum.
- Photo: JPG/PNG, max 2 MB.
- Strip unknown fields; members can never send `role` or `status`.

## 11. Security Requirements

- Argon2id password hashing; never log or return hashes.
- HTTPS only; HSTS; secure httpOnly cookies; CSRF protection (SameSite + origin check on mutating requests).
- Security headers (CSP, X-Frame-Options, Referrer-Policy) via `next.config.js`.
- Parameterised queries via ORM; input sanitisation.
- Redis-based rate limiting and lockout.
- Generic error messages on login and forgot-password (avoid account enumeration).
- 2FA (TOTP) for Super Admin (Phase 3).
- Secrets only in environment variables; never committed.
- Daily PostgreSQL backups with tested restore; Redis persistence (AOF) enabled.
- **Compliance:** follow the Nigeria Data Protection Act (NDPA) 2023: consent at signup, data minimisation, access/correction/deletion on request.

## 12. Non-Functional Requirements

- Mobile-first, responsive, accessible (WCAG AA contrast, labelled forms).
- Page load under 3 s; API p95 under 500 ms.
- Supports 10,000+ members; indexed queries; server-side pagination.
- 99% uptime target.
- Structured logging and error monitoring (e.g. Sentry).

## 13. Environment Variables

```
DATABASE_URL=postgresql://user:pass@host:5432/church
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
APP_URL=https://yourchurch.org
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
SEED_ADMIN_EMAIL=
SEED_ADMIN_PASSWORD=
```

## 14. Suggested Project Structure

```
/src
  /app
    /(public)/login, signup, set-password, forgot-password, reset-password
    /(member)/dashboard, profile, settings
    /(admin)/admin/...
    /api/auth/*, /api/me/*, /api/admin/*, /api/lookups
  /components   (ui, forms, tables, charts)
  /lib          (prisma.ts, redis.ts, auth.ts, jwt.ts, rbac.ts, email.ts, rateLimit.ts, audit.ts)
  /validators   (zod schemas)
  /middleware.ts
/prisma         (schema.prisma, seed.ts, migrations)
```

## 15. Acceptance Criteria (Key)

1. A visitor can sign up with name and email, open the emailed link, set a password, and land on the dashboard signed in.
2. A member can edit only their own profile; attempts to access another member's data return 403/404.
3. A Super Admin can list, search, filter, edit, export every member.
4. Access tokens expire after 15 minutes and refresh transparently; logout invalidates the session immediately.
5. Login is rate limited and locks after repeated failures.
6. Every admin change and member profile change is written to the audit log.
7. All pages work on a 360 px-wide phone screen.
8. Seed script creates the first Super Admin and sample departments and districts.

## 16. Testing Plan

- **Unit:** validators, JWT helpers, RBAC, rate limiter.
- **Integration:** API routes against a test PostgreSQL and Redis.
- **E2E (Playwright):** signup to set password to dashboard to edit profile; admin filter and export.
- **Security:** IDOR checks, brute-force test, expired/forged token test, role-escalation attempt.

## 17. Release Phases

| Phase | Scope |
|---|---|
| **1 (MVP)** | Auth, member profile, admin members table, search, filters, CSV export |
| **2** | Departments/districts CRUD, dashboard stats, reports, audit log, email notifications |
| **3** | Admin 2FA, extra roles (department head, district pastor), bulk Excel import |
| **4** | Attendance, giving, family linking, SMS/WhatsApp |

## 18. Open Questions

1. Manual approval of new signups, or auto-activate after email verification?
2. Full list of departments and districts?
3. Can members change their own department and district?
4. Where will the app be hosted (Vercel, VPS, Docker)? Note that Redis and PostgreSQL need managed or self-hosted services.
5. Where will profile photos be stored (S3-compatible storage, Cloudinary, local disk)?
6. How many Super Admins, and who is the backup administrator?