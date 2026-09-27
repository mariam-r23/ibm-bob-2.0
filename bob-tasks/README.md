# bob-tasks/

Task/prompt definitions for the Phase 2 carve-out engine — the thing that
has to run for real inside Bob IDE, not something simulated elsewhere. See
`docs/requirements.md` §4 for why: Bob IDE has to be "clearly the core
mechanism shown in the demo," and the submission needs
`bob_sessions/` screenshots proving real task sessions ran.

## Setup (do this once, first)

1. Confirm your Bob IDE is on **v2.0.2+**. v1.0.3 and v2.0.0 stop working
   Sept 30, 2026 — check this now, not the day of.
2. Bob is a standalone app, not a VS Code extension — open this repo's
   root folder directly in the Bob IDE app (clone it there with Bob's
   built-in git support, or open the folder if you already have it
   checked out).
3. In the Bob chat panel, run `/init`. This reads the actual codebase and
   generates a root `AGENTS.md` + per-mode `AGENTS.md` files in `.bob/` —
   persistent context Bob uses on every task from here on. Approve the
   file-write prompts. This is also a legitimate, capturable piece of
   "Bob usage evidence" for the submission — screenshot it if you want a
   second data point beyond the task summary.
4. That's it — the `carve-out-microservice` skill in `.bob/skills/` is
   picked up automatically. Bob decides when to activate it based on its
   `description` field, or you can invoke it explicitly (the kickoff
   prompt below does).

## Running the carve-out

Open `carve-out-payments-prompt.md` in this folder and paste its prompt
block into Bob IDE, in **Agent mode**. That file also covers what
permission prompts to expect and what to do once it finishes (status
check, session screenshot, docker-compose smoke test).

## Files in this folder

| File | Purpose |
|---|---|
| `carve-out-payments-prompt.md` | The actual prompt to paste into Bob IDE, plus what to approve and what to do after. |
| `carve-out-status.json` | Written by Bob while the task runs — matches `contracts.md` §4. Appears once you've run the task at least once; not committed until then. |

The step-by-step plan itself lives in
`.bob/skills/carve-out-microservice/SKILL.md`, not here — that's the
reusable, Bob-native place for it (Bob auto-activates skills by their
description), rather than a plain instructions file Bob has no structured
way to discover on its own.

## Budget

40 Bobcoins each (80 total), ring-fenced for this step specifically per
`project-context.md`. Approve Bob's plan before it runs (Plan mode, or the
plan preview in Agent mode) and check it's scoped to the four steps in the
skill — not refactoring anything outside `extracted-services/payments/`,
`monolith/users/`, `bob-tasks/`, `tests/`, and `docker-compose.yml`.
