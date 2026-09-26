/**
 * server.js
 * ---------
 * Entrypoint for the demo monolith. Deliberately minimal — this is Bob's
 * target, not a real product (see project-context.md §4).
 */

const express = require('express');
const cors = require('cors');

const usersRouter = require('./users');
const paymentsRouter = require('./payments').router;

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'monolith' }));

app.use('/users', usersRouter);
app.use('/payments', paymentsRouter);

const PORT = process.env.PORT || 4000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[monolith] listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
