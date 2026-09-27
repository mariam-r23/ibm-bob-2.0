/**
 * carveOutApi.js
 * --------------
 * Sends the §3 Carve-Out Request shape to the Bob trigger endpoint.
 *
 * POST /api/carve-out
 * Body: { action, targetModule, timestamp }  (contracts.md §3)
 *
 * Returns the parsed JSON response (or throws on network/HTTP error).
 * When mariam/carve-out-engine is merged, nothing in this file needs to
 * change — just make sure the endpoint is reachable via the Vite proxy.
 */

const CARVE_OUT_URL = '/api/carve-out';

/**
 * @param {string} targetModule  The module id to carve out (e.g. "payments").
 * @returns {Promise<object>}    Parsed response body.
 */
export async function sendCarveOutRequest(targetModule) {
  const body = {
    action: 'carve_out',
    targetModule,
    timestamp: new Date().toISOString(),
  };

  const res = await fetch(CARVE_OUT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Carve-out request failed (${res.status}): ${text}`);
  }

  return res.json();
}
