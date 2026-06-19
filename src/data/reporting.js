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
};

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
