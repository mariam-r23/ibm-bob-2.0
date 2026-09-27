# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Coding Rules (Non-Obvious)

- **Three separate npm projects** — never run `npm install` from the workspace root; always `cd` into `monolith/`, `graph-service/`, or `frontend/` first.
- **`payments/index.js` exports a named object**, not a default: `{ router, processPayment, listPaymentsForUser }`. `server.js` mounts with `.router`; do not change the export shape without updating `server.js`.
- **After carve-out, `monolith/users/index.js` must call `http://payments-service:4200`** (the docker-compose service name), not `localhost:4200` — the docker network resolves the hostname, not the host machine.
- **`graph-service/index.js` must use `/[\\/]/` to split file paths from madge** — using `path.sep` breaks the module graph silently on Windows because madge always returns forward slashes regardless of OS.
- **`bob-tasks/carve-out-status.json` must exactly match `contracts.md §4`** — the frontend polls/reads this file. Keys must be spelled exactly: `status`, `steps[].step`, `steps[].status`, `generatedFiles`.
- The contract test at `tests/payments-contract.test.js` uses **plain Node + `assert`**, no test framework — run with `node tests/payments-contract.test.js`, exit code 0 = pass.
- **Do not modify `graph-service/schema.json`** without also updating `monolith/db.js` data and `docs/contracts.md §2` — all three describe the same two tables and one FK relation.
- **`extracted-services/payments/` uses port 4200** — this is the only free port in the stack (4000 = monolith, 4100 = graph-service, 5173 = frontend).
- The carve-out skill at `.bob/skills/carve-out-microservice/SKILL.md` must NOT set Phase 3 steps (`generate_split_schema`, `generate_data_access_layer`, `generate_migration_plan`) to anything other than `"pending"` — those belong to a separate skill run.
