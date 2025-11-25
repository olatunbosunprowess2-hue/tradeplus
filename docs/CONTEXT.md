## TradePlus – Technical Context

This document defines the **tech stack**, **project structure**, and **database schema** for the TradePlus MVP.

---

## Tech Stack

- **Frontend**
  - **Framework**: Next.js (React, App Router, TypeScript)
  - **Language**: TypeScript
  - **UI**: Tailwind CSS + Headless UI (or Radix) for accessible components
  - **State & Data**:
    - React Query (TanStack Query) for server state
    - Lightweight local state via Zustand or Context
  - **Forms & Validation**: React Hook Form + Zod

- **Backend**
  - **Framework**: NestJS (TypeScript)
  - **API Style**: REST + WebSockets (for real-time notifications/chat in later phases)
  - **ORM**: Prisma
  - **Database**: PostgreSQL
  - **Cache & Queues**:
    - Redis (caching, rate-limiting, session store, background jobs)
    - BullMQ (optional) for async jobs (email, notifications)
  - **Auth**:
    - JWT (access + refresh tokens)
    - Password hashing with Argon2 or bcrypt

- **Infrastructure (recommended, not required for local dev)**
  - Docker for local development
  - Nginx as reverse proxy
  - Object storage (e.g. S3-compatible) for images

This stack is chosen for:

- **Performance** (Next.js + SSR/ISR, NestJS + PostgreSQL)
- **Developer productivity** (TypeScript end-to-end, Prisma schema)
- **Scalability** (clear separation of concerns + typed contracts)

---

## Monorepo Folder Structure

Root folder: `TradePlus/`

```txt
.
├─ apps/
│  ├─ web/                # Next.js app (user-facing + seller UI)
│  └─ api/                # NestJS backend API
├─ packages/
│  ├─ ui/                 # Shared UI components (optional)
│  ├─ types/              # Shared TypeScript types & DTOs
│  └─ config/             # Shared config (eslint, tsconfig, etc.)
├─ prisma/                # Prisma schema & migrations
│  ├─ schema.prisma
│  └─ migrations/
├─ docs/                  # Documentation (this file, ADRs, etc.)
│  └─ CONTEXT.md
├─ scripts/               # Automation scripts (seed, migrate, etc.)
├─ .env.example           # Example environment variables
├─ package.json           # Root scripts / tooling
└─ README.md              # Project overview
```

### `apps/web` (Next.js)

```txt
apps/web
├─ app/
│  ├─ (public)/
│  │  ├─ page.tsx                # Landing / homepage
│  │  ├─ discover/               # Discover feed
│  │  └─ listings/               # Listing search + filters
│  ├─ (auth)/
│  │  ├─ login/
│  │  └─ register/
│  ├─ account/
│  │  ├─ profile/
│  │  ├─ buyer/
│  │  │  ├─ saved/
│  │  │  ├─ orders/
│  │  │  └─ barter/
│  │  └─ seller/
│  │     ├─ listings/
│  │     ├─ new-listing/
│  │     └─ barter-inbox/
│  ├─ admin/                     # Admin dashboard (protected)
│  ├─ api/                       # Next.js route handlers (if needed)
│  └─ layout.tsx
├─ components/
├─ lib/                          # API clients, helpers
├─ hooks/
├─ styles/
└─ public/
```

### `apps/api` (NestJS)

```txt
apps/api
├─ src/
│  ├─ main.ts                    # Bootstrap
│  ├─ app.module.ts
│  ├─ config/                    # Env, config modules
│  ├─ common/                    # Guards, interceptors, decorators
│  ├─ auth/                      # Login, JWT, guards
│  ├─ users/                     # Users & profiles
│  ├─ locations/                 # Countries, regions
│  ├─ categories/                # Product categories
│  ├─ listings/                  # Listings, images
│  ├─ barter/                    # Barter offers & items
│  ├─ cart/                      # Cart & cart items
│  ├─ orders/                    # Orders, order items
│  ├─ payments/                  # Payments integration (simulated/real)
│  ├─ messaging/                 # Conversations & messages (optional MVP)
│  ├─ notifications/             # Notification service
│  ├─ reports/                   # Fraud reports & moderation
│  ├─ admin/                     # Admin APIs
│  └─ prisma/                    # PrismaService wrapper
└─ test/
```

---

## Database Schema (PostgreSQL, Prisma-style)

Below is the logical schema. Implementation will use Prisma, but this also maps cleanly to raw SQL.

```sql
-- USERS & AUTH

CREATE TABLE users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            CITEXT UNIQUE NOT NULL,
  password_hash    TEXT NOT NULL,
  role             TEXT NOT NULL DEFAULT 'user', -- 'user', 'admin'
  status           TEXT NOT NULL DEFAULT 'active', -- 'active', 'suspended'
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name     TEXT,
  avatar_url       TEXT,
  country_id       INT REFERENCES countries(id),
  region_id        INT REFERENCES regions(id),
  bio              TEXT,
  is_verified      BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- LOCATION & CATEGORIES

CREATE TABLE countries (
  id               SERIAL PRIMARY KEY,
  code             VARCHAR(2) UNIQUE NOT NULL, -- ISO country code
  name             TEXT NOT NULL
);

CREATE TABLE regions (
  id               SERIAL PRIMARY KEY,
  country_id       INT NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  name             TEXT NOT NULL
);

CREATE TABLE categories (
  id               SERIAL PRIMARY KEY,
  slug             TEXT UNIQUE NOT NULL,
  name             TEXT NOT NULL
);

-- LISTINGS

CREATE TABLE listings (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id                    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id                  INT NOT NULL REFERENCES categories(id),
  title                        TEXT NOT NULL,
  description                  TEXT,
  condition                    TEXT NOT NULL, -- 'new', 'used'
  price_cents                  BIGINT,       -- nullable if no cash
  currency_code                CHAR(3) NOT NULL,
  allow_cash                   BOOLEAN NOT NULL DEFAULT TRUE,
  allow_barter                 BOOLEAN NOT NULL DEFAULT FALSE,
  allow_cash_plus_barter       BOOLEAN NOT NULL DEFAULT FALSE,
  preferred_barter_notes       TEXT,         -- description of desired items
  quantity                     INT NOT NULL DEFAULT 1,
  status                       TEXT NOT NULL DEFAULT 'active', -- 'active','paused','sold','removed'
  shipping_meet_in_person      BOOLEAN NOT NULL DEFAULT TRUE,
  shipping_ship_item           BOOLEAN NOT NULL DEFAULT FALSE,
  country_id                   INT REFERENCES countries(id),
  region_id                    INT REFERENCES regions(id),
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE listing_images (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id       UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url              TEXT NOT NULL,
  sort_order       INT NOT NULL DEFAULT 0
);

-- BARTER OFFERS

CREATE TABLE barter_offers (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id           UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status               TEXT NOT NULL DEFAULT 'pending', -- 'pending','accepted','rejected','countered','cancelled'
  offered_cash_cents   BIGINT DEFAULT 0,
  currency_code        CHAR(3) NOT NULL,
  message              TEXT,
  expires_at           TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE barter_offer_items (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barter_offer_id      UUID NOT NULL REFERENCES barter_offers(id) ON DELETE CASCADE,
  offered_listing_id   UUID NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
  quantity             INT NOT NULL DEFAULT 1
);

-- CART & CHECKOUT

CREATE TABLE carts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status           TEXT NOT NULL DEFAULT 'active', -- 'active','checked_out','abandoned'
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cart_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id          UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  listing_id       UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  quantity         INT NOT NULL DEFAULT 1,
  deal_type        TEXT NOT NULL, -- 'cash','barter','cash_plus_barter'
  barter_offer_id  UUID REFERENCES barter_offers(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ORDERS & PAYMENTS

CREATE TABLE orders (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_price_cents    BIGINT NOT NULL DEFAULT 0,
  currency_code        CHAR(3) NOT NULL,
  status               TEXT NOT NULL DEFAULT 'pending', -- 'pending','paid','cancelled','fulfilled'
  payment_status       TEXT NOT NULL DEFAULT 'pending', -- 'pending','paid','failed','refunded'
  shipping_method      TEXT NOT NULL, -- 'meet_in_person','ship_item'
  barter_offer_id      UUID REFERENCES barter_offers(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  listing_id           UUID NOT NULL REFERENCES listings(id),
  quantity             INT NOT NULL DEFAULT 1,
  price_cents          BIGINT NOT NULL DEFAULT 0,
  deal_type            TEXT NOT NULL, -- 'cash','barter','cash_plus_barter'
  barter_offer_id      UUID REFERENCES barter_offers(id) ON DELETE SET NULL
);

CREATE TABLE payments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount_cents         BIGINT NOT NULL,
  currency_code        CHAR(3) NOT NULL,
  provider             TEXT NOT NULL, -- 'flutterwave','paystack','stripe','mock'
  provider_ref         TEXT,          -- external reference/ID
  status               TEXT NOT NULL DEFAULT 'pending', -- 'pending','success','failed'
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MESSAGING (OPTIONAL MVP)

CREATE TABLE conversations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id           UUID REFERENCES listings(id) ON DELETE SET NULL,
  buyer_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  barter_offer_id      UUID REFERENCES barter_offers(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE messages (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id      UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body                 TEXT NOT NULL,
  message_type         TEXT NOT NULL DEFAULT 'text', -- 'text','system'
  is_read              BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- NOTIFICATIONS

CREATE TABLE notifications (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                 TEXT NOT NULL, -- e.g. 'barter.accepted','barter.rejected','order.created'
  data                 JSONB NOT NULL, -- payload for frontend
  read_at              TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FRAUD REPORTING & MODERATION

CREATE TABLE reports (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  listing_id           UUID REFERENCES listings(id) ON DELETE SET NULL,
  message_id           UUID REFERENCES messages(id) ON DELETE SET NULL,
  reason               TEXT NOT NULL,
  status               TEXT NOT NULL DEFAULT 'open', -- 'open','in_review','resolved','dismissed'
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at          TIMESTAMPTZ,
  resolved_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL
);

-- RECENTLY VIEWED

CREATE TABLE recently_viewed (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id           UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  viewed_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

This schema covers the MVP requirements: **cash purchases, barter, cash+barter**, listings, messaging (optional, but modeled), notifications, admin moderation, fraud reports, and recent views, and is optimized for PostgreSQL with clear relations for Prisma-based access.


