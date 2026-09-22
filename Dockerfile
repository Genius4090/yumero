# Builds the React app and serves it with Caddy.
# The Caddyfile (routing, HTTPS, /api proxy) is mounted by the backend repo's docker-compose.yml.

# ---------- build ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_YANDEX_MAPS_API_KEY=
ENV VITE_YANDEX_MAPS_API_KEY=$VITE_YANDEX_MAPS_API_KEY
# same-origin API in production
ENV VITE_API_URL=
RUN npm run build

# ---------- serve ----------
FROM caddy:2-alpine
COPY --from=build /app/dist /srv/web
