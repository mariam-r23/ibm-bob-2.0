import React from 'react';
import { Handle, Position } from 'reactflow';

// Both node types get a target + source handle on BOTH the left and right
// side. graphTransform.js picks left-vs-right per edge based on which node
// sits to which side on the canvas, so an edge always exits/enters the side
// actually facing the other node instead of looping around the box.
export function ModuleNode({ data, selected }) {
  return (
    <div className={`node-card node-card--module${selected ? ' node-card--selected' : ''}`}>
      <Handle type="target" position={Position.Left} id="target-left" style={{ top: '50%' }} />
      <Handle type="source" position={Position.Left} id="source-left" style={{ top: '50%' }} />
      <div className="node-card__kind">module</div>
      <div className="node-card__title">{data.label}</div>
      {data.files?.length > 0 && (
        <ul className="node-card__files">
          {data.files.map((f) => (
            <li key={f}>
              <span className="node-card__file-icon">JS</span>
              {f}
            </li>
          ))}
        </ul>
      )}
      <Handle type="target" position={Position.Right} id="target-right" style={{ top: '50%' }} />
      <Handle type="source" position={Position.Right} id="source-right" style={{ top: '50%' }} />
    </div>
  );
}

export function TableNode({ data, selected }) {
  return (
    <div className={`node-card node-card--table${selected ? ' node-card--selected' : ''}`}>
      <Handle type="target" position={Position.Left} id="target-left" style={{ top: '50%' }} />
      <Handle type="source" position={Position.Left} id="source-left" style={{ top: '50%' }} />
      <div className="node-card__kind">table</div>
      <div className="node-card__title">{data.label}</div>
      {data.fields?.length > 0 && (
        <ul className="node-card__fields">
          {data.fields.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      )}
      <Handle type="target" position={Position.Right} id="target-right" style={{ top: '50%' }} />
      <Handle type="source" position={Position.Right} id="source-right" style={{ top: '50%' }} />
    </div>
  );
}

export const nodeTypes = {
  moduleNode: ModuleNode,
  tableNode: TableNode,
};
