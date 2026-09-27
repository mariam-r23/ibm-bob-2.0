import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import { nodeTypes } from './nodes.jsx';
import { buildFlowGraph, computeStats, getCouplingSummary } from './graphTransform.js';
import CouplingPanel from './CouplingPanel.jsx';
import TaskLogPanel from './TaskLogPanel.jsx';
import DiffViewer from './DiffViewer.jsx';
import { startMockCarveOut } from './carveOutMock.js';
// When mariam/carve-out-engine lands, also import sendCarveOutRequest from
// './carveOutApi.js' and call it before starting the log poll/stream.

const GRAPH_URL = '/api/graph';
const SCHEMA_URL = '/api/schema';

export default function App() {
  const [codeGraph, setCodeGraph] = useState(null);
  const [schemaGraph, setSchemaGraph] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);

  // --- Carve-out state ---
  // taskLog: null = idle; object = active/complete §4 snapshot
  const [taskLog, setTaskLog] = useState(null);
  // showDiff: only true after a successful run
  const [showDiff, setShowDiff] = useState(false);
  // carving: prevents double-clicks while a run is active
  const [carving, setCarving] = useState(false);
  const cancelMockRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [graphRes, schemaRes] = await Promise.all([
          fetch(GRAPH_URL),
          fetch(SCHEMA_URL),
        ]);
        if (!graphRes.ok) throw new Error(`graph fetch failed: ${graphRes.status}`);
        if (!schemaRes.ok) throw new Error(`schema fetch failed: ${schemaRes.status}`);
        const graphJson = await graphRes.json();
        const schemaJson = await schemaRes.json();
        if (cancelled) return;
        setCodeGraph(graphJson);
        setSchemaGraph(schemaJson);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const flowGraph = useMemo(() => {
    if (!codeGraph || !schemaGraph) return { nodes: [], edges: [] };
    return buildFlowGraph(codeGraph, schemaGraph);
  }, [codeGraph, schemaGraph]);

  const stats = useMemo(() => computeStats(codeGraph, schemaGraph), [codeGraph, schemaGraph]);
  const couplingItems = useMemo(
    () => getCouplingSummary(codeGraph, schemaGraph),
    [codeGraph, schemaGraph]
  );

  useEffect(() => {
    setNodes(flowGraph.nodes);
    setEdges(flowGraph.edges);
  }, [flowGraph]);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onNodeClick = useCallback((_event, node) => {
    if (node.data?.kind !== 'module') return;
    setSelectedModule((prev) => (prev === node.id ? null : node.id));
  }, []);

  // Reflect selection into node styling.
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        selected: n.data?.kind === 'module' && n.id === selectedModule,
      }))
    );
  }, [selectedModule]);

  // Cancel any running mock when the component unmounts.
  useEffect(() => {
    return () => {
      if (cancelMockRef.current) cancelMockRef.current();
    };
  }, []);

  /**
   * Handle "Carve Out with Bob" button click.
   *
   * Flow:
   *   1. (When real engine is available) POST §3 request via sendCarveOutRequest().
   *   2. Start mock (or real) §4 stream, pushing snapshots into taskLog state.
   *   3. On success → show DiffViewer.
   *   4. Error state is reflected in the §4 snapshot; UI stays responsive.
   */
  const handleCarveOut = useCallback(() => {
    if (carving || !selectedModule) return;

    // Reset previous run.
    if (cancelMockRef.current) cancelMockRef.current();
    setShowDiff(false);
    setCarving(true);
    setTaskLog(null);

    // --- Swap this block for sendCarveOutRequest(selectedModule) when engine lands ---
    // sendCarveOutRequest(selectedModule).catch(console.error);
    // ---------------------------------------------------------------------------------

    const cancel = startMockCarveOut((snapshot) => {
      setTaskLog(snapshot);
      if (snapshot.status === 'success') {
        setCarving(false);
        setShowDiff(true);
      }
      if (snapshot.status === 'error') {
        setCarving(false);
        // taskLog stays visible so the user can see which step failed.
      }
    });

    cancelMockRef.current = cancel;
  }, [carving, selectedModule]);

  const handleCloseLog = useCallback(() => {
    if (cancelMockRef.current) {
      cancelMockRef.current();
      cancelMockRef.current = null;
    }
    setTaskLog(null);
    setCarving(false);
  }, []);

  const handleCloseDiff = useCallback(() => {
    setShowDiff(false);
  }, []);

  return (
    <div className="app">
      <header className="app__header">
        <h1>MonoSplitter AI</h1>
        <p className="app__subtitle">
          Module + database coupling for <code>monolith/</code> — code graph via{' '}
          <code>madge</code>, DB coupling via <code>schema.json</code> (Tier 1).
        </p>

        {!loading && !error && (
          <div className="app__stats">
            <span className="app__stat">
              <strong>{stats.filesScanned ?? '—'}</strong> files scanned
            </span>
            <span className="app__stat-sep">·</span>
            <span className="app__stat">
              <strong>{stats.moduleCount}</strong> modules
            </span>
            <span className="app__stat-sep">·</span>
            <span className="app__stat">
              <strong>{stats.tableCount}</strong> tables
            </span>
            <span className="app__stat-sep">·</span>
            <span className="app__stat app__stat--highlight">
              <strong>{stats.couplingCount}</strong> coupling points found
            </span>
          </div>
        )}

        {selectedModule && (
          <div className="app__selection">
            Selected module: <strong>{selectedModule}</strong>
            {selectedModule === 'payments' && (
              <>
                <span className="app__selection-hint"> — carve-out target (Phase 2)</span>
                <button
                  className={`carve-btn${carving ? ' carve-btn--busy' : ''}`}
                  onClick={handleCarveOut}
                  disabled={carving}
                  aria-busy={carving}
                >
                  {carving ? 'Running…' : '✦ Carve Out with Bob'}
                </button>
              </>
            )}
          </div>
        )}
      </header>

      <main className="app__canvas">
        {loading && <div className="app__status">Loading graph…</div>}
        {error && (
          <div className="app__status app__status--error">
            Failed to load graph: {error}. Is graph-service running on :4100?
          </div>
        )}
        {!loading && !error && (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
            fitViewOptions={{ padding: 0.35, maxZoom: 1.4 }}
            minZoom={0.2}
            maxZoom={2}
          >
            <Background gap={16} />
            <Controls />
            <MiniMap
              nodeColor={(n) => (n.data?.kind === 'table' ? '#f6b73c' : '#4f8df6')}
              pannable
              zoomable
            />
            <CouplingPanel items={couplingItems} />

            {/* Live task log panel — positioned bottom-left inside the canvas */}
            {taskLog && (
              <TaskLogPanel
                taskLog={taskLog}
                onClose={handleCloseLog}
              />
            )}

            {/* Results / diff viewer — appears after a successful run */}
            {showDiff && taskLog && (
              <DiffViewer
                generatedFiles={taskLog.generatedFiles}
                onClose={handleCloseDiff}
              />
            )}
          </ReactFlow>
        )}
      </main>

      <footer className="app__legend">
        <span className="legend-item">
          <span className="legend-swatch legend-swatch--module" /> module (code)
        </span>
        <span className="legend-item">
          <span className="legend-swatch legend-swatch--table" /> table (DB, Tier 1)
        </span>
        <span className="legend-item">
          <span className="legend-line legend-line--import" /> import edge
        </span>
        <span className="legend-item">
          <span className="legend-line legend-line--relation" /> foreign key relation
        </span>
      </footer>
    </div>
  );
}
