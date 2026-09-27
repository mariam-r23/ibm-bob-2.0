# Payments Service — Production Migration Plan

> **Documentation only.** This document describes what a real migration would
> require. Nothing in this file creates, connects to, or executes against an
> actual database.

---

## Context

The Payments data currently lives inside the **shared monolith store** (`monolith/db.js`),
alongside Users data. The goal is to move Payments into its own isolated data
store owned exclusively by the `extracted-services/payments` service, matching
the schema defined in `extracted-services/payments/schema.json`.

---

## Migration Phases

### Phase 1 — Dual-Write

**Goal:** Ensure zero data loss during the transition window.

1. Update the monolith's payments write path to write to **both** the old shared
   store and the new Payments service store simultaneously.
2. Deploy this dual-write version to production.
3. Monitor both stores to confirm writes are arriving in both locations and the
   records are consistent (same `id`, `userId`, `amount`).

Duration: run until the backfill in Phase 2 is verified complete and the team
is confident in the new store's write path.

---

### Phase 2 — Backfill

**Goal:** Populate the new Payments store with all historical records that
existed before dual-write began.

1. Write a one-off migration script that reads every row from the old shared
   Payments table and inserts it into the new store, preserving original `id`
   values to avoid duplicate entries.
2. Run the script against a **staging copy** of production data first and verify
   row counts and spot-check individual records.
3. Run the script against production during a low-traffic window.
4. After the run, confirm row counts in the old store and the new store match.

---

### Phase 3 — Read Cutover

**Goal:** Switch all read traffic to the new Payments store.

1. Update any service or endpoint that reads payments data to point at the new
   Payments service instead of the old shared store.
2. Keep the dual-write still active.
3. Run smoke tests and verify that payment reads return correct data.

---

### Phase 4 — Write Cutover & Dual-Write Removal

**Goal:** Remove the old write path entirely.

1. Once read cutover has been stable for an agreed observation period (e.g.
   48 hours with no anomalies), remove the dual-write logic from the monolith.
2. The monolith's payments write path now calls the Payments service over HTTP
   (already implemented via `rewrite_imports_to_http`).
3. Deploy and re-run smoke tests.

---

### Phase 5 — Old Store Cleanup

**Goal:** Remove the Payments data from the shared monolith store.

1. Drop the `payments` table / collection from the shared store (or, for the
   in-memory demo, remove the `payments` array and related functions from
   `monolith/db.js`).
2. Confirm no remaining code references the old Payments data path.
3. Archive or delete the migration script used in Phase 2.

---

## Rollback Plan

At any phase prior to Phase 5, rollback is straightforward:

| Phase abandoned | Rollback action |
|---|---|
| Phase 1 (dual-write) | Remove the new write call; revert to single-write to old store. No data loss — old store always had authoritative data. |
| Phase 2 (backfill) | Stop the backfill script. Old store is still authoritative; dual-write keeps it current. |
| Phase 3 (read cutover) | Revert read path to old store. Dual-write ensures old store is still up to date. |
| Phase 4 (write cutover) | Re-enable dual-write; restore the old write path. Old store data is consistent because dual-write was not yet removed. |

Once Phase 5 (old store cleanup) is complete, rollback requires restoring from
a backup. Ensure a verified backup of the shared store is taken immediately
before Phase 5 begins.

---

## Acceptance Criteria

- [ ] Row counts in new Payments store match old shared store after backfill.
- [ ] All payments API endpoints return identical responses before and after
  read cutover (validated by `tests/payments-contract.test.js`).
- [ ] No errors in the Payments service logs during a 48-hour observation window
  post write-cutover.
- [ ] `monolith/db.js` no longer contains any `payments`-related code after
  Phase 5.
