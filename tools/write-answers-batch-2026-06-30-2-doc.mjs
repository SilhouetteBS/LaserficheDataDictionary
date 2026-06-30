import fs from 'node:fs';

const queue = JSON.parse(fs.readFileSync('outputs/answers-sql-research/review-queue.json', 'utf8'));

const promotedTitles = new Set([
  'Creation date of a forms authenticated participant',
  'Last sign-in time in LFDS 12, database location?',
  'From Workflows, retrieving email and manager info for LFDS Thrustees',
  'Directory Server database',
  'SQL Query to identify workflows running more than an Hour.',
  'SQL Query to get the number of workflows by repository name or ID',
  'Feature Request: List all rules invoking a given (separate) workflow rule.',
]);

const allRows = Object.values(queue).flat();
const nonPromotedRows = allRows.filter((row) => !promotedTitles.has(row.title));

function countBy(rows, key) {
  return rows.reduce((counts, row) => {
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

let markdown = '# Additional Laserfiche Answers SQL Queue Processing - 2026-06-30 Batch 2\n\n';
markdown +=
  'This public-safe summary covers the third Answers SQL research batch: 50 Forms, 45 LFDS, 50 Repository, and 50 Workflow posts. It stores titles, source links, queue status, risk, and disposition only. It does not copy raw forum SQL.\n\n';
markdown += '## Outcome\n\n';
markdown += '- Reviewed: 195 additional Answers posts.\n';
markdown += '- Promoted into Reporting guide patterns: 8 ready/read-only rows represented by 1 new script and 3 existing script evidence updates.\n';
markdown += `- Non-promoted/reference rows documented here: ${nonPromotedRows.length}.\n`;
markdown +=
  '- Repository had one ready object-definition/performance row, kept as reference-only because it is not a portable read-only reporting script.\n\n';
markdown += '## New or Updated Published Patterns\n\n';
markdown += '- Forms: `reporting/forms/forms-authenticated-participant-signup.sql`\n';
markdown += '- LFDS: `reporting/lfds/lfds-user-license-inventory.sql` evidence/source links updated\n';
markdown += '- LFDS: `reporting/lfds/lfds-claims-group-license-inventory.sql` evidence/source links updated\n';
markdown += '- Workflow: `reporting/workflow/workflow-queue-search-diagnostics.sql` evidence/source links updated\n\n';
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

fs.writeFileSync('docs/answers-sql-processed-batch-2026-06-30-2.md', markdown);
console.log(JSON.stringify({ nonPromoted: nonPromotedRows.length, counts }, null, 2));
