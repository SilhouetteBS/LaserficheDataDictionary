import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const defaultInputDir = path.join(os.homedir(), 'Downloads');
const defaultInputs = {
  manifest: path.join(defaultInputDir, 'manifest.json'),
  schemas: path.join(defaultInputDir, 'schemas.json'),
  tables: path.join(defaultInputDir, 'tables.json'),
  columns: path.join(defaultInputDir, 'columns.json'),
  keys: path.join(defaultInputDir, 'primaryAndUniqueKeys.json'),
  foreignKeys: path.join(defaultInputDir, 'foreignKeys.json'),
  indexes: path.join(defaultInputDir, 'indexes.json'),
  views: path.join(defaultInputDir, 'views.json'),
  routines: path.join(defaultInputDir, 'routines.json'),
  triggers: path.join(defaultInputDir, 'triggers.json'),
  dependencies: path.join(defaultInputDir, 'dependencies.json'),
};

function readJsonResultSet(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '').replace(/\r?\n/g, '');
  return JSON.parse(raw);
}

function readOptionalJsonResultSet(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  return readJsonResultSet(filePath);
}

function readJsonOrTabRows(filePath, columns) {
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '').trim();
  if (!raw) {
    return [];
  }

  if (raw.startsWith('[')) {
    return JSON.parse(raw.replace(/\r?\n/g, ''));
  }

  return raw.split(/\r?\n/).map((line) => {
    const values = line.split('\t');
    return Object.fromEntries(
      columns.map((column, index) => {
        const value = values[index];
        return [column.name, column.type === 'json' ? JSON.parse(value) : value];
      }),
    );
  });
}

function getOption(name, fallback) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function byName(left, right) {
  return left.localeCompare(right, undefined, { sensitivity: 'base' });
}

function cleanObject(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined && value !== null),
  );
}

function groupBy(items, getKey) {
  const groups = new Map();
  for (const item of items) {
    const key = getKey(item);
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }
  return groups;
}

export function normalizeSchema({
  manifest,
  schemas,
  tables,
  columns,
  keys,
  foreignKeys,
  indexes,
  views,
  routines,
  triggers,
  dependencies,
}) {
  const columnsByTable = new Map();
  for (const column of columns) {
    const normalizedColumn = {
      name: column.columnName,
      ordinal: column.ordinal,
      dataType: column.dataType,
      typeDefinition: column.typeDefinition,
      maxLength: column.maxLength,
      precision: column.precision,
      scale: column.scale,
      isNullable: column.isNullable,
      isIdentity: column.isIdentity,
      isComputed: column.isComputed,
      isRowGuidColumn: column.isRowGuidColumn,
      defaultDefinition: column.defaultDefinition,
      computedDefinition: column.computedDefinition,
      collationName: column.collationName,
    };

    const tableColumns = columnsByTable.get(column.tableKey) ?? [];
    tableColumns.push(cleanObject(normalizedColumn));
    columnsByTable.set(column.tableKey, tableColumns);
  }

  const keysByTable = new Map();
  for (const key of keys) {
    const tableKeys = keysByTable.get(key.tableKey) ?? [];
    tableKeys.push({
      name: key.constraintName,
      type: key.constraintType,
      typeDescription: key.constraintTypeDescription,
      backingIndexName: key.backingIndexName,
      columns: key.columns,
    });
    keysByTable.set(key.tableKey, tableKeys);
  }

  const foreignKeysBySourceTable = groupBy(foreignKeys, (foreignKey) => foreignKey.sourceTableKey);
  const foreignKeysByReferencedTable = groupBy(foreignKeys, (foreignKey) => foreignKey.referencedTableKey);
  const indexesByTable = groupBy(indexes, (index) => index.tableKey);
  const triggersByParent = groupBy(triggers, (trigger) => trigger.parentObjectKey);
  const dependenciesByReferencingObject = groupBy(dependencies, (dependency) => dependency.referencingObjectKey);

  const normalizedForeignKeys = foreignKeys.map((foreignKey) => ({
    name: foreignKey.foreignKeyName,
    sourceTableKey: foreignKey.sourceTableKey,
    referencedTableKey: foreignKey.referencedTableKey,
    deleteAction: foreignKey.deleteAction,
    updateAction: foreignKey.updateAction,
    isDisabled: foreignKey.isDisabled,
    isNotTrusted: foreignKey.isNotTrusted,
    columns: foreignKey.columns,
  }));

  return {
    exportFormatVersion: manifest.exportFormatVersion,
    productKey: manifest.productKey,
    productName: manifest.productName,
    productVersion: manifest.productVersion,
    databaseRole: manifest.databaseRole,
    exportedAtUtc: manifest.exportedAtUtc,
    schemas: schemas
      .map((schema) => ({ name: schema.schemaName }))
      .sort((left, right) => byName(left.name, right.name)),
    tables: tables
      .map((table) => ({
        key: table.tableKey,
        schemaName: table.schemaName,
        name: table.tableName,
        columns: (columnsByTable.get(table.tableKey) ?? []).sort((left, right) => left.ordinal - right.ordinal),
        keys: (keysByTable.get(table.tableKey) ?? []).sort((left, right) => byName(left.name, right.name)),
        outgoingForeignKeys: (foreignKeysBySourceTable.get(table.tableKey) ?? []).map((foreignKey) => ({
          name: foreignKey.foreignKeyName,
          referencedTableKey: foreignKey.referencedTableKey,
          deleteAction: foreignKey.deleteAction,
          updateAction: foreignKey.updateAction,
          isDisabled: foreignKey.isDisabled,
          isNotTrusted: foreignKey.isNotTrusted,
          columns: foreignKey.columns,
        })),
        incomingForeignKeys: (foreignKeysByReferencedTable.get(table.tableKey) ?? []).map((foreignKey) => ({
          name: foreignKey.foreignKeyName,
          sourceTableKey: foreignKey.sourceTableKey,
          deleteAction: foreignKey.deleteAction,
          updateAction: foreignKey.updateAction,
          isDisabled: foreignKey.isDisabled,
          isNotTrusted: foreignKey.isNotTrusted,
          columns: foreignKey.columns,
        })),
        indexes: (indexesByTable.get(table.tableKey) ?? []).map((index) => ({
          name: index.indexName,
          typeDescription: index.indexTypeDescription,
          isUnique: index.isUnique,
          isPrimaryKey: index.isPrimaryKey,
          isUniqueConstraint: index.isUniqueConstraint,
          hasFilter: index.hasFilter,
          filterDefinition: index.filterDefinition,
          columns: index.columns,
        })),
        triggers: (triggersByParent.get(table.tableKey) ?? []).map((trigger) => ({
          name: trigger.triggerName,
          isDisabled: trigger.isDisabled,
          isInsteadOfTrigger: trigger.isInsteadOfTrigger,
          definitionSha256: trigger.definitionSha256,
        })),
      }))
      .sort((left, right) => byName(left.key, right.key)),
    foreignKeys: normalizedForeignKeys,
    views: views.map((view) => ({
      key: view.viewKey,
      schemaName: view.schemaName,
      name: view.viewName,
      definitionSha256: view.definitionSha256,
      dependencies: dependenciesByReferencingObject.get(view.viewKey) ?? [],
    })),
    routines: routines.map((routine) => ({
      key: routine.routineKey,
      schemaName: routine.schemaName,
      name: routine.routineName,
      type: routine.routineType,
      typeDescription: routine.routineTypeDescription,
      definitionSha256: routine.definitionSha256,
      parameters: routine.parameters ?? [],
      dependencies: dependenciesByReferencingObject.get(routine.routineKey) ?? [],
    })),
    triggers: triggers.map((trigger) => ({
      name: trigger.triggerName,
      parentObjectKey: trigger.parentObjectKey,
      parentObjectTypeDescription: trigger.parentObjectTypeDescription,
      isDisabled: trigger.isDisabled,
      isInsteadOfTrigger: trigger.isInsteadOfTrigger,
      definitionSha256: trigger.definitionSha256,
    })),
    dependencies: dependencies.map((dependency) =>
      cleanObject({
        referencingObjectKey: dependency.referencingObjectKey,
        referencingObjectTypeDescription: dependency.referencingObjectTypeDescription,
        referencedObjectKey: dependency.referencedObjectKey,
        referencedSchemaName: dependency.referencedSchemaName,
        referencedEntityName: dependency.referencedEntityName,
        referencedObjectTypeDescription: dependency.referencedObjectTypeDescription,
        isSchemaBoundReference: dependency.isSchemaBoundReference,
        isCallerDependent: dependency.isCallerDependent,
        isAmbiguous: dependency.isAmbiguous,
      }),
    ),
  };
}

export function runImport() {
  const inputDir = getOption('input-dir', defaultInputDir);
  const resolvedDefaultInputs = { ...defaultInputs };
  for (const key of Object.keys(resolvedDefaultInputs)) {
    resolvedDefaultInputs[key] = path.join(inputDir, path.basename(resolvedDefaultInputs[key]));
  }

  const inputs = Object.fromEntries(
    Object.entries(resolvedDefaultInputs).map(([key, defaultInput]) => [key, getOption(key, defaultInput)]),
  );
  const manifest = readJsonResultSet(inputs.manifest);
  const schemas = readJsonResultSet(inputs.schemas);
  const tables = readJsonResultSet(inputs.tables);
  const columns = readJsonResultSet(inputs.columns);
  const keys = readJsonOrTabRows(inputs.keys, [
    { name: 'schemaName' },
    { name: 'tableName' },
    { name: 'tableKey' },
    { name: 'constraintName' },
    { name: 'constraintType' },
    { name: 'constraintTypeDescription' },
    { name: 'backingIndexName' },
    { name: 'columns', type: 'json' },
  ]);
  const foreignKeys = readJsonResultSet(inputs.foreignKeys);
  const indexes = readJsonResultSet(inputs.indexes);
  const views = readOptionalJsonResultSet(inputs.views);
  const routines = readJsonResultSet(inputs.routines);
  const triggers = readOptionalJsonResultSet(inputs.triggers);
  const dependencies = readJsonResultSet(inputs.dependencies);
  const normalizedManifest = {
    ...manifest,
    productKey: getOption('product', manifest.productKey),
    productName: getOption('product-name', manifest.productName),
    databaseRole: getOption('database-role', manifest.databaseRole),
  };

  const schema = normalizeSchema({
    manifest: normalizedManifest,
    schemas,
    tables,
    columns,
    keys,
    foreignKeys,
    indexes,
    views,
    routines,
    triggers,
    dependencies,
  });
  const outputDir = getOption(
    'out',
    path.join('data', schema.productKey, schema.productVersion),
  );
  const outputPath = path.join(outputDir, 'schema.json');
  const publicOutputDir = getOption(
    'public-out',
    path.join('public', 'data', schema.productKey, schema.productVersion),
  );
  const publicOutputPath = path.join(publicOutputDir, 'schema.json');
  const notesPath = path.join(outputDir, 'notes.json');
  const publicNotesPath = path.join(publicOutputDir, 'notes.json');
  const publicVersionsPath = getOption(
    'public-versions-out',
    path.join('public', 'data', schema.productKey, 'versions.json'),
  );
  const publicProductsPath = getOption('public-products-out', path.join('public', 'data', 'products.json'));

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(schema, null, 2)}\n`);
  fs.mkdirSync(publicOutputDir, { recursive: true });
  fs.writeFileSync(publicOutputPath, `${JSON.stringify(schema, null, 2)}\n`);

  const emptyNotes = {
    productKey: schema.productKey,
    productVersion: schema.productVersion,
    tables: {},
  };

  if (!fs.existsSync(notesPath)) {
    fs.writeFileSync(notesPath, `${JSON.stringify(emptyNotes, null, 2)}\n`);
  }

  if (!fs.existsSync(publicNotesPath)) {
    fs.writeFileSync(publicNotesPath, `${JSON.stringify(emptyNotes, null, 2)}\n`);
  }

  const existingVersions = fs.existsSync(publicVersionsPath)
    ? JSON.parse(fs.readFileSync(publicVersionsPath, 'utf8'))
    : {
        productKey: schema.productKey,
        productName: schema.productName,
        defaultVersion: schema.productVersion,
        versions: [],
      };
  const versionEntry = {
    version: schema.productVersion,
    label: `${schema.productName} ${schema.productVersion}`,
    schemaUrl: `/data/${schema.productKey}/${schema.productVersion}/schema.json`,
    notesUrl: `/data/${schema.productKey}/${schema.productVersion}/notes.json`,
  };
  const nextVersions = [
    ...existingVersions.versions.filter((version) => version.version !== schema.productVersion),
    versionEntry,
  ].sort((left, right) => left.version.localeCompare(right.version, undefined, { numeric: true }));
  fs.mkdirSync(path.dirname(publicVersionsPath), { recursive: true });
  fs.writeFileSync(
    publicVersionsPath,
    `${JSON.stringify(
      {
        ...existingVersions,
        productKey: schema.productKey,
        productName: schema.productName,
        defaultVersion: existingVersions.defaultVersion ?? schema.productVersion,
        versions: nextVersions,
      },
      null,
      2,
    )}\n`,
  );

  const existingProducts = fs.existsSync(publicProductsPath)
    ? JSON.parse(fs.readFileSync(publicProductsPath, 'utf8'))
    : {
        defaultProduct: schema.productKey,
        products: [],
      };
  const productEntry = {
    productKey: schema.productKey,
    productName: schema.productName,
    manifestUrl: `/data/${schema.productKey}/versions.json`,
    status: 'available',
  };
  const nextProducts = [
    ...existingProducts.products.filter((product) => product.productKey !== schema.productKey),
    productEntry,
  ].sort((left, right) => left.productName.localeCompare(right.productName, undefined, { sensitivity: 'base' }));
  fs.mkdirSync(path.dirname(publicProductsPath), { recursive: true });
  fs.writeFileSync(
    publicProductsPath,
    `${JSON.stringify(
      {
        ...existingProducts,
        defaultProduct: existingProducts.defaultProduct ?? schema.productKey,
        products: nextProducts,
      },
      null,
      2,
    )}\n`,
  );

  console.log(`Imported ${schema.productName} ${schema.productVersion}`);
  console.log(`Schemas: ${schema.schemas.length}`);
  console.log(`Tables: ${schema.tables.length}`);
  console.log(`Columns: ${schema.tables.reduce((total, table) => total + table.columns.length, 0)}`);
  console.log(`Keys: ${schema.tables.reduce((total, table) => total + table.keys.length, 0)}`);
  console.log(`Foreign keys: ${schema.foreignKeys.length}`);
  console.log(`Indexes: ${schema.tables.reduce((total, table) => total + table.indexes.length, 0)}`);
  console.log(`Views: ${schema.views.length}`);
  console.log(`Routines: ${schema.routines.length}`);
  console.log(`Triggers: ${schema.triggers.length}`);
  console.log(`Dependencies: ${schema.dependencies.length}`);
  console.log(outputPath);
  console.log(publicOutputPath);
  console.log(publicVersionsPath);

  return schema;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runImport();
}
