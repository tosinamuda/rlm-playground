# syntax=docker/dockerfile:1.4
# Frontend Dockerfile - RLM Playground UI
# Build: registry.access.redhat.com/ubi10/nodejs-24-minimal (has npm)
# Runtime: registry.access.redhat.com/ubi10/nginx-126 (static serving)
#
# Build from monorepo root:
#   docker build -f apps/frontend/Dockerfile -t rlm-frontend .

# ============================================
# Stage 1: Dependencies
# ============================================
FROM registry.access.redhat.com/ubi10/nodejs-24-minimal:latest AS deps

USER root
WORKDIR /app

# Copy root package files (monorepo)
COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/

# Install all dependencies (npm workspace hoists to root)
RUN npm ci --ignore-scripts && chown -R 1001:0 /app

USER 1001

# ============================================
# Stage 2: Build (Static Export)
# ============================================
FROM registry.access.redhat.com/ubi10/nodejs-24-minimal:latest AS builder

USER root
WORKDIR /app

# Copy dependencies from deps stage (hoisted to root)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/package-lock.json ./package-lock.json

# Copy frontend source
COPY apps/frontend ./apps/frontend

# Fix ownership for non-root build
RUN chown -R 1001:0 /app

USER 1001

# Set environment for production build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app/apps/frontend

# Build static export
RUN npm run build

# ============================================
# Stage 3: Runtime (UBI Nginx)
# ============================================
FROM registry.access.redhat.com/ubi10/nginx-126:latest

# Copy static files to web root
COPY --from=builder --chown=1001:0 /app/apps/frontend/out .

# Copy nginx configuration
COPY --chown=1001:0 apps/frontend/nginx.conf "${NGINX_CONF_PATH}"

# Expose port (nginx uses 8080 by default, non-root)
EXPOSE 8080

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
