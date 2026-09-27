/**
 * carveOutMock.js
 * ---------------
 * Simulates the streaming §4 Carve-Out Result / Task Log shape while
 * mariam/carve-out-engine isn't merged yet.
 *
 * Usage:
 *   const stop = startMockCarveOut((snapshot) => { ... });
 *   stop(); // cancel early
 *
 * The callback receives the exact §4 JSON shape on every update so the
 * TaskLogPanel component never needs to change when the real stream lands —
 * just swap startMockCarveOut for a real SSE/poll subscriber that calls the
 * same callback with the same shape.
 */

const STEPS = [
  'copy_module',
  'scaffold_service',
  'rewrite_imports_to_http',
  'generate_contract_tests',
  'generate_split_schema',
  'generate_data_access_layer',
  'generate_migration_plan',
];

const GENERATED_FILES = [
  'extracted-services/payments/main.js',
  'extracted-services/payments/Dockerfile',
  'extracted-services/payments/schema.json',
  'extracted-services/payments/data-access.js',
  'extracted-services/payments/MIGRATION.md',
];

/**
 * Builds a fresh §4 snapshot given the index of the step currently
 * in_progress (-1 means nothing started yet, STEPS.length means all done).
 */
function buildSnapshot(activeIndex, overallStatus) {
  return {
    status: overallStatus,
    steps: STEPS.map((step, i) => ({
      step,
      status:
        i < activeIndex ? 'done'
        : i === activeIndex ? 'in_progress'
        : 'pending',
    })),
    generatedFiles: activeIndex >= STEPS.length ? GENERATED_FILES : [],
  };
}

/**
 * Starts the mock simulation.
 * @param {function} onUpdate  Called with a §4 snapshot on each tick.
 * @param {number}   stepMs    How long each step takes (default 1 200 ms).
 * @returns {function}         Call to cancel the simulation early.
 */
export function startMockCarveOut(onUpdate, stepMs = 1200) {
  let active = true;
  let activeIndex = 0;

  // Emit the initial snapshot synchronously so the panel appears immediately.
  onUpdate(buildSnapshot(0, 'in_progress'));

  function tick() {
    if (!active) return;

    activeIndex += 1;

    if (activeIndex >= STEPS.length) {
      // All steps done — emit success snapshot and stop.
      onUpdate(buildSnapshot(STEPS.length, 'success'));
      return;
    }

    onUpdate(buildSnapshot(activeIndex, 'in_progress'));
    setTimeout(tick, stepMs);
  }

  setTimeout(tick, stepMs);

  return function cancel() {
    active = false;
  };
}

/**
 * Convenience: returns a snapshot with one step in the "error" state.
 * Used by the error-scenario test path in App.jsx.
 */
export function buildErrorSnapshot(failingStep = 'rewrite_imports_to_http') {
  const idx = STEPS.indexOf(failingStep);
  return {
    status: 'error',
    steps: STEPS.map((step, i) => ({
      step,
      status:
        i < idx ? 'done'
        : i === idx ? 'error'
        : 'pending',
    })),
    generatedFiles: [],
  };
}
