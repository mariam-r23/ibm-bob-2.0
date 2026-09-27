import React from 'react';

/**
 * TaskLogPanel
 * ------------
 * Renders the §4 Carve-Out Result / Task Log shape as a live step list.
 *
 * Props:
 *   taskLog   {object|null}  The latest §4 snapshot, or null when idle.
 *   onClose   {function}     Called when the user dismisses the panel.
 *
 * The component is intentionally stateless — all state lives in App.jsx so
 * it can be driven by either the mock or the real stream without changes here.
 */

const STATUS_META = {
  pending:     { label: 'pending',     icon: '○', cls: 'tl-step--pending'     },
  in_progress: { label: 'in progress', icon: '◉', cls: 'tl-step--in-progress' },
  done:        { label: 'done',        icon: '✓', cls: 'tl-step--done'        },
  error:       { label: 'error',       icon: '✕', cls: 'tl-step--error'       },
};

function StepRow({ step, status }) {
  const meta = STATUS_META[status] ?? STATUS_META.pending;
  return (
    <li className={`tl-step ${meta.cls}`}>
      <span className="tl-step__icon" aria-hidden="true">{meta.icon}</span>
      <span className="tl-step__name">{step.replace(/_/g, ' ')}</span>
      <span className="tl-step__badge">{meta.label}</span>
    </li>
  );
}

function OverallBadge({ status }) {
  const map = {
    in_progress: { label: 'Running…',  cls: 'tl-overall--running'  },
    success:     { label: 'Complete',  cls: 'tl-overall--success'  },
    error:       { label: 'Failed',    cls: 'tl-overall--error'    },
  };
  const m = map[status] ?? map.in_progress;
  return <span className={`tl-overall ${m.cls}`}>{m.label}</span>;
}

export default function TaskLogPanel({ taskLog, onClose }) {
  if (!taskLog) return null;

  const { status, steps = [], generatedFiles = [] } = taskLog;

  return (
    <div className="tl-panel" role="status" aria-live="polite" aria-label="Carve-out task log">
      <div className="tl-panel__header">
        <span className="tl-panel__title">Carve-Out Task Log</span>
        <OverallBadge status={status} />
        <button
          className="tl-panel__close"
          onClick={onClose}
          aria-label="Close task log"
        >
          ✕
        </button>
      </div>

      {status === 'error' && (
        <div className="tl-error-banner" role="alert">
          A step failed. Review the error below — the UI remains interactive.
        </div>
      )}

      <ol className="tl-step-list">
        {steps.map(({ step, status: s }) => (
          <StepRow key={step} step={step} status={s} />
        ))}
      </ol>

      {generatedFiles.length > 0 && (
        <div className="tl-generated">
          <div className="tl-generated__label">Generated files</div>
          <ul className="tl-generated__list">
            {generatedFiles.map((f) => (
              <li key={f} className="tl-generated__file">{f}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
