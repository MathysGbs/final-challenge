# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1: install production dependencies only.
# The lockfile makes this reproducible; dev dependencies (eslint) never enter
# the final image.
# ---------------------------------------------------------------------------
ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine AS deps

WORKDIR /app
COPY package.json package-lock.json ./
# npm leaves empty scope directories (@eslint/...) behind when it omits dev
# dependencies; remove them so the image really contains production code only.
RUN npm ci --omit=dev \
    && npm cache clean --force \
    && find node_modules -type d -empty -delete

# ---------------------------------------------------------------------------
# Stage 2: runtime image.
# Only node_modules from the previous stage and the application sources are
# copied in. tini runs as PID 1 so SIGTERM from `docker stop` reaches Node.
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS runtime

RUN apk add --no-cache tini

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src

# The official image ships an unprivileged `node` user (uid 1000).
USER node

EXPOSE 3000

# Shell form on purpose: ${PORT} is resolved at run time, so the check follows
# a `-e PORT=...` override. wget comes from busybox, present in alpine.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/health" || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/app.js"]
