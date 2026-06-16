export const formsDictionary = {
  products: [
    {
      id: 'forms',
      name: 'Forms',
      versions: [
        {
          version: '11.x',
          tables: [
            {
              id: 'dbo.cf_bp_main_instances',
              name: 'dbo.cf_bp_main_instances',
              shortName: 'main_instances',
              confidence: 'inferred',
              summary:
                'Starter documentation entry for a Forms business process instance table. Replace with exported metadata and reviewed notes.',
              safeReportingNotes: [
                'Use read-only queries only.',
                'Treat relationships as version-sensitive until verified against exported Forms metadata.',
              ],
              warnings: ['Do not update process instance records directly.'],
              columns: [
                {
                  name: 'bp_instance_id',
                  dataType: 'int',
                  nullable: false,
                  confidence: 'inferred',
                  purpose: 'Likely unique identifier for a business process instance.',
                },
                {
                  name: 'submission_id',
                  dataType: 'int',
                  nullable: true,
                  confidence: 'unknown',
                  purpose: 'Needs verification from Forms schema and observed product behavior.',
                },
                {
                  name: 'created_date',
                  dataType: 'datetime',
                  nullable: true,
                  confidence: 'observed',
                  purpose: 'Timestamp-style field to verify through before/after snapshots.',
                },
              ],
              relationships: [
                {
                  type: 'references',
                  table: 'dbo.cf_business_processes',
                  shortName: 'processes',
                  note: 'Likely process definition relationship.',
                  confidence: 'inferred',
                },
                {
                  type: 'referenced by',
                  table: 'dbo.cf_submissions',
                  shortName: 'submissions',
                  note: 'Potential submission relationship to validate from foreign keys or data patterns.',
                  confidence: 'unknown',
                },
              ],
            },
          ],
        },
        {
          version: '12.x',
          tables: [
            {
              id: 'dbo.cf_bp_main_instances',
              name: 'dbo.cf_bp_main_instances',
              shortName: 'main_instances',
              confidence: 'inferred',
              summary:
                'Starter documentation entry for a Forms business process instance table. Replace with exported metadata and reviewed notes.',
              safeReportingNotes: [
                'Use read-only queries only.',
                'Prefer stable IDs and documented joins when building reporting queries.',
                'Mark any query pattern as version-sensitive until Forms 11 and Forms 12 exports are compared.',
              ],
              warnings: [
                'Do not insert, update, or delete Forms records directly.',
                'Do not rely on inferred relationships without validating against the target product version.',
              ],
              columns: [
                {
                  name: 'bp_instance_id',
                  dataType: 'int',
                  nullable: false,
                  confidence: 'inferred',
                  purpose: 'Likely unique identifier for a business process instance.',
                },
                {
                  name: 'bp_id',
                  dataType: 'int',
                  nullable: false,
                  confidence: 'inferred',
                  purpose: 'Likely points to the business process definition.',
                },
                {
                  name: 'status',
                  dataType: 'int',
                  nullable: true,
                  confidence: 'unknown',
                  purpose: 'Status code requiring value mapping through product observation.',
                },
                {
                  name: 'created_date',
                  dataType: 'datetime2',
                  nullable: true,
                  confidence: 'observed',
                  purpose: 'Timestamp-style field to verify through before/after snapshots.',
                },
              ],
              relationships: [
                {
                  type: 'references',
                  table: 'dbo.cf_business_processes',
                  shortName: 'processes',
                  note: 'Likely process definition relationship.',
                  confidence: 'inferred',
                },
                {
                  type: 'referenced by',
                  table: 'dbo.cf_bp_steps',
                  shortName: 'steps',
                  note: 'Potential step/state relationship to validate from exported relationships.',
                  confidence: 'unknown',
                },
                {
                  type: 'referenced by',
                  table: 'dbo.cf_submissions',
                  shortName: 'submissions',
                  note: 'Potential submission relationship to validate from foreign keys or data patterns.',
                  confidence: 'unknown',
                },
              ],
            },
            {
              id: 'dbo.cf_business_processes',
              name: 'dbo.cf_business_processes',
              shortName: 'processes',
              confidence: 'unknown',
              summary:
                'Starter entry reserved for the Forms business process definition table once real metadata is imported.',
              safeReportingNotes: ['Use as a documentation placeholder until schema export is loaded.'],
              warnings: ['Meaning and relationships are not yet confirmed.'],
              columns: [
                {
                  name: 'bp_id',
                  dataType: 'int',
                  nullable: false,
                  confidence: 'unknown',
                  purpose: 'Needs schema export and review.',
                },
                {
                  name: 'name',
                  dataType: 'nvarchar',
                  nullable: true,
                  confidence: 'unknown',
                  purpose: 'Needs schema export and review.',
                },
              ],
              relationships: [
                {
                  type: 'referenced by',
                  table: 'dbo.cf_bp_main_instances',
                  shortName: 'main_instances',
                  note: 'Placeholder relationship from seeded example data.',
                  confidence: 'inferred',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

