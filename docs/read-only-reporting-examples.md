# Read-Only Reporting Examples

These examples are patterns, not production-ready queries. Validate object names and joins against the selected product/version before use.

## Forms

- Count submissions by process and status using exported foreign keys where available.
- List active processes with field counts using process and field metadata.
- Review report-related tables before aggregating submitted values.
- Draft active-task / Monitor-style reporting objects in `reporting/forms/forms-active-task-monitor.sql`. Deploy them to a reporting database, not to the Forms product database.

## LFDS

- Inventory identity providers and directory object counts.
- Review license allocation metadata by product or registration.
- List registration records for troubleshooting inventory.

## Repository

- Count entries by type and volume.
- Review template and field usage metadata.
- Inventory trustee and security-related metadata.

## Workflow

- Count workflows by enabled/disabled status.
- Inventory schedules and event subscriptions.
- Review workflow activity definitions for documentation coverage.
