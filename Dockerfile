# InBits Frontend — production image (TanStack Start / Vite SSR)
#
# IMPORTANT: VITE_API_BASE_URL is a *build-time* value — if you set it,
# Vite inlines it into the client JS bundle, so changing it later means
# rebuilding this image. Leave it unset (the default) for the
# docker-compose deployment: the app then resolves the backend URL at
# runtime instead — same origin in the browser (works behind the nginx
# reverse proxy in docker-compose.yml with zero rebuilds per environment),
# and INTERNAL_API_BASE_URL (a normal runtime env var, read at container
# start, not baked in) for server-side rendering. See src/lib/api.ts and
# .env.example for the full resolution order.
#
# This build's production entrypoint is `vite preview`, which is what
# actually serves the SSR handler in dist/server *and* the static client
# assets in dist/client together (verified: both / and /favicon.svg
# return 200 from it). That does mean the full node_modules + source tree
# ships in the runtime image rather than a minimal Nitro/Node output —
# fine for most deployments; for a leaner image, front this with a CDN/
# reverse proxy (see docker-compose.yml, which adds nginx) or migrate to
# a dedicated Node adapter if TanStack Start ships one for this Vite
# version down the line.

FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app ./

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}/" || exit 1

CMD ["sh", "-c", "npm run preview -- --host 0.0.0.0 --port ${PORT}"]
