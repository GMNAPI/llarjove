# LegalBot RAG - Production Dockerfile
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm build

# Production image
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install pnpm for production deps
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod --frozen-lockfile

# Copy built files, static assets, and data
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/public ./dist/public
COPY --from=builder /app/data ./data

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 legalbot
USER legalbot

EXPOSE 3000

CMD ["node", "dist/index.js"]
