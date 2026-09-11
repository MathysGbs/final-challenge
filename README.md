# Task Management API

A small REST API for managing tasks, built as the vehicle for the
GitHub + GitHub Actions + Docker final challenge. The repository itself is the
deliverable: issues, branches, pull requests, reviews, CI, a container image
published to GHCR and a versioned release. See [`CHALLENGE.md`](CHALLENGE.md)
for the assignment and [`BRANCHING.md`](BRANCHING.md) for how the team works.

## Requirements

- Node.js 20 or later (CI runs on 20 and 22)
- npm
- Docker and Docker Compose (for the container workflow)

## Local development

```bash
npm install
npm start
```

`npm ci` installs the exact tree from `package-lock.json` (what CI and the
Docker build use). The API listens on <http://localhost:3000> by default; see
[Configuration](#configuration) to change it.

## Tests

```bash
npm test
```

Tests use the built-in `node:test` runner and boot the app on a random port
for each request. They cover happy paths, validation errors (400), missing
resources (404), the status business rule and regression cases for every
feature shipped.

## Lint

```bash
npm run lint
```

ESLint 9 (flat config) with Node globals; single quotes and semicolons are
enforced.

## Build check

```bash
npm run build
```

There is no compile step. `build` loads every module, boots the app and calls
`/health`; CI runs it after lint and tests as the "application build/check"
gate.

## Configuration

The application reads its configuration from environment variables
([`src/config.js`](src/config.js)), with defaults suited to local development:

| Variable   | Default       | Used for                                             |
| ---------- | ------------- | ---------------------------------------------------- |
| `PORT`     | `3000`        | TCP port the API listens on                          |
| `NODE_ENV` | `development` | Reported by `GET /health`; the Docker image sets `production` |

```bash
PORT=8080 NODE_ENV=staging npm start
```

[`.env.example`](.env.example) lists the variables. To use a local `.env`
file, copy it and start Node with `node --env-file=.env src/app.js`.
**`.env` files are git-ignored and must never be committed** — no secrets in
the repository, ever.

## API

All responses are JSON. Errors have the shape `{ "error": "message" }`.

| Method | Path          | Description                                  | Codes         |
| ------ | ------------- | -------------------------------------------- | ------------- |
| GET    | `/health`     | Service status, uptime and environment       | 200           |
| GET    | `/tasks`      | List tasks, optionally filtered and searched | 200, 400      |
| GET    | `/tasks/:id`  | One task                                     | 200, 404      |
| POST   | `/tasks`      | Create a task                                | 201, 400      |

A task looks like:

```json
{
  "id": "1",
  "title": "Add dark mode",
  "description": "Add a toggle in settings",
  "status": "todo",
  "createdAt": "2026-09-11T12:00:00.000Z",
  "updatedAt": "2026-09-11T12:00:00.000Z"
}
```

`status` is one of `todo`, `in-progress`, `done`. The store is in memory and
starts with two example tasks.

### Listing, filtering and searching

`GET /tasks` returns `{ "data": [ ...tasks ] }` and accepts:

| Parameter | Example          | Effect                                                        |
| --------- | ---------------- | ------------------------------------------------------------- |
| `status`  | `?status=todo`   | Keep only tasks with this status; unknown value → `400`       |
| `search`  | `?search=login`  | Case-insensitive match on `title` or `description`            |

Both can be combined: `GET /tasks?status=done&search=github`.

```bash
curl 'http://localhost:3000/tasks?status=in-progress&search=login'
```

### Creating a task

`POST /tasks` with a JSON body. Validation rules, each answering `400`:

| Rule                                   | Error message                                   |
| -------------------------------------- | ----------------------------------------------- |
| Body must be a JSON object             | `Invalid request body`                          |
| `title` required, non-empty string     | `Title is required`                             |
| `title` at most 200 characters         | `Title must be at most 200 characters`          |
| `status`, if given, in the allowed list| `Status must be one of: todo, in-progress, done`|

`description` defaults to `""` and `status` to `todo`.

```bash
curl -X POST http://localhost:3000/tasks \
  -H 'content-type: application/json' \
  -d '{"title": "Write the release notes", "status": "in-progress"}'
```

### Health

`GET /health` → `{ "status": "ok", "uptime": 12.3, "env": "production" }`.
Docker's `HEALTHCHECK`, Compose and the deployment simulation in CI all rely
on it.

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

## CI

Three workflows in [`.github/workflows`](.github/workflows). Every pull request
and every push to `main` goes through the first two; a failure in any step
fails the workflow, and branch protection requires them to pass before a
merge.

| Workflow | Runs on | What it verifies |
| --- | --- | --- |
| [`ci.yml`](.github/workflows/ci.yml) — Continuous Integration | PRs, `main` | `npm ci` → `npm run lint` → `npm test` → `npm run build`, on Node **20 and 22** (matrix, `fail-fast: false`) |
| [`docker.yml`](.github/workflows/docker.yml) — Docker | PRs, `main`, tags `v*` | Image builds; smoke test (non-root uid, `/health`); Trivy report + gate on fixable CRITICAL/HIGH. On `main`/tags only: publish to GHCR with tags and OCI labels, SBOM, then pull the published image and wait for `healthy` |
| [`security-scan.yml`](.github/workflows/security-scan.yml) — Scheduled security scan | Mondays 06:00 UTC, manual | Re-scan of the published `latest` image with the same policy; `npm audit --audit-level=high` |

Obsolete runs on the same branch are cancelled (`concurrency`), npm downloads
are cached, and every workflow declares the minimum `permissions` it needs
(`contents: read` everywhere, `packages: write` only where the image is
pushed).

## Branching strategy

`main` is protected: no direct pushes, one approving review from another team
member and green checks are required, merges are merge commits. Every change
starts as an issue, lives on a branch named after its purpose and lands
through a pull request that references the issue:

```text
main
 ├── feature/<name>   new behaviour           (label: feature)
 ├── fix/<name>       bug fixes + regression test (label: bug)
 ├── chore/<name>     tooling, config, Docker (label: technical-debt, docker)
 ├── ci/<name>        workflows               (label: ci, security)
 └── docs/<name>      documentation
```

Details, commit message conventions and the review rules are in
[`BRANCHING.md`](BRANCHING.md).

## Release process

1. `main` is green and contains everything for the version.
2. Update [`CHANGELOG.md`](CHANGELOG.md) through a `docs/` pull request.
3. Tag and push: `git tag -a v1.2.3 -m "Task Management API 1.2.3" && git push origin v1.2.3`.
   The tag triggers `docker.yml`, which publishes `1.2.3`, `1.2`, `latest`
   and `sha-<commit>`.
4. Create the GitHub Release from the tag with the changelog section as notes:
   `gh release create v1.2.3 --title v1.2.3 --notes-file <notes>`.

Anyone holding an image can trace it back: `org.opencontainers.image.version`
gives the tag, `org.opencontainers.image.revision` the commit, and the GitHub
Release links both.

## Architecture

```text
Developer
   ↓  issue → branch → commits
GitHub
   ↓  pull request (template, linked issue)
Pull Request ──── review by another team member
   ↓
GitHub Actions
 ┌─────────┴──────────┐
 Continuous Integration       Docker
 lint · tests · build check   build · smoke test · Trivy scan
 (Node 20 + 22)               (no publish on PRs)
 └─────────┬──────────┘
        ↓  required checks green + 1 approval
      Merge to main
        ↓
 Docker build (same Dockerfile, cached layers)
        ↓
 Trivy gate — fixable CRITICAL/HIGH ⇒ stop
        ↓
 Publish to GHCR — latest · sha-<commit> · 1.2.3 on tags
   + OCI labels (source, revision, created, version) + SBOM
        ↓
 Deployment simulation — pull by digest, run, wait for healthy
        ↓
 Weekly re-scan of latest (security-scan.yml)
```

At runtime the service is a single Node.js process (Express 5) with an
in-memory store: no database, no external dependency, one container.

## Repository layout

```text
src/
  app.js                 Express app, /health, entry point (listens only when run directly)
  config.js              PORT / NODE_ENV with defaults
  data/store.js          in-memory task storage
  routes/tasks.js        /tasks handlers, filtering and search
  middleware/validate.js POST /tasks validation
tests/                   node:test suites
scripts/check.js         build check used by CI
Dockerfile, .dockerignore, compose.yml
.github/
  ISSUE_TEMPLATE/        feature request, bug report
  pull_request_template.md
  workflows/             ci.yml, docker.yml, security-scan.yml
BRANCHING.md             how we branch, commit, review and release
CHANGELOG.md             what each version ships
```

## Known limitations

- The store is in memory: data is lost on restart and cannot be shared
  between instances.
- No `PATCH`, `DELETE` or pagination yet (challenge features D, E, F).
- A malformed JSON body is rejected by `express.json()` before the validation
  middleware and answers Express's default HTML 400 page instead of
  `{ "error": ... }`.
