/**
 * tests/payments-contract.test.js
 * --------------------------------
 * Contract / behavior-parity test for the payments carve-out (Phase 2).
 *
 * Verifies that the extracted payments-service (extracted-services/payments/)
 * produces the same response shape and status codes that the old in-process
 * monolith/payments/processPayment() call produced before the rewrite.
 *
 * Run with:
 *   node tests/payments-contract.test.js
 *
 * The test starts both services itself (monolith on :4000, payments-service
 * on :4200) so it doesn't need docker-compose or any pre-running processes.
 * The monolith is started with PAYMENTS_SERVICE_URL=http://localhost:4200 so
 * its /users/:id/charge route talks to the local payments-service instance
 * rather than the docker-compose hostname (payments-service:4200).
 *
 * Exit 0 = all assertions passed.
 * Exit 1 = at least one assertion failed (details printed to stdout).
 */

'use strict';

const assert = require('assert');
const { spawn } = require('child_process');
const path = require('path');

// ── helpers ──────────────────────────────────────────────────────────────────

function startService(cwd, mainFile, port, env = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      process.execPath,
      [mainFile],
      {
        cwd,
        env: { ...process.env, PORT: String(port), ...env },
        stdio: 'pipe',
      }
    );

    proc.stderr.on('data', (d) => process.stderr.write(d));

    const timeout = setTimeout(() => reject(new Error(`${mainFile} on :${port} did not start in time`)), 8000);

    proc.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      process.stdout.write(text);
      if (text.includes(`localhost:${port}`)) {
        clearTimeout(timeout);
        resolve(proc);
      }
    });

    proc.on('error', reject);
  });
}

async function waitForHealth(url, retries = 10, delayMs = 300) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch (_) { /* not up yet */ }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error(`Health check timed out: ${url}`);
}

async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, body: data };
}

// ── test runner ───────────────────────────────────────────────────────────────

async function run() {
  let monolithProc, paymentsProc;
  let failures = 0;

  function check(label, actual, expected) {
    try {
      assert.deepStrictEqual(actual, expected);
      console.log(`  ✓ ${label}`);
    } catch (err) {
      console.error(`  ✗ ${label}`);
      console.error(`    expected: ${JSON.stringify(expected)}`);
      console.error(`    actual:   ${JSON.stringify(actual)}`);
      failures++;
    }
  }

  function checkShape(label, actual, requiredKeys) {
    const missing = requiredKeys.filter((k) => !(k in actual));
    if (missing.length === 0) {
      console.log(`  ✓ ${label}`);
    } else {
      console.error(`  ✗ ${label} — missing keys: ${missing.join(', ')}`);
      failures++;
    }
  }

  try {
    // --- Start services -------------------------------------------------------
    console.log('\n[contract-test] starting payments-service on :4200…');
    paymentsProc = await startService(
      path.join(__dirname, '..', 'extracted-services', 'payments'),
      'main.js',
      4200
    );
    await waitForHealth('http://localhost:4200/health');
    console.log('[contract-test] payments-service up.');

    console.log('[contract-test] starting monolith on :4000 (PAYMENTS_SERVICE_URL=http://localhost:4200)…');
    monolithProc = await startService(
      path.join(__dirname, '..', 'monolith'),
      'server.js',
      4000,
      { PAYMENTS_SERVICE_URL: 'http://localhost:4200' }
    );
    await waitForHealth('http://localhost:4000/health');
    console.log('[contract-test] monolith up.\n');

    // ── Test suite ─────────────────────────────────────────────────────────────

    console.log('Contract test: POST /payments on payments-service (direct)');
    {
      // Happy path — same call that monolith/payments/processPayment() used to handle
      const { status, body } = await post('http://localhost:4200/payments', { userId: 1, amount: 25 });
      check('status 201', status, 201);
      checkShape('response has id, userId, amount', body, ['id', 'userId', 'amount']);
      check('userId echoed back', body.userId, 1);
      check('amount echoed back', body.amount, 25);
    }

    console.log('\nContract test: POST /users/:id/charge on monolith (end-to-end via HTTP rewrite)');
    {
      // Happy path — monolith delegates to payments-service, same response shape
      const { status, body } = await post('http://localhost:4000/users/1/charge', { amount: 10 });
      check('status 201', status, 201);
      checkShape('response has id, userId, amount', body, ['id', 'userId', 'amount']);
      check('amount echoed back', body.amount, 10);
    }

    console.log('\nContract test: error paths — unknown user');
    {
      const { status, body } = await post('http://localhost:4200/payments', { userId: 9999, amount: 5 });
      check('status 404 for unknown user (payments-service direct)', status, 404);
      checkShape('error field present', body, ['error']);
    }
    {
      const { status, body } = await post('http://localhost:4000/users/9999/charge', { amount: 5 });
      // monolith forwards the 404 from payments-service
      check('status 404 for unknown user (via monolith)', status, 404);
      checkShape('error field present', body, ['error']);
    }

    console.log('\nContract test: error paths — invalid amount');
    {
      const { status, body } = await post('http://localhost:4200/payments', { userId: 1, amount: -5 });
      check('status 400 for negative amount (payments-service direct)', status, 400);
      checkShape('error field present', body, ['error']);
    }
    {
      const { status, body } = await post('http://localhost:4000/users/1/charge', { amount: -5 });
      check('status 400 for negative amount (via monolith)', status, 400);
      checkShape('error field present', body, ['error']);
    }

    // ── Summary ─────────────────────────────────────────────────────────────
    console.log('\n─────────────────────────────────────');
    if (failures === 0) {
      console.log('All contract tests passed. ✓');
    } else {
      console.error(`${failures} contract test(s) FAILED.`);
    }

  } finally {
    monolithProc?.kill();
    paymentsProc?.kill();
  }

  if (failures > 0) process.exit(1);
}

run().catch((err) => {
  console.error('[contract-test] fatal error:', err);
  process.exit(1);
});
