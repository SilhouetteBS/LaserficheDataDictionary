# Laserfiche Database Dictionary

Interactive static web app for documenting Laserfiche product databases.

Initial scope:

- Forms 11 and Forms 12 schema snapshots
- Table and column data dictionary
- Unified search with product filters
- Version-aware table documentation
- Relationships and dependency graph
- Safe read-only reporting notes
- Downloadable JSON/CSV documentation artifacts

## Support Warning

This project is intended for read-only reporting, troubleshooting, and educational use. Manually writing to or modifying Laserfiche product databases, tables, or records may violate your Laserfiche Support plan and can cause unsupported or unstable behavior.

## Development

```powershell
npm install
npm run dev
```

## Build

```powershell
npm run build
```

The built static site will be in `dist/` and can be hosted on your own web server.

## Data Model

Generated schema files and manual documentation should remain separate:

```text
data/
  forms/
    11.x/
      schema.json
      notes.yaml
    12.x/
      schema.json
      notes.yaml
```

Use `docs/forms-schema-export.sql` to export SQL Server metadata from each Forms database version.

