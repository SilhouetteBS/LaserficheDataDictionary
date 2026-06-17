import { MetadataStat } from './MetadataStat.jsx';

export function ComparisonSummary({
  comparison,
  versions,
  fromVersion,
  toVersion,
  onFromVersionChange,
  onToVersionChange,
  onOpen,
  onDownloadJson,
  onDownloadCsv,
  productName,
}) {
  if (!comparison) {
    return null;
  }

  return (
    <section className="comparison-panel" aria-label="Version comparison summary">
      <div>
        <p className="product-label">
          {productName} {comparison.fromVersion} to {comparison.toVersion}
        </p>
        <h2>Version comparison</h2>
      </div>
      <VersionComparePicker
        versions={versions}
        fromVersion={fromVersion}
        toVersion={toVersion}
        onFromVersionChange={onFromVersionChange}
        onToVersionChange={onToVersionChange}
      />
      <MetadataStat label="Added tables" value={comparison.addedTables.length} />
      <MetadataStat label="Removed tables" value={comparison.removedTables.length} />
      <MetadataStat label="Changed tables" value={comparison.changedTables.length} />
      <div className="comparison-sample">
        {comparison.changedTables.slice(0, 5).map((table) => (
          <span key={table.key}>{table.key}</span>
        ))}
      </div>
      <div className="comparison-actions">
        <button type="button" onClick={onOpen}>
          Open
        </button>
        <button type="button" onClick={onDownloadJson}>
          JSON
        </button>
        <button type="button" onClick={onDownloadCsv}>
          CSV
        </button>
      </div>
    </section>
  );
}

function VersionComparePicker({
  versions,
  fromVersion,
  toVersion,
  onFromVersionChange,
  onToVersionChange,
}) {
  return (
    <div className="compare-picker">
      <label>
        <span>From</span>
        <select value={fromVersion} onChange={(event) => onFromVersionChange(event.target.value)}>
          {versions.map((version) => (
            <option value={version.version} key={version.version}>
              {version.version}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>To</span>
        <select value={toVersion} onChange={(event) => onToVersionChange(event.target.value)}>
          {versions.map((version) => (
            <option value={version.version} key={version.version}>
              {version.version}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function ComparisonDetail({
  comparison,
  versions,
  fromVersion,
  toVersion,
  onFromVersionChange,
  onToVersionChange,
  productName,
  onSelectTable,
  selectedTableKey,
  onSelectedTableKeyChange,
}) {
  if (!comparison) {
    return null;
  }
  const selectedChange =
    comparison.changedTables.find((table) => table.key === selectedTableKey) ?? comparison.changedTables[0];

  return (
    <section className="detail-surface">
      <div className="detail-heading">
        <div>
          <p className="product-label">
            {productName} {comparison.fromVersion} to {comparison.toVersion}
          </p>
          <h2>Schema changes</h2>
          <p>Browse table, column, index, and relationship-level changes between snapshots.</p>
        </div>
        <VersionComparePicker
          versions={versions}
          fromVersion={fromVersion}
          toVersion={toVersion}
          onFromVersionChange={onFromVersionChange}
          onToVersionChange={onToVersionChange}
        />
      </div>
      {comparison.fromVersion === comparison.toVersion && (
        <p className="inline-warning">Select two different versions to compare schema changes.</p>
      )}
      <div className="diff-grid">
        <DiffList title="Added tables" items={comparison.addedTables} onSelect={onSelectTable} />
        <DiffList title="Removed tables" items={comparison.removedTables} />
      </div>
      <section className="diff-section">
        <div className="section-title-row">
          <h3>Changed tables</h3>
          <span>{comparison.changedTables.length}</span>
        </div>
        <div className="changed-table-list">
          {comparison.changedTables.map((table) => (
            <article className="changed-table-item" key={table.key}>
              <button type="button" onClick={() => onSelectTable(table.key)}>
                {table.key}
              </button>
              <button
                className="change-detail-button"
                type="button"
                onClick={() => onSelectedTableKeyChange(table.key)}
              >
                Details
              </button>
              <div className="change-tags">
                <span>+{table.addedColumns.length} columns</span>
                <span>-{table.removedColumns.length} columns</span>
                <span>{table.changedColumns.length} changed columns</span>
                <span>+{table.addedIndexes.length} indexes</span>
                <span>-{table.removedIndexes.length} indexes</span>
                <span>+{table.addedForeignKeys.length} FKs</span>
                <span>-{table.removedForeignKeys.length} FKs</span>
              </div>
              {table.changedColumns.length > 0 && (
                <p>
                  {table.changedColumns
                    .slice(0, 4)
                    .map((column) => `${column.name} (${column.changes.join(', ')})`)
                    .join('; ')}
                </p>
              )}
            </article>
          ))}
        </div>
      </section>
      {selectedChange && (
        <section className="comparison-drilldown">
          <div className="section-title-row">
            <h3>Change details</h3>
            <button type="button" onClick={() => onSelectTable(selectedChange.key)}>
              Open table
            </button>
          </div>
          <h4>{selectedChange.key}</h4>
          <div className="drilldown-grid">
            <ChangeBucket title="Added columns" items={selectedChange.addedColumns} />
            <ChangeBucket title="Removed columns" items={selectedChange.removedColumns} />
            <ChangeBucket
              title="Changed columns"
              items={selectedChange.changedColumns.map((column) => `${column.name}: ${column.changes.join(', ')}`)}
            />
            <ChangeBucket title="Added indexes" items={selectedChange.addedIndexes} />
            <ChangeBucket title="Removed indexes" items={selectedChange.removedIndexes} />
            <ChangeBucket title="Added foreign keys" items={selectedChange.addedForeignKeys} />
            <ChangeBucket title="Removed foreign keys" items={selectedChange.removedForeignKeys} />
          </div>
        </section>
      )}
    </section>
  );
}

function ChangeBucket({ title, items }) {
  return (
    <div className="change-bucket">
      <div className="section-title-row">
        <h3>{title}</h3>
        <span>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="empty-state">No changes.</p>
      ) : (
        <ul>
          {items.slice(0, 24).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DiffList({ title, items, onSelect }) {
  return (
    <section className="diff-list">
      <div className="section-title-row">
        <h3>{title}</h3>
        <span>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="empty-state">No entries.</p>
      ) : (
        <div>
          {items.map((item) =>
            onSelect ? (
              <button type="button" key={item} onClick={() => onSelect(item)}>
                {item}
              </button>
            ) : (
              <span key={item}>{item}</span>
            ),
          )}
        </div>
      )}
    </section>
  );
}
