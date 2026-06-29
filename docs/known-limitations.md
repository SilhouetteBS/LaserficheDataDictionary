# Known Limitations

- The app documents exported SQL Server metadata, not Laserfiche business semantics.
- Table and column purpose text is generated unless a checked-in `notes.json` entry provides manual documentation.
- Foreign key and dependency diagrams can only show relationships present in exported catalog metadata.
- Foreign keys are enforced SQL constraints. Dependencies are SQL expression references and may include aliases, pseudo tables, caller-dependent references, or helper objects that do not resolve to exported objects.
- SQL Server database names are environment-specific and are not used as product or version identifiers.
- Database role values identify the Laserfiche product database role, not the environment-specific SQL Server database name.
- Focused diagram mode shows direct relationships to the selected object; deeper context is available through the depth control where supported.
- Public builds are read-only. Manual notes editing is intended only for local or internal review builds.
- This project is for read-only reporting, troubleshooting, and education. It does not authorize direct writes to Laserfiche product databases.
- This helper is an unofficial FicheBait community research aid. It is not affiliated with or endorsed by Laserfiche, is not Laserfiche support documentation, and does not make direct writes to Laserfiche product databases supported.
- Validate fixes in a test or maintenance window before changing production systems.
