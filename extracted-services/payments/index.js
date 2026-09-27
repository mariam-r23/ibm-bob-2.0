/**
 * payments/index.js
 * ------------------
 * Self-contained version for the extracted payments microservice.
 * The original monolith/payments/index.js depended on require('../db');
 * that path no longer exists here, so this file embeds an equivalent
 * in-memory store seeded with the same data as monolith/db.js.
 */

const express = require('express');

const router = express.Router();

// --- Embedded in-memory store (mirrors monolith/db.js) ---------------------

const users = [
  { id: 1, name: 'Ada Lovelace', email: 'ada@example.com' },
  { id: 2, name: 'Grace Hopper', email: 'grace@example.com' },
];

const payments = [
  { id: 1, userId: 1, amount: 42.5 },
];

let nextUserId = 3;
let nextPaymentId = 2;

function getUsers() {
  return users;
}

function getUserById(id) {
  return users.find((u) => u.id === Number(id));
}

function addPayment({ userId, amount }) {
  const payment = { id: nextPaymentId++, userId: Number(userId), amount };
  payments.push(payment);
  return payment;
}

function getPayments() {
  return payments;
}

function getPaymentsByUserId(userId) {
  return payments.filter((p) => p.userId === Number(userId));
}

// --- Business logic (identical to monolith/payments/index.js) ---------------

function processPayment(userId, amount) {
  const user = getUserById(userId);
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
  const payment = addPayment({ userId, amount });
  return payment;
}

function listPaymentsForUser(userId) {
  return getPaymentsByUserId(userId);
}

// --- HTTP routes (mounted at /payments in main.js) --------------------------

router.get('/', (req, res) => {
  res.json(getPayments());
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
