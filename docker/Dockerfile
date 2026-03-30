# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS deps
WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/app/package.json packages/app/package.json

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
	pnpm fetch --frozen-lockfile

FROM deps AS build
WORKDIR /workspace
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

COPY . .

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
	pnpm install --frozen-lockfile --prefer-offline --filter @liot/app...
RUN pnpm --filter @liot/app build

FROM node:20-alpine AS runner
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production
ENV PORT=4000

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=build --chown=nextjs:nodejs /workspace/packages/app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /workspace/packages/app/package.json ./package.json
COPY --from=build --chown=nextjs:nodejs /workspace/packages/app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /workspace/packages/app/public ./public
COPY --from=build --chown=nextjs:nodejs /workspace/packages/app/drizzle ./drizzle
COPY --from=build --chown=nextjs:nodejs /workspace/packages/app/drizzle.config.ts ./drizzle.config.ts
COPY --chown=nextjs:nodejs docker/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh && mkdir -p logs

USER nextjs
EXPOSE 4000
EXPOSE 1883

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "server.js"]
