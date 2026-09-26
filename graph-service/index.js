/**
 * graph-service/index.js
 * -----------------------
 * Small Express API that:
 *   1. Runs `madge` (the library, not shelling out to the CLI) against
 *      ../monolith to get a real file-level dependency graph, then collapses
 *      it into the module-level "Code Dependency Graph" shape defined in
 *      docs/contracts.md §1.
 *   2. Reads schema.json and serves it as-is — that's the Tier 1
 *      "DB Schema Graph" shape from docs/contracts.md §2. The frontend
 *      merges the two client-side.
 *
 * No custom AST parsing here — madge does 100% of the code-graph extraction
 * (see requirements.md non-goals). This file only reshapes madge's output
 * into the contract shape and serves it over HTTP.
 */

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const madge = require('madge');

const app = express();
app.use(cors());

const MONOLITH_PATH = path.join(__dirname, '..', 'monolith');
const SCHEMA_PATH = path.join(__dirname, 'schema.json');

/**
 * Given a file path relative to monolith/ (e.g. "users/index.js" or
 * "db.js"), return the "module" it belongs to, or null if it's not part of
 * a module folder (e.g. top-level server.js, db.js).
 *
 * Only top-level directories count as modules for the Phase 1 code graph —
 * this keeps the graph at the "users / payments" granularity contracts.md
 * expects, rather than one node per file.
 */
function moduleForFile(filePath) {
  // madge always returns paths with forward slashes, regardless of host OS —
  // splitting on path.sep breaks this on Windows (path.sep === '\\'), which
  // silently drops every module node and import edge. Split on either
  // separator to be safe on every platform.
  const parts = filePath.split(/[\\/]/);
  if (parts.length < 2) return null; // top-level file (server.js, db.js) — not a module node
  return parts[0];
}

/**
 * Collapse madge's file-level dependency object into the module-level
 * { nodes, edges } shape from contracts.md §1.
 *
 * madgeResult shape: { "users/index.js": ["db.js", "payments/index.js"], ... }
 */
function toModuleGraph(madgeResult) {
  const moduleIds = new Set();
  const edgeSet = new Map(); // "source->target" -> edge
  const filesByModule = new Map(); // module id -> Set of filenames within it

  for (const file of Object.keys(madgeResult)) {
    const fromModule = moduleForFile(file);
    if (fromModule) {
      moduleIds.add(fromModule);
      if (!filesByModule.has(fromModule)) filesByModule.set(fromModule, new Set());
      // store just the filename within the module, e.g. "index.js", not the
      // full "users/index.js" — the module id is already the node label.
      filesByModule.get(fromModule).add(file.split(/[\\/]/).slice(1).join('/'));
    }

    for (const dep of madgeResult[file]) {
      const toModule = moduleForFile(dep);
      if (toModule) moduleIds.add(toModule);

      if (fromModule && toModule && fromModule !== toModule) {
        const key = `${fromModule}->${toModule}`;
        if (!edgeSet.has(key)) {
          edgeSet.set(key, { source: fromModule, target: toModule, type: 'import' });
        }
      }
    }
  }

  const nodes = Array.from(moduleIds)
    .sort()
    .map((id) => ({
      id,
      label: id,
      type: 'module',
      // Additive field beyond contracts.md §1's minimum shape — real file
      // list per module, straight from madge's own scan, so the UI can show
      // actual file contents instead of just a bare module name.
      files: Array.from(filesByModule.get(id) ?? []).sort(),
    }));
  const edges = Array.from(edgeSet.values());

  // filesScanned is additive metadata (not part of contracts.md §1's shape,
  // which only requires nodes/edges) — it's the real count of files madge
  // actually walked, used to back up the "X files scanned" stat in the UI
  // with a real number instead of a made-up one.
  const filesScanned = Object.keys(madgeResult).length;

  return { nodes, edges, meta: { filesScanned } };
}

// GET /api/graph — Code Dependency Graph (contracts.md §1)
app.get('/api/graph', async (req, res) => {
  try {
    const result = await madge(MONOLITH_PATH, {
      fileExtensions: ['js'],
      excludeRegExp: [/node_modules/],
    });
    const moduleGraph = toModuleGraph(result.obj());
    res.json(moduleGraph);
  } catch (err) {
    console.error('[graph-service] madge run failed:', err);
    res.status(500).json({ error: 'failed to build dependency graph', detail: err.message });
  }
});

// GET /api/schema — Tier 1 DB Schema Graph (contracts.md §2)
app.get('/api/schema', (req, res) => {
  try {
    const raw = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    res.json(JSON.parse(raw));
  } catch (err) {
    console.error('[graph-service] failed to read schema.json:', err);
    res.status(500).json({ error: 'failed to read schema', detail: err.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'graph-service' }));

const PORT = process.env.PORT || 4100;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[graph-service] listening on http://localhost:${PORT}`);
    console.log(`[graph-service] watching monolith at ${MONOLITH_PATH}`);
  });
}

module.exports = app;
