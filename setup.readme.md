# RP Ranch — Farm Management System

A simple, scalable, multi-tenant farm management platform built to help farmers manage poultry operations, track production, monitor flock health, and coordinate farm workers.

**Our first customer is RP Ranch.**

We will build the software around real farm operations, validate it using our own farm records, and gradually make it available to other farmers.

## 1. Project Vision

Build a farm management system that replaces manual spreadsheets and paper records with a centralized digital platform.

Farm owners should be able to:

- Create and manage multiple farms.
- Register poultry houses and flocks.
- Track bird populations and mortality.
- Record daily feed consumption and egg production.
- Manage feeding and vaccination schedules.
- Track farm activities and treatments.
- Invite team members and assign permissions.
- Monitor farm performance through dashboards.
- Export farm records and reports.

### Core Principle

**Keep it simple. Build what farmers actually need.**

The system should be easy enough for a farm worker to record daily activities from a mobile phone in less than one minute.

---

## 2. Technology Stack

### Backend

- Node.js
- TypeScript
- Express.js
- PostgreSQL
- Sequelize ORM
- REST API
- JWT-based authentication with refresh-token rotation
- express-validator for request validation
- Redis for caching and dependency health checks

### Frontend

- React
- TypeScript
- TanStack Start
- Vite
- Tailwind CSS
- shadcn/ui
- TanStack Query
- React Hook Form
- Recharts

### Infrastructure

- Docker
- GitHub Actions
- AWS or another suitable hosting provider
- PostgreSQL database
- Object storage when required
- HTTPS
- Environment-based configuration

### Development Principles

- Modular architecture
- Separation of concerns
- API-first development
- Multi-tenant data isolation
- Role-based access control (RBAC)
- Database migrations
- Automated testing
- Secure configuration management
- Continuous integration and deployment
- Logging and monitoring

---

## 3. Project Structure

```text
RP Ranch/
├── client/                         # Frontend Git submodule (TanStack Start)
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── routes/
│   │   ├── test/
│   │   └── types/
│   ├── e2e/                        # Real-browser authentication, farm and team/task tests
│   ├── .env.development            # Local API target and client port
│   ├── env.example                 # Public environment configuration template
│   ├── playwright.config.ts
│   ├── vite.config.ts              # Environment-driven dev/preview/Nitro API proxy
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── config/                 # Environment, PostgreSQL and Redis connections
│   │   ├── controllers/            # Authentication, farm, team and operational HTTP handlers
│   │   ├── database/               # Transactional migration runner
│   │   ├── middleware/             # Authentication and browser origin checks
│   │   ├── migrations/             # Versioned schema changes (up/down)
│   │   ├── models/                 # Sequelize classes with Model.init schemas
│   │   ├── routes/                 # API routers and authentication rate limits
│   │   ├── seeders/                # Opt-in pending-signup data
│   │   ├── services/               # Farm access, operational logic, reports and email templates
│   │   ├── utils/                  # Passwords, tokens, email, errors and logging
│   │   ├── validations/            # express-validator request rules
│   │   ├── app.ts                  # Express middleware and route setup
│   │   └── index.ts                # Startup, model registration and shutdown
│   ├── tests/
│   │   ├── setup.cjs               # Isolated test configuration and HTTP helper
│   │   ├── unit.test.cjs           # HTTP contracts and dependency failure checks
│   │   ├── database.test.cjs       # Migrations, rollback, constraints and seeders
│   │   ├── auth.test.cjs           # HTTP → PostgreSQL → test SMTP user flow
│   │   ├── farms.test.cjs          # Farm CRUD, membership and tenant isolation
│   │   ├── operations.test.cjs      # Invitations, permissions and operational persistence
│   │   ├── reports.test.cjs         # Report calculations and safe CSV output
│   │   └── e2e.test.cjs            # Redis, PostgreSQL, readiness and process lifecycle
│   ├── local.env                   # Shared local backend/Compose configuration
│   ├── local.env.example           # Credential-free configuration template
│   ├── Dockerfile.backend
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── database/                       # PostgreSQL image and initialization files
├── redis/                          # Redis image and configuration files
├── k8s/                            # Kubernetes bases, overlays and Argo CD
├── .github/workflows/              # Backend and frontend CI/CD
├── docker-compose.yml              # Local application services
├── docker-compose.test.yml         # Disposable PostgreSQL and Redis test services
├── .gitmodules
├── architecture.md
├── README.MD
└── setup.readme.md
```

The backend is a modular monolith. Keep the existing controller, route, validation and model layout. Define schemas using `class ... extends Model` and `Model.init(...)`, use arrow functions for handlers/helpers, and keep comments and spacing readable. Database migrations mirror the model columns and constraints; schema changes never run implicitly at application startup.

---

## 4. Core Application Modules

### 4.1 Authentication & User Management

Responsibilities:

- User registration
- Login and logout
- Email verification
- Password reset
- Secure session management
- User profile management

### 4.2 Farm Management

Responsibilities:

- Create farms
- Update farm information
- Manage multiple farms
- Register poultry houses
- Assign users to farms
- Switch between authorized farms

### 4.3 Team & Permissions

Initial roles:

| Role    | Permissions                                            |
| ------- | ------------------------------------------------------ |
| Owner   | Full farm administration                               |
| Manager | Manage operations, flocks, schedules, and reports      |
| Worker  | Record daily activities and access assigned operations |

Permissions must be enforced on the backend, not only in the frontend.

### 4.4 Supplier Management

Responsibilities:

- Register bird suppliers and hatcheries
- Store supplier contact details
- Associate suppliers with flocks
- Track the source of purchased birds

### 4.5 Flock Management

Responsibilities:

- Register new flocks
- Assign flocks to poultry houses
- Record breed and bird type
- Record initial bird population
- Track flock age
- Track current bird population
- Track mortality
- Manage flock status

Initial flock types:

- Layers
- Broilers
- Other poultry

### 4.6 Daily Farm Records

The primary operational module.

Daily record fields:

- Farm
- Flock
- Date
- Mortality count
- Mortality cause
- Feed consumed (kg)
- Eggs collected
- Medication or treatment
- Activities performed
- Notes
- Recorded by

The system should automatically calculate:

- Current bird population
- Total mortality
- Mortality percentage
- Total feed consumption
- Total egg production
- Egg production rate

Daily records must support controlled corrections with an audit trail.

### 4.7 Feed Management

Responsibilities:

- Create feeding schedules
- Assign feeding schedules to flocks
- Record daily feed consumption
- Monitor feed usage
- Track feed history
- Calculate average feed consumption

### 4.8 Health & Vaccination

Responsibilities:

- Create vaccination schedule templates
- Assign schedules to flocks
- Calculate vaccination due dates
- Record administered vaccines
- Track medication and treatments
- Identify overdue activities
- Maintain health history

Schedules must be editable to reflect veterinary and hatchery recommendations.

### 4.9 Farm Activities

Responsibilities:

- Record cleaning activities
- Record disinfection
- Record maintenance
- Track operational tasks
- Assign responsibilities
- Maintain activity history

### 4.10 Dashboard & Reporting

Dashboard metrics:

- Total active birds
- Current flock population
- Total mortality
- Eggs collected today
- Feed consumed today
- Upcoming vaccinations
- Recent activities

Reports:

- Mortality report
- Feed consumption report
- Egg production report
- Flock performance report
- Daily activity report

Export formats:

- CSV
- Excel

---

## 5. Core Database Models

Initial entities:

```text
PendingSignup
User
Session
UserToken
Farm
FarmMember
FarmInvitation
House
Supplier
Flock
DailyRecord
FeedSchedule
VaccinationSchedule
VaccinationRecord
FarmActivity
AuditLog
```

### Key Relationships

```text
User
 └── FarmMember
       └── Farm
            ├── House
            │    └── Flock
            │         ├── DailyRecord
            │         ├── FeedSchedule
            │         ├── VaccinationSchedule
            │         └── VaccinationRecord
            │
            ├── Supplier
            ├── FarmActivity
            └── FarmInvitation
```

Each tenant's operational data must be scoped to the appropriate farm or organization.

Database constraints, foreign keys, indexes, and transactions must be used to maintain data integrity.

---

# 6. Implementation Roadmap

We will implement the system incrementally.

Each phase must be completed, tested, and validated before moving to the next phase.

## Phase 1 — Project Foundation

**Goal:** Establish a reliable development environment.

Tasks:

- [x] Review existing backend starter structure.
- [x] Review frontend Git submodule.
- [x] Configure TypeScript and development scripts.
- [x] Configure environment variables.
- [x] Configure ESLint and Prettier.
- [x] Configure application logging.
- [x] Configure centralized error handling.
- [x] Configure request validation.
- [x] Establish API response conventions.
- [x] Configure development and test environments.
- [x] Add backend health-check endpoint.
- [x] Establish Git branching conventions.
- [x] Configure initial CI checks.

**Deliverable:** Backend and frontend start locally, and the backend exposes a working health-check endpoint.

## Phase 2 — Database Foundation

**Goal:** Establish persistent data storage.

Tasks:

- [x] Configure PostgreSQL.
- [x] Configure Sequelize.
- [x] Establish database connection management.
- [x] Configure migrations.
- [x] Define model conventions.
- [x] Create initial database schema.
- [x] Add foreign-key constraints.
- [x] Create indexes for common queries.
- [x] Configure database seeders.
- [x] Add database integration tests.

**Deliverable:** Database connections and migrations work reliably.

Implemented: `pending_signups`, `users`, `sessions`, `user_tokens`, migration history, case-insensitive unique emails, cascading user foreign keys, lookup/expiry indexes, transactional migrations with deployment locking, and an opt-in pending-signup seeder. Later farm schemas and relationships belong to their respective phases.

```sh
cd backend
yarn db:migrate
# Optional: set SEED_USER_NAME, SEED_USER_EMAIL and SEED_USER_PASSWORD in local.env.
yarn db:seed
```

The migration runner uses `backend/local.env` in local mode and environment variables in deployments. Apply migrations before starting the new application version. In a built container, run `node build/database/migrate.js up` as a deployment job. `yarn db:migrate:undo` rolls back the latest migration and can delete its tables/data; use it only with a deliberate rollback plan. Existing accounts with duplicate emails require manual reconciliation before the unique index can be applied. Migration failure rolls back all changes.

## Phase 3 — Authentication

**Goal:** Secure user access.

Tasks:

- [x] Create User model.
- [x] Implement user registration.
- [x] Implement login.
- [x] Implement secure password hashing.
- [x] Implement access tokens.
- [x] Implement refresh-token rotation.
- [x] Implement logout and session revocation.
- [x] Implement authentication middleware.
- [x] Implement password reset.
- [x] Implement email verification.
- [x] Add rate limiting for sensitive endpoints.
- [x] Add authentication tests.

**Deliverable:** Users can register, authenticate, and securely manage sessions through the backend API.

Implemented: pending signup requests and account creation only after approval; single-use email verification and resend; verified-user login; Bearer access tokens; HttpOnly refresh cookies; refresh-token rotation and reuse revocation; logout and logout-all; single-use password reset with session revocation; protected profile read/update; request validation; browser-origin checks; and authentication rate limiting. Public signup never creates a user. Only approval of a valid email link creates a verified, non-admin user in the same transaction that consumes the pending request. Passwords are bcrypt-hashed without altering the submitted characters.

Email verification links open `${CLIENT_URL}/verify?token=...`; reset links open `${CLIENT_URL}/reset-password?token=...`. The frontend pages must POST these tokens to the API. The authentication pages are now connected in Phase 10. The backend flow is tested using real PostgreSQL and a local SMTP inbox that never sends external email.

**Architecture invariant:** no user record, user ID, session or access token exists before approval. `pending_signups` stores the name, normalized email, bcrypt password hash, hashed approval token and 24-hour expiry. Resend invalidates the earlier token without overwriting the pending credentials; repeated signup requests cannot overwrite an active request. An expired request may be replaced by a fresh signup. Approval consumes the pending request and creates the user atomically; repeated or concurrent approval cannot create duplicate users. Development seeders follow this rule too.

Migration `003-pending-signups` moves earlier unverified users into pending requests while preserving their approval links and password hashes. Existing approved accounts remain intact. Rollback refuses to discard pending signup data or recreate unapproved users. The invariant is also recorded in `backend/AGENTS.md` for future changes.

Access tokens expire after `LOGIN_TOKEN_TTL` (15 minutes by default). `REFRESH_TOKEN_TTL_DAYS` controls the fixed session lifetime (7 days by default). Refresh does not extend that lifetime. Password reset and logout invalidate access through the persisted session check. Reusing an older refresh token revokes its session; clients must serialize refresh calls.

Configure `CLIENT_URL`, `ALLOWED_ORIGINS`, SMTP settings and a strong `JWT_SECRET` before using email delivery. Cookies are HttpOnly, use `AUTH_COOKIE_SAME_SITE` (strict by default), and are Secure in production or with SameSite=None. Serve production over HTTPS. For a local SMTP inbox without authentication, set `SMTP_AUTH_ENABLED=false`; `SMTP_SECURE` and `SMTP_REQUIRE_TLS` configure transport security.

## Phase 4 — Multi-Tenant Farm Management

**Goal:** Allow users to create independent farm workspaces.

Tasks:

- [x] Create Farm model.
- [x] Create FarmMember model.
- [x] Implement farm creation.
- [x] Implement farm profile management.
- [x] Implement farm listing.
- [x] Implement farm selection.
- [x] Implement farm membership checks.
- [x] Enforce tenant isolation in services and queries.
- [x] Add cross-tenant access tests.

Implemented: `Farm` and `FarmMember` schemas with migration `004-create-farms`; authenticated create/list/detail/update/delete APIs; atomic owner membership creation; membership-scoped listing and detail reads; and owner-only updates/deletion. Missing and inaccessible farm IDs use the same safe 404 response. Ownership and role fields cannot be submitted through profile updates. Farm list pagination accepts `page` and `limit` (maximum 100 per page).

The client “My Farms” screen loads real API data and supports create, edit and confirmed deletion. The shared switcher selects only an authorized farm and stores its ID per account in session storage. Selection survives reload and falls back safely when a farm is deleted. Empty accounts are guided to create their first farm. Demo farm profiles are removed, and other local preview modules start empty rather than showing unrelated records.

Phase 4 supports reading farms assigned to an existing member; team invitations, membership administration and extended Manager/Worker write permissions belong to Phase 5. House names are farm profile metadata for now; full house entities belong to Phase 6. No farm profile is seeded automatically.

Validation: the development migration and read-only farm-list/member-scoped lookup queries passed, along with backend/client TypeScript checks, the client production build, 16 client component/API tests and 10 backend HTTP tests. PostgreSQL CRUD/tenant-isolation/rollback tests and a real-browser farm scenario are implemented, but their execution is pending because starting the isolated Docker test services was declined. Phase 4 integration validation must pass before treating the phase as fully validated.

**Deliverable:** Users can create and manage farms without accessing other customers' data.

## Phase 5 — Team Management & RBAC

**Goal:** Enable secure collaboration.

Tasks:

- [ ] Define Owner, Manager, and Worker permissions.
- [ ] Implement role-based authorization middleware.
- [ ] Implement team invitations.
- [ ] Implement invitation acceptance.
- [ ] Implement team member listing.
- [ ] Implement role updates.
- [ ] Implement member removal.
- [ ] Prevent unauthorized role escalation.
- [ ] Record important administrative actions.
- [ ] Add authorization tests.

**Deliverable:** Farm owners can invite workers and control access.

## Phase 6 — Houses, Suppliers & Flocks

**Goal:** Register the farm's poultry operations.

Tasks:

- [ ] Create House model.
- [ ] Create Supplier model.
- [ ] Create Flock model.
- [ ] Implement poultry house management.
- [ ] Implement supplier management.
- [ ] Implement flock registration.
- [ ] Assign flocks to houses.
- [ ] Associate flocks with suppliers.
- [ ] Calculate flock age.
- [ ] Implement flock status management.
- [ ] Implement flock listing and details.
- [ ] Add validation and tests.

**Deliverable:** RP Ranch can register its poultry houses, suppliers, and bird batches.

## Phase 7 — Daily Farm Records

**Goal:** Digitize the existing farm spreadsheet.

Tasks:

- [ ] Create DailyRecord model.
- [ ] Implement daily record creation.
- [ ] Implement daily record listing.
- [ ] Implement controlled record editing.
- [ ] Implement mortality tracking.
- [ ] Implement feed consumption tracking.
- [ ] Implement egg production tracking.
- [ ] Implement activity and treatment notes.
- [ ] Calculate current bird population.
- [ ] Calculate mortality rate.
- [ ] Calculate egg production rate.
- [ ] Prevent invalid and duplicate entries.
- [ ] Add audit history for corrections.
- [ ] Add automated tests.

**Deliverable:** Workers can submit daily records, and the system automatically updates flock statistics.

## Phase 8 — Feed & Vaccination Schedules

**Goal:** Manage routine poultry care.

Tasks:

- [ ] Create feed schedule templates.
- [ ] Create vaccination schedule templates.
- [ ] Assign schedules to flocks.
- [ ] Calculate due dates using flock age.
- [ ] Implement treatment completion records.
- [ ] Display upcoming vaccinations.
- [ ] Display overdue vaccinations.
- [ ] Implement schedule editing.
- [ ] Implement vaccination history.
- [ ] Add schedule calculation tests.

**Deliverable:** Farm managers can monitor feeding and vaccination activities.

## Phase 9 — Dashboard & Reports

**Goal:** Provide operational visibility.

Tasks:

- [ ] Implement dashboard summary endpoints.
- [ ] Calculate farm-level statistics.
- [ ] Calculate flock-level statistics.
- [ ] Implement mortality trends.
- [ ] Implement egg production trends.
- [ ] Implement feed consumption trends.
- [ ] Implement date-range filtering.
- [ ] Implement CSV export.
- [ ] Implement Excel export.
- [ ] Validate reporting calculations.

**Deliverable:** Farm owners can understand farm performance without manually calculating spreadsheet values.

## Phase 10 — Frontend Integration

**Goal:** Connect the Lovable-designed frontend to the backend.

Tasks:

- [x] Establish typed API client.
- [x] Configure TanStack Query.
- [x] Connect authentication pages.
- [x] Connect farm onboarding.
- [x] Connect farm selection.
- [ ] Connect team management.
- [ ] Connect supplier and flock management.
- [ ] Connect daily record forms.
- [ ] Connect feeding and vaccination schedules.
- [ ] Connect dashboard metrics.
- [ ] Connect reports.
- [x] Implement loading and error states.
- [ ] Implement permission-aware navigation.
- [ ] Test mobile responsiveness.

Authentication and farm profile integration are implemented. API calls use relative `/api/v1` URLs through a shared client. `client/.env.development` sets the backend origin and port; Vite loads per-mode environment settings for development, preview and the standalone Nitro production proxy. The current local client URL is `http://localhost:3000` and the default backend origin is `http://localhost:5009`. Override `VITE_API_URL` and `VITE_PORT` with `client/.env.local`; production builds require an explicit `VITE_API_URL`. Keep backend `CLIENT_URL` and allowed origins aligned.

Connected screens cover signup, verification/resend, login, password recovery, profile updates and logout/all-session revocation. Protected pages restore the HttpOnly-cookie session after reload. Access tokens stay in memory; refreshes are serialized within the provider and across tabs using Web Locks where available. Farm profiles and selection are connected to the API. Other operational records remain local previews until their backend phases are implemented.

`client/e2e/auth.spec.ts` tests the built Nitro client, real backend, PostgreSQL, Redis and a local SMTP inbox together. Start the isolated test services, then run `yarn test:e2e` from `client/` after installing Chromium with `yarn playwright install chromium`. An existing Chrome installation can use `PLAYWRIGHT_CHANNEL=chrome`. Client and backend changes must both be committed before parent CI can run the full submodule flow.

**Deliverable:** A fully functional farm management application once the remaining farm modules are connected.

## Phase 11 — Import RP Ranch Data

**Goal:** Make RP Ranch the first real customer.

Tasks:

- [ ] Review existing Excel farm records.
- [ ] Map spreadsheet columns to database fields.
- [ ] Normalize dates and measurement units.
- [ ] Validate mortality and population totals.
- [ ] Import existing flock information.
- [ ] Import daily farm records.
- [ ] Import feeding schedules.
- [ ] Import vaccination schedules.
- [ ] Generate an import validation report.
- [ ] Compare imported totals with source records.
- [ ] Obtain farm owner approval of imported data.

**Deliverable:** RP Ranch's existing operational records are available in the system.

## Phase 12 — Security & Quality Assurance

**Goal:** Prepare the application for real-world usage.

Tasks:

- [ ] Review authentication security.
- [ ] Verify tenant isolation.
- [ ] Verify role permissions.
- [ ] Implement secure HTTP headers.
- [ ] Configure CORS.
- [ ] Implement request rate limiting.
- [ ] Validate all user inputs.
- [ ] Protect sensitive information.
- [ ] Review dependency vulnerabilities.
- [ ] Implement audit logging.
- [ ] Add unit tests.
- [ ] Add integration tests.
- [ ] Add end-to-end tests.
- [ ] Test database backup and restoration.
- [ ] Test critical workflows on mobile devices.

**Deliverable:** A tested application with appropriate security controls.

## Phase 13 — Deployment

**Goal:** Deploy RP Ranch to a production environment.

Tasks:

- [ ] Create production Docker configuration.
- [ ] Configure production environment variables.
- [ ] Provision managed PostgreSQL or equivalent.
- [ ] Configure HTTPS.
- [ ] Configure deployment pipeline.
- [ ] Run database migrations during deployment.
- [ ] Configure health checks.
- [ ] Configure application monitoring.
- [ ] Configure centralized logs.
- [ ] Configure automated database backups.
- [ ] Establish rollback procedures.
- [ ] Test production deployment.
- [ ] Document operational procedures.

**Deliverable:** RP Ranch is securely deployed and accessible online.

## Phase 14 — Pilot Launch

**Goal:** Validate the system using real farm operations.

Tasks:

- [ ] Register RP Ranch as the first customer.
- [ ] Configure the farm profile.
- [ ] Register active flocks.
- [ ] Invite farm workers.
- [ ] Train workers on daily record entry.
- [ ] Record daily operations.
- [ ] Validate dashboard calculations.
- [ ] Monitor application errors.
- [ ] Collect worker feedback.
- [ ] Fix usability issues.
- [ ] Confirm the system can replace the daily spreadsheet.

**Deliverable:** RP Ranch uses the platform for its daily farm operations.

---

## 7. API Design Standards

Use RESTful endpoints under:

`/api/v1`

Implemented authentication/user endpoints and planned farm endpoints:

```text
POST   /api/v1/auth/register
POST   /api/v1/users/signup              # Existing registration alias
POST   /api/v1/auth/verify-email
POST   /api/v1/auth/resend-verification
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/logout-all
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
GET    /api/v1/users/me
PATCH  /api/v1/users/me

GET    /api/v1/farms
POST   /api/v1/farms
GET    /api/v1/farms/:farmId
PATCH  /api/v1/farms/:farmId
DELETE /api/v1/farms/:farmId

GET    /api/v1/farms/:farmId/members
POST   /api/v1/farms/:farmId/invitations

GET    /api/v1/farms/:farmId/houses
POST   /api/v1/farms/:farmId/houses

GET    /api/v1/farms/:farmId/suppliers
POST   /api/v1/farms/:farmId/suppliers

GET    /api/v1/farms/:farmId/flocks
POST   /api/v1/farms/:farmId/flocks
GET    /api/v1/farms/:farmId/flocks/:flockId

GET    /api/v1/farms/:farmId/daily-records
POST   /api/v1/farms/:farmId/daily-records

GET    /api/v1/farms/:farmId/feed-schedules
GET    /api/v1/farms/:farmId/vaccinations

GET    /api/v1/farms/:farmId/dashboard
GET    /api/v1/farms/:farmId/reports
```

Registration accepts `{ name, email, password }`; login accepts `{ email, password }`. Email requests accept `{ email }`; verification accepts `{ token }`; password reset accepts `{ token, password }`. Profile updates accept `{ name }` only. Passwords require 12 characters, uppercase, lowercase, a number and a symbol, with a maximum of 72 UTF-8 bytes. Login returns `data.accessToken` and `data.user`; authenticated requests use `Authorization: Bearer <accessToken>`. Refresh and logout read the HttpOnly cookie, so browser requests must include credentials. Tokens and password hashes are never returned in public user objects.

Unknown-account password-reset and resend requests return generic success messages. If approval delivery fails, only a pending signup remains and the failure is logged internally; the public response remains generic and no user exists. Successful registration returns 202 with an email address only. Invalid/expired email links return a safe 400 message, invalid credentials/sessions return a generic 401, disallowed requests return a generic 403, registration remains 202 for existing and pending addresses, and rate limiting returns 429 with a retry hint.

API errors stay simple: return only `{ message }`. Unexpected failures return HTTP 500 with `{ "message": "Internal server error" }`. Every controller uses an explicit `try/catch` and forwards caught failures with `return next(error)` to the shared logging/error handler. Error codes, references, stack traces, SQL and provider details remain server-side; clients display a short message only. Validation returns one useful message without echoing submitted values.

Registration, resend and password recovery do not reveal account existence through distinct public statuses/messages. Registration acceptance does not guarantee mail delivery; delivery failures remain in server logs and pending requests can be retried. See `backend/README.md` for the complete error contract and OWASP/RFC references.

All protected endpoints must validate authentication, farm membership, and the required permissions.

API responses must use consistent error handling, appropriate HTTP status codes, pagination where needed, and validated request payloads.

---

## 8. Development Workflow

Use a consistent workflow for every feature.

1. Define the feature requirements and acceptance criteria.
2. Design the database changes.
3. Create and test migrations.
4. Implement request validation.
5. Implement repository and service logic.
6. Implement controller and API routes.
7. Add authentication and authorization.
8. Write automated tests.
9. Run backend checks and end-to-end tests against isolated services:

   ```sh
   docker compose -p rp-backend-tests -f docker-compose.test.yml up -d --wait
   cd backend
   yarn check
   yarn test:all
   cd ..
   docker compose -p rp-backend-tests -f docker-compose.test.yml down
   ```

   Tests use ports 15432 (PostgreSQL) and 16379 (Redis), and dynamically allocated local HTTP/SMTP ports. The lifecycle test uses port 15019. Database migration tests create/drop their own temporary database using the isolated test role; never point these tests at a shared or production database.

10. Connect the frontend.
11. Test the complete user workflow.
12. Review and merge the changes.
13. Deploy through the CI/CD pipeline.

### Git Branching

```text
main
  └── staging
       ├── feature/authentication
       ├── feature/farm-management
       ├── feature/flock-management
       ├── feature/daily-records
       └── feature/vaccination
```

Use pull requests, code reviews, and automated checks before merging into protected branches.

The frontend submodule maintains its own repository history. Changes must be committed in the frontend repository before updating the parent repository's submodule reference.

---

## 9. Definition of Done

A feature is considered complete when:

- [ ] Requirements and acceptance criteria are satisfied.
- [ ] Database changes use migrations.
- [ ] Input validation is implemented.
- [ ] Authentication and authorization are enforced.
- [ ] Tenant isolation is verified.
- [ ] Business logic is covered by appropriate tests.
- [ ] API endpoints follow established conventions.
- [ ] Frontend handles loading, success, and error states.
- [ ] Relevant documentation is updated.
- [ ] CI checks pass.
- [ ] The feature is reviewed and tested.

---

## 10. MVP Scope

The first release must include:

- User registration and login
- Farm creation and management
- Team invitations and roles
- Poultry house management
- Supplier management
- Flock registration
- Daily farm records
- Mortality tracking
- Feed consumption tracking
- Egg production tracking
- Feeding schedules
- Vaccination schedules
- Farm dashboard
- Basic reporting
- Excel/CSV export

### Out of Scope for MVP

The following features are intentionally deferred:

- Payment subscriptions
- Advanced financial accounting
- Feed inventory purchasing
- Egg sales and invoicing
- AI predictions
- IoT sensor integrations
- Automated WhatsApp notifications
- Marketplace functionality
- Advanced livestock management
- Native mobile applications

These may be considered after the poultry management system is operational and validated.

---

## 11. Future Roadmap

After the MVP is stable, the platform may expand into:

**Livestock Management:** Goats, cattle, sheep, and other farm animals.

**Inventory Management:** Feed stock, medications, equipment, and supplies.

**Sales Management:** Egg sales, customer records, orders, and invoices.

**Financial Management:** Expenses, revenue, profitability, and cost per flock.

**Notifications:** Vaccination reminders, low-stock alerts, and operational reminders.

**Advanced Analytics:** Feed conversion, production forecasting, and historical performance comparisons.

**SaaS Commercialization:** Subscription plans, customer onboarding, billing, and usage limits.

---

## 12. Success Criteria

The MVP will be successful when:

- RP Ranch can register and manage its active flocks.
- Farm workers can submit daily records from their phones.
- Farm owners can see accurate bird counts, mortality, feed consumption, and egg production.
- Vaccination schedules can be monitored.
- Team permissions are enforced correctly.
- Existing spreadsheet records can be imported and validated.
- Farmers can export their records.
- Multiple independent customers can use the platform without accessing each other's data.
- The application is reliable enough to support daily farm operations.

---

## 13. Implementation Status

| Phase                            | Status                                                                  |
| -------------------------------- | ----------------------------------------------------------------------- |
| 1. Project Foundation            | Implemented; local checks pass                                          |
| 2. Database Foundation           | Implemented; integration tests pass                                     |
| 3. Authentication                | Backend and client authentication implemented and tested                |
| 4. Multi-Tenant Farm Management  | Implemented; integration tests pass                             |
| 5. Team Management & RBAC        | Implemented; owner administration, invitations and custom permissions                                                             |
| 6. Houses, Suppliers & Flocks    | Flocks implemented; houses and suppliers remain profile metadata                                                             |
| 7. Daily Farm Records            | Implemented; audited corrections and population validation                                                             |
| 8. Feed & Vaccination Schedules  | Farm schedules and vaccination completion history implemented                                                             |
| 9. Dashboard & Reports           | Live dashboard, date/flock reports and CSV export implemented                                                             |
| 10. Frontend Integration         | Authentication, farms, team and operational modules connected |
| 11. RP Ranch Data Import         | Not started                                                             |
| 12. Security & Quality Assurance | Not started                                                             |
| 13. Deployment                   | Not started                                                             |
| 14. Pilot Launch                 | Not started                                                             |

_Update this table as each phase is completed._

---

## 14. Project Direction

We will not attempt to build everything at once.

We will build one module at a time, validate its functionality, and move to the next module only when the previous implementation meets our quality standards.

**Our first operational milestone:**

A farm worker logs in, selects a flock, records daily mortality, feed consumption, egg production, and farm activities, and saves the record.

The farm owner immediately sees the updated information on the dashboard.

**Build for RP Ranch first. Design for every farmer from day one.**

## Operational workspace

Migration `005-team-and-operations` adds farm-scoped flocks, daily records, feed stages, vaccination schedules and completion history, tasks, invitations and audit logs. Run `yarn db:migrate` from `backend` before starting the updated application.

Only the farm owner can edit/delete the farm or administer membership. Managers and workers receive role defaults which the owner can customize in **Team & Permissions**. Explicitly empty permissions grant no operational access. Write and completion permissions include the reads needed by their screens. Every API mutation checks membership and permission again; hiding a button is not the security boundary.

Invitations expire after seven days, can be resent or revoked, and grant access only when the invited email accepts using an approved account. Invitations never create users or bypass email approval. SMTP must be configured for delivery. Removing membership ends access immediately.

Flocks can be closed and reopened; historical records are retained. Daily records are unique per flock/date, cannot predate arrival, and cannot reduce population below zero. Corrections require separate permission and a reason, and store before/after audit history. Farm-level feed stages cannot overlap. Vaccination completion preserves the vaccine name/day even if the schedule is later changed. Workers can complete their assigned tasks; managing or reopening tasks requires task write permission.

Dashboard and reports read persisted records. Reports support date/flock filters and CSV downloads. Average feed uses calendar days; egg rate uses bird-days; historical population accounts for mortality through the selected date. No demo farm or operational records are loaded into new accounts. Standalone house/supplier management, feed inventory, spreadsheet import and XLSX exports remain future work.

`backend`: `yarn check`, `yarn test:all` (disposable PostgreSQL/Redis from `docker-compose.test.yml`). Coverage includes invitation expiry/replay/revocation, tenant boundaries, custom grants, owner-only farm writes, task assignment, mortality races, audited corrections, vaccination history and report calculations. `client`: `yarn check`, `yarn test`, `PLAYWRIGHT_CHANNEL=chrome yarn test:e2e`.

### Daily records by farm week

Daily records now include a seven-day table matching the workbook layout: date, end-of-day birds, mortality/cause, feed given in kilograms, eggs, production percentage, medication, activities, notes and recorder. The dashboard and flock details offer weekly browsing. Dashboard summaries show each active flock's current farm week, house, feed and egg totals.

Week 1 is arrival day through arrival + 6 days; Week 2 starts at arrival + 7 days. Each flock has its own timeline, even within the same house. Bird age includes age at arrival and is labeled separately. Date-only UTC arithmetic avoids daylight-saving shifts.

Use the house/flock filters and previous/next week controls, or enter a week number. Missing past dates offer **Add record**, prefilled with that flock/date. A saved record holds daily totals, including multiple activities in its text field; duplicate flock/date submissions are blocked. Existing totals are changed through the permission-controlled correction flow and retained in audit history. This is separate from assigned farm tasks.

Missing days display dashes, not zero feed/eggs. Weekly totals include saved records only. End-of-day bird counts subtract all recorded mortality through that date, including prior weeks. Weekly mortality rate uses opening birds; cumulative rate uses initial birds. Production percentage uses end-of-day bird counts on saved days only. Future dates are labeled upcoming. Closed flocks retain their weekly history.

`GET /api/v1/farms/:farmId/records/weekly?flockId=<uuid>&week=<number>` requires `records.read`; omitting week selects the current farm week. Dashboard permission allows weekly summaries without granting access to raw record notes. No schema migration or spreadsheet import is required for this feature. The supplied workbook was used as a layout reference only.
