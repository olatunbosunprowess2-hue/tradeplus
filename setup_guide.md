# TradePlus Development Setup Guide

## 1️⃣ Install project dependencies
```powershell
# From the repository root
cd C:\Users\PC\Desktop\TradePlus\TradePlus
npm install --legacy-peer-deps   # resolves the @types/react / @types/react-dom conflict
```
> **Tip**: If you prefer not to use `--legacy-peer-deps`, you can align the versions manually (e.g., set `@types/react-dom` to `19.1.17` in `package.json`).

## 2️⃣ Configure environment variables
Create a `.env` file in the root (or copy `.env.example`) with at least:
```text
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/tradeplus?schema=public"
PORT=3333   # API port (optional, defaults to 3333)
```
> **NOTE**: The API uses Prisma; make sure the database exists and run `npx prisma migrate dev` if you haven't already.

## 3️⃣ Start the backend (NestJS) server
```powershell
npm run dev:api   # or simply `npm run dev` – the script runs both API and web in watch mode
```
You should see logs ending with:
```
NestApplication successfully started
Application is running on: http://[::1]:3333
Swagger documentation available at: http://[::1]:3333/api/docs
```
The API is now reachable at `http://localhost:3333`.

## 4️⃣ Start the frontend (Vite) server
Open a **second** terminal window and run:
```powershell
npm run dev:web   # or `npm run dev` if the monorepo script launches both
```
The console will show something like:
```
> Local:   http://localhost:5173
> Network: http://192.168.x.x:5173
```
Open the URL in a browser to view the TradePlus UI.

## 5️⃣ Verify everything works
- **API**: Visit `http://localhost:3333/api/docs` to see the Swagger UI and test endpoints.
- **Frontend**: Load `http://localhost:5173` and try logging in, browsing listings, etc.
- If you encounter errors, check the terminal logs for stack traces and ensure the `.env` values are correct.

## 6️⃣ Common gotchas
- **Peer‑dependency conflict**: The `npm install --legacy-peer-deps` flag fixes the `@types/react` / `@types/react-dom` mismatch.
- **Database**: Make sure PostgreSQL is running and the `DATABASE_URL` points to a reachable instance.
- **Port collisions**: If another process uses port 3333 or 5173, change the ports in `.env` (for API) or `vite.config.ts` (for web).

---
You now have both the backend and frontend running locally. Happy coding!
