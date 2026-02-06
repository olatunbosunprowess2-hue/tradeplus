# =====================================================
# Production-Grade Dockerfile for BarterWave NestJS API
# =====================================================
# Features:
# - Multi-stage build for optimized image size
# - Locked Node.js and Prisma versions
# - Automated migrations on startup
# - Health check endpoint
# =====================================================

# Lock Node.js version for reproducibility
FROM node:20.20.0-alpine AS builder

# Install OpenSSL for Prisma and build tools
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files for dependency caching
COPY package.json ./
COPY apps/api/package.json ./apps/api/

# Copy Prisma schema (needed for client generation)
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
# Using --legacy-peer-deps to handle peer dependency conflicts
RUN npm install --legacy-peer-deps

# Install pinned Prisma CLI (must match @prisma/client version in package.json)
# This prevents version drift that could break migrations
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
# Production Stage - Minimal runtime image
# =====================================================
FROM node:20.20.0-alpine AS production

# Install OpenSSL for Prisma runtime
RUN apk add --no-cache openssl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Copy package files
COPY package.json ./
COPY apps/api/package.json ./apps/api/

# Install production dependencies only
RUN npm install --omit=dev --legacy-peer-deps

# Install Prisma CLI for migrations (pinned version)
RUN npm install -g prisma@5.22.0

# Copy Prisma schema and migrations (needed for migrate deploy)
COPY prisma ./prisma/

# Generate Prisma client for production
RUN prisma generate

# Copy built application from builder stage
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy node_modules from builder (includes workspace dependencies)
COPY --from=builder /app/node_modules ./node_modules

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
