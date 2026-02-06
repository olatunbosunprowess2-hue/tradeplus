# =====================================================
# Multi-stage Dockerfile for BarterWave NestJS API
# =====================================================

# Stage 1: Build Stage
FROM node:20-alpine AS builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy root package files
COPY package.json ./

# Copy workspace package files
COPY apps/api/package.json ./apps/api/

# Copy prisma schema for generate
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN npm install --legacy-peer-deps

# Install pinned Prisma CLI to match @prisma/client version
RUN npm install -g prisma@5.22.0

# Copy the API source code
COPY apps/api ./apps/api/

# Generate Prisma client
RUN prisma generate

# Build the NestJS application by running directly in the api directory
WORKDIR /app/apps/api
RUN npm run build

# Verify build output exists
RUN ls -la dist/ && ls -la dist/main.js

# =====================================================
# Stage 2: Production Stage
FROM node:20-alpine AS production

# Install OpenSSL for Prisma runtime
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package.json ./
COPY apps/api/package.json ./apps/api/

# Install only production dependencies
RUN npm install --omit=dev --legacy-peer-deps

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npm install -g prisma@5.22.0
RUN prisma generate

# Copy built application from builder stage
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy node_modules from apps/api (for workspace dependencies)
COPY --from=builder /app/node_modules ./node_modules

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3333

# Expose the port
EXPOSE 3333

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3333/api/health || exit 1

# Start the application
CMD ["node", "apps/api/dist/main.js"]
