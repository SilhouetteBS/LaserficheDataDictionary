import fs from 'node:fs';
import path from 'node:path';

const batchRoot = path.join('.tmp', 'answers-sql-research');
const outputPath = path.join('docs', 'answers-sql-processed-batch-2026-07-01.md');

const batchDirs = fs
  .readdirSync(batchRoot)
  .filter((name) => name.startsWith('2026-07-01-batch-'))
  .sort();

const seen = new Set();
const rows = [];
const perBatch = [];

for (const batchDir of batchDirs) {
  const queuePath = path.join(batchRoot, batchDir, 'review-queue.json');
  const queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
  const batchRows = Object.values(queue).flat();
  let uniqueAdded = 0;

  for (const row of batchRows) {
    const key = row.sourceLink || row.url;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    rows.push(row);
    uniqueAdded += 1;
  }

  perBatch.push({ batch: batchDir, total: batchRows.length, uniqueAdded });
}

function countBy(field) {
  return rows.reduce((counts, row) => {
    const key = field(row) || 'Unknown';
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function markdownEscape(value) {
  return String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ');
}

function riskLabel(row) {
  return row.riskLevel || row.risk || 'Not classified';
}

function disposition(row) {
  switch (row.publishStatus) {
    case 'Do not publish without explicit warning':
      return 'Excluded from runnable scripts: unsafe, write-oriented, destructive, environment setup, or support-directed content.';
    case 'Needs manual SQL extraction':
      return 'Reference only until SQL can be manually extracted and reviewed for supportability.';
    case 'Needs schema verification':
      return 'Reference only until the referenced objects are confirmed against imported schemas and supported versions.';
    case 'Ready for review':
      return 'Ready queue item kept as not-promoted in this batch pending curation into a reusable read-only reporting pattern.';
    case 'Weak candidate':
      return 'Reference only because the row had insufficient SQL or schema signal.';
    default:
      return 'Reference only pending additional review.';
  }
}

const byProduct = countBy((row) => row.product);
const byStatus = countBy((row) => row.publishStatus);
const lines = [];

lines.push('# Laserfiche Answers SQL Queue Processing - 2026-07-01');
lines.push('');
lines.push(
  'This public-safe summary covers the continuous Answers SQL research run performed before 8:00 AM Mountain Time on 2026-07-01. It stores titles, source links, queue status, risk, and disposition only. It does not copy raw forum SQL.',
);
lines.push('');
lines.push('## Outcome');
lines.push('');
lines.push(`- Completed batches: ${batchDirs.length}.`);
lines.push(`- Reviewed unique rows: ${rows.length}.`);
lines.push(
  `- Product rows reviewed: Forms ${byProduct.forms || 0}, LFDS ${byProduct.lfds || 0}, Repository ${byProduct.repository || 0}, Workflow ${byProduct.workflow || 0}.`,
);
lines.push('- The final exhaustion pass returned 0 new candidates for all products under the current search terms.');
lines.push(
  '- No runnable scripts were promoted automatically from this run; ready rows remain documented for later curation into reusable read-only reporting patterns.',
);
lines.push('');
lines.push('## Batch Counts');
lines.push('');
lines.push('| Batch | Raw rows | Unique rows added |');
lines.push('| --- | ---: | ---: |');
for (const batch of perBatch) {
  lines.push(`| ${batch.batch} | ${batch.total} | ${batch.uniqueAdded} |`);
}
lines.push('');
lines.push('## Queue Status Counts');
lines.push('');
for (const [status, count] of Object.entries(byStatus).sort((a, b) => a[0].localeCompare(b[0]))) {
  lines.push(`- ${status}: ${count}`);
}
lines.push('');
lines.push('## Processed Rows');
lines.push('');
lines.push('| Product | Status | Risk | Source | Disposition | Link |');
lines.push('| --- | --- | --- | --- | --- | --- |');

for (const row of rows.sort(
  (a, b) =>
    (a.product || '').localeCompare(b.product || '') ||
    (a.publishStatus || '').localeCompare(b.publishStatus || '') ||
    (a.title || '').localeCompare(b.title || ''),
)) {
  lines.push(
    `| ${markdownEscape(row.product)} | ${markdownEscape(row.publishStatus)} | ${markdownEscape(riskLabel(row))} | ${markdownEscape(row.title)} | ${markdownEscape(disposition(row))} | [Answers](${row.sourceLink || row.url}) |`,
  );
}

fs.writeFileSync(outputPath, `${lines.join('\n')}\n`);
console.log(JSON.stringify({ rows: rows.length, byProduct, byStatus, outputPath }, null, 2));
