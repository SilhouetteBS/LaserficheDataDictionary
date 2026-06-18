import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const confidenceValues = new Set(['confirmed', 'observed', 'inferred', 'unknown', 'deprecated', 'do_not_rely_on']);
const reviewStatusValues = new Set(['draft', 'in_review', 'approved', 'stale']);
const placeholderPattern = /\b(todo|tbd|pending manual|manual purpose documentation pending|lorem ipsum|placeholder)\b/i;
const unsafeWritePattern = /\b(insert|update|delete|merge|truncate|drop|alter)\b/i;
const databaseNamePattern = /\bdatabase name\b|\bdb name\b|\bfrom database\b|\bSQL Server database is named\b/i;

function validateText(errors, scope, field, value) {
  if (!value) {
    return;
  }
  const text = Array.isArray(value) ? value.join('\n') : String(value);
  if (placeholderPattern.test(text)) {
    errors.push(`${scope}: ${field} contains placeholder text`);
  }
  if (unsafeWritePattern.test(text) && !/\b(read-only|do not|never|unsupported|not supported|avoid)\b/i.test(text)) {
    errors.push(`${scope}: ${field} appears to include unsupported write guidance`);
  }
  if (databaseNamePattern.test(text)) {
    errors.push(`${scope}: ${field} may rely on an environment-specific database name`);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function validateNotesObject(notes, scope = 'notes.json') {
  const errors = [];
  if (!notes || typeof notes !== 'object') {
    return [`${scope}: notes must be an object`];
  }
  if (!notes.tables || typeof notes.tables !== 'object' || Array.isArray(notes.tables)) {
    errors.push(`${scope}: missing tables object`);
    return errors;
  }

  Object.entries(notes.tables).forEach(([tableKey, tableNote]) => {
    if (!tableNote || typeof tableNote !== 'object' || Array.isArray(tableNote)) {
      errors.push(`${scope}: ${tableKey} note must be an object`);
      return;
    }
    if (tableNote.confidence && !confidenceValues.has(tableNote.confidence)) {
      errors.push(`${scope}: ${tableKey} has invalid confidence "${tableNote.confidence}"`);
    }
    if (tableNote.reviewStatus && !reviewStatusValues.has(tableNote.reviewStatus)) {
      errors.push(`${scope}: ${tableKey} has invalid reviewStatus "${tableNote.reviewStatus}"`);
    }
    ['owner', 'reviewer', 'lastReviewedAt'].forEach((field) => {
      if (tableNote[field] && typeof tableNote[field] !== 'string') {
        errors.push(`${scope}: ${tableKey}.${field} must be a string`);
      }
    });
    if (tableNote.lastReviewedAt && Number.isNaN(new Date(tableNote.lastReviewedAt).getTime())) {
      errors.push(`${scope}: ${tableKey}.lastReviewedAt must be a parseable date`);
    }
    if (tableNote.reviewStatus === 'approved' && !tableNote.lastReviewedAt) {
      errors.push(`${scope}: ${tableKey} approved notes must include lastReviewedAt`);
    }
    ['safeReportingNotes', 'warnings'].forEach((field) => {
      if (tableNote[field] && !Array.isArray(tableNote[field])) {
        errors.push(`${scope}: ${tableKey}.${field} must be an array`);
      }
    });
    validateText(errors, `${scope}: ${tableKey}`, 'summary', tableNote.summary);
    validateText(errors, `${scope}: ${tableKey}`, 'safeReportingNotes', tableNote.safeReportingNotes);
    validateText(errors, `${scope}: ${tableKey}`, 'warnings', tableNote.warnings);
    if (tableNote.columns && (typeof tableNote.columns !== 'object' || Array.isArray(tableNote.columns))) {
      errors.push(`${scope}: ${tableKey}.columns must be an object`);
    }
    Object.entries(tableNote.columns ?? {}).forEach(([columnName, columnNote]) => {
      validateText(errors, `${scope}: ${tableKey}.${columnName}`, 'purpose', columnNote?.purpose);
    });
  });

  return errors;
}

export function validateAllNotes({ publicRoot = 'public' } = {}) {
  const errors = [];
  const products = readJson(path.join(publicRoot, 'data', 'products.json'));
  products.products
    .filter((product) => product.status === 'available')
    .forEach((product) => {
      const manifest = readJson(path.join(publicRoot, product.manifestUrl.replace(/^\/?data\//, 'data/')));
      manifest.versions.forEach((version) => {
        const notesPath = path.join(publicRoot, version.notesUrl.replace(/^\/?data\//, 'data/'));
        if (fs.existsSync(notesPath)) {
          errors.push(...validateNotesObject(readJson(notesPath), `${product.productKey} ${version.version}`));
        }
      });
    });
  return errors;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const fileArg = process.argv.find((arg) => arg.startsWith('--file='))?.slice('--file='.length);
  const errors = fileArg ? validateNotesObject(readJson(fileArg), fileArg) : validateAllNotes();
  if (errors.length > 0) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else {
    console.log('Notes validation passed.');
  }
}
