import React from 'react';

export default function CouplingPanel({ items }) {
  if (!items?.length) return null;

  return (
    <div className="coupling-panel">
      <div className="coupling-panel__header">
        Coupling points detected <span className="coupling-panel__count">{items.length}</span>
      </div>
      <ul className="coupling-panel__list">
        {items.map((item, i) => (
          <li key={item.id} className={`coupling-panel__item coupling-panel__item--${item.kind}`}>
            <span className="coupling-panel__badge">{i + 1}</span>
            <div>
              <div className="coupling-panel__title">{item.title}</div>
              <div className="coupling-panel__detail">{item.detail}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
