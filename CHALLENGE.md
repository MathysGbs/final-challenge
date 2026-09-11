# Final Challenge — Node.js Platform Development with GitHub, Actions & Containers

**Teams:** 3–4 students  
**Platform:** GitHub + GitHub Actions + GitHub Container Registry (GHCR)  
**Application:** Node.js REST API


## Scenario

Your team maintains a small Task Management API.

You are not simply asked to "add a feature". You are acting as a development team responsible for taking a change from an idea all the way to a tested, reviewed, containerized and published application.

The repository itself is part of the assessment.

### The expected delivery chain

```text
Issue
  ↓
Branch
  ↓
Implementation
  ↓
Tests
  ↓
Pull Request
  ↓
Code Review
  ↓
GitHub Actions
  ├── tests
  ├── lint
  ├── build
  └── security checks
  ↓
Merge
  ↓
Docker image
  ↓
GitHub Container Registry
  ↓
Versioned release
```

---

# Rules

1. No direct commits to `main`.
2. Every change must be associated with an issue.
3. Every change must use a branch.
4. Every branch must result in a Pull Request.
5. Another team member must review the Pull Request.
6. CI must pass before merging.
7. Every team member must make meaningful contributions.
8. Do not use a single student's machine as the only place where the application works.
9. The final application must be reproducible from a clean checkout.

---

# Part 1 — Issue templates

Configure and use the provided:

- Feature Request template
- Bug Report template

Create at least:

- **2 feature issues**
- **1 bug issue**
- **1 technical/debt issue**

The technical issue should concern an engineering improvement rather than a user feature.

Examples:

- Add request validation
- Improve error handling
- Containerize the application
- Add structured logging
- Add security headers

Each issue must contain clear acceptance criteria.

### Extra challenge

Use GitHub labels consistently:

```text
feature
bug
technical-debt
security
ci
docker
```

---

# Part 2 — Team branching strategy

Define and document your branching strategy.

At minimum:

```text
main
 ├── feature/...
 ├── fix/...
 └── chore/...
```

Every branch must have a purpose.

Commit history should contain meaningful commits.

Bad:

```text
update
fix
test
final
final-final
```

Better:

```text
Add task status validation
Add regression test for invalid status
Add task filtering by status
```

---

# Part 3 — Pull Requests and reviews

Create a Pull Request template and use it for every PR.

Every PR must:

- reference an issue;
- explain the changes;
- explain testing;
- contain the checklist;
- receive at least one review;
- address review feedback before merging.

### Review challenge

Each student must review at least one Pull Request from another team member.

A review must contain at least one useful technical observation.

Do not create artificial comments such as "LGTM" only.

---

# Part 4 — Application development

Implement at least **three** of the following features:

## A — Filtering

```http
GET /tasks?status=todo
```

Supported values:

```text
todo
in-progress
done
```

## B — Search

```http
GET /tasks?search=github
```

Search should work on title and/or description.

## C — Validation

Reject invalid tasks:

- missing title;
- invalid status;
- invalid request structure;
- title longer than a reasonable limit.

Return appropriate HTTP status codes.

## D — Update

```http
PATCH /tasks/:id
```

Allow modification of title, description and status.

## E — Delete

```http
DELETE /tasks/:id
```

Return an appropriate response when the task does not exist.

## F — Pagination

```http
GET /tasks?page=2&limit=10
```

Return useful pagination metadata.

---

# Part 5 — Testing strategy

Add automated tests.

You must cover:

- happy paths;
- validation errors;
- missing resources;
- at least one business rule;
- regression cases.

### Minimum requirement

Your final project must contain enough tests to demonstrate that the newly implemented features are actually protected against regression.

### Advanced requirement

Add tests for combinations of features.

For example:

```text
GET /tasks?status=done&search=github
```

and invalid combinations/parameters.

---

# Part 6 — CI quality gates

Create or improve:

```text
.github/workflows/ci.yml
```

The workflow must run for Pull Requests and changes to `main`.

It must perform at least:

```text
checkout
   ↓
setup Node
   ↓
npm ci
   ↓
lint
   ↓
test
   ↓
application build/check
```

A failure in any quality gate must fail the workflow.

---

# Part 7 — Environment configuration

The application must not hard-code environment-specific configuration.

Introduce configuration such as:

```text
PORT
NODE_ENV
```

The application should use environment variables with sensible defaults for local development.

Document them in the README.

### Security rule

Do not commit:

```text
.env
```

or secrets.

---

# Part 8 — Docker image

Now containerize the application.

Create:

```text
Dockerfile
.dockerignore
```

The image must:

- use an official Node.js base image;
- install only what is required at runtime;
- expose the application port;
- start the application correctly;
- not require source files from the host at runtime;
- run as a **non-root user**;
- contain a useful Docker `HEALTHCHECK` or provide an equivalent health endpoint.

### Advanced Docker requirement

Use a **multi-stage Docker build**.

The final image should not contain unnecessary development dependencies.

Students must be able to run:

```bash
docker build -t task-api .
docker run -p 3000:3000 task-api
```

and access the API.

---

# Part 9 — Docker Compose

Create:

```text
compose.yml
```

The Compose configuration must start the application with one command:

```bash
docker compose up
```

It should:

- build the application image;
- configure the required environment variables;
- expose the API;
- define a health check or use the application's health endpoint.

### Optional extension

Add a second service such as a database.

If you choose this extension, explain the architecture in the README.

---

# Part 10 — Publish the Docker image to GitHub

The final image must be published to **GitHub Container Registry (GHCR)**.

The expected image naming convention is:

```text
ghcr.io/<owner>/<repository>
```

Configure GitHub Actions so that:

### On Pull Request

The workflow should:

- build the Docker image;
- verify that it builds successfully;
- **not publish** the image.

### After merging to `main`

The workflow should:

- build the image;
- tag it;
- publish it to GHCR.

### Required tags

At minimum, publish:

```text
latest
```

and a unique version/tag.

For example:

```text
1.0.0
```

or:

```text
sha-abc1234
```

The image must be visible from the repository's GitHub Packages/Container Registry.

---

# Part 11 — Secure the Docker publishing workflow

Do not put a personal access token directly in the workflow.

Use GitHub Actions permissions.

The workflow should explicitly define the minimum permissions needed, including package write access where required.

Example concept:

```yaml
permissions:
  contents: read
  packages: write
```

Students must be able to explain why these permissions are required.


---

# Part 12 — Docker security scanning

Add a container security scan to GitHub Actions.

The pipeline should detect known vulnerabilities in the generated image.

For example, use a tool such as:

- Trivy
- Docker Scout
- another appropriate scanner

The team must define what happens when vulnerabilities are found.

### Minimum

The scan must be visible in GitHub Actions.

### Advanced

Fail the pipeline for vulnerabilities above a severity threshold.

Document the chosen policy.

---

# Part 13 — Image metadata and traceability

A published image should allow someone to identify:

- which version it represents;
- which commit produced it;
- when it was built.

Use Docker labels and/or OCI metadata.

The GitHub Actions workflow should generate useful image tags automatically.

### Example

```text
latest
1.0.0
sha-8f3c2a1
```

A person looking at the image should be able to trace it back to the GitHub repository and commit.

---

# Part 14 — Release

Create a versioned GitHub Release.

For example:

```text
v1.0.0
```

The release notes must contain:

- new features;
- bug fixes;
- test information;
- Docker image information;
- known limitations.

---

# Part 16 — Documentation

The README must document:

## Local development

```bash
npm install
npm start
```

## Tests

```bash
npm test
```

## Lint

```bash
npm run lint
```

## Docker

```bash
docker build -t task-api .
docker run -p 3000:3000 task-api
```

## Docker Compose

```bash
docker compose up
```

## CI

Explain what GitHub Actions verifies.

## Container registry

Explain:

- image name;
- available tags;
- how to pull the image.

## Architecture

Add a small diagram or explanation:

```text
Developer
   ↓
GitHub
   ↓
Pull Request
   ↓
Actions
 ┌─┴─────────────┐
Tests           Lint
 └──────┬────────┘
        ↓
      Merge
        ↓
 Docker Build
        ↓
 Security Scan
        ↓
      GHCR
```

---

# Part 17 — Optional advanced challenges

Choose one or more if your team finishes early.

## A — Dependency update automation

Configure Dependabot or another automated dependency update mechanism.

## B — Scheduled CI

Run security/dependency checks on a schedule in addition to PRs.

## C — Concurrency

Prevent obsolete CI runs for the same branch/PR from wasting resources.

## D — Caching

Use appropriate GitHub Actions caching for dependencies and/or Docker layers.

## E — SBOM

Generate a Software Bill of Materials for the application/container.

## F — Automatic release

Generate a release from a version tag and publish the matching container automatically.

## G — Deployment simulation

Create a workflow that verifies that the published image can be pulled and started successfully.

## H — Health monitoring

Add:

```http
GET /health
```

returning useful service information.

Then make Docker/GitHub Actions verify it.

---

# Final demonstration

Each team must be able to demonstrate the complete chain.

### GitHub

- Issue templates
- Issues
- Labels
- Branches
- Meaningful commits
- Pull Requests
- Reviews
- Branch protection

### Application

- Features
- Error handling
- Tests
- Lint
- Configuration

### GitHub Actions

- CI
- Matrix testing
- Docker build
- Security scan
- Image publishing

### Docker

- Dockerfile
- Multi-stage build
- Non-root execution
- Health check
- Compose
- Published image

### Delivery

- Version/tag
- GitHub Release
- Traceability from image → commit

---
