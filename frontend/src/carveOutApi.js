/**
 * carveOutApi.js
 * --------------
 * Reads the real Carve-Out result (contracts.md §4 shape) that Mariam's
 * carve-out engine already produced by actually running the Bob task once.
 *
 * This is a one-time, pre-recorded result, not a live re-run — see
 * bob-tasks/carve-out-status.json (copied to frontend/public/ so Vite
 * can serve it as a static file).
 *
 * Same function signature as before, so App.jsx doesn't need to change.
 */

const CARVE_OUT_STATUS_URL = '/carve-out-status.json';

/**
 * @param {string} targetModule  The module id to carve out (e.g. "payments").
 * @returns {Promise<object>}    Parsed response body, matching contracts.md §4.
 */
export async function sendCarveOutRequest(targetModule) {
  const res = await fetch(CARVE_OUT_STATUS_URL);

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to load carve-out result (${res.status}): ${text}`);
  }

  return res.json();
}

/**
 * playCarveOutResult(onUpdate)
 * -----------------------------
 * Fetches the real §4 result (from Mariam's actual carve-out run) and
 * replays it step-by-step, same interface as startMockCarveOut, so
 * App.jsx doesn't need structural changes — just swap which function
 * it calls.
 *
 * Returns a cancel() function, same as the mock did.
 */
export function playCarveOutResult(onUpdate) {
  let cancelled = false;

  async function run() {
    let result;
    try {
      result = await sendCarveOutRequest();
    } catch (err) {
      if (!cancelled) {
        onUpdate({ status: 'error', steps: [], generatedFiles: [], error: err.message });
      }
      return;
    }

    const steps = result.steps || [];
    for (let i = 0; i < steps.length; i++) {
      if (cancelled) return;
      const partialSteps = steps.map((s, idx) => ({
        ...s,
        status: idx < i ? s.status : idx === i ? 'in_progress' : 'pending',
      }));
      onUpdate({ status: 'in_progress', steps: partialSteps, generatedFiles: [] });
      await new Promise((r) => setTimeout(r, 500));
    }

    if (cancelled) return;
    onUpdate(result); // final real snapshot — status: "success", full steps + generatedFiles
  }

  run();

  return () => {
    cancelled = true;
  };
}