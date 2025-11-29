# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy shared types first (needed for compilation)
COPY shared ./shared

# Copy server package files
COPY server/package*.json ./server/

# Install dependencies
WORKDIR /app/server
RUN npm ci

# Copy server source code
COPY server ./

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY server/package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/server/dist ./dist

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start the server
CMD ["node", "dist/main.js"]
