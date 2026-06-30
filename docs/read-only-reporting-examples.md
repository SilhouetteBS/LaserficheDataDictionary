# Read-Only Reporting Examples

These examples are patterns, not production-ready queries. Validate object names and joins against the selected product/version before use.

Laserfiche Answers SQL examples that are ready for human review are summarized in
`docs/answers-sql-ready-examples.md`. That review summary records public-safe
source links and schema-match notes without copying raw forum SQL.

## Forms

- Count submissions by process and status using exported foreign keys where available.
- List active processes with field counts using process and field metadata.
- Review report-related tables before aggregating submitted values.
- Draft active-task / Monitor-style reporting objects in `reporting/forms/forms-active-task-monitor.sql`. Deploy them to a reporting database, not to the Forms product database.
- Draft field-value-to-instance lookup objects in `reporting/forms/forms-field-value-instance-lookup.sql`. This pattern helps connect submitted values back to Forms submissions and process instances.

## LFDS

- Inventory identity providers and directory object counts.
- Review license allocation metadata by product or registration.
- List registration records for troubleshooting inventory.
- Draft user/license inventory objects in `reporting/lfds/lfds-user-license-inventory.sql` based on `directory_objects`, `user_licenses`, `user_logins`, and `container_limits`.

## Repository

- Count entries by type and volume.
- Review template and field usage metadata.
- Inventory trustee and security-related metadata.
- Draft path and metadata lookup objects in `reporting/repository/repository-path-metadata-lookup.sql` based on `toc`, `doc`, `vol`, `propdef`, `propset`, and `propval`.

## Workflow

- Count workflows by enabled/disabled status.
- Inventory schedules and event subscriptions.
- Review workflow activity definitions for documentation coverage.
- Draft queue/search diagnostic objects in `reporting/workflow/workflow-queue-search-diagnostics.sql` with row/date filters for queue, search, and completion review.
