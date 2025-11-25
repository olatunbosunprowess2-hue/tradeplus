# TradePlus - Hybrid Marketplace MVP

A hybrid marketplace supporting **Cash Purchases**, **Barter**, and **Cash + Barter** deals.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- (Optional) Redis for caching (can skip for MVP)

### Installation

1. **Clone and install dependencies:**

```bash
cd TradePlus
npm install
```

2. **Set up environment variables:**

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/tradeplus?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
JWT_REFRESH_EXPIRES_IN="30d"

# API
API_PORT=3001
API_URL="http://localhost:3001"

# Frontend
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

3. **Set up the database:**

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Seed initial data
npm run db:seed
```

4. **Start development servers:**

```bash
# Start both API and frontend
npm run dev

# Or start individually:
npm run dev:api  # Backend on http://localhost:3001
npm run dev:web  # Frontend on http://localhost:3000
```

## 📁 Project Structure

```
TradePlus/
├── apps/
│   ├── api/          # NestJS backend API
│   └── web/          # Next.js frontend (to be created)
├── packages/         # Shared packages
├── prisma/           # Prisma schema and migrations
├── scripts/          # Utility scripts
└── docs/             # Documentation
```

## 🛠️ Tech Stack

- **Backend**: NestJS, TypeScript, Prisma, PostgreSQL
- **Frontend**: Next.js, TypeScript, Tailwind CSS (to be set up)
- **Auth**: JWT with Argon2 password hashing
- **Validation**: class-validator, class-transformer

## 📚 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Users
- `GET /users/me` - Get current user profile (protected)

### Locations
- `GET /locations/countries` - Get all countries
- `GET /locations/countries/:id` - Get country by ID
- `GET /locations/countries/:countryId/regions` - Get regions by country

## 🔐 Authentication

Protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## 📝 Development Status

### ✅ Completed
- [x] Monorepo structure
- [x] Prisma database schema
- [x] NestJS backend foundation
- [x] Authentication (JWT, register, login)
- [x] User profiles
- [x] Locations (countries, regions)

### 🚧 In Progress
- [ ] Categories and listings CRUD
- [ ] Barter offers system
- [ ] Cart and checkout
- [ ] Orders and payments
- [ ] Notifications
- [ ] Admin dashboard
- [ ] Next.js frontend

## 📖 Documentation

See [docs/CONTEXT.md](./docs/CONTEXT.md) for detailed feature specifications, database schema, and architecture.

## 🤝 Contributing

This is an MVP project. Follow the step-by-step development plan in the CONTEXT.md file.
