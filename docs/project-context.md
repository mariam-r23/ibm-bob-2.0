# Project Context
### MonoSplitter AI — IBM Bob 2.0 Hackathon

---

## 1. Hackathon Constraints (must-follow)

- **Bob IDE is required** and must be a **core, visible component** of the submission — not a peripheral tool. Bob Shell is optional, not used here.
- **IDE version:** must be on Bob IDE v2.0.2+ (v1.0.3 and v2.0.0 stop working Sept 30, 2026).
- **Bobcoins:** 40 per person → **80 total for the team**. No top-ups once used. Budget is ring-fenced for the highest-leverage agentic step (the carve-out engine), not for boilerplate Bob could generate trivially.
- **Submission requirement:** a `bob_sessions/` folder in the final repo containing PNG screenshots of every relevant Bob task session consumption summary (naming convention: `anosha_task01_<desc>_summary.png` / `mariam_task01_<desc>_summary.png`).
- **Data policy:** the demo app (monolith) is fully self-authored dummy data/code — no client data, no PI, no scraped social data, no confidential material. Nothing to clear here, but noted for the record.
- Optional watsonx Orchestrate / watsonx.ai are **not** part of this submission — Bob is the entire story.

## 2. The Problem

Enterprise monoliths are hard to break into microservices because code, imports, and database models are tightly coupled across many files. Manual extraction takes months of tracing imports and rewriting interfaces by hand.

## 3. The Concept — MonoSplitter AI

An interactive tool that:
1. Visualizes a monolith's module dependencies (code-level *and* database-level) as a graph.
2. Lets a developer click a module (e.g. `payments`) and hit **"Carve Out with Bob."**
3. Uses **IBM Bob 2.0** to agentically extract that module into a standalone microservice — rewriting local calls into HTTP client calls, scaffolding a Dockerfile + API wrapper, and generating contract/integration tests — live, on stage.

## 4. Final Descoped Build Decisions

These were deliberately locked in after a risk review, to keep the demo reliable within hackathon time:

| Decision | Why |
|---|---|
| Demo monolith = Node.js/Express, `/users` + `/payments` only | Any language would work in theory; JS keeps parsing and Bob's edits simple and reliable. |
| Dependency graph via `madge` (not a custom AST engine) | `madge` already does this — building our own would burn the whole hackathon. |
| Two deliberate "spaghetti links" seeded in the demo repo: (1) `users/index.js` directly imports/calls `processPayment()` from `payments/`, (2) both modules read/write a shared `db.js` data file | Without real coupling, Bob has nothing hard to untangle on stage — the demo would look staged and empty. |
| Only `payments` is a supported extraction target for the live demo | Prevents an arbitrary-module extraction breaking live; the underlying code still supports it generally, we just script the demo path. |
| Database coupling handled in two tiers, **no live DB execution on stage**: <br>**Tier 1** — visualize `Users`/`Payments` as extra graph nodes read from a schema file. <br>**Tier 2** — on "Carve Out," Bob *generates* a split schema, a data-access layer, and a migration plan as files (not executed against a running DB) | Gets the "it understands database coupling too" story without the highest-risk part of real microservice extraction (live schema migration). |
| Single monorepo workspace (`MicroSplit-Workspace/` containing `monolith/` and `extracted-services/`) | Keeps both the source and the newly generated service inside Bob's one workspace view — avoids relying on cross-repo reasoning we haven't validated. |
| `.bobignore` at workspace root (`node_modules/`, `.git/`, `dist/`) | Keeps Bob's context focused on our code, not framework noise. |
| Recorded backup of the full successful demo run | Live "docker-compose up, tests pass" is a classic failure point — always have the safety net cued up. |

## 5. The 3-Minute Demo Hook

- **0:00–0:30** — Show the messy monolith running locally.
- **0:30–1:30** — Open the dashboard, show the interactive graph (code coupling + DB coupling), highlight the two seeded links into `payments`.
- **1:30–2:30** — Click "Carve Out Payments." Show live Bob task session logs: rewriting the import into an HTTP call, scaffolding the new service + Dockerfile, generating contract tests, generating the split schema/data-access/migration files.
- **2:30–3:00** — `docker-compose up`, both services running side by side, tests green. (Backup recording ready in case live breaks.)

## 6. Team

- **Anosha** and **Mariam** — two-person team, tasks split so both work across backend and frontend every phase (see `anosha.md` / `mariam.md`).
