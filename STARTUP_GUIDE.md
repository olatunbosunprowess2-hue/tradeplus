# 🚀 TradePlus Startup Guide (Vibe Coder Edition)

This is a **super detailed**, click-by-click guide for starting up TradePlus. No assumptions, just vibes! 😎

---

## 🎯 STEP 1: Start Docker Desktop

### What to do:
1. **Click** the Windows Start button (bottom-left corner)
2. **Type** "Docker Desktop"
3. **Click** on "Docker Desktop" app to open it
4. **Wait** for Docker to fully start (the Docker whale icon in the system tray will stop animating)
5. You'll see "Docker Desktop is running" in the Docker window

> **Visual cue:** The Docker Desktop window should show a green "Engine running" status at the bottom-left

---

## 🎯 STEP 2: Open Your Terminal (PowerShell)

### What to do:
1. **Click** the Windows Start button
2. **Type** "PowerShell"
3. **Click** on "Windows PowerShell" (the blue one)
4. A blue terminal window will open

> **Visual cue:** You should see a blue window with white text showing something like `PS C:\Users\PC>`

---

## 🎯 STEP 3: Navigate to Your Project Folder

### What to do:
1. **In the PowerShell window**, type this EXACT command:
   ```powershell
   cd C:\Users\PC\Desktop\TradePlus\TradePlus
   ```
2. **Press Enter**
3. Your terminal should now show: `PS C:\Users\PC\Desktop\TradePlus\TradePlus>`

> **Visual cue:** The path before the `>` symbol should now say `TradePlus\TradePlus`

---

## 🎯 STEP 4: Start Docker Containers (Database & Redis)

### What to do:
1. **In the same PowerShell window**, type:
   ```powershell
   docker-compose up -d
   ```
2. **Press Enter**
3. **Wait** for it to finish (you'll see messages about "Creating network", "Creating volume", "Creating container")
4. When done, you'll see messages like "Container ... Started"

> **What this does:** Starts your PostgreSQL database and Redis cache in the background

> **Visual cue:** You should see green text saying containers are "Started"

### Verify it worked:
1. **Type** this command:
   ```powershell
   docker ps
   ```
2. **Press Enter**
3. You should see a table showing 2 containers running (postgres and redis)

---

## 🎯 STEP 5: Install Project Dependencies

### What to do:
1. **In the same PowerShell window** (still in `C:\Users\PC\Desktop\TradePlus\TradePlus`), type:
   ```powershell
   npm install
   ```
2. **Press Enter**
3. **Wait** (this might take 2-5 minutes) - you'll see lots of text scrolling
4. When done, you'll see something like "added XXX packages"

> **What this does:** Downloads all the code libraries your project needs

> **Visual cue:** When finished, you'll see your prompt again: `PS C:\Users\PC\Desktop\TradePlus\TradePlus>`

---

## 🎯 STEP 6: Set Up the Database

### Part A: Generate Prisma Client

1. **Type** this command:
   ```powershell
   npm run db:generate
   ```
2. **Press Enter**
3. **Wait** for it to finish (should take 10-30 seconds)
4. You'll see "✔ Generated Prisma Client"

### Part B: Run Database Migrations

1. **Type** this command:
   ```powershell
   npm run db:migrate
   ```
2. **Press Enter**
3. **If prompted** for a migration name, just **press Enter** (uses default name)
4. **Wait** for it to finish
5. You'll see messages about migrations being applied

### Part C: Seed the Database (Add Sample Data)

1. **Type** this command:
   ```powershell
   npm run db:seed
   ```
2. **Press Enter**
3. **Wait** for it to finish
4. You'll see messages about creating users, listings, etc.

> **What this does:** Creates the database structure and adds sample data including the admin account

---

## 🎯 STEP 7: Start the Application

### Option A: Start Everything at Once (EASIEST - RECOMMENDED)

1. **Type** this command:
   ```powershell
   npm run dev
   ```
2. **Press Enter**
3. **Wait** for both servers to start (30-60 seconds)
4. You'll see messages like:
   - "Nest application successfully started" (Backend)
   - "Ready in XXXms" (Frontend)
   - "Local: http://localhost:3001" (Frontend URL)

> **Visual cue:** When ready, you'll see both servers running with URLs displayed

> **IMPORTANT:** Keep this PowerShell window open! Don't close it or the servers will stop.

### Option B: Start Backend and Frontend Separately (ADVANCED)

**Only do this if Option A doesn't work or you want separate terminal windows**

#### Terminal 1 - Backend:
1. **In your current PowerShell window**, type:
   ```powershell
   npm run dev:api
   ```
2. **Press Enter**
3. **Wait** until you see "Nest application successfully started"

#### Terminal 2 - Frontend:
1. **Open a NEW PowerShell window** (repeat Step 2)
2. **Navigate to the project** (repeat Step 3):
   ```powershell
   cd C:\Users\PC\Desktop\TradePlus\TradePlus
   ```
3. **Type** this command:
   ```powershell
   npm run dev:web
   ```
4. **Press Enter**
5. **Wait** until you see "Ready in XXXms" and "Local: http://localhost:3001"

> **IMPORTANT:** Keep BOTH PowerShell windows open!

---

## 🎯 STEP 8: Open the Web App in Your Browser

### What to do:
1. **Open your web browser** (Chrome, Edge, Firefox, etc.)
2. **In the address bar**, type:
   ```
   http://localhost:3001
   ```
3. **Press Enter**
4. **BOOM!** 🎉 You should see the TradePlus homepage!

---

## 🎯 STEP 9: Log In as Admin

### What to do:
1. **On the TradePlus homepage**, look for a "Login" or "Sign In" button
2. **Click** it
3. **Enter these credentials:**
   - **Email:** `admin@tradeplus.com`
   - **Password:** `password123`
4. **Click** "Login" or "Sign In"
5. You should now be logged in as admin!

---

## 🎉 YOU'RE DONE! Now What?

### Things you can do:
- **View the homepage:** http://localhost:3001
- **Access admin dashboard:** http://localhost:3001/admin
- **Check API docs:** http://localhost:3000/api
- **Start coding!** Make changes to files and see them update automatically

---

## 🛑 How to STOP Everything When You're Done

### Stop the Application:
1. **Go to the PowerShell window(s)** where the app is running
2. **Press** `Ctrl + C` on your keyboard
3. **Wait** for the servers to stop
4. You'll see your prompt again: `PS C:\Users\PC\Desktop\TradePlus\TradePlus>`

### Stop Docker Containers (Optional):
1. **In PowerShell**, type:
   ```powershell
   docker-compose down
   ```
2. **Press Enter**
3. Containers will stop and be removed

**OR** just close Docker Desktop app (it will stop containers automatically)

---

## 🔥 Quick Restart Guide (For Next Time)

When you want to start coding again:

1. ✅ **Open Docker Desktop** (Start menu → Docker Desktop)
2. ✅ **Open PowerShell** (Start menu → PowerShell)
3. ✅ **Navigate to project:**
   ```powershell
   cd C:\Users\PC\Desktop\TradePlus\TradePlus
   ```
4. ✅ **Start Docker containers:**
   ```powershell
   docker-compose up -d
   ```
5. ✅ **Start the app:**
   ```powershell
   npm run dev
   ```
6. ✅ **Open browser:** http://localhost:3001

That's it! 🚀

---

## 😱 Troubleshooting (When Things Go Wrong)

### Problem: "Port 3000 is already in use"

**What to do:**
1. **In PowerShell**, type:
   ```powershell
   netstat -ano | findstr :3000
   ```
2. **Press Enter**
3. You'll see a number at the end (the PID)
4. **Type** (replace `1234` with the actual PID number):
   ```powershell
   taskkill /PID 1234 /F
   ```
5. **Press Enter**
6. Try starting the app again

### Problem: "Cannot connect to database"

**What to do:**
1. **Check if Docker is running:**
   - Look at the system tray (bottom-right)
   - Docker whale icon should be there and not showing errors
2. **Restart Docker containers:**
   ```powershell
   docker-compose down
   docker-compose up -d
   ```
3. **Try starting the app again**

### Problem: "Module not found" or weird errors

**What to do:**
1. **Reinstall dependencies:**
   ```powershell
   npm install
   ```
2. **Try starting the app again**

### Problem: "Prisma Client not generated"

**What to do:**
1. **Run this command:**
   ```powershell
   npm run db:generate
   ```
2. **Try starting the app again**

---

## 📍 Where Are You Right Now?

**Your PowerShell should always show:**
```
PS C:\Users\PC\Desktop\TradePlus\TradePlus>
```

**If it doesn't, type:**
```powershell
cd C:\Users\PC\Desktop\TradePlus\TradePlus
```

---

## 🎮 Vibe Coder Checklist

Before you start coding, make sure:
- ✅ Docker Desktop is open and running (green status)
- ✅ PowerShell is open and in the right folder (`TradePlus\TradePlus`)
- ✅ Docker containers are running (`docker ps` shows 2 containers)
- ✅ App is running (`npm run dev` is active in PowerShell)
- ✅ Browser is open to http://localhost:3001
- ✅ You're logged in as admin

**Now you're ready to vibe and code! 🎨✨**
