import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertTriangle,
  CalendarClock,
  Columns3,
  Database,
  FileCode2,
  GitBranch,
  Lock,
  Search,
  ShieldAlert,
  TableProperties,
} from 'lucide-react';
import { appConfig } from './config.js';
import { buildSchemaProduct, compareVersions, validateSchemaSnapshot } from './data/schemaDictionary.js';
import { isLocalNoteDifferent, localNotesToVersionNotes } from './data/notes.js';
import { getReviewItems, getSchemaHealthItems, getTableImpactItems } from './data/schemaAnalysis.js';
import { readUrlState, writeUrlState } from './data/urlState.js';
import { ConfidenceBadge } from './components/ConfidenceBadge.jsx';
import { ComparisonDetail, ComparisonSummary } from './components/ComparisonViews.jsx';
import { DatabaseDiagram } from './components/DatabaseDiagram.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { ImpactView } from './components/ImpactView.jsx';
import { ObjectExplorer } from './components/ObjectExplorer.jsx';
import { ReportingGuide } from './components/ReportingGuide.jsx';
import { SchemaHealthView } from './components/SchemaHealthView.jsx';
import { TableWorkspace } from './components/TableWorkspace.jsx';
import './styles.css';

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to load ${url}`);
  }
  return response.json();
}

function normalize(value) {
  return String(value ?? '').toLowerCase().trim();
}

function downloadText(filename, value, type) {
  const blob = new Blob([value], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadJson(filename, value) {
  downloadText(filename, `${JSON.stringify(value, null, 2)}\n`, 'application/json');
}

function readLocalNotes() {
  try {
    return JSON.parse(localStorage.getItem('lfdd.localNotes') ?? '{}');
  } catch {
    return {};
  }
}

function writeLocalNotes(notes) {
  localStorage.setItem('lfdd.localNotes', JSON.stringify(notes));
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function tableToCsv(table) {
  const rows = [
    ['column', 'type', 'nullable', 'confidence', 'purpose'],
    ...table.columns.map((column) => [
      column.name,
      column.dataType,
      column.nullable ? 'yes' : 'no',
      column.confidence,
      column.purpose,
    ]),
  ];
  return `${rows.map((row) => row.map(csvEscape).join(',')).join('\n')}\n`;
}

function comparisonToCsv(comparison) {
  const rows = [['category', 'table', 'column_or_object', 'change']];
  comparison.addedTables.forEach((table) => rows.push(['added_table', table, '', 'added']));
  comparison.removedTables.forEach((table) => rows.push(['removed_table', table, '', 'removed']));
  comparison.changedTables.forEach((table) => {
    table.addedColumns.forEach((column) => rows.push(['added_column', table.key, column, 'added']));
    table.removedColumns.forEach((column) => rows.push(['removed_column', table.key, column, 'removed']));
    table.changedColumns.forEach((column) =>
      rows.push(['changed_column', table.key, column.name, column.changes.join('; ')]),
    );
    table.addedIndexes.forEach((index) => rows.push(['added_index', table.key, index, 'added']));
    table.removedIndexes.forEach((index) => rows.push(['removed_index', table.key, index, 'removed']));
    table.addedForeignKeys.forEach((foreignKey) => rows.push(['added_foreign_key', table.key, foreignKey, 'added']));
    table.removedForeignKeys.forEach((foreignKey) =>
      rows.push(['removed_foreign_key', table.key, foreignKey, 'removed']),
    );
  });
  return `${rows.map((row) => row.map(csvEscape).join(',')).join('\n')}\n`;
}

function formatSnapshotDate(value) {
  if (!value) {
    return 'Unknown';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getSnapshotStats(version) {
  return [
    {
      label: 'Exported',
      value: formatSnapshotDate(version.exportedAtUtc),
      icon: <CalendarClock size={17} />,
    },
    {
      label: 'Tables',
      value: version.tables.length.toLocaleString(),
      icon: <TableProperties size={17} />,
    },
    {
      label: 'Columns',
      value: version.tables.reduce((total, table) => total + table.columns.length, 0).toLocaleString(),
      icon: <Columns3 size={17} />,
    },
    {
      label: 'Foreign keys',
      value: (version.source?.foreignKeys?.length ?? 0).toLocaleString(),
      icon: <GitBranch size={17} />,
    },
    {
      label: 'Routines',
      value: (version.source?.routines?.length ?? 0).toLocaleString(),
      icon: <FileCode2 size={17} />,
    },
  ];
}

function SnapshotFreshnessPanel({ productName, version }) {
  const stats = getSnapshotStats(version);

  return (
    <section className="snapshot-panel" aria-label="Schema snapshot freshness">
      <div>
        <p className="snapshot-kicker">Snapshot</p>
        <h2>{productName} {version.version}</h2>
        <p>{version.snapshotLabel || 'Generated schema metadata export'}</p>
      </div>
      <div className="snapshot-stats">
        {stats.map((stat) => (
          <div className="snapshot-stat" key={stat.label}>
            {stat.icon}
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function App() {
  const editingEnabled = appConfig.editingEnabled;
  const [initialUrlState] = useState(() => readUrlState());
  const [product, setProduct] = useState(null);
  const [productsManifest, setProductsManifest] = useState(null);
  const [selectedProductKey, setSelectedProductKey] = useState(initialUrlState.product || 'forms');
  const [loadError, setLoadError] = useState('');
  const [selectedVersion, setSelectedVersion] = useState(initialUrlState.version);
  const [selectedTableId, setSelectedTableId] = useState(initialUrlState.table);
  const [query, setQuery] = useState('');
  const [relationshipFilter, setRelationshipFilter] = useState('all');
  const [activeView, setActiveView] = useState(initialUrlState.view || 'tables');
  const [objectType, setObjectType] = useState('views');
  const [comparisonFromVersion, setComparisonFromVersion] = useState(initialUrlState.from);
  const [comparisonToVersion, setComparisonToVersion] = useState(initialUrlState.to);
  const [diagramQuery, setDiagramQuery] = useState('');
  const [diagramEdgeType, setDiagramEdgeType] = useState('all');
  const [diagramFocusKey, setDiagramFocusKey] = useState(initialUrlState.diagramFocus);
  const [diagramMode, setDiagramMode] = useState('focused');
  const [diagramDepth, setDiagramDepth] = useState(1);
  const [diagramZoom, setDiagramZoom] = useState(1);
  const [selectedChangedTableKey, setSelectedChangedTableKey] = useState('');
  const [columnUsageQuery, setColumnUsageQuery] = useState('');
  const [localNotes, setLocalNotes] = useState(readLocalNotes);

  useEffect(() => {
    let isCurrent = true;

    async function loadProduct(selectedProduct, products) {
      const manifest = await fetchJson(selectedProduct.manifestUrl);
      const versionEntries = await Promise.all(
        manifest.versions.map(async (version) => {
          const [schema, notes] = await Promise.all([
            fetchJson(version.schemaUrl),
            fetchJson(version.notesUrl).catch(() => ({ tables: {} })),
          ]);
          const schemaErrors = validateSchemaSnapshot(schema);
          if (schemaErrors.length > 0) {
            throw new Error(`${version.schemaUrl}: ${schemaErrors.join(' ')}`);
          }
          return { schema, notes };
        }),
      );

      if (!isCurrent) {
        return;
      }

      setProductsManifest(products);
      setSelectedProductKey(selectedProduct.productKey);
      const loadedProduct = buildSchemaProduct(versionEntries);
      setProduct(loadedProduct);
      const urlVersion = manifest.versions.some((version) => version.version === initialUrlState.version)
        ? initialUrlState.version
        : manifest.defaultVersion;
      const urlFromVersion = manifest.versions.some((version) => version.version === initialUrlState.from)
        ? initialUrlState.from
        : manifest.versions[0]?.version ?? urlVersion;
      const urlToVersion = manifest.versions.some((version) => version.version === initialUrlState.to)
        ? initialUrlState.to
        : urlVersion;
      setSelectedVersion(urlVersion);
      setComparisonFromVersion(urlFromVersion);
      setComparisonToVersion(urlToVersion);
      const defaultTables =
        loadedProduct.versions.find((item) => item.version === urlVersion)?.tables ?? [];
      setSelectedTableId(
        defaultTables.some((table) => table.id === initialUrlState.table)
          ? initialUrlState.table
          : defaultTables[0]?.id ?? '',
      );
      setDiagramFocusKey(initialUrlState.diagramFocus);
    }

    async function loadDefaultProduct() {
      try {
        const products = await fetchJson('/data/products.json').catch(() => ({
          defaultProduct: 'forms',
          products: [
            {
              productKey: 'forms',
              productName: 'Forms',
              manifestUrl: '/data/forms/versions.json',
              status: 'available',
            },
          ],
        }));
        const selectedProduct =
          products.products.find((item) => item.productKey === initialUrlState.product) ??
          products.products.find((item) => item.productKey === products.defaultProduct) ??
          products.products[0];
        await loadProduct(selectedProduct, products);
      } catch (error) {
        if (isCurrent) {
          setLoadError(error.message);
        }
      }
    }

    loadDefaultProduct();
    return () => {
      isCurrent = false;
    };
  }, []);

  const version = product?.versions.find((item) => item.version === selectedVersion) ?? product?.versions[0];
  const productName = product?.name ?? 'Product';
  const localNotesKey = `${selectedProductKey}:${selectedVersion}`;
  const localNotesForVersion = editingEnabled ? localNotes[localNotesKey] ?? {} : {};
  const tables = version?.tables ?? [];

  useEffect(() => {
    if (!product || !selectedVersion) {
      return;
    }

    writeUrlState({
      product: selectedProductKey,
      version: selectedVersion,
      view: activeView,
      table: selectedTableId,
      from: comparisonFromVersion,
      to: comparisonToVersion,
      diagramFocus: diagramFocusKey,
    });
  }, [
    activeView,
    comparisonFromVersion,
    comparisonToVersion,
    diagramFocusKey,
    product,
    selectedProductKey,
    selectedTableId,
    selectedVersion,
  ]);

  const comparison = useMemo(() => {
    if (!product || product.versions.length < 2) {
      return null;
    }
    const fromVersion = product.versions.find((item) => item.version === comparisonFromVersion);
    const toVersion = product.versions.find((item) => item.version === comparisonToVersion);
    return compareVersions(fromVersion, toVersion);
  }, [comparisonFromVersion, comparisonToVersion, product]);

  const filteredTables = useMemo(() => {
    const needle = normalize(query);
    if (!needle) {
      return tables;
    }

    return tables.filter((table) => {
      const columnText = table.columns
        .map((column) => `${column.name} ${column.purpose} ${column.dataType}`)
        .join(' ');
      const relationText = table.relationships.map((relationship) => relationship.table).join(' ');
      const indexText = table.indexes.map((index) => `${index.name} ${index.typeDescription}`).join(' ');
      return normalize(`${table.name} ${table.summary} ${columnText} ${relationText} ${indexText}`).includes(
        needle,
      );
    });
  }, [query, tables]);

  const selectedTable =
    tables.find((table) => table.id === selectedTableId) ?? filteredTables[0] ?? tables[0];

  function handleVersionChange(nextVersion) {
    setSelectedVersion(nextVersion);
    const nextTables = product.versions.find((item) => item.version === nextVersion)?.tables ?? [];
    setSelectedTableId(nextTables[0]?.id ?? '');
  }

  async function handleProductChange(nextProductKey) {
    const selectedProduct = productsManifest?.products.find((item) => item.productKey === nextProductKey);
    if (!selectedProduct || selectedProduct.status !== 'available') {
      return;
    }

    try {
      setLoadError('');
      const manifest = await fetchJson(selectedProduct.manifestUrl);
      const versionEntries = await Promise.all(
        manifest.versions.map(async (versionEntry) => {
          const [schema, notes] = await Promise.all([
            fetchJson(versionEntry.schemaUrl),
            fetchJson(versionEntry.notesUrl).catch(() => ({ tables: {} })),
          ]);
          const schemaErrors = validateSchemaSnapshot(schema);
          if (schemaErrors.length > 0) {
            throw new Error(`${versionEntry.schemaUrl}: ${schemaErrors.join(' ')}`);
          }
          return { schema, notes };
        }),
      );
      const loadedProduct = buildSchemaProduct(versionEntries);
      setSelectedProductKey(selectedProduct.productKey);
      setProduct(loadedProduct);
      setSelectedVersion(manifest.defaultVersion);
      setComparisonFromVersion(manifest.versions[0]?.version ?? manifest.defaultVersion);
      setComparisonToVersion(manifest.defaultVersion);
      setSelectedTableId(
        loadedProduct.versions.find((item) => item.version === manifest.defaultVersion)?.tables[0]?.id ?? '',
      );
      setQuery('');
      setDiagramFocusKey('');
      setActiveView('tables');
    } catch (error) {
      setLoadError(error.message);
    }
  }

  function navigateToTable(tableId) {
    if (tables.some((table) => table.id === tableId)) {
      setSelectedTableId(tableId);
      setActiveView('tables');
      return;
    }

    setQuery(tableId);
    setActiveView('tables');
  }

  function saveLocalTableNote(tableKey, note) {
    if (!editingEnabled) {
      return;
    }

    const nextNotes = {
      ...localNotes,
      [localNotesKey]: {
        ...(localNotes[localNotesKey] ?? {}),
        [tableKey]: {
          ...note,
          updatedAtUtc: new Date().toISOString(),
        },
      },
    };
    setLocalNotes(nextNotes);
    writeLocalNotes(nextNotes);
  }

  function clearLocalTableNote(tableKey) {
    if (!editingEnabled) {
      return;
    }

    const versionNotes = { ...(localNotes[localNotesKey] ?? {}) };
    delete versionNotes[tableKey];
    const nextNotes = { ...localNotes, [localNotesKey]: versionNotes };
    setLocalNotes(nextNotes);
    writeLocalNotes(nextNotes);
  }

  function importLocalNotes(event) {
    if (!editingEnabled) {
      return;
    }

    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result ?? '{}'));
        const importedTables = parsed.tables ?? parsed[localNotesKey] ?? {};
        const nextNotes = {
          ...localNotes,
          [localNotesKey]: {
            ...(localNotes[localNotesKey] ?? {}),
            ...importedTables,
          },
        };
        setLocalNotes(nextNotes);
        writeLocalNotes(nextNotes);
      } catch (error) {
        setLoadError(`Unable to import notes: ${error.message}`);
      }
    };
    reader.readAsText(file);
  }

  function exportVersionNotes() {
    if (!editingEnabled) {
      return;
    }

    downloadJson(
      `${selectedProductKey}-${selectedVersion}-notes-ready.json`,
      localNotesToVersionNotes(localNotes, localNotesKey, selectedProductKey, selectedVersion),
    );
  }

  if (loadError) {
    return (
      <main className="loading-state">
        <AlertTriangle size={26} />
        <h1>Unable to load schema data</h1>
        <p>{loadError}</p>
      </main>
    );
  }

  if (!product || !version || !selectedTable) {
    return (
      <main className="loading-state">
        <Database size={26} />
        <h1>Laserfiche Database Dictionary</h1>
        <p>Loading schema snapshots...</p>
      </main>
    );
  }

  const visibleRelationships = selectedTable.relationships.filter((relationship) => {
    if (relationshipFilter === 'all') {
      return true;
    }
    return relationship.type === relationshipFilter;
  });

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
          <label className="sidebar-select">
            <span>Product</span>
            <select value={selectedProductKey} onChange={(event) => handleProductChange(event.target.value)}>
              {(productsManifest?.products ?? []).map((item) => (
                <option
                  disabled={item.status !== 'available'}
                  key={item.productKey}
                  value={item.productKey}
                >
                  {item.productName}
                  {item.status !== 'available' ? ' (planned)' : ''}
                </option>
              ))}
            </select>
          </label>
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
                <span className="table-item-badges">
                  {table.hasManualNotes && <span className="notes-dot" title="Manual notes present">Notes</span>}
                  <ConfidenceBadge value={table.confidence} />
                </span>
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
              placeholder="Search tables, columns, relationships, indexes"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <label className="version-picker">
            <span>Version</span>
            <select value={selectedVersion} onChange={(event) => handleVersionChange(event.target.value)}>
              {product.versions.map((item) => (
                <option value={item.version} key={item.version}>
                  {productName} {item.version}
                </option>
              ))}
            </select>
          </label>

          {editingEnabled && (
            <div className="editing-mode-badge" role="status">
              <Lock size={15} />
              Editing enabled
            </div>
          )}
        </header>

        <nav className="view-tabs" aria-label="Dictionary views">
          {[
            ['tables', 'Tables'],
            ['compare', 'Compare'],
            ['diagram', 'Diagram'],
            ['objects', 'Objects'],
            ['impact', 'Impact'],
            ['health', 'Health'],
            ['reporting', 'Reporting'],
          ].map(([value, label]) => (
            <button
              className={activeView === value ? 'selected' : ''}
              key={value}
              type="button"
              onClick={() => setActiveView(value)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="warning-banner" role="note">
          <ShieldAlert size={20} />
          <p>
            This documentation is for read-only reporting, troubleshooting, and education. Manually
            writing to or modifying Laserfiche product databases, tables, or records may violate
            your Laserfiche Support plan.
          </p>
        </div>

        <SnapshotFreshnessPanel productName={productName} version={version} />

        <ComparisonSummary
          comparison={comparison}
          versions={product.versions}
          fromVersion={comparisonFromVersion}
          toVersion={comparisonToVersion}
          onFromVersionChange={setComparisonFromVersion}
          onToVersionChange={setComparisonToVersion}
          onOpen={() => setActiveView('compare')}
          productName={productName}
          onDownloadJson={() => downloadJson(`${selectedProductKey}-version-comparison.json`, comparison)}
          onDownloadCsv={() =>
            downloadText(`${selectedProductKey}-version-comparison.csv`, comparisonToCsv(comparison), 'text/csv')
          }
        />

        <ErrorBoundary key={`${activeView}:${selectedProductKey}:${selectedVersion}`}>
          {activeView === 'compare' ? (
            <ComparisonDetail
              comparison={comparison}
              versions={product.versions}
              fromVersion={comparisonFromVersion}
              toVersion={comparisonToVersion}
              onFromVersionChange={setComparisonFromVersion}
              onToVersionChange={setComparisonToVersion}
              productName={productName}
              onSelectTable={navigateToTable}
              selectedTableKey={selectedChangedTableKey}
              onSelectedTableKeyChange={setSelectedChangedTableKey}
            />
          ) : activeView === 'diagram' ? (
            <DatabaseDiagram
              diagramQuery={diagramQuery}
              edgeType={diagramEdgeType}
              focusKey={diagramFocusKey}
              mode={diagramMode}
              depth={diagramDepth}
              zoom={diagramZoom}
              onDiagramQueryChange={setDiagramQuery}
              onEdgeTypeChange={setDiagramEdgeType}
              onFocusKeyChange={setDiagramFocusKey}
              onModeChange={setDiagramMode}
              onDepthChange={setDiagramDepth}
              onZoomChange={setDiagramZoom}
              productName={productName}
              version={version}
              onSelectTable={navigateToTable}
            />
          ) : activeView === 'objects' ? (
            <ObjectExplorer
              objectType={objectType}
              onObjectTypeChange={setObjectType}
              columnUsageQuery={columnUsageQuery}
              onColumnUsageQueryChange={setColumnUsageQuery}
              version={version}
              productName={productName}
              onDownloadReviewQueue={() =>
                downloadJson(`${selectedProductKey}-${version.version}-documentation-review.json`, getReviewItems(version))
              }
              onSelectTable={navigateToTable}
            />
          ) : activeView === 'impact' ? (
            <ImpactView
              version={version}
              localNotesForVersion={localNotesForVersion}
              onDownloadJson={() =>
                downloadJson(`${selectedProductKey}-${version.version}-table-impact.json`, getTableImpactItems(version))
              }
              onSelectTable={navigateToTable}
            />
          ) : activeView === 'health' ? (
            <SchemaHealthView
              version={version}
              onDownloadJson={() =>
                downloadJson(`${selectedProductKey}-${version.version}-schema-health.json`, getSchemaHealthItems(version))
              }
              onSelectTable={navigateToTable}
            />
          ) : activeView === 'reporting' ? (
            <ReportingGuide productName={productName} version={version} onSelectTable={navigateToTable} />
          ) : (
            <TableWorkspace
              selectedTable={selectedTable}
              selectedVersion={selectedVersion}
              productName={productName}
              editingEnabled={editingEnabled}
              localNote={localNotesForVersion[selectedTable.id]}
              localNotesKey={localNotesKey}
              localNoteChanged={isLocalNoteDifferent(localNotesForVersion[selectedTable.id], selectedTable)}
              onExportLocalNotes={() => {
                if (editingEnabled) {
                  downloadJson(`${selectedProductKey}-${selectedVersion}-local-notes.json`, localNotes);
                }
              }}
              onExportVersionNotes={exportVersionNotes}
              onImportLocalNotes={importLocalNotes}
              onSaveLocalNote={saveLocalTableNote}
              onClearLocalNote={clearLocalTableNote}
              onDownloadTableJson={() => downloadJson(`${selectedTable.id}.json`, selectedTable.source)}
              onDownloadTableCsv={() => downloadText(`${selectedTable.id}.csv`, tableToCsv(selectedTable), 'text/csv')}
              visibleRelationships={visibleRelationships}
              relationshipFilter={relationshipFilter}
              setRelationshipFilter={setRelationshipFilter}
              navigateToTable={navigateToTable}
            />
          )}
        </ErrorBoundary>
      </section>
    </main>
  );
}

const rootElement = document.getElementById('root');
globalThis.laserficheDictionaryRoot ??= createRoot(rootElement);
globalThis.laserficheDictionaryRoot.render(<App />);
