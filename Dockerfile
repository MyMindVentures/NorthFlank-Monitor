# Multi-stage build for NorthFlank Monitor
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Production stage
FROM node:18-alpine AS production

# Create app directory
WORKDIR /app

# Copy production dependencies and source code
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src ./src

# Create data directory for SQLite database
RUN mkdir -p data logs

# Create a non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S monitor -u 1001
USER monitor

# Expose ports
EXPOSE 3002 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/health || exit 1

# Start the application
CMD ["node", "src/index.js"]