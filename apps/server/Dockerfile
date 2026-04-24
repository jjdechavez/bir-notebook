FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.29.3 --activate

WORKDIR /apps

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY apps/shared/package.json ./apps/shared/
COPY apps/server/package.json ./apps/server/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM deps AS build
COPY apps/shared ./apps/shared
COPY apps/server ./apps/server
RUN pnpm --filter @bir-notebook/shared build
RUN pnpm --filter @bir-notebook/server build

FROM build AS extract
RUN pnpm deploy --filter @bir-notebook/server --prod /prod/server

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=extract --chown=node:node /prod/server ./

USER node
EXPOSE 3333

CMD ["node", "dist/server.js"]
