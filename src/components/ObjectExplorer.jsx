import { useMemo } from 'react';
import { getColumnUsages, getReviewItems } from '../data/schemaAnalysis.js';

export function ObjectExplorer({
  objectType,
  onObjectTypeChange,
  columnUsageQuery,
  onColumnUsageQueryChange,
  version,
  productName,
  onDownloadReviewQueue,
  onSelectTable,
}) {
  const objects = {
    views: version.source.views ?? [],
    routines: version.source.routines ?? [],
    triggers: version.source.triggers ?? [],
    dependencies: version.source.dependencies ?? [],
  };
  const selectedObjects = objects[objectType] ?? [];
  const reviewItems = useMemo(() => getReviewItems(version), [version]);
  const columnUsages = useMemo(() => getColumnUsages(version, columnUsageQuery), [columnUsageQuery, version]);

  return (
    <section className="detail-surface">
      <div className="detail-heading">
        <div>
          <p className="product-label">{productName} {version.version}</p>
          <h2>Schema objects</h2>
          <p>Explore exported views, routines, triggers, and dependency references.</p>
        </div>
      </div>
      <div className="object-tabs">
        {Object.entries(objects).map(([key, items]) => (
          <button
            className={objectType === key ? 'selected' : ''}
            key={key}
            type="button"
            onClick={() => onObjectTypeChange(key)}
          >
            {key} <span>{items.length}</span>
          </button>
        ))}
      </div>
      <div className="object-tools">
        <section className="review-queue">
          <div className="section-title-row">
            <h3>Documentation review queue</h3>
            <span>{reviewItems.length}</span>
          </div>
          <button className="text-button" type="button" onClick={onDownloadReviewQueue}>
            Export queue
          </button>
          <div className="review-list">
            {reviewItems.slice(0, 8).map((item) => (
              <button key={item.key} type="button" onClick={() => onSelectTable(item.key)}>
                <strong>{item.key}</strong>
                <span>{item.confidence} - {item.columnsNeedingReview} unknown columns</span>
                {item.hasManualNotes && <em>notes started</em>}
              </button>
            ))}
          </div>
        </section>
        <section className="column-usage">
          <div className="section-title-row">
            <h3>Column usage search</h3>
            <span>{columnUsages.length}</span>
          </div>
          <input
            value={columnUsageQuery}
            onChange={(event) => onColumnUsageQueryChange(event.target.value)}
            placeholder="Search column name, type, purpose"
          />
          <div className="usage-list">
            {columnUsages.length === 0 ? (
              <p className="empty-state">Enter a column name such as bp_id or tenant_id.</p>
            ) : (
              columnUsages.slice(0, 10).map((usage) => (
                <button
                  key={`${usage.tableKey}-${usage.columnName}`}
                  type="button"
                  onClick={() => onSelectTable(usage.tableKey)}
                >
                  <strong>{usage.tableKey}.{usage.columnName}</strong>
                  <span>{usage.dataType}</span>
                  <em>
                    {usage.indexedBy.length} indexes - {usage.foreignKeys.length} foreign keys
                  </em>
                </button>
              ))
            )}
          </div>
        </section>
      </div>
      <div className="object-list">
        {selectedObjects.length === 0 ? (
          <p className="empty-state">No {objectType} exported.</p>
        ) : (
          selectedObjects.slice(0, 250).map((item, index) => (
            <article className="object-item" key={`${objectType}-${item.key ?? item.name ?? index}`}>
              <strong>{item.key ?? item.name ?? item.referencingObjectKey}</strong>
              <p>{item.typeDescription ?? item.parentObjectTypeDescription ?? item.referencingObjectTypeDescription}</p>
              {item.parentObjectKey && (
                <button type="button" onClick={() => onSelectTable(item.parentObjectKey)}>
                  {item.parentObjectKey}
                </button>
              )}
              {item.referencedObjectKey && <code>{item.referencedObjectKey}</code>}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
