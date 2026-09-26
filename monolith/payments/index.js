/**
 * payments/index.js
 * ------------------
 * The module that gets carved out into extracted-services/payments/ in Phase 2.
 *
 * processPayment() is imported and called DIRECTLY (in-process function call,
 * not HTTP) by monolith/users/index.js — that's DELIBERATE COUPLING POINT #1.
 * madge will surface this as a users -> payments edge in the code dependency
 * graph; Bob's carve-out task rewrites the call site in users/index.js into
 * an HTTP client call against the new standalone service.
 */

const express = require('express');
const db = require('../db');

const router = express.Router();

/**
 * Core business logic. Exported so users/index.js can call it in-process
 * today. After carve-out, this same logic lives inside
 * extracted-services/payments/main.js and is reached over HTTP instead.
 */
function processPayment(userId, amount) {
  const user = db.getUserById(userId);
  if (!user) {
    const err = new Error(`No such user: ${userId}`);
    err.status = 404;
    throw err;
  }
  if (typeof amount !== 'number' || amount <= 0) {
    const err = new Error('amount must be a positive number');
    err.status = 400;
    throw err;
  }
  const payment = db.addPayment({ userId, amount });
  return payment;
}

function listPaymentsForUser(userId) {
  return db.getPaymentsByUserId(userId);
}

// --- HTTP routes (mounted at /payments in monolith/server.js) --------------

router.get('/', (req, res) => {
  res.json(db.getPayments());
});

router.post('/', (req, res) => {
  try {
    const { userId, amount } = req.body;
    const payment = processPayment(userId, amount);
    res.status(201).json(payment);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/user/:userId', (req, res) => {
  res.json(listPaymentsForUser(req.params.userId));
});

module.exports = {
  router,
  processPayment,
  listPaymentsForUser,
};
