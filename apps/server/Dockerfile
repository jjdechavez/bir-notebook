# Multi-stage build for server app
# Stage 1: Build the application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install all dependencies (including dev for building)
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Stage 2: Runtime image
FROM node:18-alpine AS runner

WORKDIR /app

# Copy package files for production dependencies
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install only production dependencies
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile && pnpm store prune

# Copy built application from builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/start ./start
COPY --from=builder /app/config ./config
COPY --from=builder /app/database ./database
COPY --from=builder /app/app ./app
COPY --from=builder /app/ace.js ./
COPY --from=builder /app/adonisrc.ts ./
COPY --from=builder /app/tsconfig.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S adonis -u 1001

# Change ownership
RUN chown -R adonis:nodejs /app
USER adonis

# Expose port
EXPOSE 3333

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node ace health:check || exit 1

# Start the application
CMD ["node", "bin/server.js"]