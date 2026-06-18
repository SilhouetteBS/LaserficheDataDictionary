import { useState } from 'react';

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
}) {
  if (!comparison) {
    return null;
  }
  const unchangedCount = comparison.unchangedTables?.length ?? 0;

  return (
    <section className="comparison-panel" aria-label="Version comparison summary">
      <div className="comparison-panel-header">
        <div>
          <h2>Version comparison</h2>
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
      </div>
      <div className="comparison-panel-body">
        <VersionComparePicker
          versions={versions}
          fromVersion={fromVersion}
          toVersion={toVersion}
          onFromVersionChange={onFromVersionChange}
          onToVersionChange={onToVersionChange}
        />
        <div className="comparison-metrics" aria-label="Comparison counts">
          {[
            ['added', 'Added', comparison.addedTables.length],
            ['removed', 'Removed', comparison.removedTables.length],
            ['changed', 'Changed', comparison.changedTables.length],
            ['unchanged', 'Unchanged', unchangedCount],
          ].map(([status, label, value]) => (
            <span className={`change-status-${status}`} key={label}>
              <strong>{value}</strong>
              {label}
            </span>
          ))}
        </div>
      </div>
      {comparison.changedTables.length > 0 && (
        <div className="comparison-sample">
          <strong>Changed tables</strong>
          <div>
            {comparison.changedTables.slice(0, 5).map((table) => (
              <span key={table.key}>{table.key}</span>
            ))}
          </div>
        </div>
      )}
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
  onSelectTable,
  selectedTableKey,
  onSelectedTableKeyChange,
}) {
  const [changeFilter, setChangeFilter] = useState('all');
  if (!comparison) {
    return null;
  }
  const selectedChange =
    comparison.changedTables.find((table) => table.key === selectedTableKey) ?? comparison.changedTables[0];
  const objectChangeGroups = [
    ['views', 'Views'],
    ['routines', 'Routines'],
    ['triggers', 'Triggers'],
  ].map(([key, label]) => ({
    key,
    label,
    changes: comparison.objectChanges?.[key] ?? { added: [], removed: [], changed: [] },
  }));
  const hasObjectChanges = objectChangeGroups.some(
    (group) => group.changes.added.length + group.changes.removed.length + group.changes.changed.length > 0,
  );
  const dependencyChanges = comparison.dependencyChanges ?? { added: [], removed: [] };
  const dependencyChangeCount = dependencyChanges.added.length + dependencyChanges.removed.length;
  const objectChangeCount = objectChangeGroups.reduce(
    (total, group) => total + group.changes.added.length + group.changes.removed.length + group.changes.changed.length,
    0,
  );
  const filteredChangedTables = comparison.changedTables.filter((table) => {
    if (changeFilter === 'all') {
      return true;
    }
    if (changeFilter === 'columns') {
      return table.addedColumns.length + table.removedColumns.length + table.changedColumns.length > 0;
    }
    if (changeFilter === 'keys') {
      return table.addedKeys.length + table.removedKeys.length + table.changedKeys.length > 0;
    }
    if (changeFilter === 'indexes') {
      return table.addedIndexes.length + table.removedIndexes.length + table.changedIndexes.length > 0;
    }
    if (changeFilter === 'relationships') {
      return table.addedForeignKeys.length + table.removedForeignKeys.length + table.changedForeignKeys.length > 0;
    }
    return true;
  });
  return (
    <section className="detail-surface">
      <div className="detail-heading">
        <div>
          <h2>Schema changes</h2>
          <p>Browse table, column, index, and relationship-level changes between snapshots.</p>
        </div>
      </div>
      {comparison.fromVersion === comparison.toVersion && (
        <p className="inline-warning">Select two different versions to compare schema changes.</p>
      )}
      <div className="diff-grid">
        <DiffList title="Added tables" status="added" items={comparison.addedTables} onSelect={onSelectTable} />
        <DiffList title="Removed tables" status="removed" items={comparison.removedTables} />
      </div>
      <section className="diff-section">
        <div className="section-title-row">
          <h3>Changed tables</h3>
          <span>{filteredChangedTables.length}</span>
        </div>
        <div className="comparison-filter-row" aria-label="Change filters">
          {[
            ['all', 'All'],
            ['columns', 'Columns'],
            ['keys', 'Keys'],
            ['indexes', 'Indexes'],
            ['relationships', 'Relationships'],
          ].map(([value, label]) => (
            <button
              className={changeFilter === value ? 'selected' : ''}
              key={value}
              onClick={() => setChangeFilter(value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="changed-table-list">
          {filteredChangedTables.map((table) => (
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
                <span className="change-status-added">+{table.addedColumns.length} columns</span>
                <span className="change-status-removed">-{table.removedColumns.length} columns</span>
                <span className="change-status-changed">{table.changedColumns.length} changed columns</span>
                <span className="change-status-added">+{table.addedKeys.length} keys</span>
                <span className="change-status-removed">-{table.removedKeys.length} keys</span>
                <span className="change-status-changed">{table.changedKeys.length} changed keys</span>
                <span className="change-status-added">+{table.addedIndexes.length} indexes</span>
                <span className="change-status-removed">-{table.removedIndexes.length} indexes</span>
                <span className="change-status-changed">{table.changedIndexes.length} changed indexes</span>
                <span className="change-status-added">+{table.addedForeignKeys.length} FKs</span>
                <span className="change-status-removed">-{table.removedForeignKeys.length} FKs</span>
                <span className="change-status-changed">{table.changedForeignKeys.length} changed FKs</span>
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
      {(hasObjectChanges || dependencyChangeCount > 0) && (
        <section className="diff-section">
          <div className="section-title-row">
            <h3>Object and dependency changes</h3>
            <span>{objectChangeCount + dependencyChangeCount}</span>
          </div>
          <div className="drilldown-grid">
            {objectChangeGroups.map((group) => (
              <ObjectChangeBucket group={group} key={group.key} />
            ))}
            <ChangeBucket title="Added dependencies" items={dependencyChanges.added} />
            <ChangeBucket title="Removed dependencies" items={dependencyChanges.removed} />
          </div>
        </section>
      )}
      {selectedChange && (
        <section className="comparison-drilldown">
          <div className="section-title-row">
            <h3>Change details</h3>
            <button className="text-button" type="button" onClick={() => onSelectTable(selectedChange.key)}>
              Open table
            </button>
          </div>
          <h4>{selectedChange.key}</h4>
          <div className="drilldown-grid">
            <ChangeBucket title="Added columns" items={selectedChange.addedColumns} />
            <ChangeBucket title="Removed columns" items={selectedChange.removedColumns} />
            <ChangeBucket
              title="Changed columns"
              items={selectedChange.changedColumns.map((column) => `${column.name}: ${column.details.join('; ')}`)}
            />
            <ChangeBucket title="Added keys" items={selectedChange.addedKeys} />
            <ChangeBucket title="Removed keys" items={selectedChange.removedKeys} />
            <ChangeBucket
              title="Changed keys"
              items={selectedChange.changedKeys.map((key) => `${key.name}: ${key.details.join('; ')}`)}
            />
            <ChangeBucket title="Added indexes" items={selectedChange.addedIndexes} />
            <ChangeBucket title="Removed indexes" items={selectedChange.removedIndexes} />
            <ChangeBucket
              title="Changed indexes"
              items={selectedChange.changedIndexes.map((index) => `${index.name}: ${index.details.join('; ')}`)}
            />
            <ChangeBucket title="Added foreign keys" items={selectedChange.addedForeignKeys} />
            <ChangeBucket title="Removed foreign keys" items={selectedChange.removedForeignKeys} />
            <ChangeBucket
              title="Changed foreign keys"
              items={selectedChange.changedForeignKeys.map((foreignKey) =>
                `${foreignKey.name}: ${foreignKey.details.join('; ')}`)}
            />
          </div>
        </section>
      )}
    </section>
  );
}

function ObjectChangeBucket({ group }) {
  return (
    <div className="change-bucket change-bucket-changed">
      <div className="section-title-row">
        <h3>{group.label}</h3>
        <span className="change-status-changed">
          {group.changes.added.length + group.changes.removed.length + group.changes.changed.length}
        </span>
      </div>
      <div className="object-change-grid">
        <ChangeList title="Added" status="added" items={group.changes.added} />
        <ChangeList title="Removed" status="removed" items={group.changes.removed} />
        <ChangeList
          title="Changed"
          status="changed"
          items={group.changes.changed.map((object) => `${object.key}: ${object.details.join('; ')}`)}
        />
      </div>
    </div>
  );
}

function ChangeList({ title, status, items }) {
  return (
    <div className={`object-change-list object-change-list-${status}`}>
      <strong>{title}</strong>
      {items.length === 0 ? (
        <p className="empty-state">No changes.</p>
      ) : (
        <ul>
          {items.slice(0, 12).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function getChangeStatus(title) {
  const normalizedTitle = title.toLowerCase();
  if (normalizedTitle.includes('added')) {
    return 'added';
  }
  if (normalizedTitle.includes('removed')) {
    return 'removed';
  }
  if (normalizedTitle.includes('changed')) {
    return 'changed';
  }
  return 'unchanged';
}

function ChangeBucket({ title, items }) {
  const status = getChangeStatus(title);
  return (
    <div className={`change-bucket change-bucket-${status}`}>
      <div className="section-title-row">
        <h3>{title}</h3>
        <span className={`change-status-${status}`}>{items.length}</span>
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

function DiffList({ title, status, items, onSelect }) {
  return (
    <section className={`diff-list diff-list-${status}`}>
      <div className="section-title-row">
        <h3>{title}</h3>
        <span className={`change-status-${status}`}>{items.length}</span>
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
