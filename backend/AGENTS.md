# Backend conventions

- Preserve the existing controller, route, validation and service layout.
- Define schemas with Sequelize model classes and `Model.init(...)`.
- Prefer arrow functions, readable spacing and comments explaining important behavior.
- Every controller must use an explicit try/catch block. Forward caught errors to the shared handler with `return next(error)`; do not rely on automatic async error handling.
- A signup request must never create a user. Store unapproved registration data in `pending_signups`, with a password hash, hashed approval token and expiry.
- Create the user only when a valid, unexpired approval link is confirmed. User creation and pending-signup consumption must commit in one transaction.
- Expired links, retries, resend requests, email failures and development seeders must never bypass approval. Seeders may prepare pending requests only.
- Never automatically approve or discard existing accounts when changing this flow. Preserve pending data and valid approval links through migrations.
- Cover this invariant in integration tests and the client/browser flow.

# Error and message conventions

- Use the reviewed error codes in `src/utils/errors.ts` and the shared error handler. Never return an exception's message, stack, SQL, parameters or provider response.
- Keep API errors simple: return only `{ message }`. Unexpected failures return `{ "message": "Internal server error" }`. Error codes, references, stack traces and diagnostics stay server-side.
- Return one useful validation message without rejected values. Do not expose passwords, tokens, cookies or headers in errors or logs.
- Signup, resend and password recovery must not reveal account existence through their public message or status. Do not overwrite active pending credentials on repeated signup.
- A 202 signup response means the request was accepted; it does not confirm account existence or email delivery. Failed delivery still creates no user.
- Access logs must omit query strings and referrers because approval/reset tokens can appear there. Log only approved diagnostic fields for unexpected exceptions.
- Client UI displays a short error message only. Never display support references or raw server/proxy details.

# Farm access conventions

- Create the farm and its owner's FarmMember row in one transaction.
- Scope farm reads by authenticated membership and farm writes by both membership and ownership. Never accept a caller-supplied owner/user/role for a farm profile.
- Return the same NOT_FOUND response for missing and inaccessible farms.
- Keep farm data query caches scoped to the signed-in account. New accounts must start with an empty farm list, never seeded demo farms.
- Only the actual farm owner can administer membership or edit/delete farm profiles. Operational permissions are checked server-side on every request; empty custom grants mean no access.
- Invitations never create users or bypass signup approval. Scope every operational query and audit record to the farm. Preserve historical records when flocks close or schedules change.
- House and supplier names remain profile metadata; standalone entities are not yet implemented.
