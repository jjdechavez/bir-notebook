# --- Stage 1: Base ---
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.29.3 --activate

# --- Stage 2: Builder ---
FROM base AS builder
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/shared/package.json ./apps/shared/
COPY apps/server/package.json ./apps/server/

# Install ALL dependencies (including devDeps)
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY apps/shared ./apps/shared
COPY apps/server ./apps/server

# Build everything
RUN pnpm --filter @bir-notebook/shared build
RUN pnpm --filter @bir-notebook/server build

# --- Stage 3: Production Isolation ---
FROM base AS extract
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/server/package.json ./apps/server/
COPY apps/shared/package.json ./apps/shared/

# 1. pnpm deploy creates a standalone folder with PHYSICAL copies of node_modules
# It also resolves the @bir-notebook/shared workspace dependency into a real folder
RUN pnpm --filter @bir-notebook/server --prod deploy /app/isolated

# 2. Copy the compiled Adonis code (the 'build' directory) into the isolated folder
# This merges the compiled JS files with the production node_modules
COPY --from=builder /app/apps/server/build /app/isolated/build

# --- Stage 4: Final Runner ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && \
    adduser -S adonis -u 1001 -G nodejs

# Copy the entire isolated folder from the extract stage
COPY --from=extract --chown=adonis:nodejs /app/isolated ./

USER adonis

# AdonisJS v6 compiled entry point
EXPOSE 3333

# We run from the root of the isolated folder, calling the compiled server
CMD ["node", "build/bin/server.js"]
