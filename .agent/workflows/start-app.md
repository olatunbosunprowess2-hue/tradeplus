---
description: How to start the TradePlus application from scratch
---

# Starting TradePlus Application

## Quick Start (One-time Setup Complete)
// turbo-all

```powershell
# 1. Start database
docker-compose up -d

# 2. Wait for database to be ready (about 5 seconds)
Start-Sleep 5

# 3. Start the application
npm run dev
```

## First Time Setup

If this is your first time or database is empty:

```powershell
# 1. Start database
docker-compose up -d

# 2. Wait for database
Start-Sleep 5

# 3. Sync database schema
npx prisma db push

# 4. Seed initial data (admin user, categories, sample listings)
npx prisma db seed

# 5. Start the application
npm run dev
```

## URLs after startup:
- Frontend: http://localhost:3001
- Backend API: http://localhost:3333
- Swagger Docs: http://localhost:3333/api/docs

## Default Admin Login:
- Email: admin@tradeplus.com
- Password: password123

## Troubleshooting

### Database not starting?
```powershell
docker-compose down
docker-compose up -d
```

### "Internal Server Error" on first load?
Run database seed:
```powershell
npx prisma db push
npx prisma db seed
```

### Port already in use?
Stop existing processes:
```powershell
# Find process on port 3001
netstat -ano | findstr :3001

# Kill it (replace PID with actual process ID)
taskkill /PID <PID> /F
```
