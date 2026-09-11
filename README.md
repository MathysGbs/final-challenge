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

## Container registry

Every merge to `main` and every `v*.*.*` tag publishes the image to the
GitHub Container Registry:

```text
ghcr.io/mathysgbs/final-challenge
```

| Tag             | Set on                     | Meaning                                  |
| --------------- | -------------------------- | ---------------------------------------- |
| `latest`        | merge to `main`, releases  | most recent build of the default branch  |
| `sha-<7 chars>` | every publish              | unique tag, traces back to one commit    |
| `1.2.3`, `1.2`  | tag `v1.2.3`               | released versions                        |

```bash
docker pull ghcr.io/mathysgbs/final-challenge:latest
docker run -p 3000:3000 ghcr.io/mathysgbs/final-challenge:latest
```

The image carries OCI labels generated at build time, so it can be traced
back to the repository, the commit and the build:

```bash
docker inspect --format '{{json .Config.Labels}}' ghcr.io/mathysgbs/final-challenge:latest
# org.opencontainers.image.source   → https://github.com/MathysGbs/final-challenge
# org.opencontainers.image.revision → full commit SHA
# org.opencontainers.image.created  → build timestamp
# org.opencontainers.image.version  → tag or branch that produced it
```

### Docker workflow

[`docker.yml`](.github/workflows/docker.yml) runs on pull requests, on
pushes to `main` and on version tags:

| Event           | Build | Smoke test | Publish | Pull & run published image |
| --------------- | :---: | :--------: | :-----: | :------------------------: |
| Pull request    |  yes  |    yes     |   no    |             no             |
| Push to `main`  |  yes  |    yes     |   yes   |            yes             |
| Tag `v*.*.*`    |  yes  |    yes     |   yes   |            yes             |

The smoke test starts the freshly built image, checks it runs as uid 1000
and that `/health` answers. After publishing, a second job pulls the image by
digest — exactly like a deployment would — and waits for Docker's own
`HEALTHCHECK` to report `healthy`.

**Permissions.** The workflow declares `permissions: contents: read` at the
top and the publishing job adds `packages: write`. `contents: read` is needed
to check out the sources; `packages: write` is what lets the run push to
GHCR. Authentication uses the run's own short-lived `GITHUB_TOKEN`: no
personal access token is stored in the repository or its secrets. The
verification job only gets `packages: read`, because pulling is all it does.

## Security scanning

Every image build is scanned with [Trivy](https://github.com/aquasecurity/trivy)
before anything is published, and the published `latest` image is re-scanned
every Monday by [`security-scan.yml`](.github/workflows/security-scan.yml)
(which also runs `npm audit`). Reports are uploaded to the repository's
**Security → Code scanning** tab; the table output is visible in the
workflow logs.

### Policy

| Finding                                       | Effect                                   |
| --------------------------------------------- | ---------------------------------------- |
| CRITICAL or HIGH **with a fix available**     | pipeline fails, image is **not** published |
| CRITICAL or HIGH without a fix (`unfixed`)    | reported, does not block                 |
| MEDIUM and LOW                                | reported, does not block                 |

Why this line: blocking on a vulnerability nobody can fix yet would only
freeze delivery, while a fixable CRITICAL/HIGH is a one-line change (bump the
base image, `apk upgrade`, bump a dependency) that must happen before the
image reaches the registry.

### When the scan fails

- **On a pull request** — the author fixes it in the same PR (upgrade the base
  image tag, bump the dependency, or drop the package if it is not needed at
  runtime). The reviewer checks the fix, not just the green check.
- **On the weekly scan** — the job fails and GitHub notifies the team. Open an
  issue with the `security` label, fix it through the normal PR flow and cut a
  patch release so `latest` is clean again.
- **Exception** — if a finding cannot be fixed and is demonstrably not
  exploitable here, add the CVE id to a `.trivyignore` file **in a PR** with
  the justification and an expiry date in the comment. No exception is
  granted outside a reviewed PR.

### What the first scan found

The initial `node:20-alpine` image reported 4 HIGH OpenSSL CVEs (fixed in
Alpine but not yet in the base image) and 20 HIGH/CRITICAL findings in the
packages bundled with the image's `npm`. The Dockerfile now runs
`apk upgrade` and removes `npm`, `npx` and `corepack` from the runtime stage,
which the container never uses. The image scans clean for fixable
CRITICAL/HIGH vulnerabilities.

### SBOM

For every published image the workflow generates a CycloneDX Software Bill
of Materials (`sbom.cdx.json`), attached to the workflow run as an artifact
for 90 days.

## GitHub Actions

The final repository must contain workflows for:

- tests and lint;
- matrix testing;
- Docker build;
- container security scanning;
- publishing the image to GitHub Container Registry.

See `CHALLENGE.md` for the complete requirements.
