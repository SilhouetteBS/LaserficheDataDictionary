import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertTriangle,
  Database,
  Download,
  FileSearch,
  GitBranch,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { formsDictionary } from './data/formsDictionary.js';
import './styles.css';

const confidenceLabels = {
  confirmed: 'Confirmed',
  observed: 'Observed',
  inferred: 'Inferred',
  unknown: 'Unknown',
};

function normalize(value) {
  return value.toLowerCase().trim();
}

function App() {
  const [selectedProduct, setSelectedProduct] = useState('forms');
  const [selectedVersion, setSelectedVersion] = useState('12.x');
  const [selectedTableId, setSelectedTableId] = useState('dbo.cf_bp_main_instances');
  const [query, setQuery] = useState('');

  const product = formsDictionary.products.find((item) => item.id === selectedProduct);
  const version = product.versions.find((item) => item.version === selectedVersion) ?? product.versions[0];
  const tables = version.tables;

  const filteredTables = useMemo(() => {
    const needle = normalize(query);
    if (!needle) {
      return tables;
    }

    return tables.filter((table) => {
      const columnText = table.columns
        .map((column) => `${column.name} ${column.purpose} ${column.dataType}`)
        .join(' ');
      return normalize(`${table.name} ${table.summary} ${columnText}`).includes(needle);
    });
  }, [query, tables]);

  const selectedTable =
    tables.find((table) => table.id === selectedTableId) ?? filteredTables[0] ?? tables[0];

  function handleVersionChange(nextVersion) {
    setSelectedVersion(nextVersion);
    const nextTables = product.versions.find((item) => item.version === nextVersion)?.tables ?? [];
    setSelectedTableId(nextTables[0]?.id ?? '');
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Product and table navigation">
        <div className="brand">
          <div className="brand-mark">
            <Database size={22} />
          </div>
          <div>
            <h1>Laserfiche Database Dictionary</h1>
            <p>Schema, relationships, and reporting notes</p>
          </div>
        </div>

        <section className="sidebar-section">
          <h2>Products</h2>
          <label className="check-row">
            <input
              type="checkbox"
              checked={selectedProduct === 'forms'}
              onChange={() => setSelectedProduct('forms')}
            />
            <span>Forms</span>
          </label>
          {['LFDS', 'Repository', 'Workflow'].map((label) => (
            <label className="check-row disabled" key={label}>
              <input type="checkbox" disabled />
              <span>{label}</span>
            </label>
          ))}
        </section>

        <section className="sidebar-section">
          <div className="section-title-row">
            <h2>Tables</h2>
            <span>{filteredTables.length}</span>
          </div>
          <div className="table-list">
            {filteredTables.map((table) => (
              <button
                className={table.id === selectedTable.id ? 'table-item selected' : 'table-item'}
                key={table.id}
                type="button"
                onClick={() => setSelectedTableId(table.id)}
              >
                <span>{table.name}</span>
                <ConfidenceBadge value={table.confidence} />
              </button>
            ))}
          </div>
        </section>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="search-box">
            <Search size={18} />
            <input
              aria-label="Search tables, columns, descriptions"
              placeholder="Search tables, columns, descriptions"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <label className="version-picker">
            <span>Version</span>
            <select value={selectedVersion} onChange={(event) => handleVersionChange(event.target.value)}>
              {product.versions.map((item) => (
                <option value={item.version} key={item.version}>
                  Forms {item.version}
                </option>
              ))}
            </select>
          </label>
        </header>

        <div className="warning-banner" role="note">
          <ShieldAlert size={20} />
          <p>
            This documentation is for read-only reporting, troubleshooting, and education. Manually
            writing to or modifying Laserfiche product databases, tables, or records may violate
            your Laserfiche Support plan.
          </p>
        </div>

        <div className="content-grid">
          <article className="table-detail">
            <div className="detail-heading">
              <div>
                <p className="product-label">Forms {selectedVersion}</p>
                <h2>{selectedTable.name}</h2>
                <p>{selectedTable.summary}</p>
              </div>
              <div className="heading-actions">
                <ConfidenceBadge value={selectedTable.confidence} />
                <button className="icon-button" type="button" title="Download table JSON">
                  <Download size={17} />
                </button>
              </div>
            </div>

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
                    <span>{column.purpose}</span>
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
            <DependencyGraph table={selectedTable} />
            <div className="relationship-list">
              {selectedTable.relationships.map((relationship) => (
                <div className="relationship-item" key={`${relationship.type}-${relationship.table}`}>
                  <span>{relationship.type}</span>
                  <strong>{relationship.table}</strong>
                  <p>{relationship.note}</p>
                  <ConfidenceBadge value={relationship.confidence} />
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function ConfidenceBadge({ value }) {
  return <span className={`confidence confidence-${value}`}>{confidenceLabels[value] ?? value}</span>;
}

function DependencyGraph({ table }) {
  return (
    <div className="graph" aria-label="Dependency graph preview">
      <div className="graph-node graph-node-main">{table.shortName}</div>
      {table.relationships.slice(0, 4).map((relationship, index) => (
        <React.Fragment key={relationship.table}>
          <div className={`graph-line line-${index + 1}`} />
          <div className={`graph-node graph-node-${index + 1}`}>{relationship.shortName}</div>
        </React.Fragment>
      ))}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);

