# =============================================================================
# Multi-stage Dockerfile for React Admin UI
# =============================================================================

# -----------------------------------------------------------------------------
# Base stage - Common setup for all stages
# -----------------------------------------------------------------------------
FROM node:24-alpine AS base
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S reactuser -u 1001 -G nodejs

# -----------------------------------------------------------------------------
# Dependencies stage - Install all dependencies
# -----------------------------------------------------------------------------
FROM base AS dependencies
COPY package*.json ./
RUN npm ci --include=dev && npm cache clean --force

# -----------------------------------------------------------------------------
# Development stage - For local development with hot reload
# -----------------------------------------------------------------------------
FROM dependencies AS development

# Copy application code
# Note: In development, mount code as volume: docker run -v ./:/app
COPY --chown=reactuser:nodejs . .

# Switch to non-root user
USER reactuser

# Expose port
EXPOSE 3000

# Use dumb-init and start development server
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "dev"]

# -----------------------------------------------------------------------------
# Build stage - Build the React application
# -----------------------------------------------------------------------------
FROM dependencies AS build

# Copy source code
COPY . .

# Build for production
ENV NODE_ENV=production
RUN npm run build

# -----------------------------------------------------------------------------
# Production stage - Serve with Nginx
# -----------------------------------------------------------------------------
FROM nginx:1.27-alpine AS production

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Create non-root user for nginx
RUN addgroup -g 1001 -S nginx-app && \
    adduser -S nginx-app -u 1001 -G nginx-app && \
    chown -R nginx-app:nginx-app /usr/share/nginx/html && \
    chown -R nginx-app:nginx-app /var/cache/nginx && \
    chown -R nginx-app:nginx-app /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx-app:nginx-app /var/run/nginx.pid

# Switch to non-root user
USER nginx-app

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Labels for better image management and security scanning
LABEL maintainer="AIOutlet Team"
LABEL service="admin-ui"
LABEL version="1.0.0"
LABEL org.opencontainers.image.source="https://github.com/aioutlet/aioutlet"
LABEL org.opencontainers.image.description="Admin UI for AIOutlet platform"
LABEL org.opencontainers.image.vendor="AIOutlet"
LABEL framework="react"
LABEL language="javascript"
