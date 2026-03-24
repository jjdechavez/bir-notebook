FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages ./packages

RUN pnpm install --frozen-lockfile

FROM base AS build
COPY apps/api ./apps/api
RUN pnpm -C apps/api build
RUN pnpm prune --prod

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S node && adduser -S node -G node

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/api/dist ./dist
COPY apps/api/package.json ./package.json

USER node
EXPOSE 3000

CMD ["node", "dist/server.js"]
