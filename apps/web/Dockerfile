# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/ ./packages/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile --filter @educore/web...

COPY apps/web/ ./apps/web/

# Build Next.js in standalone mode
ENV NEXT_TELEMETRY_DISABLED=1
ENV BUILD_STANDALONE=true
RUN pnpm --filter @educore/web build

# Stage 2: Production (Next.js standalone)
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Next.js standalone output
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 4001
ENV PORT=4001
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
