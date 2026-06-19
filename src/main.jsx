import { Fragment, lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertTriangle,
  CalendarClock,
  Clipboard,
  Columns3,
  Database,
  ExternalLink,
  FileCode2,
  GitBranch,
  HelpCircle,
  Lock,
  Search,
  ShieldAlert,
  TableProperties,
  X,
} from 'lucide-react';
import { appConfig } from './config.js';
import { buildSchemaProduct, compareVersions, validateSchemaSnapshot } from './data/schemaDictionary.js';
import { isLocalNoteDifferent, localNotesToVersionNotes } from './data/notes.js';
import {
  getReviewItems,
  getSchemaHealthItems,
  getTableImpactItems,
  getUnresolvedDependencyItems,
} from './data/schemaAnalysis.js';
import {
  comparisonToCsv,
  relationshipsToCsv,
  reviewTablesToCsv,
  tableToCsv,
} from './data/csvExports.js';
import {
  formatCompletenessValue,
  getDatabaseRoleExplanation,
  getObjectCompletionByType,
  getSnapshotCompletenessRows,
  getTableCompletionBySchema,
  getVersionTrendRows,
} from './data/schemaCompleteness.js';
import {
  attachProductVersions,
  buildGlobalSearchItems,
  getConfidenceLegendItems,
  getSchemaCoverageGaps,
} from './data/projectInsights.js';
import { readUrlState, writeUrlState } from './data/urlState.js';
import { ComparisonDetail, ComparisonSummary } from './components/ComparisonViews.jsx';
import { DatabaseDiagram } from './components/DatabaseDiagram.jsx';
import { DependencyReportView } from './components/DependencyReportView.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { ImpactView } from './components/ImpactView.jsx';
import { ObjectExplorer } from './components/ObjectExplorer.jsx';
import { ReportingGuide } from './components/ReportingGuide.jsx';
import { SchemaHealthView } from './components/SchemaHealthView.jsx';
import { TableWorkspace } from './components/TableWorkspace.jsx';
import './styles.css';

const editingBuildEnabled = import.meta.env.VITE_ENABLE_EDITING === 'true';
const ImportPreviewView = editingBuildEnabled
  ? lazy(() => import('./components/ImportPreviewView.jsx').then((module) => ({ default: module.ImportPreviewView })))
  : null;
const EditingCapabilityGuard = editingBuildEnabled
  ? lazy(() => import('./components/EditingCapabilityGuard.jsx').then((module) => ({ default: module.EditingCapabilityGuard })))
  : null;

function resolvePublicUrl(url) {
  if (!url || /^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(url)) {
    return url;
  }

  const baseUrl = import.meta.env.BASE_URL || '/';
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const normalizedPath = String(url).replace(/^\/+/, '');
  return `${normalizedBase}${normalizedPath}`;
}

class DataLoadError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'DataLoadError';
    this.details = details;
  }
}

async function fetchJson(url) {
  const requestUrl = resolvePublicUrl(url);
  let response;
  try {
    response = await fetch(requestUrl, { cache: 'no-store' });
  } catch (error) {
    throw new DataLoadError(`Unable to request ${requestUrl}.`, [
      'Confirm the static site is serving the public/data folder.',
      error.message,
    ]);
  }

  if (!response.ok) {
    throw new DataLoadError(`Unable to load ${requestUrl}.`, [
      `HTTP status: ${response.status}`,
      'Confirm the product manifest points to an existing JSON file.',
    ]);
  }

  try {
    return await response.json();
  } catch (error) {
    throw new DataLoadError(`Unable to parse JSON from ${requestUrl}.`, [
      'Confirm the file was exported as JSON and was not saved as text, HTML, or CSV.',
      error.message,
    ]);
  }
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

function readUiPreferences() {
  try {
    const preferences = JSON.parse(localStorage.getItem('lfdd.uiPreferences.v1') ?? '{}');
    return typeof preferences === 'object' && preferences ? preferences : {};
  } catch {
    return {};
  }
}

function readJsonStorage(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? 'null');
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function writeUiPreferences(preferences) {
  localStorage.setItem('lfdd.uiPreferences.v1', JSON.stringify(preferences));
}

function markdownEscape(value) {
  return String(value ?? '').replaceAll('|', '\\|').replaceAll('\r\n', '\n');
}

function tableToMarkdown(table, productName, selectedVersion, relationships) {
  const lines = [
    `# ${table.name}`,
    '',
    `Product: ${productName}`,
    `Version: ${selectedVersion}`,
    `Confidence: ${table.confidence}`,
    '',
    '## Summary',
    '',
    table.summary,
    '',
    '## Read-only Guidance',
    '',
    ...table.safeReportingNotes.map((note) => `- ${note}`),
    '',
    '## Warnings',
    '',
    ...table.warnings.map((warning) => `- ${warning}`),
    '',
    '## Columns',
    '',
    '| Column | Type | Nullable | Confidence | Purpose |',
    '| --- | --- | --- | --- | --- |',
    ...table.columns.map((column) =>
      `| ${markdownEscape(column.name)} | ${markdownEscape(column.dataType)} | ${column.nullable ? 'Yes' : 'No'} | ${markdownEscape(column.confidence)} | ${markdownEscape(column.purpose)} |`),
    '',
    '## Relationships',
    '',
    '| Direction | Related table | Confidence | Note |',
    '| --- | --- | --- | --- |',
    ...(relationships.length > 0
      ? relationships.map((relationship) =>
        `| ${markdownEscape(relationship.type)} | ${markdownEscape(relationship.table)} | ${markdownEscape(relationship.confidence)} | ${markdownEscape(relationship.note)} |`)
      : ['| None |  |  | No exported SQL foreign keys for this table. |']),
    '',
  ];
  return `${lines.join('\n')}\n`;
}

function versionSummaryToMarkdown(productName, version) {
  const source = version.source ?? {};
  const totalColumns = version.tables.reduce((total, table) => total + table.columns.length, 0);
  const totalRelationships = version.tables.reduce((total, table) => total + table.relationships.length, 0);
  const rows = getSnapshotCompletenessRows(version);
  const lines = [
    `# ${productName} ${version.version}`,
    '',
    '## Product/version metadata',
    '',
    `- Exported: ${formatSnapshotDate(version.exportedAtUtc)}`,
    `- Export format: ${formatCompletenessValue(source.exportFormatVersion)}`,
    `- Database role: ${formatCompletenessValue(source.databaseRole)}`,
    `- Tables: ${version.tables.length}`,
    `- Columns: ${totalColumns}`,
    `- Relationships: ${totalRelationships}`,
    '',
    '## Coverage',
    '',
    '| Area | Count |',
    '| --- | ---: |',
    ...rows.map((row) => `| ${markdownEscape(row.label)} | ${markdownEscape(row.value)} |`),
    '',
    '## Tables',
    '',
    '| Table | Columns | Relationships | Confidence | Notes |',
    '| --- | ---: | ---: | --- | --- |',
    ...version.tables.map((table) =>
      `| ${markdownEscape(table.id)} | ${table.columns.length} | ${table.relationships.length} | ${markdownEscape(table.confidence)} | ${table.hasManualNotes ? 'Manual notes' : 'Pending'} |`),
    '',
  ];
  return `${lines.join('\n')}\n`;
}

function formatSnapshotDate(value) {
  if (!value) {
    return 'Unknown';
  }

  const normalizedValue = /(?:z|[+-]\d{2}:?\d{2})$/i.test(String(value)) ? value : `${value}Z`;
  const date = new Date(normalizedValue);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getSnapshotAgeWarning(version) {
  if (!version.exportedAtUtc) {
    return 'Export timestamp is missing; confirm the metadata freshness before relying on it.';
  }
  const normalizedValue = /(?:z|[+-]\d{2}:?\d{2})$/i.test(String(version.exportedAtUtc))
    ? version.exportedAtUtc
    : `${version.exportedAtUtc}Z`;
  const exportedAt = new Date(normalizedValue);
  if (Number.isNaN(exportedAt.getTime())) {
    return 'Export timestamp could not be parsed; confirm the metadata freshness before relying on it.';
  }
  const ageDays = Math.floor((Date.now() - exportedAt.getTime()) / 86400000);
  return ageDays > 180 ? `This metadata export is ${ageDays.toLocaleString()} days old; verify it still matches the target environment.` : '';
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

const versionTrendColumns = [
  ['Version', 'Product version for this imported schema snapshot.'],
  ['Schema size', 'Approximate serialized schema metadata size for the snapshot.'],
  ['Objects', 'Total exported tables, views, routines, and triggers.'],
  ['Health', 'Number of schema health warnings detected for this version.'],
  ['Deps', 'Resolved SQL expression dependencies compared with total exported dependency rows.'],
  ['Notes', 'Percent of tables with manual notes in this version.'],
];

function SnapshotFreshnessPanel({ product, productsManifest, productName, version, onDownloadMarkdown }) {
  const stats = getSnapshotStats(version);
  const [showSnapshotDetails, setShowSnapshotDetails] = useState(false);
  const source = version.source ?? {};
  const rows = getSnapshotCompletenessRows(version);
  const trendRows = getVersionTrendRows(product);
  const tableCompletionRows = getTableCompletionBySchema(version);
  const objectCompletionRows = getObjectCompletionByType(version);
  const freshnessWarning = getSnapshotAgeWarning(version);
  const importedVersions = product.versions.map((item) => item.version).join(', ');
  const coverageGaps = getSchemaCoverageGaps(productsManifest, product);
  const confidenceLegendItems = getConfidenceLegendItems();

  return (
    <section className="snapshot-panel" aria-label="Product and version metadata freshness">
      <div className="snapshot-main">
        <div>
          <p className="snapshot-kicker">Product/version</p>
          <h2>{productName} {version.version}</h2>
          {freshnessWarning && <p className="snapshot-warning">{freshnessWarning}</p>}
        </div>
        <div className="snapshot-actions">
          <button
            aria-expanded={showSnapshotDetails}
            className="snapshot-details-button"
            onClick={() => setShowSnapshotDetails((current) => !current)}
            type="button"
          >
            {showSnapshotDetails ? 'Hide details' : 'Metadata details'}
          </button>
          <button className="snapshot-details-button" onClick={onDownloadMarkdown} type="button">
            Markdown
          </button>
        </div>
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
      {showSnapshotDetails ? (
        <div className="snapshot-details" aria-label="Product and version metadata completeness">
          <div>
            <h3>Export manifest and coverage</h3>
            <p>
              Product and version identity come from the export manifest and static manifests, not the SQL Server
              database name. Database names can differ by environment.
            </p>
          </div>

          <div className="snapshot-details-card-stack">
            <div className="snapshot-completeness-grid" aria-label="Metadata object counts">
              {rows.map((row) => (
                <span key={row.label}>
                  <strong>{row.value}</strong>
                  {row.label}
                </span>
              ))}
            </div>
            <div className="snapshot-completeness-grid" aria-label="Object documentation completion by type">
              {objectCompletionRows.map((row) => (
                <span key={row.label}>
                  <strong>{row.value}</strong>
                  <span className="snapshot-card-label">
                    {row.label}
                    {row.tooltip && (
                      <span className="info-tooltip" tabIndex={0} aria-label={`${row.label}: ${row.tooltip}`}>
                        i
                        <span role="tooltip">{row.tooltip}</span>
                      </span>
                    )}
                  </span>
                </span>
              ))}
            </div>
            <div className="snapshot-completeness-grid" aria-label="Table documentation completion by schema">
              {tableCompletionRows.slice(0, 10).map((row) => (
                <span key={row.label}>
                  <strong>{row.value}</strong>
                  <span className="snapshot-card-label">
                    {row.label}
                    {row.tooltip && (
                      <span className="info-tooltip" tabIndex={0} aria-label={`${row.label}: ${row.tooltip}`}>
                        i
                        <span role="tooltip">{row.tooltip}</span>
                      </span>
                    )}
                  </span>
                </span>
              ))}
            </div>

            <dl className="snapshot-manifest-list">
              <div>
                <dt>Export format</dt>
                <dd>{formatCompletenessValue(source.exportFormatVersion)}</dd>
              </div>
              <div>
                <dt>Export script</dt>
                <dd>{formatCompletenessValue(source.exportScriptVersion)}</dd>
              </div>
              <div>
                <dt>Database role</dt>
                <dd>
                  <strong>{formatCompletenessValue(source.databaseRole)}</strong>
                  <span>{getDatabaseRoleExplanation(source.databaseRole)}</span>
                </dd>
              </div>
              <div>
                <dt>Imported versions</dt>
                <dd>{importedVersions || 'None loaded'}</dd>
              </div>
            </dl>
          </div>
          <div className="snapshot-trend-table">
            <h3>Version trends</h3>
            <div>
              {versionTrendColumns.map(([label, tooltip]) => (
                <span className="snapshot-trend-heading" key={label}>
                  {label}
                  <span className="info-tooltip" tabIndex={0} aria-label={`${label}: ${tooltip}`}>
                    i
                    <span role="tooltip">{tooltip}</span>
                  </span>
                </span>
              ))}
              {trendRows.map((row) => (
                <Fragment key={row.version}>
                  <strong>{row.version}</strong>
                  <span>{row.schemaSize.toLocaleString()}</span>
                  <span>{row.objectCount.toLocaleString()}</span>
                  <span>{row.healthIssues.toLocaleString()}</span>
                  <span>{row.dependencyResolution}</span>
                  <span>{row.notesCompletion}</span>
                </Fragment>
              ))}
            </div>
          </div>
          <div className="snapshot-support-grid">
            <section className="snapshot-support-panel">
              <div className="section-title-row">
                <h3>Confidence legend</h3>
                <span>{confidenceLegendItems.length}</span>
              </div>
              <div className="confidence-legend-list">
                {confidenceLegendItems.map((item) => (
                  <div key={item.value}>
                    <strong>{item.label}</strong>
                    <p>{item.description}</p>
                  </div>
                ))}
              </div>
            </section>
            <section className="snapshot-support-panel">
              <div className="section-title-row">
                <h3>Coverage gaps</h3>
                <span>{coverageGaps.length}</span>
              </div>
              {coverageGaps.length === 0 ? (
                <p className="empty-state">No immediate product/version export gaps were detected from the current manifests.</p>
              ) : (
                <ul>
                  {coverageGaps.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function getInitialDiagramEdgeType(value) {
  return ['all', 'foreignKey', 'dependency'].includes(value) ? value : 'foreignKey';
}

function getInitialDiagramMode(value) {
  return ['full', 'focused'].includes(value) ? value : 'full';
}

function getInitialDiagramDepth(value) {
  return Number(value) === 2 ? 2 : 1;
}

function getInitialDiagramZoom(value) {
  const numericValue = Number(value);
  return [0.75, 1, 1.25, 1.5].includes(numericValue) ? numericValue : 1;
}

function getInitialDiagramSecondHop(value) {
  return value !== 'hidden';
}

function getInitialBooleanToggle(value) {
  return value === 'true';
}

const diagramObjectTypes = ['table', 'view', 'routine', 'trigger'];

function getInitialDiagramObjectTypes(value) {
  const selectedTypes = new Set(
    String(value ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter((item) => diagramObjectTypes.includes(item)),
  );

  return diagramObjectTypes.reduce((filters, type) => {
    filters[type] = type === 'table' || selectedTypes.size === 0 || selectedTypes.has(type);
    return filters;
  }, {});
}

function serializeDiagramObjectTypes(filters) {
  const selectedTypes = diagramObjectTypes.filter((type) => filters[type]);
  return selectedTypes.length === diagramObjectTypes.length ? '' : selectedTypes.join(',');
}

function getDocumentationCoverage(tables) {
  const counts = {
    confirmed: 0,
    observed: 0,
    inferred: 0,
    unknown: 0,
    deprecated: 0,
    do_not_rely_on: 0,
    manual: 0,
  };
  tables.forEach((table) => {
    counts[table.confidence] = (counts[table.confidence] ?? 0) + 1;
    if (table.hasManualNotes) {
      counts.manual += 1;
    }
  });
  return counts;
}

function App() {
  const editingEnabled = appConfig.editingEnabled;
  const [initialUrlState] = useState(() => readUrlState());
  const [initialPreferences] = useState(readUiPreferences);
  const preferredProductKey = initialUrlState.product || initialPreferences.product || 'forms';
  const preferredVersion = initialUrlState.version || initialPreferences.version || '';
  const preferredView = initialUrlState.view || initialPreferences.view || 'tables';
  const [product, setProduct] = useState(null);
  const [productsManifest, setProductsManifest] = useState(null);
  const [selectedProductKey, setSelectedProductKey] = useState(preferredProductKey);
  const [loadError, setLoadError] = useState('');
  const [selectedVersion, setSelectedVersion] = useState(preferredVersion);
  const [selectedTableId, setSelectedTableId] = useState(initialUrlState.table);
  const [query, setQuery] = useState(initialUrlState.q);
  const [tableConfidenceFilter, setTableConfidenceFilter] = useState(initialUrlState.confidence || 'all');
  const [tableNotesFilter, setTableNotesFilter] = useState(initialUrlState.notes || 'all');
  const [relationshipFilter, setRelationshipFilter] = useState('all');
  const [activeView, setActiveView] = useState(preferredView);
  const [objectType, setObjectType] = useState(initialUrlState.objectType || 'views');
  const [comparisonFromVersion, setComparisonFromVersion] = useState(initialUrlState.from);
  const [comparisonToVersion, setComparisonToVersion] = useState(initialUrlState.to);
  const [diagramQuery, setDiagramQuery] = useState(initialUrlState.diagramQuery);
  const [diagramEdgeType, setDiagramEdgeType] = useState(
    getInitialDiagramEdgeType(initialUrlState.diagramEdges || initialPreferences.diagramEdges),
  );
  const [diagramFocusKey, setDiagramFocusKey] = useState(initialUrlState.diagramFocus);
  const [diagramMode, setDiagramMode] = useState(
    getInitialDiagramMode(initialUrlState.diagramMode || initialPreferences.diagramMode),
  );
  const [diagramDepth, setDiagramDepth] = useState(
    getInitialDiagramDepth(initialUrlState.diagramDepth || initialPreferences.diagramDepth),
  );
  const [diagramZoom, setDiagramZoom] = useState(
    getInitialDiagramZoom(initialUrlState.diagramZoom || initialPreferences.diagramZoom),
  );
  const [diagramObjectTypeFilters, setDiagramObjectTypeFilters] = useState(() =>
    getInitialDiagramObjectTypes(initialUrlState.diagramTypes || initialPreferences.diagramTypes),
  );
  const [showDiagramSecondHopEdges, setShowDiagramSecondHopEdges] = useState(() =>
    getInitialDiagramSecondHop(initialUrlState.diagramSecondHop || initialPreferences.diagramSecondHop),
  );
  const [diagramConnectedOnly, setDiagramConnectedOnly] = useState(() =>
    getInitialBooleanToggle(initialUrlState.diagramConnectedOnly || initialPreferences.diagramConnectedOnly),
  );
  const [selectedChangedTableKey, setSelectedChangedTableKey] = useState('');
  const [columnUsageQuery, setColumnUsageQuery] = useState(initialUrlState.objectQuery);
  const [localNotes, setLocalNotes] = useState(readLocalNotes);
  const [editingWarningAccepted, setEditingWarningAccepted] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [shortcutHelpOpen, setShortcutHelpOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [favoriteObjects, setFavoriteObjects] = useState(() => readJsonStorage('lfdd.favoriteObjects.v1', []));
  const [diagramPresets, setDiagramPresets] = useState(() => readJsonStorage('lfdd.diagramPresets.v1', []));
  const canEditNotes = editingEnabled && editingWarningAccepted;
  const canUseImport = canEditNotes;

  useEffect(() => {
    let isCurrent = true;

    async function loadProduct(selectedProduct, products) {
      const manifest = await fetchJson(selectedProduct.manifestUrl).catch((error) => {
        throw new DataLoadError(`Unable to load ${selectedProduct.productName ?? selectedProduct.productKey} versions.`, [
          selectedProduct.manifestUrl,
          error.message,
          ...(error.details ?? []),
        ]);
      });
      if (!Array.isArray(manifest.versions) || manifest.versions.length === 0) {
        throw new DataLoadError(`Product manifest has no versions: ${selectedProduct.manifestUrl}`, [
          'Add at least one version entry with schemaUrl and notesUrl.',
        ]);
      }

      const versionEntries = await Promise.all(
        manifest.versions.map(async (version) => {
          const schema = await fetchJson(version.schemaUrl).catch((error) => {
            throw new DataLoadError(`Unable to load schema snapshot for ${version.version}.`, [
              version.schemaUrl,
              error.message,
              ...(error.details ?? []),
            ]);
          });
          const notes = await fetchJson(version.notesUrl).catch(() => ({ tables: {} }));
          const schemaErrors = validateSchemaSnapshot(schema);
          if (schemaErrors.length > 0) {
            throw new DataLoadError(`Schema snapshot failed validation for ${version.version}.`, [
              version.schemaUrl,
              ...schemaErrors.slice(0, 8),
              ...(schemaErrors.length > 8 ? [`${schemaErrors.length - 8} more validation errors.`] : []),
            ]);
          }
          return { schema, notes };
        }),
      );

      if (!isCurrent) {
        return;
      }

      setProductsManifest(products);
      setSelectedProductKey(selectedProduct.productKey);
      const loadedProduct = attachProductVersions(buildSchemaProduct(versionEntries));
      setProduct(loadedProduct);
      const urlVersion = manifest.versions.some((version) => version.version === preferredVersion)
        ? preferredVersion
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
      setDiagramEdgeType(getInitialDiagramEdgeType(initialUrlState.diagramEdges || initialPreferences.diagramEdges));
      setDiagramMode(getInitialDiagramMode(initialUrlState.diagramMode || initialPreferences.diagramMode));
      setDiagramDepth(getInitialDiagramDepth(initialUrlState.diagramDepth || initialPreferences.diagramDepth));
      setDiagramZoom(getInitialDiagramZoom(initialUrlState.diagramZoom || initialPreferences.diagramZoom));
      setDiagramObjectTypeFilters(
        getInitialDiagramObjectTypes(initialUrlState.diagramTypes || initialPreferences.diagramTypes),
      );
      setShowDiagramSecondHopEdges(
        getInitialDiagramSecondHop(initialUrlState.diagramSecondHop || initialPreferences.diagramSecondHop),
      );
      setDiagramConnectedOnly(
        getInitialBooleanToggle(initialUrlState.diagramConnectedOnly || initialPreferences.diagramConnectedOnly),
      );
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
          products.products.find((item) => item.productKey === preferredProductKey) ??
          products.products.find((item) => item.productKey === products.defaultProduct) ??
          products.products[0];
        await loadProduct(selectedProduct, products);
      } catch (error) {
        if (isCurrent) {
          setLoadError(error);
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
      q: query,
      confidence: tableConfidenceFilter === 'all' ? '' : tableConfidenceFilter,
      notes: tableNotesFilter === 'all' ? '' : tableNotesFilter,
      from: comparisonFromVersion,
      to: comparisonToVersion,
      objectType,
      objectQuery: columnUsageQuery,
      diagramFocus: diagramFocusKey,
      diagramQuery,
      diagramMode,
      diagramEdges: diagramEdgeType,
      diagramDepth: String(diagramDepth),
      diagramZoom: String(diagramZoom),
      diagramTypes: serializeDiagramObjectTypes(diagramObjectTypeFilters),
      diagramSecondHop: showDiagramSecondHopEdges ? '' : 'hidden',
      diagramConnectedOnly: diagramConnectedOnly ? 'true' : '',
    });
    writeUiPreferences({
      product: selectedProductKey,
      version: selectedVersion,
      view: activeView,
      q: query,
      confidence: tableConfidenceFilter,
      notes: tableNotesFilter,
      objectType,
      objectQuery: columnUsageQuery,
      diagramQuery,
      diagramMode,
      diagramEdges: diagramEdgeType,
      diagramDepth: String(diagramDepth),
      diagramZoom: String(diagramZoom),
      diagramTypes: serializeDiagramObjectTypes(diagramObjectTypeFilters),
      diagramSecondHop: showDiagramSecondHopEdges ? '' : 'hidden',
      diagramConnectedOnly: diagramConnectedOnly ? 'true' : '',
    });
  }, [
    activeView,
    columnUsageQuery,
    comparisonFromVersion,
    comparisonToVersion,
    diagramDepth,
    diagramEdgeType,
    diagramFocusKey,
    diagramMode,
    diagramObjectTypeFilters,
    diagramQuery,
    diagramZoom,
    diagramConnectedOnly,
    objectType,
    product,
    query,
    selectedProductKey,
    selectedTableId,
    selectedVersion,
    showDiagramSecondHopEdges,
    tableConfidenceFilter,
    tableNotesFilter,
  ]);

  const comparison = useMemo(() => {
    if (!product || product.versions.length < 2) {
      return null;
    }
    const fromVersion = product.versions.find((item) => item.version === comparisonFromVersion);
    const toVersion = product.versions.find((item) => item.version === comparisonToVersion);
    return compareVersions(fromVersion, toVersion);
  }, [comparisonFromVersion, comparisonToVersion, product]);

  const activeViewLabels = useMemo(() => ([
    ['tables', 'Tables'],
    ['compare', 'Compare'],
    ['diagram', 'Diagram'],
    ['objects', 'Objects'],
    ['impact', 'Impact'],
    ['health', 'Health'],
    ['dependencies', 'Dependencies'],
    ...(editingEnabled ? [['import', 'Import']] : []),
    ['reporting', 'Reporting'],
  ]), [editingEnabled]);

  useEffect(() => {
    if (activeView === 'import' && !editingEnabled) {
      setActiveView('tables');
    }
  }, [activeView, editingEnabled]);

  const commandItems = useMemo(() => {
    if (!version) {
      return [];
    }
    const globalSearchItems = buildGlobalSearchItems(version, tables).map((item) => ({
      ...item,
      action: () => {
        if (item.objectType) {
          setObjectType(item.objectType);
          setColumnUsageQuery(item.label);
          setActiveView('objects');
          return;
        }
        if (item.tableKey) {
          setSelectedTableId(item.tableKey);
          setActiveView('tables');
        }
      },
    }));
    return [
      ...activeViewLabels.map(([value, label]) => ({ type: 'View', label, action: () => setActiveView(value) })),
      ...globalSearchItems,
    ];
  }, [activeViewLabels, tables, version]);

  const filteredCommandItems = useMemo(() => {
    const needle = normalize(commandQuery);
    return commandItems
      .filter((item) => normalize(`${item.type} ${item.label} ${item.searchText ?? ''}`).includes(needle))
      .slice(0, 24);
  }, [commandItems, commandQuery]);

  useEffect(() => {
    function handleKeyboardShortcuts(event) {
      const target = event.target;
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName) || target?.isContentEditable;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(true);
        return;
      }
      if (event.key === '?' && !isTyping) {
        event.preventDefault();
        setShortcutHelpOpen((current) => !current);
        return;
      }
      if (isTyping) {
        return;
      }
      const numericShortcut = Number(event.key);
      if (numericShortcut >= 1 && numericShortcut <= activeViewLabels.length) {
        event.preventDefault();
        setActiveView(activeViewLabels[numericShortcut - 1][0]);
      }
      if (activeView === 'diagram') {
        if (event.key === '+' || event.key === '=') {
          setDiagramZoom((current) => Math.min(1.5, current + 0.25));
        } else if (event.key === '-') {
          setDiagramZoom((current) => Math.max(0.75, current - 0.25));
        } else if (event.key.toLowerCase() === 'f') {
          setDiagramZoom(1);
        } else if (event.key === 'Escape') {
          setDiagramFocusKey('');
          setDiagramMode('full');
        }
      }
    }
    window.addEventListener('keydown', handleKeyboardShortcuts);
    return () => window.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [activeView, activeViewLabels]);

  const documentationCoverage = useMemo(() => getDocumentationCoverage(tables), [tables]);
  const unknownTables = useMemo(() => tables.filter((table) => table.confidence === 'unknown'), [tables]);

  const filteredTables = useMemo(() => {
    const needle = normalize(query);
    return tables.filter((table) => {
      if (tableConfidenceFilter !== 'all' && table.confidence !== tableConfidenceFilter) {
        return false;
      }
      if (tableNotesFilter === 'manual' && !table.hasManualNotes) {
        return false;
      }
      if (tableNotesFilter === 'missing' && table.hasManualNotes) {
        return false;
      }
      if (!needle) {
        return true;
      }
      const columnText = table.columns
        .map((column) => `${column.name} ${column.purpose} ${column.dataType}`)
        .join(' ');
      const relationText = table.relationships.map((relationship) => relationship.table).join(' ');
      const indexText = table.indexes.map((index) => `${index.name} ${index.typeDescription}`).join(' ');
      return normalize(`${table.name} ${table.summary} ${columnText} ${relationText} ${indexText}`).includes(
        needle,
      );
    });
  }, [query, tableConfidenceFilter, tableNotesFilter, tables]);

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
      const loadedProduct = attachProductVersions(buildSchemaProduct(versionEntries));
      setSelectedProductKey(selectedProduct.productKey);
      setProduct(loadedProduct);
      setSelectedVersion(manifest.defaultVersion);
      setComparisonFromVersion(manifest.versions[0]?.version ?? manifest.defaultVersion);
      setComparisonToVersion(manifest.defaultVersion);
      setSelectedTableId(
        loadedProduct.versions.find((item) => item.version === manifest.defaultVersion)?.tables[0]?.id ?? '',
      );
      setQuery('');
      setTableConfidenceFilter('all');
      setTableNotesFilter('all');
      setColumnUsageQuery('');
      setDiagramQuery('');
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

  function toggleFavoriteObject(objectKey) {
    const nextFavorites = favoriteObjects.includes(objectKey)
      ? favoriteObjects.filter((item) => item !== objectKey)
      : [...favoriteObjects, objectKey].slice(-24);
    setFavoriteObjects(nextFavorites);
    localStorage.setItem('lfdd.favoriteObjects.v1', JSON.stringify(nextFavorites));
  }

  async function copyCurrentDeepLink(label = 'link') {
    await navigator.clipboard?.writeText(window.location.href);
    setLoadError('');
    setCommandQuery(`Copied ${label}`);
    globalThis.setTimeout(() => setCommandQuery(''), 900);
  }

  function saveDiagramPreset() {
    const preset = {
      id: `${Date.now()}`,
      label: `${selectedProductKey} ${selectedVersion} ${diagramFocusKey || 'full diagram'}`,
      product: selectedProductKey,
      version: selectedVersion,
      diagramFocus: diagramFocusKey,
      diagramMode,
      diagramEdges: diagramEdgeType,
      diagramDepth,
      diagramZoom,
      diagramTypes: serializeDiagramObjectTypes(diagramObjectTypeFilters),
      diagramSecondHop: showDiagramSecondHopEdges,
      diagramConnectedOnly,
    };
    const nextPresets = [preset, ...diagramPresets].slice(0, 10);
    setDiagramPresets(nextPresets);
    localStorage.setItem('lfdd.diagramPresets.v1', JSON.stringify(nextPresets));
  }

  function applyDiagramPreset(presetId) {
    const preset = diagramPresets.find((item) => item.id === presetId);
    if (!preset) {
      return;
    }
    setDiagramFocusKey(preset.diagramFocus);
    setDiagramMode(preset.diagramMode);
    setDiagramEdgeType(preset.diagramEdges);
    setDiagramDepth(preset.diagramDepth);
    setDiagramZoom(preset.diagramZoom);
    setDiagramObjectTypeFilters(getInitialDiagramObjectTypes(preset.diagramTypes));
    setShowDiagramSecondHopEdges(preset.diagramSecondHop);
    setDiagramConnectedOnly(preset.diagramConnectedOnly);
  }

  function saveLocalTableNote(tableKey, note) {
    if (!canEditNotes) {
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
    if (!canEditNotes) {
      return;
    }

    const versionNotes = { ...(localNotes[localNotesKey] ?? {}) };
    delete versionNotes[tableKey];
    const nextNotes = { ...localNotes, [localNotesKey]: versionNotes };
    setLocalNotes(nextNotes);
    writeLocalNotes(nextNotes);
  }

  function importLocalNotes(event) {
    if (!canEditNotes) {
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
    if (!canEditNotes) {
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
        <p>{loadError.message}</p>
        {loadError.details?.length > 0 && (
          <ul className="load-error-details">
            {loadError.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        )}
      </main>
    );
  }

  if (!product || !version || !selectedTable) {
    return (
      <main className="loading-state">
        <Database size={26} />
        <h1>Laserfiche Data Dictionary</h1>
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
      <aside className="sidebar" aria-label="Product, version, and view navigation">
        <div className="brand">
          <div className="brand-mark">
            <Database size={22} />
          </div>
          <div>
            <h1>Laserfiche Data Dictionary</h1>
            <p>Schema, relationships, and reporting</p>
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
          <label className="sidebar-select">
            <span>Version</span>
            <select value={selectedVersion} onChange={(event) => handleVersionChange(event.target.value)}>
              {product.versions.map((item) => (
                <option value={item.version} key={item.version}>
                  {item.version}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="sidebar-section">
          <h2>Database views</h2>
          <nav className="sidebar-view-nav" aria-label="Dictionary views">
            {activeViewLabels.map(([value, label]) => (
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
        </section>
      </aside>

      <section className="workspace">
        <header className="topbar">
          {editingEnabled && (
            <div className="editing-mode-badge" role="status">
              <Lock size={15} />
              Editing enabled
            </div>
          )}

          <div className="warning-banner topbar-warning" role="note">
            <ShieldAlert size={20} />
            <p>
              This documentation is for read-only reporting, troubleshooting, and education. Manually
              writing to or modifying Laserfiche product databases, tables, etc. will violate your
              Laserfiche Support plan and is not supported.
              {' '}
              <a
                className="warning-link"
                href="https://github.com/SilhouetteBS/LaserficheDataDictionary/blob/main/docs/known-limitations.md"
                rel="noreferrer"
                target="_blank"
              >
                Known limitations
                <ExternalLink aria-hidden="true" size={13} />
              </a>
            </p>
          </div>

          <div className="topbar-actions">
            <button className="text-button command-button" type="button" onClick={() => setCommandOpen(true)}>
              <Search size={14} />
              Command
            </button>
            <button className="icon-button" title="Keyboard shortcuts" type="button" onClick={() => setShortcutHelpOpen(true)}>
              <HelpCircle size={16} />
            </button>
            <button className="icon-button" title="Copy current view link" type="button" onClick={() => copyCurrentDeepLink('current view')}>
              <Clipboard size={16} />
            </button>
          </div>
        </header>

        <SnapshotFreshnessPanel
          product={product}
          productsManifest={productsManifest}
          productName={productName}
          version={version}
          onDownloadMarkdown={() =>
            downloadText(
              `${selectedProductKey}-${selectedVersion}-summary.md`,
              versionSummaryToMarkdown(productName, version),
              'text/markdown',
            )
          }
        />

        {editingEnabled && (
          <div className="editing-warning-banner" role="note">
            <Lock size={18} />
            <div>
              <strong>Local editing mode only</strong>
              <p>
                Notes are saved to this browser's local storage. This does not enable database editing and does not
                make direct Laserfiche database writes supported.
              </p>
              <label>
                <input
                  checked={editingWarningAccepted}
                  onChange={(event) => setEditingWarningAccepted(event.target.checked)}
                  type="checkbox"
                />
                I understand that editing notes is local documentation work only.
              </label>
            </div>
          </div>
        )}

        {activeView === 'compare' && (
          <ComparisonSummary
            comparison={comparison}
            versions={product.versions}
            fromVersion={comparisonFromVersion}
            toVersion={comparisonToVersion}
            onFromVersionChange={setComparisonFromVersion}
            onToVersionChange={setComparisonToVersion}
            onOpen={() => setActiveView('compare')}
            onDownloadJson={() => downloadJson(`${selectedProductKey}-version-comparison.json`, comparison)}
            onDownloadCsv={() =>
              downloadText(`${selectedProductKey}-version-comparison.csv`, comparisonToCsv(comparison), 'text/csv')
            }
          />
        )}

        <ErrorBoundary key={`${activeView}:${selectedProductKey}:${selectedVersion}`}>
          {activeView === 'compare' ? (
            <ComparisonDetail
              comparison={comparison}
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
              objectTypeFilters={diagramObjectTypeFilters}
              presets={diagramPresets}
              showSecondHopEdges={showDiagramSecondHopEdges}
              connectedOnly={diagramConnectedOnly}
              onDiagramQueryChange={setDiagramQuery}
              onEdgeTypeChange={setDiagramEdgeType}
              onFocusKeyChange={setDiagramFocusKey}
              onModeChange={setDiagramMode}
              onDepthChange={setDiagramDepth}
              onZoomChange={setDiagramZoom}
              onObjectTypeFiltersChange={setDiagramObjectTypeFilters}
              onApplyPreset={applyDiagramPreset}
              onShowSecondHopEdgesChange={setShowDiagramSecondHopEdges}
              onConnectedOnlyChange={setDiagramConnectedOnly}
              onSavePreset={saveDiagramPreset}
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
          ) : activeView === 'dependencies' ? (
            <DependencyReportView
              version={version}
              onDownloadJson={() =>
                downloadJson(
                  `${selectedProductKey}-${version.version}-unresolved-dependencies.json`,
                  getUnresolvedDependencyItems(version),
                )
              }
            />
          ) : activeView === 'import' ? (
            canUseImport && ImportPreviewView ? (
              <Suspense fallback={<div className="loading-state-inline">Loading import tools...</div>}>
                <ImportPreviewView selectedProductKey={selectedProductKey} product={product} />
              </Suspense>
            ) : EditingCapabilityGuard ? (
              <Suspense fallback={<div className="loading-state-inline">Loading editing guard...</div>}>
                <EditingCapabilityGuard />
              </Suspense>
            ) : null
          ) : activeView === 'reporting' ? (
            <ReportingGuide version={version} onSelectTable={navigateToTable} />
          ) : (
            <TableWorkspace
              documentationCoverage={documentationCoverage}
              selectedTable={selectedTable}
              version={version}
              favoriteObjects={favoriteObjects}
              filteredTables={filteredTables}
              editingEnabled={canEditNotes}
              localNote={localNotesForVersion[selectedTable.id]}
              localNotesKey={localNotesKey}
              localNoteChanged={isLocalNoteDifferent(localNotesForVersion[selectedTable.id], selectedTable)}
              query={query}
              tableConfidenceFilter={tableConfidenceFilter}
              tableNotesFilter={tableNotesFilter}
              onExportLocalNotes={() => {
                if (canEditNotes) {
                  downloadJson(`${selectedProductKey}-${selectedVersion}-local-notes.json`, localNotes);
                }
              }}
              onExportVersionNotes={exportVersionNotes}
              onImportLocalNotes={importLocalNotes}
              onSaveLocalNote={saveLocalTableNote}
              onClearLocalNote={clearLocalTableNote}
              onClearTableSearch={() => setQuery('')}
              onDownloadTableJson={() => downloadJson(`${selectedTable.id}.json`, selectedTable.source)}
              onDownloadTableCsv={() =>
                downloadText(`${selectedTable.id}-columns.csv`, tableToCsv(selectedTable), 'text/csv')
              }
              onDownloadTableMarkdown={() =>
                downloadText(
                  `${selectedTable.id}.md`,
                  tableToMarkdown(selectedTable, productName, selectedVersion, visibleRelationships),
                  'text/markdown',
                )
              }
              onDownloadRelationshipsCsv={() =>
                downloadText(
                  `${selectedTable.id}-relationships.csv`,
                  relationshipsToCsv(selectedTable, visibleRelationships),
                  'text/csv',
                )
              }
              onDownloadUnknownTablesCsv={() =>
                downloadText(
                  `${selectedProductKey}-${selectedVersion}-unknown-tables.csv`,
                  reviewTablesToCsv(unknownTables),
                  'text/csv',
                )
              }
              onQueryChange={setQuery}
              onSelectTable={setSelectedTableId}
              onSetTableConfidenceFilter={setTableConfidenceFilter}
              onSetTableNotesFilter={setTableNotesFilter}
              onToggleFavoriteObject={toggleFavoriteObject}
              visibleRelationships={visibleRelationships}
              relationshipFilter={relationshipFilter}
              setRelationshipFilter={setRelationshipFilter}
              navigateToTable={navigateToTable}
            />
          )}
        </ErrorBoundary>
      </section>
      {commandOpen && (
        <div className="command-overlay" role="dialog" aria-label="Command palette">
          <div className="command-palette">
            <div className="search-box">
              <Search size={18} />
              <input
                autoFocus
                aria-label="Command search"
                placeholder="Search views, tables, columns, objects, relationships"
                value={commandQuery}
                onChange={(event) => setCommandQuery(event.target.value)}
              />
              <button aria-label="Close command palette" type="button" onClick={() => setCommandOpen(false)}>
                <X size={15} />
              </button>
            </div>
            <div className="command-results">
              {filteredCommandItems.map((item) => (
                <button
                  key={`${item.type}:${item.label}`}
                  type="button"
                  onClick={() => {
                    item.action();
                    setCommandOpen(false);
                    setCommandQuery('');
                  }}
                >
                  <span>{item.type}</span>
                  <strong>{item.label}</strong>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {shortcutHelpOpen && (
        <div className="command-overlay" role="dialog" aria-label="Keyboard shortcuts">
          <div className="shortcut-help">
            <button aria-label="Close keyboard shortcuts" type="button" onClick={() => setShortcutHelpOpen(false)}>
              <X size={15} />
            </button>
            <h2>Keyboard shortcuts</h2>
            <dl>
              <div><dt>Ctrl/Command + K</dt><dd>Open command palette</dd></div>
              <div><dt>?</dt><dd>Show or hide shortcuts</dd></div>
              <div><dt>1-{activeViewLabels.length}</dt><dd>Switch primary tabs</dd></div>
              <div><dt>+ / -</dt><dd>Zoom diagram in or out</dd></div>
              <div><dt>F</dt><dd>Reset diagram zoom</dd></div>
              <div><dt>Esc</dt><dd>Clear focused diagram object</dd></div>
            </dl>
          </div>
        </div>
      )}
    </main>
  );
}

const rootElement = document.getElementById('root');
globalThis.laserficheDictionaryRoot ??= createRoot(rootElement);
globalThis.laserficheDictionaryRoot.render(<App />);
