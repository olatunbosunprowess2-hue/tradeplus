# TradePlus - How to Start the App

## Why Login Failed Previously

The login failed because **the PostgreSQL database wasn't running**. The app has 3 components that must all be running:

1. **PostgreSQL Database** (stores all data)
2. **Backend API** (NestJS on port 3333)
3. **Frontend** (Next.js on port 3000)

When you ran `npm run dev`, it started the API and Frontend, but the database was stopped. The API couldn't connect to the database, causing the `ERR_CONNECTION_REFUSED` error.

---

## How to Start TradePlus (Step by Step)

### Step 1: Start the Database

Open a terminal in the project root and run:

```bash
docker-compose up -d
```

**What this does:** Starts PostgreSQL and Redis in Docker containers.

**Wait for:** About 5-10 seconds for containers to fully start.

---

### Step 2: Start the App

In the same terminal (or a new one), run:

```bash
npm run dev
```

**What this does:** Starts both the backend API and frontend web app concurrently.

**Wait for:** 
- `[0] [Nest] ... Application is running on: http://localhost:3333`
- `[1] ✓ Ready in X.Xs`

---

### Step 3: Open the App

Open your browser and go to:

```
http://localhost:3000
```

---

## Login Credentials

### Admin Account
- **Email:** `admin@tradeplus.com`
- **Password:** `password123`

### Test Users
- **Email:** `john@example.com` / **Password:** `password123`
- **Email:** `sarah@example.com` / **Password:** `password123`
- **Email:** `mike@example.com` / **Password:** `password123`

---

## Quick Troubleshooting

### "Can't reach database server"
- **Problem:** Database isn't running
- **Fix:** Run `docker-compose up -d`

### "Port 3000 already in use"
- **Problem:** Another Next.js app is running
- **Fix:** Stop other processes or use `npx kill-port 3000`

### "Port 3333 already in use"
- **Problem:** Another NestJS app is running
- **Fix:** Stop other processes or use `npx kill-port 3333`

### Login says "Invalid credentials"
- **Problem:** User might not exist or wrong password
- **Fix:** Re-run the seed script: `npm run db:seed`

---

## Stopping the App

1. **Stop the dev servers:** Press `Ctrl+C` in the terminal running `npm run dev`
2. **Stop the database:** Run `docker-compose down`

---

## Complete Startup Checklist

- [ ] Docker Desktop is running
- [ ] Run `docker-compose up -d`
- [ ] Wait 10 seconds
- [ ] Run `npm run dev`
- [ ] Wait for "Ready" messages
- [ ] Open `http://localhost:3000`
- [ ] Login with credentials above

---

## Need to Reset Everything?

If something goes wrong, reset with these commands:

```bash
# Stop everything
docker-compose down
npx kill-port 3000 3333

# Clear database and restart fresh
docker-compose down -v
docker-compose up -d
npm run db:migrate
npm run db:seed

# Start app
npm run dev
```
