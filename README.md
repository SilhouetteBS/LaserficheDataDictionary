# Laserfiche Database Dictionary

Interactive static web app for documenting Laserfiche product databases for read-only reporting, troubleshooting, and education.

## Scope

- Product/version selector backed by static JSON manifests
- Forms 11 and Forms 12 schema snapshots
- Table, column, key, index, trigger, dependency, and relationship views
- Focused database diagram with full-database mode
- Version comparison with selectable source/target versions
- Local manual notes workflow with import/export
- Schema health, impact, and reporting guide views
- Static JSON/CSV export artifacts

## Support Warning

This project is intended for read-only reporting, troubleshooting, and educational use. Manually writing to or modifying Laserfiche product databases, tables, or records may violate your Laserfiche Support plan and can cause unsupported or unstable behavior.

## Development

```powershell
npm install
npm run dev
```

The dev server binds to `127.0.0.1`.

## Validation

```powershell
npm run lint
npm run test:unit
npm run build
npm run render:check
```

Or run the bundled non-browser validation:

```powershell
npm run validate
```

For browser smoke testing, start the dev server first and then run:

```powershell
$env:CHROME_PATH='C:/Program Files/Google/Chrome/Application/chrome.exe'
$env:APP_URL='http://127.0.0.1:4177'
npm run test:e2e
```

## Build

```powershell
npm run build
```

The built static site is emitted to `dist/` and can be hosted by any static web server.

## Data Layout

Generated schema files and manual documentation remain separate:

```text
data/
  forms/
    12.0.2503.10378/
      schema.json
      notes.json
public/
  data/
    products.json
    forms/
      versions.json
      12.0.2503.10378/
        schema.json
        notes.json
```

`data/` is the source-side copy. `public/data/` is what the static app fetches at runtime.

Database names are environment-specific and must not be used as product or version identifiers. Use explicit export labels such as `productKey`, `productVersion`, and `snapshotLabel`.

## Export SQL Metadata

Use `docs/forms-schema-export.sql` for Forms exports.

Use `docs/sql-server-schema-export.sql` for a product-neutral export script that can be used for LFDS, Repository, Workflow, or Forms databases.

The export script reads SQL Server catalog metadata only. It does not read Laserfiche business table rows and does not modify the database.

Save each SQL result set as JSON using these names:

```text
manifest.json
schemas.json
tables.json
columns.json
primaryAndUniqueKeys.json
foreignKeys.json
indexes.json
views.json
routines.json
triggers.json
dependencies.json
```

See `docs/schema-export-guide.md` for the full export procedure.

## Import Schema Exports

Forms default import from `Downloads`:

```powershell
npm run import:forms
```

Forms import from a specific folder:

```powershell
npm run import:forms -- --input-dir "C:\path\to\forms-export"
```

Generic product import, for example LFDS:

```powershell
npm run import:schema -- --product=lfds --product-name="LFDS" --database-role=lfds --input-dir "C:\path\to\lfds-export"
```

The importer updates product/version manifests in `public/data/` and creates empty `notes.json` files when they do not already exist.

## Manual Notes Workflow

Manual notes are edited locally in the browser first. Use the table detail page to:

- save a local note draft
- import a notes JSON file
- export local browser notes
- export a review-ready `notes.json` shape for the selected product/version

Checked-in notes should stay separate from generated `schema.json` snapshots.

## CI

GitHub Actions runs separate jobs for:

- lint and unit tests
- production build and render smoke check
- Playwright browser smoke test
