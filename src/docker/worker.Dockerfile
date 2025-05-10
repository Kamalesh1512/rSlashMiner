# Use Node 20 slim image
FROM node:22-alpine

WORKDIR /app

# Copy package files first and install production deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy all files
COPY . .

# Install dependencies
RUN npm install

# Install tsx globally
RUN npm install -g tsx

# Set environment variables file if needed
# ENTRYPOINT or CMD to run your cron job
CMD ["tsx", "src/cron/scheduler.ts"]
