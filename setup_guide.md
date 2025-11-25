# TradePlus Setup Guide

This guide provides step-by-step instructions to set up and run the TradePlus application from scratch.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

1.  **Node.js**: Version 18 or higher (LTS recommended).
    *   Download: [https://nodejs.org/](https://nodejs.org/)
    *   Verify: `node -v` and `npm -v`
2.  **Docker Desktop**: For running the database and other services.
    *   Download: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
    *   Verify: `docker -v` and `docker-compose -v`
3.  **Git**: For version control.
    *   Download: [https://git-scm.com/](https://git-scm.com/)

## Step 1: Clone the Repository

If you haven't already, clone the project repository:

```bash
git clone <repository-url>
cd TradePlus
```

## Step 2: Environment Setup

1.  **Create `.env` file**:
    Copy the `.env.example` file to `.env` in the root directory (or create one if it doesn't exist).

    ```bash
    cp .env.example .env
    ```

2.  **Configure Environment Variables**:
    Open `.env` and ensure the following variables are set (adjust as needed):

    ```env
    # Database
    DATABASE_URL="postgresql://user:password@localhost:5432/tradeplus?schema=public"

    # JWT Secrets (Change these for production!)
    JWT_SECRET="super-secret-jwt-key"
    JWT_REFRESH_SECRET="super-secret-refresh-key"

    # Frontend URL
    NEXT_PUBLIC_API_URL="http://localhost:3000/api"
    ```

## Step 3: Start Infrastructure (Docker)

Start the required services (PostgreSQL, Redis, etc.) using Docker Compose:

```bash
docker-compose up -d
```

*   `up`: Starts the containers.
*   `-d`: Runs them in detached mode (in the background).

Verify they are running:
```bash
docker ps
```

## Step 4: Install Dependencies

Install the project dependencies using `npm`:

```bash
npm install
```

## Step 5: Database Setup

1.  **Generate Prisma Client**:
    ```bash
    npm run db:generate
    ```

2.  **Run Migrations**:
    Apply the database schema to your local database:
    ```bash
    npm run db:migrate
    ```

3.  **Seed Database (Optional)**:
    If you need initial data:
    ```bash
    npm run db:seed
    ```

## Step 6: Start the Application

Start the development servers for both the API and the Web Frontend:

```bash
npm run dev
```

This command uses `concurrently` to run both services.
*   **Web App**: [http://localhost:3000](http://localhost:3000)
*   **API**: [http://localhost:3000/api](http://localhost:3000/api) (or whatever port the API runs on, usually proxied or on 3001/3333)

## Troubleshooting

*   **Database Connection Error**: Ensure Docker is running and the `DATABASE_URL` in `.env` matches the docker-compose configuration.
*   **Port Conflicts**: If ports 3000 or 5432 are in use, stop other services or change the ports in `docker-compose.yml` and `.env`.
*   **Prisma Errors**: Try running `npx prisma generate` again if you see type errors related to the database.

## Admin User Setup

To create an admin user, you can run the setup script:

```bash
node setup-admin.js
```
Or use the provided npm script if available.
