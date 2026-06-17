import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { getErrorBoundaryFallback } from '../src/components/errorBoundaryFallback.js';
import { buildDatabaseDiagram } from '../src/data/diagram.js';
import { buildSchemaProduct, compareVersions, validateSchemaSnapshot } from '../src/data/schemaDictionary.js';
import { localNotesToVersionNotes } from '../src/data/notes.js';
import { buildGeneratedReportingExamples, getReportingPaths } from '../src/data/reporting.js';
import { getReviewItems, getSchemaHealthItems, getTableImpactItems } from '../src/data/schemaAnalysis.js';
import { buildUrlStatePath, readUrlState } from '../src/data/urlState.js';
import { normalizeSchema, runImport } from './import-forms-metadata.mjs';

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

const forms11 = {
  schema: readJson('public/data/forms/11.0.2311/schema.json'),
  notes: readJson('public/data/forms/11.0.2311/notes.json'),
};
const forms12 = {
  schema: readJson('public/data/forms/12.0.2503.10378/schema.json'),
  notes: readJson('public/data/forms/12.0.2503.10378/notes.json'),
};
const minimalExport = readJson('tools/fixtures/minimal-export.json');
const product = buildSchemaProduct([forms11, forms12]);
const latestVersion = product.versions.at(-1);

assert.equal(product.id, 'forms');
assert.equal(product.name, 'Forms');
assert.equal(product.versions.length, 2);

const comparison = compareVersions(product.versions[0], latestVersion);
assert.ok(comparison.addedTables.length > 0);
assert.ok(comparison.changedTables.length > 0);

const reportingPaths = getReportingPaths('forms');
assert.equal(reportingPaths.length, 4);

const examples = buildGeneratedReportingExamples(latestVersion);
assert.equal(examples.length, 4);
assert.ok(examples.some((example) => example.available));
assert.equal(examples.some((example) => /<process_|<status_/.test(example.sql)), false);

const impactItems = getTableImpactItems(latestVersion);
assert.ok(impactItems.length > 0);
assert.ok(impactItems[0].score >= impactItems.at(-1).score);

const healthItems = getSchemaHealthItems(latestVersion);
assert.ok(healthItems.length > 0);
assert.ok(healthItems.some((item) => item.riskFlags.length > 0));

const reviewItems = getReviewItems(latestVersion);
assert.ok(reviewItems.length > 0);
assert.ok(reviewItems[0].columnsNeedingReview >= reviewItems.at(-1).columnsNeedingReview);

const focusedDiagramWithoutFocus = buildDatabaseDiagram(latestVersion, '', 'all', '', 'focused', 1);
assert.equal(focusedDiagramWithoutFocus.edges.length, 0);
const focusedDiagram = buildDatabaseDiagram(latestVersion, '', 'all', 'dbo.cf_business_processes', 'focused', 1);
assert.ok(focusedDiagram.edges.length > 0);
assert.ok(focusedDiagram.nodes.length < focusedDiagramWithoutFocus.nodes.length);
const twoHopDiagram = buildDatabaseDiagram(latestVersion, '', 'all', 'dbo.cf_business_processes', 'focused', 2);
assert.ok(twoHopDiagram.nodes.length >= focusedDiagram.nodes.length);
const fullDiagram = buildDatabaseDiagram(latestVersion, '', 'all', 'dbo.cf_business_processes', 'full', 1);
assert.ok(fullDiagram.edges.length > twoHopDiagram.edges.length);

const urlState = readUrlState('?product=forms&version=12&view=health&table=dbo.cf_users');
assert.equal(urlState.product, 'forms');
assert.equal(urlState.view, 'health');
assert.equal(
  buildUrlStatePath({ product: 'forms', version: '12', view: 'tables', table: '' }, '?keep=1', '/app', '#top'),
  '/app?keep=1&product=forms&version=12&view=tables#top',
);

const notes = localNotesToVersionNotes(
  {
    'forms:12.0.2503.10378': {
      'dbo.example': {
        confidence: 'observed',
        summary: 'Example table',
        safeReportingNotes: ['Read only'],
        warnings: ['Do not write'],
      },
    },
  },
  'forms:12.0.2503.10378',
  'forms',
  '12.0.2503.10378',
);
assert.equal(notes.productKey, 'forms');
assert.equal(notes.tables['dbo.example'].confidence, 'observed');

const normalizedFixture = normalizeSchema(minimalExport);

assert.equal(normalizedFixture.tables.length, 2);
assert.equal(normalizedFixture.foreignKeys[0].name, 'FK_child_parent');
assert.equal(normalizedFixture.tables.find((table) => table.key === 'dbo.child').incomingForeignKeys.length, 0);
assert.equal(normalizedFixture.tables.find((table) => table.key === 'dbo.child').outgoingForeignKeys.length, 1);
assert.equal(normalizedFixture.tables.find((table) => table.key === 'dbo.child').indexes.length, 1);
assert.equal(normalizedFixture.tables.find((table) => table.key === 'dbo.child').triggers.length, 1);
assert.equal(normalizedFixture.views[0].dependencies.length, 1);
assert.deepEqual(validateSchemaSnapshot(normalizedFixture), []);
assert.ok(validateSchemaSnapshot({ productKey: 'bad' }).length > 0);
assert.ok(
  validateSchemaSnapshot({
    productKey: 'bad',
    productVersion: '1',
    tables: [{ key: 'dbo.bad', columns: [{}], keys: [], indexes: [] }],
    foreignKeys: [{ name: 'FK_bad' }],
  }).some((error) => error.includes('missing data type')),
);

const boundaryFallback = getErrorBoundaryFallback(new Error('Boundary test failure'));
assert.equal(boundaryFallback.title, 'Unable to render this view');
assert.equal(boundaryFallback.message, 'Boundary test failure');

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lfdd-import-'));
const inputDir = path.join(tempRoot, 'input');
const outputDir = path.join(tempRoot, 'data', 'fixture', '1.0');
const publicOutputDir = path.join(tempRoot, 'public', 'data', 'fixture', '1.0');
fs.mkdirSync(inputDir, { recursive: true });
const fixtureFileMap = {
  manifest: 'manifest.json',
  schemas: 'schemas.json',
  tables: 'tables.json',
  columns: 'columns.json',
  keys: 'primaryAndUniqueKeys.json',
  foreignKeys: 'foreignKeys.json',
  indexes: 'indexes.json',
  views: 'views.json',
  routines: 'routines.json',
  triggers: 'triggers.json',
  dependencies: 'dependencies.json',
};
Object.entries(fixtureFileMap).forEach(([key, fileName]) => {
  fs.writeFileSync(path.join(inputDir, fileName), `${JSON.stringify(minimalExport[key])}\n`);
});
const originalArgv = process.argv;
process.argv = [
  process.argv[0],
  'tools/import-forms-metadata.mjs',
  `--input-dir=${inputDir}`,
  `--out=${outputDir}`,
  `--public-out=${publicOutputDir}`,
  `--public-versions-out=${path.join(tempRoot, 'public', 'data', 'fixture', 'versions.json')}`,
  `--public-products-out=${path.join(tempRoot, 'public', 'data', 'products.json')}`,
];
try {
  runImport();
} finally {
  process.argv = originalArgv;
}
assert.equal(readJson(path.join(outputDir, 'schema.json')).productKey, 'fixture');
assert.equal(readJson(path.join(publicOutputDir, 'schema.json')).tables.length, 2);
assert.equal(readJson(path.join(tempRoot, 'public', 'data', 'products.json')).products[0].productKey, 'fixture');

console.log(
  JSON.stringify(
    {
      product: product.id,
      versions: product.versions.length,
      changedTables: comparison.changedTables.length,
      reportingExamples: examples.length,
      impactItems: impactItems.length,
      healthItems: healthItems.length,
      fixtureTables: normalizedFixture.tables.length,
      diagramEdges: focusedDiagram.edges.length,
      cliImportTables: readJson(path.join(outputDir, 'schema.json')).tables.length,
    },
    null,
    2,
  ),
);
