import {
  AlertTriangle,
  Download,
  FileSearch,
  GitBranch,
  KeyRound,
  Network,
  TableProperties,
} from 'lucide-react';
import { ConfidenceBadge } from './ConfidenceBadge.jsx';
import { ManualNotesEditor } from './ManualNotesEditor.jsx';
import { MetadataStat } from './MetadataStat.jsx';

export function TableWorkspace({
  selectedTable,
  selectedVersion,
  productName,
  localNote,
  localNotesKey,
  localNoteChanged,
  onExportLocalNotes,
  onExportVersionNotes,
  onImportLocalNotes,
  onSaveLocalNote,
  onClearLocalNote,
  onDownloadTableJson,
  onDownloadTableCsv,
  visibleRelationships,
  relationshipFilter,
  setRelationshipFilter,
  navigateToTable,
}) {
  return (
    <div className="content-grid">
      <article className="table-detail">
        <div className="detail-heading">
          <div>
            <p className="product-label">{productName} {selectedVersion}</p>
            <h2>{selectedTable.name}</h2>
            <p>{selectedTable.summary}</p>
          </div>
          <div className="heading-actions">
            <ConfidenceBadge value={selectedTable.confidence} />
            {selectedTable.hasManualNotes && <span className="notes-badge">Manual notes</span>}
            <button
              className="icon-button"
              type="button"
              title="Download table JSON"
              onClick={onDownloadTableJson}
            >
              <Download size={17} />
            </button>
            <button
              className="text-button"
              type="button"
              onClick={onDownloadTableCsv}
            >
              CSV
            </button>
          </div>
        </div>

        <section className="stats-strip" aria-label="Table metadata counts">
          <MetadataStat icon={<TableProperties size={17} />} label="Columns" value={selectedTable.columns.length} />
          <MetadataStat icon={<KeyRound size={17} />} label="Keys" value={selectedTable.keys.length} />
          <MetadataStat icon={<Network size={17} />} label="Indexes" value={selectedTable.indexes.length} />
          <MetadataStat icon={<GitBranch size={17} />} label="Relations" value={selectedTable.relationships.length} />
        </section>

        <section className="guidance-panel">
          <div>
            <h3>
              <FileSearch size={18} />
              Read-only guidance
            </h3>
            <ul>
              {selectedTable.safeReportingNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>
              <AlertTriangle size={18} />
              Warnings
            </h3>
            <ul>
              {selectedTable.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        </section>

        <ManualNotesEditor
          localNote={localNote}
          localNotesKey={localNotesKey}
          localNoteChanged={localNoteChanged}
          selectedTable={selectedTable}
          onExportLocalNotes={onExportLocalNotes}
          onExportVersionNotes={onExportVersionNotes}
          onImportLocalNotes={onImportLocalNotes}
          onClear={onClearLocalNote}
          onSave={onSaveLocalNote}
        />

        <section className="metadata-panels">
          <MetadataList
            title="Keys"
            items={selectedTable.keys}
            emptyText="No primary or unique keys exported."
            renderItem={(key) => (
              <>
                <strong>{key.name}</strong>
                <span>{key.typeDescription}</span>
                <code>{key.columns.map((column) => column.columnName).join(', ')}</code>
              </>
            )}
          />
          <MetadataList
            title="Indexes"
            items={selectedTable.indexes}
            emptyText="No indexes exported."
            renderItem={(index) => (
              <>
                <strong>{index.name}</strong>
                <span>{index.typeDescription}</span>
                <code>{index.columns.map((column) => column.columnName).join(', ')}</code>
              </>
            )}
          />
          <MetadataList
            title="Triggers"
            items={selectedTable.triggers}
            emptyText="No triggers exported."
            renderItem={(trigger) => (
              <>
                <strong>{trigger.name}</strong>
                <span>{trigger.isDisabled ? 'Disabled' : 'Enabled'}</span>
                <code>{trigger.isInsteadOfTrigger ? 'INSTEAD OF' : 'AFTER'}</code>
              </>
            )}
          />
        </section>

        <section className="columns-section">
          <div className="section-title-row">
            <h3>Columns</h3>
            <span>{selectedTable.columns.length} columns</span>
          </div>
          <div className="columns-table" role="table" aria-label="Columns">
            <div className="table-row table-head" role="row">
              <span>Column</span>
              <span>Type</span>
              <span>Nullable</span>
              <span>Purpose</span>
              <span>Status</span>
            </div>
            {selectedTable.columns.map((column) => (
              <div className="table-row" role="row" key={column.name}>
                <strong>{column.name}</strong>
                <code>{column.dataType}</code>
                <span>{column.nullable ? 'Yes' : 'No'}</span>
                <span>
                  {column.purpose}
                  {column.hasManualNotes && <em className="inline-note-label"> noted</em>}
                </span>
                <ConfidenceBadge value={column.confidence} />
              </div>
            ))}
          </div>
        </section>
      </article>

      <aside className="relationship-panel">
        <div className="section-title-row">
          <h3>Relationships</h3>
          <GitBranch size={18} />
        </div>
        <DependencyGraph table={{ ...selectedTable, relationships: visibleRelationships }} />
        <div className="segmented-control" aria-label="Relationship filter">
          {[
            ['all', 'All'],
            ['references', 'Out'],
            ['referenced by', 'In'],
          ].map(([value, label]) => (
            <button
              className={relationshipFilter === value ? 'selected' : ''}
              key={value}
              type="button"
              onClick={() => setRelationshipFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relationship-list">
          {visibleRelationships.length === 0 ? (
            <p className="empty-state">No SQL foreign keys exported for this table.</p>
          ) : (
            visibleRelationships.map((relationship, index) => (
              <div className="relationship-item" key={`${relationship.type}-${relationship.table}-${index}`}>
                <span>{relationship.type}</span>
                <button type="button" onClick={() => navigateToTable(relationship.table)}>
                  {relationship.table}
                </button>
                <p>{relationship.note}</p>
                <ConfidenceBadge value={relationship.confidence} />
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}

function MetadataList({ title, items, emptyText, renderItem }) {
  return (
    <section className="metadata-list">
      <div className="section-title-row">
        <h3>{title}</h3>
        <span>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="empty-state">{emptyText}</p>
      ) : (
        <div className="metadata-list-items">
          {items.slice(0, 6).map((item) => (
            <div className="metadata-list-item" key={item.name}>
              {renderItem(item)}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function DependencyGraph({ table }) {
  const incoming = table.relationships
    .filter((relationship) => relationship.type === 'referenced by')
    .slice(0, 4);
  const outgoing = table.relationships
    .filter((relationship) => relationship.type === 'references')
    .slice(0, 4);

  return (
    <div className="graph" aria-label="Dependency graph preview">
      <div className="graph-row graph-row-related">
        {incoming.length === 0 ? (
          <span className="graph-empty">No incoming keys</span>
        ) : (
          incoming.map((relationship, index) => (
            <div className="graph-node" key={`${relationship.type}-${relationship.table}-${index}`} title={relationship.table}>
              {relationship.shortName}
            </div>
          ))
        )}
      </div>
      <div className="graph-connector" />
      <div className="graph-center">
        <div className="graph-node graph-node-main" title={table.name}>
          {table.shortName}
        </div>
      </div>
      <div className="graph-connector" />
      <div className="graph-row graph-row-related">
        {outgoing.length === 0 ? (
          <span className="graph-empty">No outgoing keys</span>
        ) : (
          outgoing.map((relationship, index) => (
            <div className="graph-node" key={`${relationship.type}-${relationship.table}-${index}`} title={relationship.table}>
              {relationship.shortName}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
