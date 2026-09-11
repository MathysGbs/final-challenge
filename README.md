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

Students must create a production-ready Docker image.

Expected commands:

```bash
docker build -t task-api .
docker run -p 3000:3000 task-api
```

## Docker Compose

Students must create:

```bash
docker compose up
```

## GitHub Actions

The final repository must contain workflows for:

- tests and lint;
- matrix testing;
- Docker build;
- container security scanning;
- publishing the image to GitHub Container Registry.

See `CHALLENGE.md` for the complete requirements.
