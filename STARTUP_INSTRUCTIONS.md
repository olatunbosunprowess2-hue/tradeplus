# Startup Instructions

Follow these steps to successfully start the BarterWave application.

## Prerequisites

1.  **Docker Desktop**: Ensure Docker Desktop is installed and running.
    -   *Verification*: Run `docker info` in your terminal or check the Docker icon in your system tray.

2.  **Node.js**: Ensure you have Node.js installed.

## Startup Steps

### 1. Start Database Services
The application requires PostgreSQL and Redis to be running in Docker containers.

```powershell
docker-compose up -d
```
*Wait ~10 seconds for the database to fully initialize.*

### 2. Verify Database Status (Optional)
If you want to ensure the database is ready:

```powershell
docker ps
```
*You should see `barterwave-postgres` in the list.*

### 3. Start the Application
This command starts both the Backend API (Port 3333) and Frontend Web App (Port 3000).

```powershell
npm run dev
```

### 4. Access the App
Open your browser to: **[http://localhost:3000](http://localhost:3000)**

## Troubleshooting

### "Connection Refused" or Database Errors
If the app fails to load data or you see backend errors:
1.  Stop the app (`Ctrl+C`).
2.  Restart the containers:
    ```powershell
    docker-compose restart
    ```
3.  Run `npm run dev` again.

### Port Conflicts (EADDRINUSE)
If you see an error that port 3333 or 3000 is in use:
1.  Find the process using the port (e.g., specific to your OS) or just restart your terminal/computer.
2.  Alternatively, kill the specific ports:
    ```powershell
    npx kill-port 3333 3000
    ```

### Resetting Data
To completely wipe the database and start fresh with seed data:

```powershell
# Stop services
docker-compose down -v

# Start services
docker-compose up -d

# Run migrations and seed
npm run db:migrate
npm run db:seed
```
