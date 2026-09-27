# Carve-out kickoff prompt

Paste this into Bob IDE's chat, in **Agent mode**, after running `/init`
once for this project (see `bob-tasks/README.md`). This is intentionally
short — Bob's own docs recommend short, actionable prompts over giant
multi-step blocks; the actual step-by-step plan lives in the
`carve-out-microservice` skill, which this prompt invokes.

---

```
Carve out the payments module from monolith/ into a standalone
microservice, using the carve-out-microservice skill. Reference
@docs/contracts.md for the exact shapes to produce and
@monolith/payments/index.js and @monolith/users/index.js as the code
being extracted and rewritten.

Use a subagent to scaffold the new service (extracted-services/payments/)
in parallel with rewriting the import in monolith/users/index.js — those
two are independent. Keep me updated in bob-tasks/carve-out-status.json
as you go.

Once the service is scaffolded and the import is rewritten, generate and
actually run the contract test — don't mark this done until it passes
against both services running together.
```

---

## What to expect / approve

Bob will likely ask permission for several tool categories as it works —
approve each when it makes sense for what you asked:
- **Skill tools** — to activate `carve-out-microservice`.
- **Subagent tools** — for the parallel scaffold step.
- **Edit tools** — to write the new service files and rewrite
  `monolith/users/index.js`.

If Bob's plan (shown before it starts, in Plan mode if it switches there
first) looks like it's doing more than the four steps in the skill —
touching files outside `extracted-services/payments/`, `monolith/users/`,
`bob-tasks/`, `tests/`, and `docker-compose.yml` — stop and re-scope before
approving. That's the fastest way to blow through Bobcoins on work outside
the ring-fenced budget.

## After it finishes

1. Screenshot the task session consumption summary (Bob IDE → Tasks →
   select the task → click the header) and save it as
   `bob_sessions/mariam_task01_carve_out_payments_summary.png` —
   `project-context.md`'s naming convention, do this the same session,
   don't leave it for later.
2. Confirm `bob-tasks/carve-out-status.json` shows `"status": "success"`.
3. Run `docker-compose up` and confirm all three services come up clean.
4. Hand off to Anosha — she wires the "Carve Out with Bob" button and live
   log panel to this same status file.
