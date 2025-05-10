# Step 1: Build the Next.js app
FROM node:22-alpine AS builder

# Enable system packages needed for building packages like bcrypt
RUN apk add --no-cache libc6-compat python3 make g++

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy all files
COPY . .

# Build the Next.js app
RUN npm run build

# Step 2: Use minimal image for running the app
FROM node:22-alpine AS runner

# Install only runtime dependencies
RUN apk add --no-cache libc6-compat

# Set environment to production
ENV NODE_ENV=production

WORKDIR /app

# Copy built artifacts and necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Optional: expose port (default Next.js port)
EXPOSE 3000

# Default command: start Next.js server
CMD ["npm", "run", "start"]
