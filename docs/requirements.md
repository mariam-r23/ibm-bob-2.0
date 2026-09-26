# Requirements Doc
### MonoSplitter AI

---

## 1. Tech Stack

| Layer | Choice |
|---|---|
| Demo monolith | Node.js + Express |
| Dependency graph extraction | `madge` (CLI, run against the monolith, outputs JSON) |
| Frontend | React + `reactflow` |
| Backend (graph service) | Node.js + Express (small API serving graph JSON + schema JSON) |
| Containerization | Docker + `docker-compose` (monolith + extracted service side by side) |
| Agentic engine | IBM Bob 2.0 (IDE, required, core of the submission) |
| Schema representation (Tier 1/2) | Plain `schema.json` describing `Users` / `Payments` tables + one foreign-key-style relation |

## 2. Phase Breakdown & Functional Requirements

### Phase 1 — Foundation & Code-Coupling Visualization
- Demo monolith exists with `/users` and `/payments` folders.
- Two deliberate coupling points are present and working end-to-end (import call + shared `db.js`).
- `madge` runs against the monolith and produces a valid dependency JSON.
- A small backend endpoint serves that JSON to the frontend.
- Frontend renders the JSON as an interactive node/edge graph (pan/zoom, click a node to select it).
- Monorepo workspace scaffolded (`MicroSplit-Workspace/monolith`, `/extracted-services`, `.bobignore`).

**Exit criteria:** open the dashboard, see the real dependency graph of the real monolith, click the `payments` node and see it highlight.

### Phase 2 — Bob Carve-Out Engine
- A "Carve Out with Bob" action exists in the UI, scoped to the `payments` module for the demo.
- Triggering it runs a Bob task (via Bob IDE, using a defined task/prompt) that:
  - Copies `payments/` into `extracted-services/payments/`.
  - Scaffolds an Express (or FastAPI) wrapper + `Dockerfile` for the new service.
  - Rewrites the direct import in `users/index.js` into an HTTP client call.
  - Generates a contract/integration test verifying behavior parity pre/post extraction.
- Live task session output is visible (logs/steps), either streamed into the UI or shown directly in Bob IDE during the demo.
- A results/diff view shows what changed: new files created, files modified in the monolith.
- `docker-compose.yml` boots both services together; the integration test passes.

**Exit criteria:** click "Carve Out," watch Bob do the multi-file edit, run `docker-compose up`, tests pass.

### Phase 3 — Database Coupling (Tier 1 + Tier 2) & Demo Polish
- `schema.json` defines `Users` and `Payments` tables with one relation representing the shared `db.js` coupling.
- Graph view is extended (Tier 1) to render these as additional nodes/edges alongside the code graph.
- On "Carve Out," Bob additionally (Tier 2) generates:
  - A standalone schema file for the new service.
  - A minimal data-access layer for it.
  - A short migration plan (`MIGRATION.md`) describing what a real split would require.
  - **No live database is created, migrated, or queried during the demo** — these are generated files only.
- Demo polish: backup screen recording of a full successful run, README finished, `bob_sessions/` populated with task screenshots for both teammates.

**Exit criteria:** graph shows both code and DB coupling; carve-out produces the Tier 2 files; backup recording exists; repo is submission-ready.

## 3. Explicit Non-Goals (do not build these)

- No custom AST/dependency-parsing engine — `madge` only.
- No support for extracting an arbitrary/user-chosen module in the live demo — `payments` only.
- No live database migration, no second real running database queried on stage.
- No multi-language support (Java/C#/etc.) — Node/Express only.
- No use of watsonx Orchestrate / watsonx.ai in this submission.

## 4. Submission Deliverables Checklist

- [ ] Working repo with `README.md` explaining setup + demo steps.
- [ ] `bob_sessions/` folder with both teammates' task summary screenshots.
- [ ] `docs/contracts.md`, `docs/requirements.md`, `docs/project-context.md` included.
- [ ] Backup demo video linked or included.
- [ ] Bob IDE clearly the core mechanism shown in the demo (not incidental).
