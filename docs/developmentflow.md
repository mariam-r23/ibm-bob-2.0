# Development Flow
### MonoSplitter AI — Git, Setup & Session Workflow

---

## 1. Repo Structure

```
MicroSplit-Workspace/
├── monolith/                    # the messy demo target app
│   ├── users/
│   ├── payments/
│   ├── db.js                    # shared data-layer coupling point (deliberate)
│   └── package.json
├── extracted-services/          # Bob writes carved-out services here (empty at start)
├── graph-service/               # backend: madge runner + schema reader + API
│   ├── index.js
│   ├── schema.json               # Tier 1 DB definition (Users/Payments)
│   └── package.json
├── frontend/                    # React Flow dashboard
│   ├── src/
│   └── package.json
├── bob-tasks/                   # Bob prompt/task definitions for the carve-out engine
├── docs/
│   ├── contracts.md              # single source of truth — both watch this
│   ├── requirements.md
│   ├── project-context.md
│   └── workplans/
│       ├── anosha.md
│       └── mariam.md
├── bob_sessions/                # submission screenshots
├── tests/
├── docker-compose.yml
├── .bobignore
└── README.md
```

Keeping `docs/contracts.md` as one file both of you watch is more important than the exact folder layout — that's what prevents silent integration breaks between whoever's on the backend graph JSON and whoever's on the frontend that consumes it.

## 2. Branching Strategy

```
main                      — always working, always demoable, protected
├── phase-N-integration   — where both people's work merges for a given phase
│   ├── anosha/module-name
│   └── mariam/module-name
```

- **`main`** — only receives merges from a completed `phase-N-integration` branch once that phase's exit criteria (see `requirements.md`) pass end-to-end. Never commit to `main` directly.
- **`phase-N-integration`** — created at the start of each phase (Phase 1, 2, 3). Both of you merge your module branches here as they're ready. This is where you catch integration issues *before* they hit `main`.
- **Personal module branches** — one per module you own that phase, named `yourname/module-name`. Work here freely, commit often, doesn't need to be clean.

There are **3 phases**, matching `requirements.md`, each ending in a merge to `main`:

```
phase-1-integration → merge → main (v0.1)   — code-coupling graph
phase-2-integration → merge → main (v0.2)   — Bob carve-out engine
phase-3-integration → merge → main (v1.0)   — DB coupling + demo polish (final)
```

## 3. Branch Naming & Commits

- Branches: `anosha/graph-backend`, `mariam/graph-frontend`, etc. — lowercase, hyphenated.
- Commits: short present-tense summary, e.g. `add madge runner and graph JSON endpoint` — doesn't need to be formal, just readable by the other person scanning history.
- If a commit changes a **contract shape** in `docs/contracts.md`, prefix it: `[CONTRACT] add generatedFiles field to carve-out result` — this should immediately catch the other person's eye when scanning the log.

## 4. Contract Change Protocol

Because you're building against shared JSON shapes in parallel, an unannounced contract change is the single most likely thing to break the other person's work silently. Rule:

1. If you need to change a contract shape (in `docs/contracts.md`), message the other person *before* pushing the change — not after.
2. Update `docs/contracts.md` in the same commit as the code change.
3. The other person updates their consuming code before their next integration merge, not before their next commit — no need to drop everything, but don't merge to `phase-N-integration` on a stale contract.

## 5. Setup & Requirements

**Both of you need:**

| Tool | Purpose |
|---|---|
| Node.js 20+ | Monolith, graph-service, frontend — this whole project is JS/TS |
| `madge` (`npm install -g madge`) | Dependency graph extraction from the monolith |
| Docker + `docker-compose` | Run monolith + extracted service side by side |
| Bob IDE v2.0.2+ | Required — the core agentic engine. Sign in with your hackathon-provisioned account (`ibm-coding-challenge-uat`, region us-east), not your personal one. |
| Git + GitHub account | Version control, both added as collaborators |

**One-time setup per person:**

```bash
git clone <repo-url>
cd MicroSplit-Workspace

# monolith
cd monolith && npm install

# graph-service
cd ../graph-service && npm install

# frontend
cd ../frontend && npm install

# global tool
npm install -g madge
```

- No `.env`/API keys needed for this project (Bob handles the agentic calls via IDE auth, no separate model API key required for the demo path).
- Confirm you're on the hackathon Bob account before starting any task, so Bobcoin usage doesn't hit your personal account.

## 6. Session Start Checklist

Run through this at the start of every work session, not just the first one:

1. `git checkout phase-N-integration && git pull` — get the latest integrated state.
2. Skim `docs/contracts.md` for any `[CONTRACT]`-tagged changes since last session.
3. `git checkout yourname/your-module && git merge phase-N-integration` — bring your branch up to date before continuing.
4. Check your `waiting on` section in `anosha.md` / `mariam.md` — if something you needed has landed, swap your stub for the real thing now, don't defer it.
5. Quick message to the other person if you're about to start something that touches a shared contract or the `payments` extraction target.

## 7. Session End Checklist

1. Commit your work, even if incomplete — don't leave uncommitted changes sitting locally.
2. Push your module branch: `git push origin yourname/your-module`.
3. If your module (or a deliverable inside it) is genuinely ready, open a PR into `phase-N-integration`, not directly into `main`.
4. Update your workplan checklist so the other person can see progress without asking.
5. If you hit a blocker that affects the other person, flag it before ending the session.
6. If you ran a real Bob task this session, screenshot the task session consumption summary now (Bob IDE → Tasks → select task → click header) and drop it in `bob_sessions/` — don't leave this for the final day.

## 8. Merge & Integration Points

| Phase | Integration trigger |
|---|---|
| Phase 1 | Graph backend (madge + API) and graph frontend both ready → merge to `phase-1-integration`, confirm the real dependency graph renders end-to-end → tag `v0.1`. |
| Phase 2 | Bob carve-out engine + carve-out UI/results-viewer both ready → merge to `phase-2-integration`, run `docker-compose up`, confirm the contract test passes end-to-end → tag `v0.2`. |
| Phase 3 | DB schema/Tier2 generation + Tier1 overlay UI/demo-polish both ready → merge to `phase-3-integration`, joint run-through of the full 3-minute demo together → merge to `main`, tag `v1.0`. |

`main` should always reflect the last fully-working phase, even while the next `phase-N-integration` is mid-progress.

## 9. Development Flow Diagram

```
 ANOSHA                                                    MARIAM
   │                                                          │
   ▼                                                          ▼
anosha/monolith-backend                            mariam/graph-frontend
  (build monolith + seed 2                          (madge → JSON graph
   deliberate coupling points,                        rendered in React Flow,
   scaffold workspace + .bobignore)                    backend graph service)
   │                                                          │
   └──────────────────► phase-1-integration ◄─────────────────┘
                                │
                confirm real dependency graph renders end-to-end
                                │
                                ▼
                          merge → main (v0.1)
                                │
        ┌───────────────────────┴─────────────────────────┐
        ▼                                                 ▼
anosha/carve-out-ui                              mariam/carve-out-engine
  (trigger button, live task log                  (Bob task defs: copy module,
   streaming panel, results/                        rewrite import→HTTP, scaffold
   diff viewer)                                      Dockerfile+API wrapper,
                                                      generate contract test,
                                                      docker-compose wiring)
        │                                                 │
        └──────────────────► phase-2-integration ◄────────┘
                                │
                    docker-compose up, contract test passes
                                │
                                ▼
                          merge → main (v0.2)
                                │
        ┌───────────────────────┴─────────────────────────┐
        ▼                                                 ▼
anosha/db-schema-backend                        mariam/db-overlay-frontend
  (schema.json for Users/Payments,                (Tier 1 DB nodes on graph,
   Bob task defs for Tier 2 —                       demo polish, backup
   split schema, data-access layer,                 recording, bob_sessions,
   migration plan generation)                       README)
        │                                                 │
        └──────────────────► phase-3-integration ◄────────┘
                                │
                      joint full demo run-through
                                │
                                ▼
                          merge → main (v1.0 — final)
```

Each fork-and-join cycle matches a phase: work independently on module branches, converge at a `phase-N-integration` branch to catch issues early, confirm the exit criteria actually pass end-to-end, then merge to `main` and fork again for the next phase.
