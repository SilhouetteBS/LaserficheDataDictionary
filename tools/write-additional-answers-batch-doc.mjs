import fs from 'node:fs';

const queue = JSON.parse(fs.readFileSync('outputs/answers-sql-research/review-queue.json', 'utf8'));

const promotedTitles = new Set([
  'How to Extract Laserfiche Forms Monitor (Instances & Tasks) Data via SQL for Custom Dashboards?',
  'Forms SQL Database - Assigned Tasks',
  'Question on GUID-like number',
  'Missing Index Details from SQL Plan for Forms Database',
  'SQL query for Form lookups',
  'Lookup tables in Forms, where used?',
  'query forms database for Forms, Fields and variables per business process',
  'Show variable names with field location on form',
  'Last Person to Edit Forms',
  'Validate PDF headers for Forms attachments',
  'Custom Field in Report',
  'Resubmitting Previously Submitted Form Data',
  'Delete Completed/Cancelled Forms from SQL (Forms 10.2)',
  'Forms Logs in Web Interface',
  'Is there a database search by user to see how many Processes they are attached to?',
  'Forms - How to find a reference to a form in the process',
  'View all saved Drafts as an Admin',
  'Know all the business processes and tasks that use a certain team',
  'Is there a forms feature to be able to see how many forms processes a team is used in?',
  'Query to return Forms teams that a user is a member',
  'Forms Database Tables Documentation',
  'In Progress Forms Tasks',
  'SQL Query to retrieve the email, username, display name and the License Type',
  'How can one export a list of all the groups and respective users in LF directory server?',
  'Add LFDS Groups to SQL Query',
  "How to adjust a form's functionality based on the group the user is in?",
  'Query for Forms',
  'LFDS User License Display Limitations',
  'disk space',
  'Is there a way to find out the recycle bin size of a repository?',
  'General database error while searching with one user but not with admin account',
  'SQL Server temp database size',
  'SQL Table for finding electronic file location',
  'Best way to query Metadata on documents from another Application?',
  'Error executing SQL command',
  'How to configure Laserfiche (server) to NOT be db_owner - least privileges',
  'Where are Windows Account details stored in SQL',
  'lookup a repository folder',
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

let markdown = '# Additional Laserfiche Answers SQL Queue Processing - 2026-06-30\n\n';
markdown +=
  'This public-safe summary covers the second 200-post Answers SQL research batch: 50 Forms, 50 LFDS, 50 Repository, and 50 Workflow posts. It stores titles, source links, queue status, risk, and disposition only. It does not copy raw forum SQL.\n\n';
markdown += '## Outcome\n\n';
markdown += '- Reviewed: 200 additional Answers posts.\n';
markdown += '- Promoted into consolidated Reporting guide patterns: 39 ready/read-only rows represented by 4 reusable scripts.\n';
markdown += `- Non-promoted/reference rows documented here: ${nonPromotedRows.length}.\n`;
markdown +=
  '- Workflow had no directly ready schema-matched product-database script in this batch; Workflow rows remain reference-only or need schema verification/manual review.\n\n';
markdown += '## New Published Patterns\n\n';
markdown += '- Forms: `reporting/forms/forms-design-lookup-inventory.sql`\n';
markdown += '- Forms: `reporting/forms/forms-attachment-error-draft-diagnostics.sql`\n';
markdown += '- LFDS: `reporting/lfds/lfds-claims-group-license-inventory.sql`\n';
markdown += '- Repository: `reporting/repository/repository-storage-security-diagnostics.sql`\n\n';
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

fs.writeFileSync('docs/answers-sql-processed-additional-batch-2026-06-30.md', markdown);
console.log(JSON.stringify({ nonPromoted: nonPromotedRows.length, counts }, null, 2));
