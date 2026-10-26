# Multi-stage production Dockerfile for A.A. Master Nig. Limited Cement System
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency specifications
COPY package.json package-lock.json* ./

# Install all dependencies for build
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Copy application source code
COPY . .

# Build Vite frontend assets into /app/dist
RUN npm run build

# Runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package specs
COPY package.json package-lock.json* ./

# Install production dependencies
RUN npm ci --omit=dev --legacy-peer-deps || npm install --omit=dev --legacy-peer-deps

# Copy built frontend assets from builder stage
COPY --from=builder /app/dist ./dist

# Copy backend server code, TypeScript configuration, and initial database
COPY server.ts tsconfig.json ./
COPY src/server ./src/server
COPY src/types ./src/types
COPY data ./data

EXPOSE 3000

CMD ["npm", "start"]
