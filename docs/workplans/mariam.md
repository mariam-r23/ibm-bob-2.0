# Mariam's Workplan
### MonoSplitter AI

Your work alternates frontend and backend every phase — you're not "the frontend person," you touch both, same as Anosha. See `contracts.md` before starting anything that produces or consumes a shared JSON shape.

---

## Phase 1 — Graph Service (backend) + Graph Frontend (frontend)

**Branch:** `mariam/graph-frontend` (covers both pieces of this feature slice)

- [ ] Backend: build `graph-service/` — run `madge` against `monolith/` (once Anosha's monolith exists), transform its output into the Code Dependency Graph shape (`contracts.md` §1), and serve it via a small Express endpoint.
- [ ] Backend: expose the endpoint the frontend will call (agree the route name with Anosha, e.g. `GET /api/graph`).
- [ ] Frontend: build the React Flow dashboard in `frontend/` — fetch the graph JSON, render nodes/edges, support pan/zoom and node selection.
- [ ] Frontend: clicking a node should visually select it and expose it to the rest of the app (needed for Phase 2's carve-out trigger).
- [ ] Sanity-check against Anosha's actual monolith once it's pushed — don't build against a fabricated JSON for too long.

**Waiting on:** Anosha's `monolith-backend` branch (need the real monolith with the two coupling points before `madge` output means anything).

**Hands off to Anosha when done:** a real, working dependency graph rendering in the dashboard, so the Phase 2 "Carve Out" button has something real to sit on top of.

---

## Phase 2 — Bob Carve-Out Engine (backend/agentic) + Docker Wiring (infra)

**Branch:** `mariam/carve-out-engine`

- [ ] Write the Bob task/prompt definitions (in `bob-tasks/`) for the code-coupling carve-out:
  - [ ] Copy `monolith/payments/` into `extracted-services/payments/`.
  - [ ] Scaffold an Express wrapper + `Dockerfile` for the new standalone service.
  - [ ] Rewrite the direct import in `monolith/users/index.js` into an HTTP client call (`fetch`/`axios` to the new service).
  - [ ] Generate a contract/integration test verifying pre/post behavior parity.
- [ ] Make the task emit progress matching the Carve-Out Result / Task Log shape (`contracts.md` §4) so Anosha's live log panel can render it.
- [ ] Write `docker-compose.yml` to run `monolith` and `extracted-services/payments` side by side.
- [ ] Run the generated contract test against both services up together — confirm it actually passes, not just that files were created.

**Waiting on:** Anosha's `carve-out-ui` branch for the trigger contract shape (already fixed in `contracts.md` §3, so you can build against the spec without waiting on her UI existing).

**Hands off to Anosha when done:** a real, working carve-out she can wire her UI's live stream to instead of mocked data.

---

## Phase 3 — Tier 1 DB Overlay (frontend) + Demo Polish (shared)

**Branch:** `mariam/db-overlay-frontend`

- [ ] Once Anosha's `schema.json` lands, extend the graph frontend to render the DB Schema Graph shape (`contracts.md` §2) as extra table nodes + relation edges, visually distinct from the code-import edges.
- [ ] Confirm the merged graph (code coupling + DB coupling) reads clearly — don't let it turn into visual noise.
- [ ] Demo polish:
  - [ ] Record the full successful demo run as a backup video.
  - [ ] Finish `README.md` — setup steps, how to run the demo, link to the backup video.
  - [ ] Confirm `bob_sessions/` has both teammates' task screenshots before submission.
- [ ] Do a joint full run-through of the 3-minute demo with Anosha before the final merge to `main`.

**Waiting on:** Anosha's `db-schema-backend` branch (`schema.json` + the three Tier 2 generated files) before the overlay has real data to render.

**Hands off to Anosha when done:** a submission-ready repo, ready for the joint final demo run-through.

---

## Cross-Phase Reminders

- Any time you touch a shape in `contracts.md`, tag the commit `[CONTRACT]` and message Anosha before pushing.
- Run the session start/end checklists in `developmentflow.md` every session, not just day one.
- You own the graph/dashboard rendering; Anosha owns the underlying module/schema correctness — if data looks wrong, check the contract shape first before assuming it's your bug.
