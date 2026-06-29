import { useState } from 'react';
import { FileUp } from 'lucide-react';
import { validateSchemaSnapshot } from '../data/schemaDictionary.js';

const requiredImportTypes = ['manifest', 'schemas', 'tables', 'columns'];
const optionalImportTypes = [
  'primaryanduniquekeys',
  'foreignkeys',
  'indexes',
  'views',
  'routines',
  'triggers',
  'dependencies',
];
const importTypeLabels = {
  manifest: 'manifest.json',
  schemas: 'schemas.json',
  tables: 'tables.json',
  columns: 'columns.json',
  primaryanduniquekeys: 'primaryAndUniqueKeys.json',
  foreignkeys: 'foreignKeys.json',
  indexes: 'indexes.json',
  views: 'views.json',
  routines: 'routines.json',
  triggers: 'triggers.json',
  dependencies: 'dependencies.json',
};

async function checksumFile(file) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function classifyImportFile(name) {
  const normalized = name.toLowerCase().replace(/\\/g, '/').split('/').pop();
  const base = normalized.replace(/\.json$/, '');
  const knownTypes = [
    'manifest',
    'schemas',
    'tables',
    'columns',
    'primaryanduniquekeys',
    'foreignkeys',
    'indexes',
    'views',
    'routines',
    'triggers',
    'dependencies',
    'schema',
  ];
  return knownTypes.find((type) => base === type || base.endsWith(`_${type}`)) ?? 'unknown';
}

async function analyzeImportFiles(files, selectedProductKey, existingVersions) {
  const errors = [];
  const warnings = [];
  const entries = [];
  const jsonByType = new Map();

  await Promise.all(files.map(async (file) => {
    const type = classifyImportFile(file.name);
    const checksum = await checksumFile(file);
    const entry = { name: file.name, size: file.size, type, checksum };
    entries.push(entry);
    if (!file.name.toLowerCase().endsWith('.json')) {
      warnings.push(`${file.name}: non-JSON file ignored.`);
      return;
    }
    if (file.size < 3) {
      warnings.push(`${file.name}: suspiciously small export file.`);
    }
    try {
      const parsed = JSON.parse(await file.text());
      if (jsonByType.has(type)) {
        warnings.push(`${file.name}: another ${type} export file was already loaded; confirm which one should be imported.`);
      }
      jsonByType.set(type, parsed);
      entry.rows = Array.isArray(parsed) ? parsed.length : undefined;
      if (Array.isArray(parsed) && parsed.length === 0 && ['tables', 'columns'].includes(type)) {
        warnings.push(`${file.name}: required export result appears empty.`);
      }
      if (Array.isArray(parsed) && parsed.length === 0 && ['views', 'routines', 'triggers', 'dependencies'].includes(type)) {
        warnings.push(`${file.name}: optional result set is empty; confirm that is expected for this product/version.`);
      }
    } catch {
      errors.push(`${file.name}: invalid JSON.`);
    }
  }));

  const manifest = jsonByType.get('manifest')?.[0] ?? jsonByType.get('manifest') ?? jsonByType.get('schema');
  const productKey = manifest?.productKey;
  const productVersion = manifest?.productVersion;
  const fileManifests = [];
  jsonByType.forEach((value, type) => {
    const rows = Array.isArray(value) ? value : [value];
    rows.forEach((row) => {
      if (row?.productKey || row?.productVersion) {
        fileManifests.push({
          type,
          productKey: row.productKey,
          productVersion: row.productVersion,
        });
      }
    });
  });
  if (productKey && productKey !== selectedProductKey) {
    warnings.push(`Product mismatch: import is ${productKey}, current product is ${selectedProductKey}.`);
  }
  if (productVersion && existingVersions.includes(productVersion)) {
    warnings.push(`Version collision: ${productVersion} already exists. Do not replace static files until the duplicate has been reviewed and intentionally approved.`);
  }
  fileManifests.forEach((item) => {
    if (productKey && item.productKey && item.productKey !== productKey) {
      errors.push(`${importTypeLabels[item.type] ?? item.type}: productKey ${item.productKey} does not match manifest ${productKey}.`);
    }
    if (productVersion && item.productVersion && item.productVersion !== productVersion) {
      errors.push(`${importTypeLabels[item.type] ?? item.type}: productVersion ${item.productVersion} does not match manifest ${productVersion}.`);
    }
  });
  requiredImportTypes.forEach((type) => {
    if (!jsonByType.has(type) && !jsonByType.has('schema')) {
      errors.push(`Missing required ${type}.json export result.`);
    }
  });
  optionalImportTypes.forEach((type) => {
    if (!jsonByType.has(type) && !jsonByType.has('schema')) {
      warnings.push(`Optional ${type}.json result is missing; importer should treat this as an empty result only after confirmation.`);
    }
  });
  if (jsonByType.has('schema')) {
    validateSchemaSnapshot(jsonByType.get('schema')).forEach((error) => errors.push(`schema.json: ${error}`));
  }

  return {
    readyForReview: errors.length === 0,
    checklist: [...requiredImportTypes, ...optionalImportTypes].map((type) => ({
      type,
      label: importTypeLabels[type] ?? `${type}.json`,
      required: requiredImportTypes.includes(type),
      status: jsonByType.has(type) || jsonByType.has('schema') ? 'present' : requiredImportTypes.includes(type) ? 'missing' : 'optional missing',
    })),
    collision: Boolean(productVersion && existingVersions.includes(productVersion)),
    entries: entries.sort((left, right) => left.name.localeCompare(right.name)),
    errors,
    warnings,
    productKey: productKey ?? 'Unknown',
    productVersion: productVersion ?? 'Unknown',
  };
}

export function ImportPreviewView({ selectedProductKey, product }) {
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const existingVersions = product.versions.map((version) => version.version);

  async function handleFiles(fileList) {
    const files = [...fileList];
    if (files.length === 0) {
      return;
    }
    setIsLoading(true);
    try {
      setPreview(await analyzeImportFiles(files, selectedProductKey, existingVersions));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="detail-surface import-preview-view">
      <div className="detail-heading">
        <div>
          <h2>Import preview</h2>
          <p>Validate schema export JSON files before copying them into the static data folders.</p>
        </div>
      </div>
      <section className="import-checklist">
        <h3>Before loading exports</h3>
        <ul>
          <li>Confirm the product and version come from the export manifest, not the SQL Server database name.</li>
          <li>Keep exports read-only and do not run any write scripts against Laserfiche databases.</li>
          <li>Use all expected JSON result files when possible; missing optional result files are treated as warnings.</li>
          <li>Review duplicate version warnings before replacing existing static files.</li>
          <li>Use the current product-neutral export script with SQL Server 2016 or newer; it relies on FOR JSON output and catalog views.</li>
          <li>Submit public exports through GitHub Issues only; maintainers review, import, and publish accepted snapshots.</li>
          <li>Run the privacy checklist before copying any submitted files into the repository.</li>
        </ul>
      </section>
      <label
        className="import-drop-zone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          handleFiles(event.dataTransfer.files);
        }}
      >
        <FileUp size={22} />
        <span>{isLoading ? 'Reading files...' : 'Drop export JSON files here or choose files'}</span>
        <input multiple type="file" accept=".json,application/json" onChange={(event) => handleFiles(event.target.files)} />
      </label>
      {preview && (
        <section className="import-preview-results">
          <div className="section-title-row">
            <h3>Preview summary</h3>
            <span>{preview.entries.length} files</span>
          </div>
          <dl>
            <div><dt>Product</dt><dd>{preview.productKey}</dd></div>
            <div><dt>Version</dt><dd>{preview.productVersion}</dd></div>
            <div><dt>Review status</dt><dd>{preview.readyForReview ? 'Ready for maintainer review' : 'Fix errors first'}</dd></div>
            <div><dt>Errors</dt><dd>{preview.errors.length}</dd></div>
            <div><dt>Warnings</dt><dd>{preview.warnings.length}</dd></div>
            <div><dt>Collision</dt><dd>{preview.collision ? 'Review required' : 'None'}</dd></div>
          </dl>
          <div className="import-file-checklist" aria-label="Expected import files">
            {preview.checklist.map((item) => (
              <span className={`import-file-check import-file-check-${item.status.replace(/\s+/g, '-')}`} key={item.type}>
                <strong>{item.label}</strong>
                <em>{item.required ? 'Required' : 'Optional'} - {item.status}</em>
              </span>
            ))}
          </div>
          {preview.errors.length > 0 && (
            <div className="import-message import-message-error">
              <strong>Errors</strong>
              <ul>{preview.errors.map((error) => <li key={error}>{error}</li>)}</ul>
            </div>
          )}
          {preview.warnings.length > 0 && (
            <div className="import-message import-message-warning">
              <strong>Warnings</strong>
              <ul>{preview.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
            </div>
          )}
          <div className="import-file-list">
            {preview.entries.map((entry) => (
              <article key={entry.name}>
                <strong>{entry.name}</strong>
                <span>{entry.type}</span>
                <code>{entry.checksum}</code>
                <em>{entry.size.toLocaleString()} bytes{entry.rows !== undefined ? `, ${entry.rows} rows` : ''}</em>
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
