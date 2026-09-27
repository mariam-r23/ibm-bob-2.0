---
name: carve-out-microservice
description: Extracts a tightly-coupled module out of monolith/ into a standalone Express microservice under extracted-services/ — copies the module, scaffolds a service wrapper + Dockerfile, rewrites the in-process import that called it into an HTTP client call, and generates a contract test proving behavior parity. Activate when asked to "carve out", "extract", or "split off" a module (e.g. payments) into its own service.
---

# Carve out a module into a standalone microservice

This skill encodes the MonoSplitter AI carve-out workflow. The shapes below are
the contract — see `docs/contracts.md` §4 and §5 for the authoritative JSON.
Read that file before starting; do not invent a different shape.

## Preconditions

Before doing anything, read:
- `docs/contracts.md` (§4 Carve-Out Result / Task Log shape, §5 File Manifest)
- `monolith/payments/index.js` (the module being extracted)
- `monolith/users/index.js` (the caller with the direct import to rewrite)
- `monolith/db.js` (so the new service's data-access shape stays consistent
  with the fields the monolith already uses)

## Status reporting (do this first, and after every step)

Create/update `bob-tasks/carve-out-status.json` with the exact shape from
`contracts.md` §4. Initialize all 7 steps as `"pending"` except the ones this
skill covers (the first 4), and never touch the Phase 3 steps
(`generate_split_schema`, `generate_data_access_layer`,
`generate_migration_plan`) — those belong to a separate skill run later and
must stay `"pending"` when this skill finishes. Set `status: "in_progress"`
at the start, update each step's status as you reach/finish it, and only set
the top-level `status` to `"success"` after the contract test in step 4
actually passes when run — not merely after the file exists.

## Steps

### 1. `copy_module`
Copy `monolith/payments/` into `extracted-services/payments/` as the starting
point for the new service. Preserve the business logic in
`processPayment()` and the route handlers exactly — only the surrounding
service wrapper changes in step 2.

### 2. `scaffold_service` (parallelizable — see below)
Scaffold `extracted-services/payments/` into a standalone service:
- `main.js` — a small Express app that mounts the copied payment routes
  on its own port (use `4200`, unused elsewhere in this repo) and replaces
  the old `require('../db')` with a local, in-memory data store seeded the
  same way `monolith/db.js` is, since this service no longer has access to
  the monolith's shared `db.js`.
- `package.json` — minimal deps (`express`, `cors`), matching the style of
  `graph-service/package.json`.
- `Dockerfile` — same pattern as `monolith/Dockerfile`, exposing port 4200.

### 3. `rewrite_imports_to_http`
In `monolith/users/index.js`, replace the direct
`require('../payments')` / `processPayment()` in-process call with an HTTP
client call (use `fetch`, no new dependency needed) to the new service at
`http://payments-service:4200` (the docker-compose service name — see step
below) for the `/charge` route. Keep the route's external behavior
(request/response shape, status codes) identical — this is what the
contract test in step 4 verifies.

### 4. `generate_contract_tests`
Write `tests/payments-contract.test.js`: a small script (plain Node +
`assert`, no test framework dependency needed for this demo scope) that
starts both services (or hits them if already running via docker-compose),
POSTs the same request `monolith/users/index.js`'s old in-process call
would have made, and asserts the response shape/status matches what the
monolith produced *before* the rewrite. This is the pre/post behavior
parity check Mariam's workplan requires — it must actually run and pass,
not just exist.

### Parallelization

Steps 2 and 4 don't depend on each other — step 2 needs the copied module
from step 1, and step 4 needs the route contract (which is already fully
specified by the existing `monolith/payments/index.js` routes, independent
of the rewrite in step 3). Use a subagent to scaffold the service (step 2)
while the main agent handles the import rewrite (step 3); only start step 4
once both are done, since the contract test needs both the new service
running and the rewritten caller in place to test the full pre/post path.

## Docker wiring

After all four steps pass, add an `extracted-services-payments` service to
the root `docker-compose.yml` alongside `monolith` and `graph-service`
(same pattern as the existing two — see that file for the style), so
`docker-compose up` brings up all three side by side. Update
`generatedFiles` in the status JSON to match `contracts.md` §5 once this is
done.

## Definition of done

- `bob-tasks/carve-out-status.json` shows `status: "success"` with the
  first four steps `"done"`.
- `docker-compose up` brings up `monolith`, `graph-service`, and the new
  `extracted-services/payments` service together with no manual steps.
- `node tests/payments-contract.test.js` (or however it's invoked) exits 0
  against the running stack.
