# Backend

Express API with PostgreSQL (Sequelize) and Redis (ioredis). Node 24 and Yarn 4.9.4 are used in CI and the container image.

## Local setup

Run `yarn install --immutable` in this directory. Copy `local.env.example` to `local.env` for a new checkout, then configure your local credentials. Environment variables take precedence over the environment file. `yarn dev-start` starts the API on port 5010 by default.

For the root Compose stack, `backend/local.env` is the shared configuration source. Review `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` and `REDIS_DB` there. Start your own Redis service from the repository root:

```sh
docker compose --env-file backend/local.env up -d redis
```

Compose needs `--env-file` to resolve `${...}` values; the service-level `env_file` only supplies variables inside the backend container. Shell variables take precedence over the file.

Redis uses `REDIS_PORT` for its listening port, localhost port mapping and health check, and `REDIS_PASSWORD` for authentication. The local setting is 6380 to avoid the existing Redis on 6379. The backend uses `REDIS_HOST=localhost` when run locally; Compose overrides only its hostname to `redis` so it reaches this stack's own service. `REDIS_DB` selects the logical database in the backend connection. Redis data persists in this Compose project's `redisdata` volume.

To run the backend, PostgreSQL and Redis together, use `docker compose --env-file backend/local.env up --build -d`. Run the client separately from `client/`. Existing database volumes are preserved; credentials must match the existing volume. No schema migration runs automatically.

## Health and lifecycle

- `GET /health/live`: HTTP process liveness; independent of external services.
- `GET /health/ready` and `GET /health`: PostgreSQL authentication and Redis PING, checked concurrently with a 1.5-second response deadline. Returns 200 when ready and 503 on failures or shutdown. Responses expose dependency status without connection details.
- Set `REDIS_CACHE_ENABLED=false` to explicitly disable caching and its readiness requirement.
- `GET /`: Redis-backed greeting with configured TTL; returns 503 if caching is enabled but unavailable.

Probes bypass request rate limiting. Kubernetes uses separate startup, liveness and readiness probes. Startup fails if required connections cannot be established. SIGTERM/SIGINT stop accepting requests, drain HTTP work, and close database/Redis connections.

SMTP is used during email delivery; it is not part of readiness, so a mail provider outage does not remove all API replicas from service. Email send failures are awaited and propagated.

Schema changes use explicit versioned migrations; application startup never calls `db.sync()`. See the database and authentication sections in [the setup guide](../setup.readme.md) for schema conventions and API contracts.

## Database and user setup

From `backend/`, run `yarn db:migrate` before starting the API. This creates or adopts the existing users table, normalizes emails, enforces unique emails, and creates the session, password-reset token and pending-signup tables. Existing duplicate emails must be reconciled manually; a failed migration rolls back without deleting accounts. The runner tracks applied versions and serializes concurrent migration runs.

To prepare optional development signup data, configure `SEED_USER_NAME`, `SEED_USER_EMAIL` and `SEED_USER_PASSWORD` in `local.env`, then run `yarn db:seed`. This creates only a pending request, never a user. Request an approval email through the resend endpoint and approve it before logging in. Re-running the seeder preserves existing data; production seeding is blocked.

`yarn db:migrate:undo` rolls back the latest migration and can remove data. Production containers run migrations explicitly using `node build/database/migrate.js up`, before the new version is started.

## Authentication

**Account-creation invariant:** `POST /auth/register` returns a generic 202 response. An eligible new signup is stored as a pending request and its approval email is attempted. This response does not confirm account existence or delivery. There is no user ID, user row, session or access token at this stage. The pending request stores only a password hash, hashed approval token, signup details and a 24-hour expiry. Confirming a valid link via `POST /auth/verify-email` creates a verified, non-admin user and consumes the pending request in one transaction. Expired, invalid, superseded and reused links cannot create accounts. Concurrent approval requests create one user at most.

New, existing and already-pending email addresses receive the same generic 202 registration response. Active pending credentials cannot be overwritten by another signup attempt. Resend replaces the token without changing credentials. An expired pending request can be replaced by a fresh registration. Password recovery applies only after approval has created the user.

Migration `003-pending-signups` moves legacy unverified user rows into pending requests, preserving their IDs, password hashes and existing approval links; approved users are preserved. Associated unusable sessions are revoked by cascading deletion of the old unverified user rows. Rollback refuses to drop a non-empty pending-signup table rather than discard credentials or recreate unapproved users.

`/api/v1/auth` supports register, verify-email, resend-verification, login, refresh, logout, logout-all, forgot-password and reset-password. `/api/v1/users/signup` remains a registration alias. Authenticated users can GET/PATCH `/api/v1/users/me`; only name is editable through the profile endpoint.

Use Bearer access tokens from login/refresh and send credentials for the HttpOnly refresh cookie. Public profile responses never expose password hashes or token records. Refresh rotation invalidates the old token; reuse revokes the session. Clients must serialize refresh requests. Logout and password reset revoke stored sessions, including their access tokens.

`LOGIN_TOKEN_TTL` defaults to 15m and `REFRESH_TOKEN_TTL_DAYS` defaults to 7. Production cookies require HTTPS. `AUTH_COOKIE_SAME_SITE` defaults to strict. Browser origins must match `CLIENT_URL` or `ALLOWED_ORIGINS`.

Verification links open `${CLIENT_URL}/verify?token=...`; password reset links open `${CLIENT_URL}/reset-password?token=...`. The connected client pages submit these tokens to the corresponding POST endpoints. Configure SMTP to deliver these emails. Local inboxes may set `SMTP_AUTH_ENABLED=false`; use `SMTP_SECURE`/`SMTP_REQUIRE_TLS` for transport security. Delivery failures are logged internally and preserve only the pending request for resend. The public response remains generic and never creates a user.

## Farm workspaces (Phase 4)

Apply `yarn db:migrate` to create `farms` and `farm_members` (migration 004). Farm creation and the creator's Owner membership commit atomically. All endpoints require a valid Bearer session:

| Method | Path                            | Access                             |
| ------ | ------------------------------- | ---------------------------------- |
| GET    | `/api/v1/farms?page=1&limit=20` | Farms where the caller is a member |
| POST   | `/api/v1/farms`                 | Creates a farm owned by the caller |
| GET    | `/api/v1/farms/:farmId`         | Members of that farm               |
| PATCH  | `/api/v1/farms/:farmId`         | Farm owner                         |
| DELETE | `/api/v1/farms/:farmId`         | Farm owner; returns 204            |

Create accepts `name`, `country`, `location`, `type`, optional `description`, and optional `houses` (up to 50 unique house names). PATCH accepts a non-empty subset of the same fields. Unknown fields, ownership changes and role changes are rejected. Names/country are limited to 100 characters, location to 200, type to 50, description to 2000, and each house name to 100. Owner/user IDs and membership records are omitted from public farm responses; the caller's role is returned for UI controls.

Reads are scoped through the authenticated user's membership, and writes additionally require ownership. Missing and inaccessible farm IDs both return the same safe 404. Memberships have unique farm/user pairs, foreign keys and cascading removal when the farm is deleted. The list is paginated with a maximum page size of 100. Team invitation/membership administration remains in Phase 5; house entities remain in Phase 6.

`tests/farms.test.cjs` covers CRUD, pagination, rejected ownership injection, invalid payloads, read-only membership, cross-tenant denial, foreign keys, cascading deletion and rollback after membership creation failure. `client/e2e/farms.spec.ts` covers the full UI flow against PostgreSQL. These new integration/browser scenarios still require execution with the isolated test stack; test-service startup was declined during implementation. The development farm migration, read-only farm-list/member-scoped lookup queries, TypeScript checks, HTTP unit tests and client tests/build have passed.

## Error handling

Keep responses simple. Every controller uses an explicit `try/catch` block and forwards errors with `return next(error)`. The shared handler logs diagnostic details on the server and returns only `{ message }` to the client. Unexpected failures return HTTP 500 with:

```json
{ "message": "Internal server error" }
```

Validation returns one useful message. Error codes, references, stack traces, SQL and provider details are never sent to clients. Internal logs omit credentials, request bodies, query strings and referrers that could contain tokens.

Registration, resend and password recovery keep generic messages to avoid revealing account existence. Signup remains pending until approval. The client shows short public messages and uses `Internal server error` for server failures, without a support reference.

## Tests

From the repository root:

```sh
docker compose -p rp-backend-tests -f docker-compose.test.yml up -d --wait
cd backend
yarn check
yarn test:all
cd ..
docker compose -p rp-backend-tests -f docker-compose.test.yml down
```

`yarn test` runs HTTP contract and failure tests with injected dependencies. `yarn test:e2e` uses real PostgreSQL and password-protected Redis, testing HTTP readiness, cache miss/hit/expiry, disconnected dependency responses, Redis reconnection, process startup and SIGTERM shutdown. Database tests also cover apply/rollback, atomic failure on duplicate legacy data, foreign keys, and repeatable development seeding. Authentication tests follow registration → verification email → login → profile → refresh → logout → password reset through real HTTP, PostgreSQL and a local SMTP capture server. Both commands compile before testing and use Node's built-in test runner. No additional test dependency is needed.

Test services use disposable storage and dedicated localhost ports 15432 and 16379. The tests never load developer environment files or credentials. Override `TEST_POSTGRES_HOST`, `TEST_POSTGRES_PORT`, `TEST_REDIS_HOST`, or `TEST_REDIS_PORT` if needed. The process lifecycle test additionally binds localhost port 15019. Always stop the test stack after running tests, including after a failure.

CI runs lint, type checking, unit and integration tests against isolated service containers before scans and publishing. The client also provides `yarn test:e2e`, which tests the built Nitro client and this backend together through the browser; see `client/README.md`.

## Deployment follow-up

Authentication, farm profiles, team invitations and operational modules are connected to the client. Only owners administer the farm/team; managers and workers use configurable operational grants. Migration 005 adds these tables and has been applied locally. Apply migrations explicitly in each deployment and use deployment secrets for credentials.

Operational integration tests cover invitation acceptance/replay/expiry/revocation, owner-only farm changes, custom permissions, tenant isolation, flock populations, audited record corrections, feed schedules, vaccination history, assigned tasks and reports. See `../setup.readme.md` for implemented scope and remaining work.

## Weekly daily records

`GET /api/v1/farms/:farmId/records/weekly?flockId=<uuid>&week=1` returns seven daily rows and totals, requiring `records.read`. Week is optional and defaults to the current arrival-based week. Weeks start on flock arrival, rather than calendar Monday or the birds' biological age. Missing entries remain null. Totals use recorded daily feed/eggs and historical mortality. Dashboard responses include current weekly summaries per active flock/house; raw notes remain restricted to daily-record readers. No migration is needed.

### Rate limits and trusted proxies

Workspace and session traffic uses broad flood protection (3,000 requests per
minute per IP by default). Sensitive account actions each have a separate
30-request / 15-minute budget; login counts failed requests only. Registration
and the legacy signup alias share a budget. Configure actual ingress IPs or CIDRs
in `TRUSTED_PROXIES` so a proxy is not mistaken for every visitor; do not trust
arbitrary forwarded headers. Environment overrides control the thresholds.

Counters currently live in each backend process. Multiple replicas need a shared
limiter store or equivalent gateway enforcement for consistent budgets. Tune
thresholds against observed traffic and load tests; defaults are not capacity guarantees.

### Historical Excel imports

Owners can import daily flock history at **Import History** (`/imports`). Other
members need the explicit `records.import` grant in Settings; neither Worker nor
Manager defaults include it. The server checks this grant again when saving.

The client reads `.xlsx` files up to 5 MB in a worker. It supports the RICHPONG
weekly layout (`WEEK 1`, `WEEK 2`, etc.) and combines daily rows across sheets.
Feed values such as `4.3kg` are converted to kilograms. Empty rows, summary totals
and days without mortality/feed/egg values are excluded. Missing numeric values
are never assumed to be zero; `xxxx` text placeholders are cleared. Spreadsheet
formulas are not executed; only their cached results are read.

Users select an existing flock, including a closed flock, and review/edit each
selected row. Dates are read as saved, with day/month/year text supported. To fix
Excel day/month swaps, users can explicitly apply weekly dates from a confirmed
Week 1 start date. Original dates and workbook bird counts are preserved in notes.
The system's population remains based on the flock's initial birds and mortality.
Medication/activity text remains daily record text; it does not mark scheduled
vaccinations or tasks complete.

`POST /api/v1/farms/:farmId/imports/preview` checks normalized rows without saving.
`POST .../imports/commit` rechecks access and conflicts inside one transaction,
locks the farm and flock, skips identical saved records, rejects conflicting or
repeated dates, and audits the inserted record IDs and worksheet row references.
Neither route overwrites existing records. Batches are limited to 2,000 rows and
2 MB of JSON. No source workbook is retained by the server. Import history tests
run against the disposable database as part of `yarn test:e2e`.
