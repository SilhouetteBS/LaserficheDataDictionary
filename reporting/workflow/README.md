# Workflow Reporting Patterns

This folder contains public-safe reporting object drafts. They are based on exported schema metadata and do not include private source-review tracker details.

## Deployment Boundary

- Create these objects in a separate reporting database, not in the Workflow product database.
- Treat all Workflow product database references as read-only.
- Replace the SQLCMD variable `WorkflowDatabase` with the actual Workflow database name for the environment.
- Validate the selected Workflow version before deploying a pattern.

## Patterns

- `workflow-queue-search-diagnostics.sql`: Queue size, search activity, and completion diagnostic views.
