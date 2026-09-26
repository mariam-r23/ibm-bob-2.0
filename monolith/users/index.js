/**
 * users/index.js
 * --------------
 * DELIBERATE COUPLING POINT #1 (code-level).
 *
 * This module directly `require()`s payments/ and calls its exported
 * processPayment() function as a normal in-process JS call. This is exactly
 * the kind of "spaghetti link" that makes monoliths hard to split by hand —
 * madge surfaces it as a users -> payments import edge, and Bob's carve-out
 * task (Phase 2) rewrites the call below into an HTTP client call against
 * the new extracted-services/payments service.
 */

const express = require('express');
const db = require('../db');
const { processPayment } = require('../payments'); // <-- direct in-process import

const router = express.Router();

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
 * Sign-up flow that also charges an initial fee — this is the realistic
 * "business reason" the two modules ended up coupled: a user action needs to
 * trigger a payment, and the shortest path was a direct function call.
 */
router.post('/:id/charge', (req, res) => {
  const { amount } = req.body;
  try {
    // >>> COUPLING POINT #1: direct in-process call into payments/ <<<
    const payment = processPayment(req.params.id, amount);
    res.status(201).json(payment);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
