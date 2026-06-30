# Repository Reporting Patterns

This folder contains public-safe reporting object drafts. They are based on exported schema metadata and do not include private source-review tracker details.

## Deployment Boundary

- Create these objects in a separate reporting database, not in the Repository product database.
- Treat all Repository product database references as read-only.
- Replace the SQLCMD variable `RepositoryDatabase` with the actual repository database name for the environment.
- Validate the selected Repository version before deploying a pattern.

## Patterns

- `repository-path-metadata-lookup.sql`: Entry path, document/page, volume, and field metadata lookup views.
