/**
 * graphTransform.js
 * -----------------
 * Turns the two backend JSON shapes (contracts.md §1 code graph + §2 DB
 * schema graph) into reactflow's { nodes, edges } shape. This is the client
 * side "merge" contracts.md §2 says should happen: table nodes get
 * type: "table", relation edges render with a distinct style from code
 * import edges.
 *
 * Layout is intentionally simple (two rows) since Phase 1 only ever has a
 * handful of nodes — no layout library needed.
 */

const MODULE_ROW_Y = 40;
const TABLE_ROW_Y = 280;
const COL_SPACING = 340;

/**
 * Every edge in this Phase 1 graph IS one of the two deliberately seeded
 * coupling points (see project-context.md §4) — there's nothing else to
 * show yet. Rather than a generic "import" / "foreign_key" label, name the
 * actual coupling story so the graph reads as evidence, not an abstract
 * diagram. Falls back to the generic contract-shape label for any edge this
 * demo doesn't know about (keeps it from breaking if the monolith grows).
 */
const CODE_COUPLING_NARRATIVES = {
  'users->payments': {
    // Short — sits directly on the canvas edge, has to fit between two node
    // cards. Full story lives in panelTitle/detail, shown in the side panel.
    edgeLabel: 'processPayment()',
    panelTitle: 'processPayment() call — coupling #1',
    detail: 'users/index.js imports payments/ and calls processPayment() directly (in-process, not HTTP)',
  },
};

const DB_COUPLING_NARRATIVES = {
  'Payments->Users': {
    edgeLabel: 'shared db.js (FK)',
    panelTitle: 'shared db.js — coupling #2 (userId FK)',
    detail: 'users/ and payments/ both read/write the same in-memory db.js store',
  },
};

/**
 * Both node types expose a target+source handle on the left AND right side
 * (ids "target-left" / "source-left" / "target-right" / "source-right").
 * Given the x position of two nodes, pick the handle pair that makes the
 * edge exit/enter whichever side actually faces the other node — otherwise
 * an edge can end up leaving from the far side of a box and looping all the
 * way around it to reach its target.
 */
function pickHandles(sourceX, targetX) {
  if (sourceX <= targetX) {
    return { sourceHandle: 'source-right', targetHandle: 'target-left' };
  }
  return { sourceHandle: 'source-left', targetHandle: 'target-right' };
}

export function buildFlowGraph(codeGraph, schemaGraph) {
  const nodes = [];
  const edges = [];
  const xById = new Map();

  const moduleNodes = codeGraph?.nodes ?? [];
  const codeEdges = codeGraph?.edges ?? [];
  const tables = schemaGraph?.tables ?? [];
  const relations = schemaGraph?.relations ?? [];

  // --- Module (code) nodes, top row ---
  moduleNodes.forEach((n, i) => {
    const x = i * COL_SPACING + 40;
    xById.set(n.id, x);
    nodes.push({
      id: n.id,
      position: { x, y: MODULE_ROW_Y },
      data: { label: n.label ?? n.id, kind: 'module', files: n.files ?? [] },
      type: 'moduleNode',
    });
  });

  // --- Code import edges ---
  codeEdges.forEach((e, i) => {
    const { sourceHandle, targetHandle } = pickHandles(
      xById.get(e.source) ?? 0,
      xById.get(e.target) ?? 0
    );
    const narrative = CODE_COUPLING_NARRATIVES[`${e.source}->${e.target}`];
    edges.push({
      id: `import-${e.source}-${e.target}-${i}`,
      source: e.source,
      target: e.target,
      sourceHandle,
      targetHandle,
      label: narrative?.edgeLabel ?? e.type ?? 'import',
      title: narrative?.detail,
      animated: true,
      className: 'flow-edge flow-edge--import flow-edge--coupling',
    });
  });

  // --- DB table nodes, bottom row ---
  tables.forEach((t, i) => {
    const x = i * COL_SPACING + 40;
    xById.set(t.id, x);
    nodes.push({
      id: t.id,
      position: { x, y: TABLE_ROW_Y },
      data: {
        label: t.id,
        kind: 'table',
        fields: t.fields ?? [],
      },
      type: 'tableNode',
    });
  });

  // --- DB relation edges (Tier 1 overlay) ---
  relations.forEach((r, i) => {
    const { sourceHandle, targetHandle } = pickHandles(
      xById.get(r.from) ?? 0,
      xById.get(r.to) ?? 0
    );
    const narrative = DB_COUPLING_NARRATIVES[`${r.from}->${r.to}`];
    const fallbackLabel = `${r.type ?? 'relation'}${r.field ? ` (${r.field})` : ''}`;
    edges.push({
      id: `relation-${r.from}-${r.to}-${i}`,
      source: r.from,
      target: r.to,
      sourceHandle,
      targetHandle,
      label: narrative?.edgeLabel ?? fallbackLabel,
      title: narrative?.detail,
      className: 'flow-edge flow-edge--relation flow-edge--coupling',
    });
  });

  return { nodes, edges };
}

/**
 * Derived stats for the header strip — every number here traces back to
 * real backend data (madge's own file walk, the actual node/edge counts),
 * nothing invented client-side.
 */
export function computeStats(codeGraph, schemaGraph) {
  const filesScanned = codeGraph?.meta?.filesScanned ?? null;
  const moduleCount = codeGraph?.nodes?.length ?? 0;
  const tableCount = schemaGraph?.tables?.length ?? 0;
  const codeCouplingCount = codeGraph?.edges?.length ?? 0;
  const dbCouplingCount = schemaGraph?.relations?.length ?? 0;
  return {
    filesScanned,
    moduleCount,
    tableCount,
    couplingCount: codeCouplingCount + dbCouplingCount,
  };
}

/**
 * Narrated list of the coupling points actually present in the live data —
 * feeds the "Coupling points detected" panel. Walks the same edges the
 * graph renders, so this can never drift out of sync with what's on screen.
 */
export function getCouplingSummary(codeGraph, schemaGraph) {
  const items = [];
  (codeGraph?.edges ?? []).forEach((e) => {
    const narrative = CODE_COUPLING_NARRATIVES[`${e.source}->${e.target}`];
    items.push({
      id: `code-${e.source}-${e.target}`,
      kind: 'code',
      title: narrative?.panelTitle ?? `${e.source} → ${e.target} (${e.type})`,
      detail: narrative?.detail ?? `${e.source} imports ${e.target}`,
    });
  });
  (schemaGraph?.relations ?? []).forEach((r) => {
    const narrative = DB_COUPLING_NARRATIVES[`${r.from}->${r.to}`];
    items.push({
      id: `db-${r.from}-${r.to}`,
      kind: 'db',
      title: narrative?.panelTitle ?? `${r.from} → ${r.to} (${r.type})`,
      detail: narrative?.detail ?? `${r.from}.${r.field} references ${r.to}`,
    });
  });
  return items;
}
