# LegalBot RAG - Production Dockerfile
FROM node:20-slim AS builder

WORKDIR /app

# Set to commit SHA or timestamp in CI to force fresh build (avoids stale cache)
ARG CACHEBUST=
RUN echo "Build cache key: ${CACHEBUST}"

# Install dependencies
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm@9 && pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm build

# Production image
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install pnpm for production deps
RUN npm install -g pnpm@9

# Copy package files
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod --frozen-lockfile

# Copy built files, static assets, and data
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/public ./dist/public
COPY --from=builder /app/data ./data

# Fix ownership so non-root user can read vector_store.json
RUN chown -R 1001:1001 /app/data

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 legalbot
USER legalbot

CMD ["node", "dist/index.js"]
