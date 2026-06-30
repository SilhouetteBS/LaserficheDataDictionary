# Forms Reporting Patterns

This folder contains public-safe reporting object drafts. They are based on exported schema metadata and do not include private source-review tracker details.

## Deployment Boundary

- Create these objects in a separate reporting database, not in the Forms product database.
- Treat all Forms product database references as read-only.
- Replace the SQLCMD variable `FormsDatabase` with the actual Forms database name for the environment.
- Validate the selected Forms version before deploying a pattern.

## Patterns

- `forms-active-task-monitor.sql`: Active Forms task / Monitor-style reporting view, optional indexed snapshot table, refresh stored procedure, and filtered read stored procedure.
- `forms-field-value-instance-lookup.sql`: Submitted field-value lookup view and stored procedure that connect values to submissions and process instances.
