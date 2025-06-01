# Stage 1: Build the Next.js app
FROM node:22-slim AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

RUN npm run build

# Stage 2: Runtime container
FROM node:22-slim AS runner

# Install dependencies required by Puppeteer and Chromium
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libxkbcommon0 \
    libgbm1 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    dumb-init \
    chromium \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
# Tell Puppeteer to skip downloading Chromium since we installed it via apt
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
# Tell Puppeteer where to find the Chromium executable
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app


RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser

# Copy with correct ownership directly
COPY --from=builder --chown=pptruser:pptruser /app/public ./public
COPY --from=builder --chown=pptruser:pptruser /app/.next ./.next
COPY --from=builder --chown=pptruser:pptruser /app/node_modules ./node_modules
COPY --from=builder --chown=pptruser:pptruser /app/package.json ./package.json
COPY --from=builder --chown=pptruser:pptruser /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=pptruser:pptruser /app/src ./src

# Switch to non-root user
USER pptruser

# Use dumb-init as the entrypoint to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start Next.js app
CMD ["npm", "run", "start"]
