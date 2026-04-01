# syntax=docker/dockerfile:1.7

### base
FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

### deps
FROM base AS deps
WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/app/package.json packages/app/package.json

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
  pnpm install --frozen-lockfile --filter @liot/app...

### builder
FROM deps AS builder
WORKDIR /workspace

COPY . .

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
  pnpm --filter @liot/app build

### runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=4000

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder --chown=nextjs:nodejs /workspace/packages/app/.next/standalone/   ./
COPY --from=builder --chown=nextjs:nodejs /workspace/packages/app/public              ./packages/app/public
COPY --from=builder --chown=nextjs:nodejs /workspace/packages/app/.next/static        ./packages/app/.next/static
COPY --chown=nextjs:nodejs docker/entrypoint.sh                                       /entrypoint.sh

RUN chmod +x /entrypoint.sh && mkdir -p logs

USER nextjs
EXPOSE 4000
EXPOSE 1883

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "packages/app/server.js"]
