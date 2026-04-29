# --- Stage 1: Build Stage ---
FROM node:22-alpine AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.29.3 --activate

WORKDIR /app

# 1. Copy workspace manifests
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY apps/shared/package.json ./apps/shared/
COPY apps/web/package.json ./apps/web/

# 2. Install dependencies (Cached)
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# 3. Copy source code
COPY apps/shared ./apps/shared
COPY apps/web ./apps/web

# 4. Build the shared package and then the web app
RUN pnpm --filter @bir-notebook/shared build
RUN pnpm --filter @bir-notebook/web build

# --- Stage 2: Serve Stage ---
FROM nginx:alpine AS runner

# Copy built files
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# REPLACE the main config instead of adding to conf.d
COPY apps/web/nginx.conf /etc/nginx/nginx.conf
COPY apps/web/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000
CMD ["/docker-entrypoint.sh"]
