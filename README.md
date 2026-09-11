# Task Management API — Final Challenge

Starter project for the GitHub + Actions + Docker final challenge.

## Requirements

- Node.js 20+
- npm
- Docker
- Docker Compose

## Install

```bash
npm install
```

## Run locally

```bash
npm start
```

The API listens on port `3000` by default.

## Test

```bash
npm test
```

## Lint

```bash
npm run lint
```

## API

Starter endpoints:

- `GET /tasks`
- `GET /tasks/:id`
- `POST /tasks`

Students must implement additional functionality from `CHALLENGE.md`.

## Docker

```bash
docker build -t task-api .
docker run -p 3000:3000 task-api
```

The API is then available on <http://localhost:3000>. Override the port or
the environment with `-e PORT=8080 -p 8080:8080` / `-e NODE_ENV=staging`.

The [`Dockerfile`](Dockerfile) is a multi-stage build:

| Stage     | Base               | Purpose                                                    |
| --------- | ------------------ | ---------------------------------------------------------- |
| `deps`    | `node:20-alpine`   | `npm ci --omit=dev` from the lockfile: production deps only |
| `runtime` | `node:20-alpine`   | copies `node_modules` and `src/`, nothing else              |

Properties of the runtime image:

- runs as the unprivileged `node` user (uid 1000), not root;
- contains no dev dependencies, tests, git history or lint configuration
  (see [`.dockerignore`](.dockerignore));
- `tini` is PID 1 so `docker stop` delivers `SIGTERM` to Node immediately
  instead of waiting for the 10 s kill timeout;
- declares `EXPOSE 3000` and a `HEALTHCHECK` that calls `GET /health` every
  30 s (`docker inspect --format '{{.State.Health.Status}}' <container>`
  shows `healthy`).

## Docker Compose

```bash
docker compose up
```

[`compose.yml`](compose.yml) builds the image, sets `NODE_ENV` and `PORT`,
publishes the API on the host and reuses the `/health` endpoint as the
container health check. `docker compose ps` shows `(healthy)` once the API
answers.

| Variable   | Default      | Effect                                   |
| ---------- | ------------ | ---------------------------------------- |
| `API_PORT` | `3000`       | Host port mapped to the container's 3000 |
| `NODE_ENV` | `production` | Passed to the application                |

```bash
API_PORT=8080 docker compose up      # API on http://localhost:8080
docker compose down                  # stop and remove the container
```

The stack has a single service: the store is in memory, so there is no
database to run alongside it.

## GitHub Actions

The final repository must contain workflows for:

- tests and lint;
- matrix testing;
- Docker build;
- container security scanning;
- publishing the image to GitHub Container Registry.

See `CHALLENGE.md` for the complete requirements.
