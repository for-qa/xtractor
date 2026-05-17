# =============================================================================
# Stage 1: Build & Compile TypeScript
# =============================================================================
FROM node:20-slim AS builder

WORKDIR /app

# Install native compilation dependencies required by better-sqlite3
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package descriptors for a cached dependency layer
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for TypeScript compilation)
RUN npm ci

# Copy tsconfig.json and the source code
COPY tsconfig.json ./
COPY src/ ./src/

# Compile TypeScript to JavaScript (writes output to /app/dist)
RUN npm run build

# Remove development dependencies, leaving only production dependencies
RUN npm prune --production

# =============================================================================
# Stage 2: Minimal Production Image
# =============================================================================
FROM node:20-slim AS runner

WORKDIR /app

# Ensure production environment
ENV NODE_ENV=production
# Render/Cloud platforms inject PORT dynamically, but fallback to 8105
ENV PORT=8105

# Copy production dependencies and built code from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Copy frontend assets and configuration files
COPY assets/ ./assets/
COPY config/ ./config/

# Ensure the config.yaml exists by copying config.example.yaml if config.yaml is ignored
RUN if [ ! -f config/config.yaml ] && [ -f config/config.example.yaml ]; then \
        cp config/config.example.yaml config/config.yaml; \
    fi

# Create persistent storage directory for SQLite DB, logs, staging, and reports
RUN mkdir -p output/staging output/logs output/reports

# Grant the non-root 'node' user ownership of the application and workspace
RUN chown -R node:node /app

# Switch to the non-root user for robust runtime security
USER node

# Expose the default dashboard web server port
EXPOSE 8105

# Start the Web Dashboard Server
CMD ["node", "dist/server.js"]
