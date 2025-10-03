FROM node:22.20.0-alpine AS base

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
COPY src ./src
COPY tsconfig.json ./
COPY tsup.config.ts ./
COPY vitest.config.ts ./
COPY biome.json ./

RUN pnpm install --frozen-lockfile

RUN pnpm build

FROM node:22.20.0-alpine AS build

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --prod

COPY --from=base /app/dist ./dist

RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 5000

CMD ["pnpm", "start"]
