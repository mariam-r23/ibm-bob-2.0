# MonoSplitter AI

Visualizes a monolith's module + database coupling as an interactive graph,
then uses Bob to agentically carve a selected module out into a standalone
microservice. Built for the IBM Bob 2.0 hackathon.

> **Status:** Phase 1 complete (code-coupling graph). Phase 2 (Bob carve-out
> engine) and Phase 3 (DB Tier 2 generation + demo polish) are next — see
> `docs/requirements.md` for the full phase breakdown.

## What's here (Phase 1)

- `monolith/` — the demo target app (Node/Express), with two deliberate
  coupling points:
  1. `users/index.js` directly calls `processPayment()` from `payments/`.
  2. `users/` and `payments/` both read/write the shared `db.js` data layer.
- `graph-service/` — runs `madge` against `monolith/`, serves the code
  dependency graph (`GET /api/graph`) and the Tier 1 DB schema graph
  (`GET /api/schema`) per `docs/contracts.md`.
- `frontend/` — React + reactflow dashboard. Fetches both endpoints, merges
  them client-side, renders module nodes + table nodes with pan/zoom, and
  lets you click a module node to select/highlight it.
- `extracted-services/`, `bob-tasks/` — scaffolded, populated in Phase 2.
- `docs/` — the planning docs this build follows (`contracts.md` is the
  source of truth for every shared JSON shape).

## Setup

Requires Node.js 20+.

```bash
# monolith
cd monolith && npm install && cd ..

# graph-service
cd graph-service && npm install && cd ..

# frontend
cd frontend && npm install && cd ..

# global tool (used by graph-service, and handy for manual checks)
npm install -g madge
```

## Running it locally (no Docker needed for Phase 1 dev)

Open three terminals from the workspace root:

```bash
# 1. monolith (port 4000)
cd monolith && npm start

# 2. graph-service (port 4100)
cd graph-service && npm start

# 3. frontend (port 5173, proxies /api/* to graph-service on :4100)
cd frontend && npm run dev
```

Then open **http://localhost:5173**. You should see:

- Two blue module nodes (`users`, `payments`) with a solid animated edge
  `users → payments` (the direct `processPayment()` import madge found).
- Two amber table nodes (`Users`, `Payments`) below them with a dashed
  foreign-key edge `Payments → Users` (the `db.js` coupling, Tier 1).
- Clicking the `payments` module node highlights it and shows a
  "carve-out target (Phase 2)" hint in the header.

### Sanity-checking the pieces individually

```bash
curl http://localhost:4000/health        # monolith is up
curl http://localhost:4000/users         # seeded users
curl -X POST http://localhost:4000/users/1/charge \
  -H "Content-Type: application/json" -d '{"amount": 12.5}'   # coupling point #1 in action
curl http://localhost:4100/api/graph     # real madge-derived module graph
curl http://localhost:4100/api/schema    # Tier 1 DB schema
```

## Docker (base services)

```bash
docker-compose up --build
```

Brings up `monolith` (`:4000`) and `graph-service` (`:4100`). The frontend
currently runs via `npm run dev` outside Docker; `extracted-services/payments`
joins `docker-compose.yml` in Phase 2 once the carve-out engine writes it.

## Project docs

- `docs/project-context.md` — the problem, the concept, locked-in demo
  decisions.
- `docs/requirements.md` — phase-by-phase functional requirements and exit
  criteria.
- `docs/contracts.md` — every shared JSON shape (code graph, DB schema graph,
  carve-out request/result). Watch this file — it's the single source of
  truth between backend and frontend.
- `docs/developmentflow.md` — branching strategy, session checklists.
- `docs/workplans/` — per-teammate phase breakdowns.
