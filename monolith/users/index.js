/**
 * users/index.js
 * --------------
 * DELIBERATE COUPLING POINT #1 — REWRITTEN by MonoSplitter AI carve-out.
 *
 * The direct in-process `require('../payments')` / `processPayment()` call
 * has been replaced with an HTTP client call to the extracted
 * payments-service at http://payments-service:4200 (docker-compose hostname).
 * External behavior (request/response shapes, status codes) is unchanged —
 * verified by tests/payments-contract.test.js.
 */

const express = require('express');
const db = require('../db');

const router = express.Router();

const PAYMENTS_SERVICE_URL = process.env.PAYMENTS_SERVICE_URL || 'http://payments-service:4200';

// --- HTTP routes (mounted at /users in monolith/server.js) -----------------

router.get('/', (req, res) => {
  res.json(db.getUsers());
});

router.get('/:id', (req, res) => {
  const user = db.getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'user not found' });
  res.json(user);
});

router.post('/', (req, res) => {
  const { name, email } = req.body;
  const user = db.addUser({ name, email });
  res.status(201).json(user);
});

/**
 * Sign-up flow that also charges an initial fee.
 * Previously called processPayment() in-process (coupling #1).
 * Now delegates to the extracted payments-service over HTTP.
 */
router.post('/:id/charge', async (req, res) => {
  const { amount } = req.body;
  try {
    const response = await fetch(`${PAYMENTS_SERVICE_URL}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: req.params.id, amount }),
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    res.status(201).json(data);
  } catch (err) {
    res.status(502).json({ error: 'payments-service unreachable', detail: err.message });
  }
});

module.exports = router;
