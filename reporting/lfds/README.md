# LFDS Reporting Patterns

This folder contains public-safe reporting object drafts. They are based on exported schema metadata and do not include private source-review tracker details.

## Deployment Boundary

- Create these objects in a separate reporting database, not in the LFDS product database.
- Treat all LFDS product database references as read-only.
- Replace the SQLCMD variable `LfdsDatabase` with the actual LFDS database name for the environment.
- Validate the selected LFDS version before deploying a pattern.

## Patterns

- `lfds-user-license-inventory.sql`: Directory object, login, license, and identity provider inventory views.
