# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder

WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY packages/ ./packages/
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/
COPY prisma/ ./prisma/

RUN npm ci

COPY . .

RUN npm run prisma:generate
RUN npm run build:api

FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/prisma ./prisma

EXPOSE 4000

CMD ["node", "apps/api/dist/index.js"]
