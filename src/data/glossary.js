export const glossaryTerms = [
  {
    term: 'Schema export',
    definition: 'A metadata-only export of SQL Server catalog information. It should not include Laserfiche business row data.',
  },
  {
    term: 'Product snapshot',
    definition: 'One imported product/version schema package. Product and version come from the export manifest, not the SQL Server database name.',
  },
  {
    term: 'Read-only reporting',
    definition: 'SELECT-only analysis for troubleshooting, education, or reporting. It does not include writing to Laserfiche product tables or records.',
  },
  {
    term: 'Foreign key',
    definition: 'An exported SQL Server constraint that connects columns between two tables.',
  },
  {
    term: 'Dependency',
    definition: 'A SQL expression reference reported by SQL Server for views, routines, or triggers. It may include aliases or unresolved helper references.',
  },
  {
    term: 'Unresolved dependency',
    definition: 'A dependency row that SQL Server reported but the export could not match to an exported table, view, routine, or trigger.',
  },
  {
    term: 'Documentation confidence',
    definition: 'The review level assigned to a table, column, or object note, from unknown or inferred through observed, confirmed, deprecated, or do not rely.',
  },
  {
    term: 'Repository',
    definition: 'The Laserfiche database area that stores document, folder, template, field, trustee, and metadata structures.',
  },
  {
    term: 'Forms process',
    definition: 'A Laserfiche Forms business process definition and its related instance, submission, and task metadata.',
  },
  {
    term: 'LFDS identity',
    definition: 'Identity, provider, group, licensing, or directory metadata exported from Laserfiche Directory Server.',
  },
  {
    term: 'Workflow runtime',
    definition: 'Workflow definition, instance, activity, schedule, and history metadata used for read-only troubleshooting.',
  },
];

export const exportCompatibilityNotes = [
  'Use SQL Server 2016 or newer because the export script relies on FOR JSON output.',
  'Run the script against the target Laserfiche product database, but use explicit product/version fields instead of the SQL Server database name.',
  'Save each result set as UTF-8 JSON. Empty views, triggers, routines, or dependency result sets can be valid for some products.',
  'The script reads catalog metadata and estimated row counts only; it does not read application row values or modify the database.',
  'Definitions are off by default because stored procedure, view, and trigger text can expose implementation details.',
];
