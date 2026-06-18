# Release Checklist

Use this checklist before publishing a public build or adding a new product/version snapshot.

## Data

- Confirm product and version identity comes from `products.json`, `versions.json`, and schema metadata, not from the SQL database name.
- Keep generated `schema.json` separate from manual `notes.json`.
- Run `npm run validate:data` after every import.
- Run `npm run validate:notes` when manual notes change.
- Confirm missing `views.json` or `triggers.json` exports are intentional for that product/version.
- Review data validation failures for duplicate object keys, orphaned foreign keys, and missing dependency targets.
- Review dependency resolution stats and confirm unresolved references are expected SQL Server metadata artifacts.

## Diagram

- Smoke test Full database mode for the largest imported product.
- Smoke test Focused mode with one outgoing foreign key.
- Smoke test Focused mode with multiple outgoing foreign keys.
- Smoke test Focused mode with incoming foreign keys.
- Smoke test dependency mode with a routine that references a table.
- Confirm connector lines align in the open gap between table boxes.
- Confirm relationship cards and highlighted connectors match the same foreign key.
- Confirm relationship card hover/focus dims non-selected connectors.
- Confirm object-type filters hide Views, Routines, and Triggers when selected.

## Public Build

- Run `npm run lint`.
- Run `npm run test:unit`.
- Run `npm run test:diagram`.
- Run `npm run validate:data`.
- Run `npm run validate:notes`.
- Run `npm run verify:lockfile`.
- Run `npm run verify:static-security`.
- Run `npm run build`.
- Run `npm run test:static-build`.
- Run `npm run verify:public-build`.
- Run `npm run audit:performance`.
- Run `npm run audit:accessibility`.
- Run `npm run test:e2e` against a local server.
- Run `npm run test:visual` against a local server.
- Confirm editing-only UI is absent in the public artifact.
- Confirm the read-only support warning and Known Limitations link are visible.

## Documentation

- Update `README.md` when commands, data layout, or deployment behavior changes.
- Update `docs/schema-export-guide.md` when export filenames or SQL scripts change.
- Record known product-specific export gaps in the import notes or release notes.
