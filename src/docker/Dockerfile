# Stage 1: Builder
FROM node:22-slim AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:22-slim AS runner

ENV NODE_ENV=production

WORKDIR /app

# Copy only required build artifacts
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/src ./src

# Use a non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser
USER appuser

# Start your Next.js app
CMD ["npm", "run", "start"]
