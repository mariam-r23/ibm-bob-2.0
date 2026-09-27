import React, { useState, useEffect } from 'react';

/**
 * DiffViewer
 * ----------
 * Shows the §5 generated file manifest, the real before/after diff of the
 * monolith/users/index.js import coupling line, and (Phase 3) a before/after
 * comparison of the DB schema — original coupled schema vs. the split-out
 * Tier 2 schema Bob generated for the extracted service.
 *
 * Props:
 *   generatedFiles  {string[]}  From the §4 snapshot's generatedFiles array.
 *   onClose         {function}  Called when the user dismisses the panel.
 *
 * BEFORE_LINE / AFTER_LINE mirror the actual content of
 * monolith/users/index.js's rewritten /:id/charge handler — not an invented
 * example. If that file's rewrite approach ever changes, update these two
 * constants to match, since this panel is meant to be verifiable against the
 * real source, not just illustrative.
 */

// contracts.md §5 — full manifest with purpose labels
const FILE_MANIFEST = [
  { file: 'extracted-services/payments/main.js',         purpose: 'New standalone service entrypoint' },
  { file: 'extracted-services/payments/Dockerfile',      purpose: 'Container definition for the new service' },
  { file: 'extracted-services/payments/schema.json',     purpose: 'Tier 2: split-out schema for Payments' },
  { file: 'extracted-services/payments/data-access.js',  purpose: 'Tier 2: data-access layer for the new service' },
  { file: 'extracted-services/payments/MIGRATION.md',    purpose: 'Tier 2: human-readable migration plan (not executed)' },
  { file: 'monolith/users/index.js',                     purpose: 'Direct import replaced with an HTTP client call' },
  { file: 'tests/payments-contract.test.js',             purpose: 'Auto-generated contract/integration test' },
];

// Matches the actual monolith/users/index.js POST /:id/charge handler —
// verify against that file if this ever looks stale.
const BEFORE_LINE = `const { processPayment } = require('../payments'); // <-- direct in-process import

router.post('/:id/charge', (req, res) => {
  const { amount } = req.body;
  const payment = processPayment(req.params.id, amount);
  res.status(201).json(payment);
});`;

const AFTER_LINE = `const PAYMENTS_SERVICE_URL =
  process.env.PAYMENTS_SERVICE_URL || 'http://payments-service:4200';

router.post('/:id/charge', async (req, res) => {
  const { amount } = req.body;
  const response = await fetch(\`\${PAYMENTS_SERVICE_URL}/payments\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.params.id, amount }),
  });
  const data = await response.json();
  res.status(response.status).json(data);
});`;

const SPLIT_SCHEMA_URL = '/api/schema/split';

export default function DiffViewer({ generatedFiles, onClose }) {
  const [tab, setTab] = useState('manifest'); // 'manifest' | 'diff' | 'schema'
  const [splitSchema, setSplitSchema] = useState(null);
  const [splitSchemaError, setSplitSchemaError] = useState(null);

  // Fetch the Tier 2 split schema lazily, once, when the schema tab is
  // first opened — no point fetching it if the viewer never opens that tab.
  useEffect(() => {
    if (tab !== 'schema' || splitSchema || splitSchemaError) return;
    let cancelled = false;
    fetch(SPLIT_SCHEMA_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setSplitSchema(data);
      })
      .catch((err) => {
        if (!cancelled) setSplitSchemaError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, splitSchema, splitSchemaError]);

  return (
    <div className="dv-panel" aria-label="Results and diff viewer">
      <div className="dv-panel__header">
        <span className="dv-panel__title">Results</span>
        <div className="dv-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === 'manifest'}
            className={`dv-tab${tab === 'manifest' ? ' dv-tab--active' : ''}`}
            onClick={() => setTab('manifest')}
          >
            Generated files
          </button>
          <button
            role="tab"
            aria-selected={tab === 'diff'}
            className={`dv-tab${tab === 'diff' ? ' dv-tab--active' : ''}`}
            onClick={() => setTab('diff')}
          >
            Import diff
          </button>
          <button
            role="tab"
            aria-selected={tab === 'schema'}
            className={`dv-tab${tab === 'schema' ? ' dv-tab--active' : ''}`}
            onClick={() => setTab('schema')}
          >
            DB schema
          </button>
        </div>
        <button className="dv-panel__close" onClick={onClose} aria-label="Close results">
          ✕
        </button>
      </div>

      {tab === 'manifest' && (
        <div className="dv-manifest" role="tabpanel">
          <table className="dv-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Purpose</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {FILE_MANIFEST.map(({ file, purpose }) => {
                const generated = generatedFiles.includes(file);
                return (
                  <tr key={file} className={generated ? 'dv-row--generated' : ''}>
                    <td className="dv-row__file"><code>{file}</code></td>
                    <td className="dv-row__purpose">{purpose}</td>
                    <td className="dv-row__status">
                      {generated
                        ? <span className="dv-badge dv-badge--done">✓ generated</span>
                        : <span className="dv-badge dv-badge--pending">pending</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'diff' && (
        <div className="dv-diff" role="tabpanel">
          <div className="dv-diff__filename">
            <code>monolith/users/index.js</code>
            <span className="dv-diff__label">coupling point #1 — direct import → HTTP client</span>
          </div>
          <div className="dv-diff__panes">
            <div className="dv-diff__pane">
              <div className="dv-diff__pane-header dv-diff__pane-header--before">Before</div>
              <pre className="dv-diff__code dv-diff__code--removed">{BEFORE_LINE}</pre>
            </div>
            <div className="dv-diff__pane">
              <div className="dv-diff__pane-header dv-diff__pane-header--after">After</div>
              <pre className="dv-diff__code dv-diff__code--added">{AFTER_LINE}</pre>
            </div>
          </div>
        </div>
      )}

      {tab === 'schema' && (
        <div className="dv-diff" role="tabpanel">
          <div className="dv-diff__filename">
            <code>Payments table</code>
            <span className="dv-diff__label">coupling point #2 — shared db.js → isolated data store</span>
          </div>
          <div className="dv-diff__panes">
            <div className="dv-diff__pane">
              <div className="dv-diff__pane-header dv-diff__pane-header--before">
                Before (graph-service/schema.json — Tier 1)
              </div>
              <div className="dv-schema-card">
                <div className="dv-schema-card__title">Payments</div>
                <ul className="dv-schema-card__fields">
                  <li>id</li>
                  <li>userId</li>
                  <li>amount</li>
                </ul>
                <div className="dv-schema-card__relation dv-schema-card__relation--coupled">
                  ⚠ foreign_key → Users.id (userId)
                </div>
              </div>
            </div>
            <div className="dv-diff__pane">
              <div className="dv-diff__pane-header dv-diff__pane-header--after">
                After (extracted-services/payments/schema.json — Tier 2)
              </div>
              {!splitSchema && !splitSchemaError && (
                <div className="dv-schema-card dv-schema-card--loading">Loading…</div>
              )}
              {splitSchemaError && (
                <div className="dv-schema-card dv-schema-card--error">
                  Not available yet ({splitSchemaError}) — has the split schema been generated?
                </div>
              )}
              {splitSchema && (
                <div className="dv-schema-card">
                  {splitSchema.tables.map((t) => (
                    <React.Fragment key={t.id}>
                      <div className="dv-schema-card__title">{t.id}</div>
                      <ul className="dv-schema-card__fields">
                        {t.fields.map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                    </React.Fragment>
                  ))}
                  <div className="dv-schema-card__relation dv-schema-card__relation--isolated">
                    ✓ no DB relation to Users — cross-service data now goes over HTTP only
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
