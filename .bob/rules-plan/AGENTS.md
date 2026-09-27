# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Architecture Constraints (Non-Obvious)

- **Client-side graph merge** — the frontend fetches two separate backend endpoints (`/api/graph`, `/api/schema`) and merges them in `graphTransform.js`. There is no combined endpoint. Any plan that moves this merge to the backend changes the contract shape.
- **No shared data layer after carve-out** — the extracted `payments` service must duplicate `db.js`'s in-memory store locally. It cannot import or call `monolith/db.js` after extraction (different process, different container).
- **`graph-service/Dockerfile` context is the workspace root** (not `graph-service/`) — it needs to `COPY ../monolith` to run madge against it. Plans that move the Dockerfile context will break the Docker build.
- **Three-phase integration model** — changes must never go directly to `main`. Branches: `yourname/module-name` → `phase-N-integration` → `main`. Planning work that skips `phase-N-integration` violates the submission model.
- **Contract shape changes are blocking** — `docs/contracts.md` changes require coordination with the other teammate before merging. Any plan that changes a shared JSON shape should flag this as a synchronization dependency.
- **The carve-out's four steps have a specific dependency order**: `copy_module` → `scaffold_service` ∥ `rewrite_imports_to_http` → `generate_contract_tests`. Steps 2 and 3 are parallelizable; step 4 requires both to be complete.
- **Phase 3 DB deliverables are generated files only** — `schema.json`, `data-access.js`, and `MIGRATION.md` in `extracted-services/payments/` are text outputs. No plan should include live DB execution, migration, or a second running database.
- **No linter, no formatter, no type system** — plans that add ESLint/Prettier/TypeScript are out of scope and not part of any phase's exit criteria.
