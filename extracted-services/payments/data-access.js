/**
 * data-access.js
 * --------------
 * Data-access layer for the standalone Payments service.
 *
 * Replaces the shared monolith/db.js dependency with an in-process store
 * that belongs exclusively to this service. The schema for the Payments
 * table (id, userId, amount) is defined in ./schema.json.
 *
 * No Users data is held here — cross-service lookups go over HTTP.
 */

'use strict';

// In-memory store (mirrors the Payments table defined in schema.json).
const payments = [
  { id: 1, userId: 1, amount: 42.5 },
];

let nextId = payments.length + 1;

/**
 * Return a single payment by its id, or undefined if not found.
 * @param {number|string} id
 * @returns {{ id: number, userId: number, amount: number } | undefined}
 */
function getPayment(id) {
  return payments.find((p) => p.id === Number(id));
}

/**
 * Return all payments, optionally filtered to a single userId.
 * @param {{ userId?: number|string }} [filter]
 * @returns {{ id: number, userId: number, amount: number }[]}
 */
function listPayments(filter = {}) {
  if (filter.userId !== undefined) {
    return payments.filter((p) => p.userId === Number(filter.userId));
  }
  return payments.slice();
}

/**
 * Persist a new payment and return the created record.
 * @param {{ userId: number|string, amount: number }} data
 * @returns {{ id: number, userId: number, amount: number }}
 */
function addPayment({ userId, amount }) {
  const payment = { id: nextId++, userId: Number(userId), amount: Number(amount) };
  payments.push(payment);
  return payment;
}

module.exports = { getPayment, listPayments, addPayment };
