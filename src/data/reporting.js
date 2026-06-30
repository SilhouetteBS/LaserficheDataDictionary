const reportingAssetLoaders = {
  'reporting/forms/forms-active-task-monitor.sql': () =>
    import('../../reporting/forms/forms-active-task-monitor.sql?raw').then((module) => module.default),
  'reporting/forms/forms-active-task-monitor-evidence.md': () =>
    import('../../reporting/forms/forms-active-task-monitor-evidence.md?raw').then((module) => module.default),
  'reporting/forms/forms-field-value-instance-lookup.sql': () =>
    import('../../reporting/forms/forms-field-value-instance-lookup.sql?raw').then((module) => module.default),
  'reporting/forms/forms-field-value-instance-lookup-evidence.md': () =>
    import('../../reporting/forms/forms-field-value-instance-lookup-evidence.md?raw').then((module) => module.default),
  'reporting/forms/forms-submission-volume-summary.sql': () =>
    import('../../reporting/forms/forms-submission-volume-summary.sql?raw').then((module) => module.default),
  'reporting/forms/forms-submission-volume-summary-evidence.md': () =>
    import('../../reporting/forms/forms-submission-volume-summary-evidence.md?raw').then((module) => module.default),
  'reporting/lfds/lfds-user-license-inventory.sql': () =>
    import('../../reporting/lfds/lfds-user-license-inventory.sql?raw').then((module) => module.default),
  'reporting/lfds/lfds-user-license-inventory-evidence.md': () =>
    import('../../reporting/lfds/lfds-user-license-inventory-evidence.md?raw').then((module) => module.default),
  'reporting/lfds/lfds-directory-account-state.sql': () =>
    import('../../reporting/lfds/lfds-directory-account-state.sql?raw').then((module) => module.default),
  'reporting/lfds/lfds-directory-account-state-evidence.md': () =>
    import('../../reporting/lfds/lfds-directory-account-state-evidence.md?raw').then((module) => module.default),
  'reporting/repository/repository-path-metadata-lookup.sql': () =>
    import('../../reporting/repository/repository-path-metadata-lookup.sql?raw').then((module) => module.default),
  'reporting/repository/repository-path-metadata-lookup-evidence.md': () =>
    import('../../reporting/repository/repository-path-metadata-lookup-evidence.md?raw').then((module) => module.default),
  'reporting/repository/repository-page-and-search-diagnostics.sql': () =>
    import('../../reporting/repository/repository-page-and-search-diagnostics.sql?raw').then((module) => module.default),
  'reporting/repository/repository-page-and-search-diagnostics-evidence.md': () =>
    import('../../reporting/repository/repository-page-and-search-diagnostics-evidence.md?raw').then((module) => module.default),
  'reporting/workflow/workflow-queue-search-diagnostics.sql': () =>
    import('../../reporting/workflow/workflow-queue-search-diagnostics.sql?raw').then((module) => module.default),
  'reporting/workflow/workflow-queue-search-diagnostics-evidence.md': () =>
    import('../../reporting/workflow/workflow-queue-search-diagnostics-evidence.md?raw').then((module) => module.default),
  'reporting/workflow/workflow-wait-completion-diagnostics.sql': () =>
    import('../../reporting/workflow/workflow-wait-completion-diagnostics.sql?raw').then((module) => module.default),
  'reporting/workflow/workflow-wait-completion-diagnostics-evidence.md': () =>
    import('../../reporting/workflow/workflow-wait-completion-diagnostics-evidence.md?raw').then((module) => module.default),
};

export const productReportingPaths = {
  forms: [
    {
      title: 'Process lifecycle',
      summary: 'Start with business processes, then follow instances and submission records.',
      tables: ['dbo.cf_business_processes', 'dbo.cf_bp_main_instances', 'dbo.cf_submissions'],
    },
    {
      title: 'Form design to submitted values',
      summary: 'Use form definitions and fields to orient submitted data tables before aggregating.',
      tables: ['dbo.cf_forms', 'dbo.cf_fields', 'dbo.cf_bp_data'],
    },
    {
      title: 'Users, groups, and roles',
      summary: 'Map user records through group membership and role assignment tables.',
      tables: ['dbo.cf_users', 'dbo.cf_usergroups_users_mapping', 'dbo.cf_usergroups', 'dbo.cf_roles'],
    },
    {
      title: 'Tasks, timers, and history',
      summary: 'Use worker instance tables and history tables for queue and task-state reporting.',
      tables: ['dbo.cf_bp_worker_instances', 'dbo.cf_bp_worker_instance_history', 'dbo.cf_bp_task_reminders'],
    },
  ],
  lfds: [
    {
      title: 'Directory identities and providers',
      summary: 'Start with directory objects, then add provider context and login details.',
      tables: ['dbo.directory_objects', 'dbo.identity_providers', 'dbo.user_logins'],
    },
    {
      title: 'User licenses',
      summary: 'Use directory object SIDs to connect identity records to license assignments.',
      tables: ['dbo.directory_objects', 'dbo.user_licenses', 'dbo.container_limits'],
    },
    {
      title: 'SAML to Laserfiche SID mapping',
      summary: 'Use SID mapping tables when reconciling federated users to Laserfiche identities.',
      tables: ['dbo.saml_lf_sid_mappings', 'dbo.directory_objects', 'dbo.identity_providers'],
    },
  ],
  repository: [
    {
      title: 'Repository entry inventory',
      summary: 'Start from TOC entries, then add parent, volume, and template context.',
      tables: ['dbo.toc', 'dbo.vol', 'dbo.propset'],
    },
    {
      title: 'Field metadata and values',
      summary: 'Use field definitions with property values to report entry metadata.',
      tables: ['dbo.propdef', 'dbo.propval', 'dbo.toc'],
    },
    {
      title: 'Document pages and electronic documents',
      summary: 'Use entry and page tables to review page counts, image sizes, and text inventory.',
      tables: ['dbo.toc', 'dbo.doc', 'dbo.vol'],
    },
  ],
  workflow: [
    {
      title: 'Task queue diagnostics',
      summary: 'Use queue and queue data tables to review retry state, queued work, and task payload size.',
      tables: ['dbo.workflow_task_queue', 'dbo.workflow_task_queue_data'],
    },
    {
      title: 'Search activity tracing',
      summary: 'Connect search instance records to search entry records for current and logged activity.',
      tables: ['dbo.search_instance', 'dbo.search_entry', 'dbo.search_instance_log', 'dbo.search_entry_log'],
    },
    {
      title: 'Instance completion status',
      summary: 'Use completion records for workflow instance completion and retry diagnostics.',
      tables: ['dbo.instance_completion'],
    },
  ],
};

const repoBlobBaseUrl = 'https://github.com/SilhouetteBS/LaserficheDataDictionary/blob/main';

export const communityReportingPatterns = {
  forms: [
    {
      title: 'Forms active task and Monitor reporting',
      summary:
        'Creates reporting-database views and procedures for active Forms tasks, worker instances, and Monitor-style task review.',
      scriptPath: 'reporting/forms/forms-active-task-monitor.sql',
      evidencePath: 'reporting/forms/forms-active-task-monitor-evidence.md',
      sourceCount: 6,
      tables: [
        'dbo.cf_bp_main_instances',
        'dbo.cf_bp_worker_instances',
        'dbo.cf_bp_worker_instance_history',
        'dbo.cf_bp_data',
      ],
      tags: ['Community sourced', 'Schema matched', 'Not live tested', 'Read-only'],
      answersLinks: [
        {
          title: 'Forms Instance Monitoring',
          url: 'https://answers.laserfiche.com/questions/102452/Forms-Instance-Monitoring',
        },
        {
          title: 'Troubleshoot Forms SQL Blockers',
          url: 'https://answers.laserfiche.com/questions/233803/Troubleshoot-Forms-SQL-Blockers',
        },
        {
          title: 'Forms report with start time and end time for each User Task',
          url: 'https://answers.laserfiche.com/questions/212282/Forms-report-with--start-time-and-end-time-for-each-User-Task-in-Forms-process',
        },
        {
          title: 'Report to use for Active Forms',
          url: 'https://answers.laserfiche.com/questions/216937/Report-to-use-for-Active-Forms',
        },
        {
          title: 'Forms Report to Dynamically show all tasks started by you',
          url: 'https://answers.laserfiche.com/questions/184820/Forms-Report-to-Dynamically-show-all-tasks-started-by-you',
        },
        {
          title: 'Generating Report on Unassigned Tasks',
          url: 'https://answers.laserfiche.com/questions/208760/Generating-Report-on-Unassigned-Tasks',
        },
        {
          title: 'delete outstanding forms from a deleted account',
          url: 'https://answers.laserfiche.com/questions/233682/delete-outstanding-forms-from-a-deleted-account',
        },
        {
          title: 'Current step information from Monitor page',
          url: 'https://answers.laserfiche.com/questions/215801/How-can-I-retrieve-the-current-step-information-from-an-SQL-table-which-is-displayed-on-the-Monitor-page',
        },
      ],
    },
    {
      title: 'Forms field-value to instance lookup',
      summary:
        'Creates a reporting view and procedure that connect submitted values to Forms submissions and business process instances.',
      scriptPath: 'reporting/forms/forms-field-value-instance-lookup.sql',
      evidencePath: 'reporting/forms/forms-field-value-instance-lookup-evidence.md',
      sourceCount: 5,
      tables: ['dbo.cf_bp_data', 'dbo.cf_submissions', 'dbo.cf_bp_main_instances', 'dbo.cf_fields'],
      tags: ['Community sourced', 'Schema matched', 'Not live tested', 'Read-only'],
      answersLinks: [
        {
          title: 'How do I find a specific form submission on my Forms database?',
          url: 'https://answers.laserfiche.com/questions/153974/How-do-I-find-a-specific-form-submission-on-my-Forms-database',
        },
        {
          title: 'Query Forms SQL database to Find Instance based on Field Value',
          url: 'https://answers.laserfiche.com/questions/201522/Query-Forms-SQL-database-to-Find-Instance-based-on-Field-Value',
        },
      ],
    },
    {
      title: 'Forms submission volume summary',
      summary:
        'Creates reporting-database objects for submission and instance counts by process, status, and date range.',
      scriptPath: 'reporting/forms/forms-submission-volume-summary.sql',
      evidencePath: 'reporting/forms/forms-submission-volume-summary-evidence.md',
      sourceCount: 2,
      tables: ['dbo.cf_bp_main_instances', 'dbo.cf_business_processes', 'dbo.cf_submissions'],
      tags: ['Community sourced', 'Schema matched', 'Not live tested', 'Read-only'],
      answersLinks: [
        {
          title: 'Top 10 Forms Submissions',
          url: 'https://answers.laserfiche.com/questions/237177/Top-10-Forms-Submissions--An-Experience-Using-AI-To-Write-A-SQL-Query',
        },
        {
          title: 'Report to use for Active Forms',
          url: 'https://answers.laserfiche.com/questions/216937/Report-to-use-for-Active-Forms',
        },
      ],
    },
  ],
  lfds: [
    {
      title: 'LFDS user and license inventory',
      summary:
        'Creates read-only reporting objects for directory users, identity providers, logins, licenses, limits, and SAML SID mappings.',
      scriptPath: 'reporting/lfds/lfds-user-license-inventory.sql',
      evidencePath: 'reporting/lfds/lfds-user-license-inventory-evidence.md',
      sourceCount: 6,
      tables: [
        'dbo.directory_objects',
        'dbo.identity_providers',
        'dbo.user_logins',
        'dbo.user_licenses',
        'dbo.container_limits',
        'dbo.saml_lf_sid_mappings',
      ],
      tags: ['Community sourced', 'Schema matched', 'Not live tested', 'Read-only'],
      answersLinks: [
        {
          title: 'Any ways to get Laserfiche Directory account lock status in batch?',
          url: 'https://answers.laserfiche.com/questions/206318/Any-ways-to-get-Laserfiche-Directory-account-lock-status-in-batch',
        },
        {
          title: 'Querying LFDS database for user last log in in Forms',
          url: 'https://answers.laserfiche.com/questions/151526/Querying-LFDS-database-for-user-last-log-in-in-Forms',
        },
        {
          title: 'Directory Server Database query help',
          url: 'https://answers.laserfiche.com/questions/204411/Directory-Server-Database-query-help',
        },
        {
          title: 'Number of licenses we own',
          url: 'https://answers.laserfiche.com/questions/184000/Number-of-licenses-we-ownin-the-database',
        },
        {
          title: 'Linking multiple SAML identity providers through common username',
          url: 'https://answers.laserfiche.com/questions/213876/Linking-multiple-SAML-identity-providers-through-common-username',
        },
      ],
    },
    {
      title: 'LFDS directory account state',
      summary:
        'Creates read-only account-state and group-membership views for directory objects, login failures, and identity providers.',
      scriptPath: 'reporting/lfds/lfds-directory-account-state.sql',
      evidencePath: 'reporting/lfds/lfds-directory-account-state-evidence.md',
      sourceCount: 2,
      tables: ['dbo.directory_objects', 'dbo.identity_providers', 'dbo.user_logins', 'dbo.group_membership'],
      tags: ['Community sourced', 'Schema matched', 'Not live tested', 'Read-only'],
      answersLinks: [
        {
          title: 'Any ways to get Laserfiche Directory account lock status in batch?',
          url: 'https://answers.laserfiche.com/questions/206318/Any-ways-to-get-Laserfiche-Directory-account-lock-status-in-batch',
        },
        {
          title: 'How to query User with organization in LFDS Database?',
          url: 'https://answers.laserfiche.com/questions/187013/How-to-query-User-with-organization-in-LFDS-Database-',
        },
      ],
    },
  ],
  repository: [
    {
      title: 'Repository path and metadata lookup',
      summary:
        'Creates read-only reporting views and a lookup procedure for entries, parent folders, volumes, pages, templates, and field values.',
      scriptPath: 'reporting/repository/repository-path-metadata-lookup.sql',
      evidencePath: 'reporting/repository/repository-path-metadata-lookup-evidence.md',
      sourceCount: 11,
      tables: ['dbo.toc', 'dbo.doc', 'dbo.vol', 'dbo.propset', 'dbo.propdef', 'dbo.propval'],
      tags: ['Community sourced', 'Schema matched', 'Not live tested', 'Read-only'],
      answersLinks: [
        {
          title: 'How to mimic a repository search using a SQL query?',
          url: 'https://answers.laserfiche.com/questions/156668/How-to-mimic-a-repository-search-using-a-SQL-query',
        },
        {
          title: 'Feature Request: Ability to use Lookup Rules in Forms to query metadata in repository',
          url: 'https://answers.laserfiche.com/questions/207941/Feature-Request--Ability-to-use-Lookup-Rules-in-Forms-to-query-metadata-in-repository',
        },
        {
          title: 'Query to see how many pages in repository are in color and black & white?',
          url: 'https://answers.laserfiche.com/questions/168368/Query-to-see-how-many-pages-in-repository-are-in-color-and-black--white',
        },
        {
          title: 'SQL query on LF Server tables for specific metadata',
          url: 'https://answers.laserfiche.com/questions/201363/SQL-query-on-LF-Server-tables-for-specific-metadata',
        },
        {
          title: 'What table in SQL is the document path located?',
          url: 'https://answers.laserfiche.com/questions/67002/What-table-in-SQL-is-the-document-path-located',
        },
      ],
    },
    {
      title: 'Repository page and search diagnostics',
      summary:
        'Creates read-only diagnostics for page counts, likely color pages, image/text sizes, active documents, and search-related troubleshooting context.',
      scriptPath: 'reporting/repository/repository-page-and-search-diagnostics.sql',
      evidencePath: 'reporting/repository/repository-page-and-search-diagnostics-evidence.md',
      sourceCount: 4,
      tables: ['dbo.toc', 'dbo.doc', 'dbo.vol', 'dbo.active_doc'],
      tags: ['Community sourced', 'Schema matched', 'Not live tested', 'Read-only'],
      answersLinks: [
        {
          title: 'Query to see how many pages in repository are in color and black & white?',
          url: 'https://answers.laserfiche.com/questions/168368/Query-to-see-how-many-pages-in-repository-are-in-color-and-black--white',
        },
        {
          title: 'Unknown SQL have a performance impact on Laseriche',
          url: 'https://answers.laserfiche.com/questions/66306/Unknown-SQL-have-a-performance-impact-on-Laseriche',
        },
        {
          title: 'General database error 9008 during search',
          url: 'https://answers.laserfiche.com/questions/221495/While-we-search-within-repository-we-got-error--Error-executing-SQL-command-General-database-error-9008',
        },
        {
          title: 'ORA-32033 unsupported column aliasing',
          url: 'https://answers.laserfiche.com/questions/78110/sql-statement-returns-ORA32033-unsupported-column-aliasing',
        },
      ],
    },
  ],
  workflow: [
    {
      title: 'Workflow queue and search diagnostics',
      summary:
        'Creates read-only reporting objects for workflow task queues, queue payload sizes, search activity, and completion status.',
      scriptPath: 'reporting/workflow/workflow-queue-search-diagnostics.sql',
      evidencePath: 'reporting/workflow/workflow-queue-search-diagnostics-evidence.md',
      sourceCount: 4,
      tables: [
        'dbo.workflow_task_queue',
        'dbo.workflow_task_queue_data',
        'dbo.search_instance',
        'dbo.search_entry',
        'dbo.search_instance_log',
        'dbo.search_entry_log',
        'dbo.instance_completion',
      ],
      tags: ['Community sourced', 'Schema matched', 'Not live tested', 'Read-only'],
      answersLinks: [
        {
          title: 'Workflow activity search SQL error ambiguous column name',
          url: 'https://answers.laserfiche.com/questions/62128/Workflow-activity-search-SQL-error-ambiguous-column-name',
        },
        {
          title: 'A transport-level error has occurred when receiving results from the server',
          url: 'https://answers.laserfiche.com/questions/105587/A-transportlevel-error-has-occurred-when-receiving-results-from-the-server-provider-TCP-Provider-error-0--The-semaphore-timeout-period-has-expired',
        },
        {
          title: 'workflow_task_queue_data table size very large',
          url: 'https://answers.laserfiche.com/questions/128584/workflowTaskQueuedata-table-size-very-large--Using-SQL-Express-database',
        },
      ],
    },
    {
      title: 'Workflow wait and completion diagnostics',
      summary:
        'Creates read-only views for wait conditions and completion retry state while exposing payload sizes instead of payload contents.',
      scriptPath: 'reporting/workflow/workflow-wait-completion-diagnostics.sql',
      evidencePath: 'reporting/workflow/workflow-wait-completion-diagnostics-evidence.md',
      sourceCount: 2,
      tables: ['dbo.wait_condition', 'dbo.instance_completion'],
      tags: ['Community sourced', 'Schema matched', 'Not live tested', 'Read-only'],
      answersLinks: [
        {
          title: 'Connection pool timeout',
          url: 'https://answers.laserfiche.com/questions/105585/Timeout-expired--The-timeout-period-elapsed-prior-to-obtaining-a-connection-from-the-pool--This-may-have-occurred-because-all-pooled-connections-were-in-use-and-max-pool-size-was-reached',
        },
        {
          title: 'Transport-level semaphore timeout',
          url: 'https://answers.laserfiche.com/questions/105587/A-transportlevel-error-has-occurred-when-receiving-results-from-the-server-provider-TCP-Provider-error-0--The-semaphore-timeout-period-has-expired',
        },
      ],
    },
  ],
};

export function getCommunityReportingPatterns(productKey) {
  return (communityReportingPatterns[productKey] ?? []).map((pattern) => ({
    ...pattern,
    scriptUrl: `${repoBlobBaseUrl}/${pattern.scriptPath}`,
    evidenceUrl: `${repoBlobBaseUrl}/${pattern.evidencePath}`,
    scriptLoader: reportingAssetLoaders[pattern.scriptPath],
    evidenceLoader: reportingAssetLoaders[pattern.evidencePath],
  }));
}

export function getReportingPaths(productKey) {
  return productReportingPaths[productKey] ?? [];
}

export function getReportingQuestions(productKey) {
  const commonQuestions = {
    forms: [
      {
        question: 'Which processes exist and how are they named?',
        guidance: 'Start with process definition tables, then inspect process instance tables before counting activity.',
        tables: ['dbo.cf_business_processes', 'dbo.cf_bp_main_instances'],
      },
      {
        question: 'How many submissions exist by process or date?',
        guidance: 'Use submission and process tables, then validate the join path from exported foreign keys or the diagram.',
        tables: ['dbo.cf_business_processes', 'dbo.cf_submissions'],
      },
      {
        question: 'Where are submitted field values stored?',
        guidance: 'Use form and field definitions to identify the value tables, then verify value column meaning before reporting.',
        tables: ['dbo.cf_forms', 'dbo.cf_fields', 'dbo.cf_bp_data'],
      },
      {
        question: 'Who can access or administer Forms items?',
        guidance: 'Start with users and group/role mapping tables, then confirm the meaning of flags and role identifiers.',
        tables: ['dbo.cf_users', 'dbo.cf_usergroups_users_mapping', 'dbo.cf_roles'],
      },
    ],
    repository: [
      {
        question: 'Which templates, fields, and document metadata structures exist?',
        guidance: 'Start with template and field tables, then use relationships to find document or entry associations.',
        tables: ['dbo.template', 'dbo.propdef', 'dbo.toc'],
      },
      {
        question: 'How are users, trustees, and access-related records represented?',
        guidance: 'Start with trustee/security tables and verify joins carefully before reporting access state.',
        tables: ['dbo.trustee', 'dbo.account_cache', 'dbo.acl'],
      },
    ],
    lfds: [
      {
        question: 'Which identities, providers, and groups are configured?',
        guidance: 'Start with directory object and provider tables, then inspect foreign keys before joining identity records.',
        tables: ['dbo.directory_objects', 'dbo.identity_providers', 'dbo.groups'],
      },
      {
        question: 'Which licenses or registered applications are represented?',
        guidance: 'Start with license/application tables and validate product-specific meaning before operational reporting.',
        tables: ['dbo.licenses', 'dbo.applications'],
      },
    ],
    workflow: [
      {
        question: 'Which workflows, schedules, and runtime records exist?',
        guidance: 'Start with workflow definition tables, then follow runtime/history relationships for execution reporting.',
        tables: ['dbo.Workflow', 'dbo.Schedule', 'dbo.Instance'],
      },
      {
        question: 'How can I inspect workflow activity or error history?',
        guidance: 'Use activity/history tables and confirm status values before aggregating by state or error.',
        tables: ['dbo.Activity', 'dbo.InstanceHistory', 'dbo.Error'],
      },
    ],
  };

  return commonQuestions[productKey] ?? [];
}

function quoteName(value) {
  return `[${String(value).replaceAll(']', ']]')}]`;
}

function quoteTableKey(tableKey) {
  const [schemaName, tableName] = tableKey.split('.');
  return `${quoteName(schemaName)}.${quoteName(tableName)}`;
}

function getTableByKey(version, tableKey) {
  return version.source.tables.find((table) => table.key === tableKey);
}

function chooseColumns(table, patterns, fallbackCount = 5) {
  if (!table) {
    return [];
  }

  const selected = [];
  patterns.forEach((pattern) => {
    const match = table.columns.find(
      (column) => pattern.test(column.name) && !selected.some((existing) => existing.name === column.name),
    );
    if (match) {
      selected.push(match);
    }
  });

  table.columns.slice(0, fallbackCount).forEach((column) => {
    if (!selected.some((existing) => existing.name === column.name)) {
      selected.push(column);
    }
  });

  return selected.slice(0, fallbackCount);
}

function selectList(columns, alias = '') {
  return columns.map((column) => `  ${alias ? `${alias}.` : ''}${quoteName(column.name)}`).join(',\n');
}

function findForeignKeyBetween(version, leftTableKey, rightTableKey) {
  return (version.source.foreignKeys ?? []).find(
    (foreignKey) =>
      (foreignKey.sourceTableKey === leftTableKey && foreignKey.referencedTableKey === rightTableKey) ||
      (foreignKey.sourceTableKey === rightTableKey && foreignKey.referencedTableKey === leftTableKey),
  );
}

function joinConditionForForeignKey(foreignKey, leftAlias, rightAlias, leftTableKey) {
  const sourceAlias = foreignKey.sourceTableKey === leftTableKey ? leftAlias : rightAlias;
  const referencedAlias = foreignKey.referencedTableKey === leftTableKey ? leftAlias : rightAlias;

  return foreignKey.columns
    .map(
      (column) =>
        `${sourceAlias}.${quoteName(column.sourceColumnName)} = ${referencedAlias}.${quoteName(
          column.referencedColumnName,
        )}`,
    )
    .join(' AND ');
}

export function buildGeneratedReportingExamples(version) {
  if (version.source.productKey !== 'forms') {
    return [];
  }

  const processTable = getTableByKey(version, 'dbo.cf_business_processes');
  const submissionsTable = getTableByKey(version, 'dbo.cf_submissions');
  const taskTable = getTableByKey(version, 'dbo.cf_bp_worker_instances');
  const userTable = getTableByKey(version, 'dbo.cf_users');
  const groupTable = getTableByKey(version, 'dbo.cf_usergroups');
  const roleTable = getTableByKey(version, 'dbo.cf_roles');
  const processColumns = chooseColumns(processTable, [/name/i, /display/i, /title/i, /id$/i]);
  const submissionColumns = chooseColumns(submissionsTable, [/id$/i, /process/i, /created/i, /submitted/i]);
  const taskColumns = chooseColumns(taskTable, [/status/i, /state/i, /assigned/i, /created/i, /updated/i]);
  const userColumns = chooseColumns(userTable, [/user/i, /name/i, /email/i, /id$/i]);
  const processSubmissionFk =
    processTable && submissionsTable ? findForeignKeyBetween(version, processTable.key, submissionsTable.key) : null;
  const statusColumn = taskTable?.columns.find((column) => /status|state/i.test(column.name));
  const taskDateColumn = taskTable?.columns.find((column) => /updated|modified|created|date/i.test(column.name));

  return [
    {
      title: 'List processes',
      tables: ['dbo.cf_business_processes'],
      available: Boolean(processTable && processColumns.length),
      sql: processTable
        ? `SELECT TOP (100)\n${selectList(processColumns)}\nFROM ${quoteTableKey(processTable.key)}\nORDER BY 1;`
        : '',
      note: processTable
        ? 'Generated from columns exported for this version. Narrow the SELECT list further before operational use.'
        : 'Expected Forms process table was not found in this snapshot.',
    },
    {
      title: 'Count submissions by process',
      tables: ['dbo.cf_business_processes', 'dbo.cf_submissions'],
      available: Boolean(processTable && submissionsTable && processSubmissionFk),
      sql:
        processTable && submissionsTable && processSubmissionFk
          ? `SELECT\n  p.${quoteName(processColumns[0]?.name ?? processTable.columns[0].name)} AS process_value,\n  COUNT_BIG(*) AS submission_count\nFROM ${quoteTableKey(processTable.key)} AS p\nJOIN ${quoteTableKey(submissionsTable.key)} AS s\n  ON ${joinConditionForForeignKey(processSubmissionFk, 'p', 's', processTable.key)}\nGROUP BY p.${quoteName(processColumns[0]?.name ?? processTable.columns[0].name)}\nORDER BY submission_count DESC;`
          : submissionsTable
            ? `SELECT TOP (100)\n${selectList(submissionColumns)}\nFROM ${quoteTableKey(submissionsTable.key)}\nORDER BY 1;`
            : '',
      note: processSubmissionFk
        ? `Generated from exported foreign key ${processSubmissionFk.name}.`
        : 'A direct exported foreign key between processes and submissions was not found; use the diagram to choose a verified path before joining.',
    },
    {
      title: 'Show task records for status review',
      tables: ['dbo.cf_bp_worker_instances'],
      available: Boolean(taskTable),
      sql: taskTable
        ? `SELECT TOP (100)\n${selectList(taskColumns)}\nFROM ${quoteTableKey(taskTable.key)}${statusColumn ? `\nWHERE ${quoteName(statusColumn.name)} IS NOT NULL` : ''}\nORDER BY ${taskDateColumn ? quoteName(taskDateColumn.name) : '1'} DESC;`
        : '',
      note: statusColumn
        ? `Generated using status-like column ${statusColumn.name}. Confirm the meaning of each status value before reporting.`
        : 'No status-like column was detected; review the exported Columns panel before adding filters.',
    },
    {
      title: 'List users',
      tables: ['dbo.cf_users', 'dbo.cf_usergroups', 'dbo.cf_roles'],
      available: Boolean(userTable),
      sql: userTable
        ? `SELECT TOP (100)\n${selectList(userColumns, 'u')}\nFROM ${quoteTableKey(userTable.key)} AS u\nORDER BY 1;`
        : '',
      note:
        groupTable || roleTable
          ? 'User table exists; inspect exported foreign keys before adding group or role joins.'
          : 'User table exists, but expected group or role tables were not found in this snapshot.',
    },
  ];
}

export function buildTableReportingExamples(version, tableKey) {
  const table = getTableByKey(version, tableKey);
  if (!table) {
    return [];
  }

  const displayColumns = chooseColumns(table, [/name/i, /title/i, /status/i, /type/i, /date/i, /id$|guid$|uuid$/i], 6);
  const dateColumn = table.columns.find((column) => /date|time|created|modified|updated/i.test(column.name));
  const statusColumn = table.columns.find((column) => /status|state|type/i.test(column.name));
  const examples = [
    {
      title: 'Inspect representative rows',
      note: 'Use TOP with a narrow column list when orienting yourself to table shape. Do not update rows.',
      sql: `SELECT TOP (100)\n${selectList(displayColumns)}\nFROM ${quoteTableKey(table.key)}\nORDER BY 1;`,
    },
  ];

  if (dateColumn) {
    examples.push({
      title: `Recent records by ${dateColumn.name}`,
      note: 'Confirm the date column meaning before using it for operational reporting.',
      sql: `SELECT TOP (100)\n${selectList(displayColumns)}\nFROM ${quoteTableKey(table.key)}\nWHERE ${quoteName(dateColumn.name)} IS NOT NULL\nORDER BY ${quoteName(dateColumn.name)} DESC;`,
    });
  }

  if (statusColumn) {
    examples.push({
      title: `Counts by ${statusColumn.name}`,
      note: 'Status and type values are product-specific. Validate the values before publishing metrics.',
      sql: `SELECT\n  ${quoteName(statusColumn.name)},\n  COUNT_BIG(*) AS row_count\nFROM ${quoteTableKey(table.key)}\nGROUP BY ${quoteName(statusColumn.name)}\nORDER BY row_count DESC;`,
    });
  }

  return examples;
}
