/**
 * main.js
 * -------
 * Standalone entrypoint for the extracted payments microservice.
 * Runs on port 4200 (see docs/contracts.md §5 and AGENTS.md).
 */
const express = require('express');
const cors = require('cors');
const { router: paymentsRouter } = require('./index');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'payments-service' }));
app.use('/payments', paymentsRouter);

const PORT = process.env.PORT || 4200;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[payments-service] listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
