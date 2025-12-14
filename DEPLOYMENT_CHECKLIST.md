# BarterWave Deployment Checklist

## Pre-Deployment (Do Now)

### Domain & Email Setup
- [ ] Purchase `barterwave.com` domain
- [ ] Set up email hosting (Google Workspace, Zoho, or similar)
- [ ] Create email addresses:
  - [ ] `noreply@barterwave.com`
  - [ ] `support@barterwave.com`
  - [ ] `privacy@barterwave.com`
- [ ] Get SMTP credentials

### Payment Setup
- [ ] Create Paystack account at [paystack.com](https://paystack.com)
- [ ] Complete business verification
- [ ] Get API keys (test + live):
  - [ ] `PAYSTACK_SECRET_KEY`
  - [ ] `PAYSTACK_PUBLIC_KEY`

### Hosting Setup
- [ ] Choose hosting provider:
  - **Frontend**: Vercel (recommended), Netlify
  - **Backend**: Railway, Render, DigitalOcean
  - **Database**: Supabase, Railway, PlanetScale
- [ ] Set up production database
- [ ] Configure DNS records

---

## Environment Variables (.env.production)

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/barterwave?schema=public"

# JWT (generate strong secret: openssl rand -base64 32)
JWT_SECRET="your-super-secure-jwt-secret-here"
JWT_EXPIRES_IN="7d"

# Email (from your email provider)
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=noreply@barterwave.com
SMTP_PASS=your-smtp-password
EMAIL_FROM=noreply@barterwave.com
EMAIL_FROM_NAME=BarterWave

# Paystack
PAYSTACK_SECRET_KEY=sk_live_xxx
PAYSTACK_PUBLIC_KEY=pk_live_xxx

# URLs
FRONTEND_URL=https://barterwave.com
API_URL=https://api.barterwave.com

# Uploads
UPLOAD_DIR=/var/uploads
MAX_FILE_SIZE=10485760
```

---

## Deployment Steps

### 1. Database
```bash
# Run migrations
npx prisma migrate deploy

# Seed initial data (categories, admin)
npx prisma db seed
```

### 2. Backend (NestJS)
```bash
cd apps/api
npm run build
npm run start:prod
```

### 3. Frontend (Next.js)
```bash
cd apps/web
npm run build
npm run start
```

---

## Post-Deployment Checklist

### Verification
- [ ] Test user registration
- [ ] Test login/logout
- [ ] Test listing creation
- [ ] Test escrow flow (with test payment)
- [ ] Test password reset email
- [ ] Test admin panel access
- [ ] Verify HTTPS is working
- [ ] Check mobile responsiveness

### SEO & Analytics
- [ ] Submit sitemap to Google Search Console
- [ ] Set up Google Analytics
- [ ] Verify Open Graph images work (use [opengraph.xyz](https://opengraph.xyz))

### Security
- [ ] Enable rate limiting
- [ ] Set up CORS properly
- [ ] Configure security headers
- [ ] Set up error monitoring (Sentry)
- [ ] Enable database backups

---

## Quick Reference

| Service | Recommended Provider | Cost |
|---------|---------------------|------|
| Domain | Namecheap, GoDaddy | ~$12/year |
| Email | Zoho (free 5 users), Google Workspace | $0-6/user/mo |
| Frontend | Vercel | Free tier available |
| Backend | Railway | ~$5/month |
| Database | Supabase, Railway | Free tier available |
| Payments | Paystack | 1.5% + ₦100 per txn |
