# --- Stage 1: Build Stage ---
FROM node:22-alpine AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

WORKDIR /app

# 1. Copy workspace manifests
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/shared/package.json ./apps/shared/
COPY apps/web/package.json ./apps/web/
COPY apps/server/package.json ./apps/server/

# 2. Install dependencies (Cached)
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# 3. Copy source code
COPY apps/shared ./apps/shared
COPY apps/server ./apps/server
COPY apps/web ./apps/web

ARG PORT
ARG APP_KEY
ARG HOST
ARG LOG_LEVEL
ARG DB_HOST
ARG DB_PORT
ARG DB_USER
ARG DB_PASSWORD
ARG DB_DATABASE
ARG FE_URL
ENV PORT=$PORT
ENV APP_KEY=$APP_KEY
ENV HOST=$HOST
ENV LOG_LEVEL=$LOG_LEVEL
ENV DB_HOST=$DB_HOST
ENV DB_PORT=$DB_PORT
ENV DB_USER=$DB_USER
ENV DB_PASSWORD=$DB_PASSWORD
ENV DB_DATABASE=$DB_DATABASE
ENV FE_URL=$FE_URL
RUN cd apps/server && NODE_ENV=development node ace tuyau:generate

# 4. Build the shared package and then the web app
RUN pnpm --filter @bir-notebook/shared build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm --filter @bir-notebook/web build

# --- Stage 2: Serve Stage ---
FROM nginx:alpine AS runner

# Copy built files
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# REPLACE the main config instead of adding to conf.d
COPY apps/web/nginx.conf /etc/nginx/nginx.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
