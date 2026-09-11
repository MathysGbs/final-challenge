# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-09-11

First versioned release. Image: `ghcr.io/mathysgbs/final-challenge:1.0.0`.

### Added

- Filtering of tasks by status: `GET /tasks?status=todo|in-progress|done`,
  unknown values answer 400 (#11).
- Case-insensitive search on title and description: `GET /tasks?search=` (#11).
- Request validation on `POST /tasks`: required title, 200-character limit,
  allowed statuses, JSON object body; uniform `{ "error": ... }` responses (#12).
- `GET /health` reporting status, uptime and environment (#11).
- Environment-based configuration (`PORT`, `NODE_ENV`) with local defaults
  and a documented `.env.example` (#11, docs PR).
- Production Docker image: multi-stage build on `node:20-alpine`, non-root
  user, `tini` as PID 1, `HEALTHCHECK` on `/health` (#7).
- `docker compose up` with health check and port/environment configuration (#8).
- GitHub Actions: lint, tests and build check on Node 20 and 22 (`ci.yml`);
  image build and smoke test on pull requests; publication to GHCR on `main`
  and tags with `latest`, `sha-<commit>` and semver tags, OCI labels and a
  CycloneDX SBOM; deployment simulation pulling the published image (#9).
- Trivy scan gating publication on fixable CRITICAL/HIGH vulnerabilities,
  SARIF reports in the Security tab, weekly re-scan and `npm audit` (#13).
- Issue and pull request templates, branching strategy (`BRANCHING.md`).

### Fixed

- `npm run lint` failed on a clean checkout because ESLint had no Node
  globals (3c8d734).
- `npm ci` could not run: the lockfile was missing (5458add).
- `.env` files were not git-ignored (#6).

### Security

- The base image shipped 4 fixable HIGH OpenSSL CVEs and 20 HIGH/CRITICAL
  findings in the packages bundled with `npm`; the runtime stage now runs
  `apk upgrade` and removes `npm`, `npx` and `corepack`. The published image
  scans clean for fixable CRITICAL/HIGH vulnerabilities (#13).

### Tests

- 8 automated tests (`node --test`), run on Node 20 and 22 in CI: health,
  listing, 404 on unknown task, task creation, and one regression test per
  validation rule (missing title, invalid status, title too long, malformed
  body).

### Known limitations

- In-memory store: data is lost on restart, single instance only.
- No `PATCH`, `DELETE` or pagination endpoints.
- A malformed JSON body answers Express's default HTML 400 page rather than
  the JSON error format.
- `POST /tasks` accepts an empty-string `status` (validation only rejects
  unknown non-empty values) — fix in progress.

[1.0.0]: https://github.com/MathysGbs/final-challenge/releases/tag/v1.0.0
