/**
 * db.js
 * -----
 * DELIBERATE COUPLING POINT #2 (Tier 1 DB coupling).
 *
 * This is a single shared, in-memory "data layer" imported directly by both
 * monolith/users/ and monolith/payments/. In a real system this would be a
 * shared database/ORM instance; here it's a plain in-memory store so the demo
 * has zero external dependencies (no real DB to run/query on stage).
 *
 * Both modules read AND write this same object — that's the coupling madge's
 * import graph plus our Tier 1 schema.json overlay are meant to surface.
 */

// --- Users table -----------------------------------------------------------
const users = [
  { id: 1, name: 'Ada Lovelace', email: 'ada@example.com' },
  { id: 2, name: 'Grace Hopper', email: 'grace@example.com' },
];

// --- Payments table ----------------------------------------------------------
// Payments.userId is the foreign_key-style relation mirrored in
// graph-service/schema.json (see contracts.md §2).
const payments = [
  { id: 1, userId: 1, amount: 42.5 },
];

let nextUserId = users.length + 1;
let nextPaymentId = payments.length + 1;

function getUsers() {
  return users;
}

function getUserById(id) {
  return users.find((u) => u.id === Number(id));
}

function addUser({ name, email }) {
  const user = { id: nextUserId++, name, email };
  users.push(user);
  return user;
}

function getPayments() {
  return payments;
}

function getPaymentsByUserId(userId) {
  return payments.filter((p) => p.userId === Number(userId));
}

function addPayment({ userId, amount }) {
  const payment = { id: nextPaymentId++, userId: Number(userId), amount };
  payments.push(payment);
  return payment;
}

module.exports = {
  getUsers,
  getUserById,
  addUser,
  getPayments,
  getPaymentsByUserId,
  addPayment,
};
