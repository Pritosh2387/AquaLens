# ============================================================
# AquaLens — Frontend Dockerfile  (DUMMY / PLACEHOLDER)
# ============================================================
# NOTE: This is a placeholder file. The project currently runs
# in development mode only. Docker support is not yet active.
# Do NOT use this in production without proper configuration.
# ============================================================

# ── Stage 1: build ──────────────────────────────────────────
FROM node:20-alpine AS build

LABEL maintainer="AquaLens Team"
LABEL description="AquaLens React + Vite Frontend — Maritime Command Centre Dashboard"

WORKDIR /app

# Install dependencies first (layer-cache friendly)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .

# Set API base URL at build time — override with --build-arg
ARG VITE_API_BASE_URL=http://localhost:8000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ── Stage 2: serve ──────────────────────────────────────────
FROM nginx:stable-alpine AS serve

LABEL description="AquaLens Frontend — Nginx static server"

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx config — serve SPA with fallback to index.html for client-side routing
RUN printf 'server {\n\
    listen 80;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    location /api/ {\n\
        proxy_pass http://backend:8000;\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
