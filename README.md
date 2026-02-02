# 🌊 BarterWave

**Africa's Trusted Marketplace for Buying, Selling & Trading**

BarterWave is a modern hybrid marketplace that enables users across Africa to trade goods and services through cash, barter, or a combination of both. Built with security-first principles including escrow protection for distress sales.

![BarterWave](https://img.shields.io/badge/BarterWave-Marketplace-blue)
![License](https://img.shields.io/badge/license-Private-red)
![Platform](https://img.shields.io/badge/platform-Web-green)
![Coverage](https://img.shields.io/badge/coverage-Africa-orange)

---

## 🚀 Features

### Core Trading
- **💰 Cash Sales** - Traditional buying/selling with cash payments
- **🔄 Barter Trading** - Exchange items without money
- **💱 Hybrid Deals** - Combine cash + items for flexible trades

### Trust & Safety
- **🔒 Escrow Protection** - Secure payments for distress sales
- **✅ Identity Verification** - KYC with ID + selfie verification
- **⭐ Seller Ratings** - Build trust through reviews

### User Experience
- **🔥 Distress Sales** - Urgent deals with buyer protection
- **📱 Mobile-First Design** - Optimized for all devices
- **🌙 Dark Mode** - Eye-friendly dark theme
- **📍 Location Filtering** - Find items in your state

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React, TypeScript |
| **Styling** | TailwindCSS, CSS Variables |
| **State** | Zustand, TanStack Query |
| **Backend** | NestJS, Prisma ORM |
| **Database** | PostgreSQL |
| **Auth** | JWT, bcrypt |

---

## 📦 Getting Started

### Prerequisites
- Node.js 18+
- Docker Desktop
- Git

### 1. Clone & Install

```bash
git clone <repository-url>
cd BarterWave
npm install
```

### 2. Start Database

```bash
docker-compose up -d
```

Wait for PostgreSQL to be healthy (check with `docker ps`).

### 3. Setup Database

```bash
# First time only
npx prisma db push
npx prisma db seed
```

### 4. Start Development Servers

```bash
# In one terminal - API (port 3001)
cd apps/api && npm run start:dev

# In another terminal - Web (port 3000)
cd apps/web && npm run dev
```

### 5. Access the App

- **Web App**: http://localhost:3000
- **API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api/docs

### Default Admin Login
- **Email**: `admin@barterwave.com`
- **Password**: `password123`

---

## 📁 Project Structure

```
BarterWave/
├── apps/
│   ├── api/              # NestJS Backend
│   │   ├── src/
│   │   │   ├── auth/     # Authentication
│   │   │   ├── users/    # User management
│   │   │   ├── listings/ # Marketplace listings
│   │   │   ├── escrow/   # Escrow transactions
│   │   │   ├── admin/    # Admin panel
│   │   │   └── email/    # Email service
│   │   └── prisma/       # Database schema
│   │
│   └── web/              # Next.js Frontend
│       ├── app/          # App router pages
│       ├── components/   # React components
│       └── lib/          # Utilities & stores
│
├── docker-compose.yml    # PostgreSQL container
└── package.json          # Root config
```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/barterwave?schema=public"

# JWT
JWT_SECRET="your-jwt-secret-here"
JWT_EXPIRES_IN="7d"

# Email (optional - for production)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
EMAIL_FROM=noreply@barterwave.com
EMAIL_FROM_NAME=BarterWave

# Paystack (optional - for payments)
PAYSTACK_SECRET_KEY=sk_test_xxx
PAYSTACK_PUBLIC_KEY=pk_test_xxx

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Uploads
UPLOAD_DIR=./uploads
```

---

## 🧪 Testing

```bash
# Run API tests
cd apps/api && npm test

# Run web tests
cd apps/web && npm test
```

---

## 🚢 Deployment

### Production Build

```bash
# Build API
cd apps/api && npm run build

# Build Web
cd apps/web && npm run build
```

### Recommended Platforms
- **Frontend**: Vercel, Netlify
- **Backend**: Railway, Render, DigitalOcean
- **Database**: Supabase, Railway, PlanetScale

---

## 📋 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | User registration |
| POST | `/auth/login` | User login |
| POST | `/auth/forgot-password` | Password reset |

### Listings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/listings` | Get all listings |
| POST | `/listings` | Create listing |
| GET | `/listings/:id` | Get single listing |
| PATCH | `/listings/:id` | Update listing |
| DELETE | `/listings/:id` | Delete listing |

### Escrow
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/escrow/initiate` | Start escrow transaction |
| POST | `/escrow/confirm/:id` | Buyer confirms receipt |
| GET | `/escrow/my-transactions` | Get user's escrow history |

---

## 👥 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests
4. Submit a pull request

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 📞 Support

- **Email**: support@barterwave.com
- **Website**: https://barterwave.com

---

Built with ❤️ for Africa 🌍
