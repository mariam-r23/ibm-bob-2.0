# Anosha's Workplan
### MonoSplitter AI

Your work alternates backend and frontend every phase — you're not "the backend person," you touch both, same as Mariam. See `contracts.md` before starting anything that produces or consumes a shared JSON shape.

---

## Phase 1 — Monolith + Workspace Scaffold (backend/infra)

**Branch:** `anosha/monolith-backend`

- [ ] Build the demo monolith in `monolith/` (Node/Express): `/users` and `/payments` folders, minimal realistic routes.
- [ ] Seed the two deliberate coupling points:
  - [ ] `users/index.js` directly imports and calls `processPayment()` from `payments/`.
  - [ ] `users/` and `payments/` both read/write a shared `db.js` (in-memory or simple JSON/SQLite file).
- [ ] Keep the code intentionally simple — this is Bob's target, not a real product; don't over-engineer it.
- [ ] Scaffold the monorepo workspace root: `MicroSplit-Workspace/` containing `monolith/` and an empty `extracted-services/`.
- [ ] Add `.bobignore` at the workspace root: `node_modules/`, `.git/`, `dist/`.
- [ ] Confirm `madge` (Mariam's side) can actually parse your monolith cleanly — run it yourself once as a sanity check before merging.

**Waiting on:** nothing — this is the starting point for everything else.

**Hands off to Mariam when done:** a working monolith with both coupling points live, so she can point `madge` and the graph service at it.

---

## Phase 2 — Carve-Out UI, Live Logs & Diff Viewer (frontend)

**Branch:** `anosha/carve-out-ui`

- [ ] Add the "Carve Out with Bob" button on the selected node in the graph (scoped to `payments` for the demo — see `requirements.md` non-goals).
- [ ] On click, send the Carve-Out Request shape from `contracts.md` §3.
- [ ] Build a live task/log panel that renders the Carve-Out Result / Task Log shape (`contracts.md` §4) as it updates — step-by-step status (`pending` → `in_progress` → `done`).
- [ ] Build the results/diff viewer: show the generated file list (`contracts.md` §5) and a simple before/after view of `monolith/users/index.js` (import call → HTTP client call).
- [ ] Handle the `"error"` status gracefully in the UI — don't let a failed step look like a frozen screen.

**Waiting on:** Mariam's `carve-out-engine` branch (the actual Bob task defs + docker-compose wiring) — you can build against the `contracts.md` shapes with mocked data until that lands, then swap the mock for the real stream.

**Hands off to Mariam when done:** a working trigger + log UI she can point her real Bob output at during integration.

---

## Phase 3 — DB Schema Backend + Tier 2 Bob Prompts (backend/agentic)

**Branch:** `anosha/db-schema-backend`

- [ ] Write `graph-service/schema.json` per `contracts.md` §2: `Users` and `Payments` tables, one `foreign_key`-style relation representing the shared `db.js` coupling.
- [ ] Write the Bob task/prompt definitions (in `bob-tasks/`) for the Tier 2 database-coupling generation, triggered as part of the same carve-out task:
  - [ ] Generate `extracted-services/payments/schema.json` (split-out schema).
  - [ ] Generate `extracted-services/payments/data-access.js` (data-access layer for the new service).
  - [ ] Generate `extracted-services/payments/MIGRATION.md` (human-readable migration plan — **never executed**, file only).
- [ ] Make sure these three outputs match the `generatedFiles` list in `contracts.md` §4 exactly, so Mariam's overlay/diff viewer picks them up without a contract mismatch.
- [ ] Take your own Bob task session screenshots as you go and drop them in `bob_sessions/` — don't leave this for the last day.

**Waiting on:** Phase 2's carve-out engine being merged, since Tier 2 generation hooks into the same task flow Mariam built.

**Hands off to Mariam when done:** confirmed `schema.json` + the three Tier 2 generated files, so she can wire the Tier 1 overlay and do the final joint demo run-through.

---

## Cross-Phase Reminders

- Any time you touch a shape in `contracts.md`, tag the commit `[CONTRACT]` and message Mariam before pushing.
- Run the session start/end checklists in `developmentflow.md` every session, not just day one.
- You own `payments`-side correctness; Mariam owns the graph/dashboard consuming it — if something looks wrong in the UI, check the contract shape first before assuming it's her bug.
