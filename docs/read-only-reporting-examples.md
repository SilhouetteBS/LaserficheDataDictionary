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
- Review field-value-to-instance lookup candidates before publishing a second reusable Forms script.

## LFDS

- Inventory identity providers and directory object counts.
- Review license allocation metadata by product or registration.
- List registration records for troubleshooting inventory.
- Review user/license inventory candidates based on `directory_objects`, `user_licenses`, `user_logins`, and `container_limits`.

## Repository

- Count entries by type and volume.
- Review template and field usage metadata.
- Inventory trustee and security-related metadata.
- Review path and metadata lookup candidates based on `toc`, `doc`, `vol`, `propdef`, `propset`, and `propval`.

## Workflow

- Count workflows by enabled/disabled status.
- Inventory schedules and event subscriptions.
- Review workflow activity definitions for documentation coverage.
- Review queue-size and search-activity diagnostic candidates with row/date filters before publishing runnable SQL.
