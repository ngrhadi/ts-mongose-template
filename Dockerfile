# Stage 1: Builder - Install dependencies and build TypeScript
FROM node:18-alpine AS builder
WORKDIR /app

# 1. Install dependencies (cached layer)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# 2. Copy source and build (separate layer)
COPY . .
RUN npm run build

# Stage 2: Runner - Production-ready image
FROM node:18-alpine AS runner
WORKDIR /app

# Create non-root user and set permissions
RUN addgroup -S appgroup && \
    adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /app

# Copy built artifacts from builder
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/package*.json ./
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules

# Set environment variables for production
ENV NODE_ENV=production
ENV PORT=3000

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
    CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000
CMD ["node", "dist/index.js"]
