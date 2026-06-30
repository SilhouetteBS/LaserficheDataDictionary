import fs from 'node:fs';

const queueFiles = [
  '.tmp/answers-sql-research/review-queue-limit100-pass1.json',
  'outputs/answers-sql-research/review-queue.json',
];

const promotedTitles = new Set([
  'Forms SQL query for all instances at a gateway step',
  'Forms Inbox Email Reminder',
  'Forms SQL queries are consuming all the server resources.',
  'Join login and username',
  'Participant User Not Seeing Anything After Logging In',
  'SQL Query to Find Forms Processes User Has Access Rights To',
  'Number of active Forms tasks for each user type',
  'LFDS database user_logins table not updated for some Windows users',
  'SQL database schema does not match error 9110',
  'Getting the Created By field',
  'Audit trail on Number of Records in Each Folder',
  'Workflow Last Modified Date',
]);

const rows = [];
for (const file of queueFiles) {
  const queue = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const [product, items] of Object.entries(queue)) {
    for (const item of items) {
      rows.push({ ...item, product });
    }
  }
}

const uniqueRows = [...new Map(rows.map((row) => [row.sourceLink || row.url, row])).values()];
const nonPromotedRows = uniqueRows.filter((row) => !promotedTitles.has(row.title));

function countBy(rowsToCount, key) {
  return rowsToCount.reduce((counts, row) => {
    const value = row[key] ?? 'Unknown';
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function escapeTable(value) {
  return String(value ?? '')
    .replaceAll('|', '\\|')
    .replace(/\s+/g, ' ')
    .trim();
}

function dispositionFor(row) {
  if (row.publishStatus?.startsWith('Do not publish')) {
    return 'Excluded from runnable scripts: unsafe, write-oriented, destructive, environment setup, or support-directed content.';
  }
  if (row.publishStatus?.includes('manual')) {
    return 'Not promoted: requires manual extraction and supportability review.';
  }
  if (row.publishStatus?.includes('Weak')) {
    return 'Reference only: insufficient SQL/schema signal for a public Reporting guide script.';
  }
  if (row.publishStatus?.includes('schema')) {
    return 'Reference only: needs additional schema/version verification before a reusable script is appropriate.';
  }
  return 'Reference only: not promoted to runnable SQL in this batch.';
}

const counts = countBy(nonPromotedRows, 'publishStatus');
const productCounts = countBy(uniqueRows, 'product');

let markdown = '# Additional Laserfiche Answers SQL Queue Processing - 2026-06-30 Batch 3\n\n';
markdown +=
  'This public-safe summary covers the expanded Answers SQL research batch requested as up to 100 more posts per product. It stores titles, source links, queue status, risk, and disposition only. It does not copy raw forum SQL.\n\n';
markdown += '## Outcome\n\n';
markdown += `- Reviewed unique rows: ${uniqueRows.length}.\n`;
markdown += `- Product rows reviewed: Forms ${productCounts.forms ?? 0}, LFDS ${productCounts.lfds ?? 0}, Repository ${productCounts.repository ?? 0}, Workflow ${productCounts.workflow ?? 0}.\n`;
markdown += '- Promoted into Reporting guide patterns: 12 rows represented by 2 new scripts and 7 existing script evidence updates.\n';
markdown += `- Non-promoted/reference rows documented here: ${nonPromotedRows.length}.\n`;
markdown +=
  '- The run used paged Answers search results after the first pass exhausted the previous first-page search strategy.\n\n';
markdown += '## New or Updated Published Patterns\n\n';
markdown += '- Forms: `reporting/forms/forms-session-diagnostics.sql`\n';
markdown += '- Workflow: `reporting/workflow/workflow-definition-history.sql`\n';
markdown += '- Forms: active task/Monitor evidence and source links updated\n';
markdown += '- Forms: user/group inventory evidence and source links updated\n';
markdown += '- LFDS: user/license inventory evidence and source links updated\n';
markdown += '- Repository: path/metadata lookup evidence and source links updated\n';
markdown += '- Repository: query compatibility evidence and source links updated\n';
markdown += '- Repository: storage/security diagnostics evidence and source links updated\n\n';
markdown += '## Non-Promoted Counts\n\n';
for (const [status, count] of Object.entries(counts).sort()) {
  markdown += `- ${status}: ${count}\n`;
}
markdown += '\n## Non-Promoted Rows\n\n';
markdown += '| Product | Status | Risk | Source | Disposition | Link |\n';
markdown += '| --- | --- | --- | --- | --- | --- |\n';

const sortedRows = [...nonPromotedRows].sort(
  (a, b) =>
    (a.product ?? '').localeCompare(b.product ?? '') ||
    (a.publishStatus ?? '').localeCompare(b.publishStatus ?? '') ||
    a.title.localeCompare(b.title),
);

for (const row of sortedRows) {
  markdown += `| ${escapeTable(row.product)} | ${escapeTable(row.publishStatus)} | ${escapeTable(row.riskLevel)} | ${escapeTable(row.title)} | ${escapeTable(
    dispositionFor(row),
  )} | [Answers](${row.sourceLink}) |\n`;
}

fs.writeFileSync('docs/answers-sql-processed-batch-2026-06-30-3.md', markdown);
console.log(JSON.stringify({ reviewedUnique: uniqueRows.length, nonPromoted: nonPromotedRows.length, counts, productCounts }, null, 2));
