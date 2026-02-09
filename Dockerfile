# Multi-stage build for production deployment

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy ALL files first (including patches)
COPY . .

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Build application
RUN pnpm build

# Stage 2: Runtime
FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files, lock file, and patches
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
