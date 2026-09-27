# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Documentation Context (Non-Obvious)

- **`docs/contracts.md` is the authoritative spec** — every JSON shape (code graph, schema graph, carve-out status, file manifest) is defined there. When answering questions about request/response shapes, cite contracts.md, not the source code.
- **`bob-tasks/` contains the actual prompts to paste into Bob IDE** — not code Bob runs automatically. Bob doesn't poll this folder; the carve-out is initiated by a human pasting `carve-out-payments-prompt.md` into Bob's chat.
- **`.bob/skills/carve-out-microservice/SKILL.md`** is Bob's step-by-step execution plan for the carve-out — Bob activates it automatically from the `description` field in the frontmatter when matching keywords are in the prompt.
- The DB coupling is **simulated** via a hand-authored `graph-service/schema.json` — there is no live database, no ORM, and no migration tooling anywhere in this project.
- **`bob_sessions/`** is for submission screenshots of real Bob task consumption summaries, not code. It starts empty and is populated after running the carve-out task.
- The carve-out target is **permanently `payments`** for the demo — requirements.md explicitly lists supporting arbitrary modules as a non-goal.
- The graph API returns an additive `meta.filesScanned` field and per-node `files[]` array — these are not in `contracts.md §1`'s minimum shape but are present in real responses. Frontend code that reads these fields is safe.
