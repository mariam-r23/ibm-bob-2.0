import React, { useState } from 'react';

/**
 * DiffViewer
 * ----------
 * Shows the §5 generated file manifest and a before/after diff of the
 * monolith/users/index.js import coupling line.
 *
 * Props:
 *   generatedFiles  {string[]}  From the §4 snapshot's generatedFiles array.
 *   onClose         {function}  Called when the user dismisses the panel.
 *
 * The before/after content is hard-coded because:
 *   a) The monolith/users/index.js is a static demo file (contracts.md §5).
 *   b) The "after" is what Bob's rewrite_imports_to_http step produces.
 *   c) When the real file-read endpoint exists, just swap the constants below.
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

// Exact coupling line from monolith/users/index.js
const BEFORE_LINE = `const { processPayment } = require('../payments'); // <-- direct in-process import`;

// What Bob's rewrite_imports_to_http step emits
const AFTER_LINE = `const axios = require('axios'); // HTTP client — payments is now an extracted service
// processPayment via HTTP:
async function processPayment(userId, amount) {
  const res = await axios.post('http://payments-service/payments', { userId, amount });
  return res.data;
}`;

export default function DiffViewer({ generatedFiles, onClose }) {
  const [tab, setTab] = useState('manifest'); // 'manifest' | 'diff'

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
    </div>
  );
}
