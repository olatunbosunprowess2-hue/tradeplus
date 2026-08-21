# =====================================================
# Production-Grade Dockerfile for BarterWave NestJS API
# =====================================================
# Features:
# - Multi-stage build for optimized image size
# - Locked Node.js 20 LTS Alpine image
# - Automated migrations on startup
# - Health check endpoint
# =====================================================

# Stage 1: Build Stage
FROM node:20-alpine AS builder

# Install OpenSSL for Prisma and build tools
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files for dependency caching
COPY package.json ./
COPY apps/api/package.json ./apps/api/

# Copy Prisma schema (needed for client generation)
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN npm install --legacy-peer-deps

# Install pinned Prisma CLI
RUN npm install -g prisma@5.22.0

# Copy API source code
COPY apps/api ./apps/api/

# Generate Prisma client
RUN prisma generate

# Build the application
WORKDIR /app/apps/api
RUN npm run build

# Verify build artifacts exist (fail fast if build is broken)
RUN ls -la dist/src/main.js || (echo "Build verification failed!" && exit 1)

# =====================================================
# Stage 2: Production Stage - Minimal runtime image
# =====================================================
FROM node:20-alpine AS production

# Install OpenSSL for Prisma runtime
RUN apk add --no-cache openssl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Copy package files and Prisma schema
COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY prisma ./prisma/

# Copy built application and node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Install Prisma CLI globally in runtime for automated startup migrations
RUN npm install -g prisma@5.22.0

# Generate Prisma client in runtime image
RUN prisma generate

# Set ownership to non-root user
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Environment configuration
ENV NODE_ENV=production
ENV PORT=3333

# Expose the application port
EXPOSE 3333

# Health check - verify API is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3333/api/health || exit 1

# Start with production script (runs migrations first)
CMD ["node", "apps/api/dist/src/start-production.js"]
