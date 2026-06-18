import { useMemo } from 'react';
import { getSchemaHealthItems } from '../data/schemaAnalysis.js';
import { MetadataStat } from './MetadataStat.jsx';

export function SchemaHealthView({ version, onDownloadJson, onSelectTable }) {
  const healthItems = useMemo(() => getSchemaHealthItems(version), [version]);

  return (
    <section className="detail-surface">
      <div className="detail-heading">
        <div>
          <h2>Schema health</h2>
          <p>Review structural flags that affect reporting joins, table risk, and documentation priority.</p>
        </div>
        <button className="text-button" type="button" onClick={onDownloadJson}>
          Export health
        </button>
      </div>
      <div className="health-summary">
        <MetadataStat label="Flagged tables" value={healthItems.length} />
        <MetadataStat
          label="No primary key"
          value={healthItems.filter((item) => item.primaryKeyCount === 0).length}
        />
        <MetadataStat
          label="FK warnings"
          value={healthItems.reduce((total, item) => total + item.untrustedForeignKeyCount, 0)}
        />
        <MetadataStat
          label="Triggered"
          value={healthItems.filter((item) => item.triggerCount > 0).length}
        />
      </div>
      <div className="health-list">
        {healthItems.slice(0, 120).map((item) => (
          <button className="health-row" key={item.key} type="button" onClick={() => onSelectTable(item.key)}>
            <strong>{item.key}</strong>
            <span>{item.primaryKeyCount} PKs</span>
            <span>{item.untrustedForeignKeyCount} FK warnings</span>
            <span>{item.triggerCount} triggers</span>
            <span>{item.computedColumnCount} computed</span>
            <em>{item.riskFlags.join(', ')}</em>
          </button>
        ))}
      </div>
    </section>
  );
}
