# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/ ./packages/
COPY apps/api/package.json ./apps/api/

# Install deps (only API + shared packages)
RUN pnpm install --frozen-lockfile --filter @educore/api...

# Copy source and Prisma schema
COPY prisma/ ./prisma/
COPY apps/api/ ./apps/api/

# Generate Prisma client
RUN pnpm --filter @educore/api db:generate

# Build NestJS
RUN pnpm --filter @educore/api build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/ ./packages/
COPY apps/api/package.json ./apps/api/

# Install production deps only
RUN pnpm install --frozen-lockfile --filter @educore/api... --prod

# Copy Prisma schema and generated client
COPY prisma/ ./prisma/
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/apps/api/dist ./apps/api/dist

WORKDIR /app/apps/api

EXPOSE 4000

ENV NODE_ENV=production

CMD ["node", "dist/main"]
