# Contracts
### The single source of truth for every shape shared across frontend / backend / Bob output

Both of you watch this file. If you change a shape here, tag the commit `[CONTRACT]` and message the other person **before** pushing (see `developmentflow.md` §4).

---

## 1. Code Dependency Graph (backend → frontend)

Produced by the graph-service after running `madge` against `monolith/`.

```json
{
  "nodes": [
    { "id": "users", "label": "users", "type": "module" },
    { "id": "payments", "label": "payments", "type": "module" }
  ],
  "edges": [
    { "source": "users", "target": "payments", "type": "import" }
  ]
}
```

- `type` on a node is currently always `"module"` (Tier 1 DB nodes are a separate shape, merged client-side — see §2).
- `type` on an edge is `"import"` for now. Reserved future value: `"shared-data"` for the `db.js` coupling if we decide to surface it as its own edge type instead of a schema relation.

## 2. DB Schema Graph — Tier 1 (backend → frontend)

Read from `graph-service/schema.json`, rendered as extra nodes/edges on the same canvas.

```json
{
  "tables": [
    { "id": "Users", "fields": ["id", "name", "email"] },
    { "id": "Payments", "fields": ["id", "userId", "amount"] }
  ],
  "relations": [
    { "from": "Payments", "to": "Users", "type": "foreign_key", "field": "userId" }
  ]
}
```

- Frontend merges this with §1's graph: table nodes get `type: "table"`, relations render as a distinct edge style from code imports.

## 3. Carve-Out Request (frontend → Bob trigger)

Sent when the user clicks "Carve Out with Bob" on a selected node.

```json
{
  "action": "carve_out",
  "targetModule": "payments",
  "timestamp": "2026-09-26T12:00:00Z"
}
```

- `targetModule` is constrained to `"payments"` for the live demo (see requirements.md non-goals), but the shape supports any module id.

## 4. Carve-Out Result / Task Log (Bob execution → frontend)

Streamed or polled while Bob runs the carve-out task.

```json
{
  "status": "in_progress",
  "steps": [
    { "step": "copy_module", "status": "done" },
    { "step": "scaffold_service", "status": "done" },
    { "step": "rewrite_imports_to_http", "status": "in_progress" },
    { "step": "generate_contract_tests", "status": "pending" },
    { "step": "generate_split_schema", "status": "pending" },
    { "step": "generate_data_access_layer", "status": "pending" },
    { "step": "generate_migration_plan", "status": "pending" }
  ],
  "generatedFiles": [
    "extracted-services/payments/main.js",
    "extracted-services/payments/Dockerfile",
    "extracted-services/payments/schema.json",
    "extracted-services/payments/data-access.js",
    "extracted-services/payments/MIGRATION.md"
  ]
}
```

- `status` is one of `"in_progress" | "success" | "error"`.
- `steps[].status` is one of `"pending" | "in_progress" | "done" | "error"`.
- The last three `generatedFiles` entries (`schema.json`, `data-access.js`, `MIGRATION.md`) are the Tier 2 database-coupling deliverables — generated files only, never executed against a live database.

## 5. Generated Microservice File Manifest (Bob output → results/diff viewer)

What the results/diff view expects to find and display after a successful carve-out:

| File | Purpose |
|---|---|
| `extracted-services/payments/main.js` | New standalone service entrypoint |
| `extracted-services/payments/Dockerfile` | Container definition for the new service |
| `extracted-services/payments/schema.json` | Tier 2: split-out schema for `Payments` |
| `extracted-services/payments/data-access.js` | Tier 2: data-access layer for the new service |
| `extracted-services/payments/MIGRATION.md` | Tier 2: human-readable migration plan (not executed) |
| `monolith/users/index.js` (modified) | Direct import replaced with an HTTP client call |
| `tests/payments-contract.test.js` | Auto-generated contract/integration test |
