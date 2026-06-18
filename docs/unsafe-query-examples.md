# Unsafe Query Examples

Do not run write operations against Laserfiche product databases for documentation, reporting, or troubleshooting.

## Avoid

```sql
UPDATE dbo.SomeLaserficheTable SET SomeColumn = 'value';
DELETE FROM dbo.SomeLaserficheTable WHERE ...;
INSERT INTO dbo.SomeLaserficheTable (...) VALUES (...);
MERGE dbo.SomeLaserficheTable AS target USING ...;
ALTER TABLE dbo.SomeLaserficheTable ...;
DROP INDEX ... ON dbo.SomeLaserficheTable;
```

## Why

Direct writes can corrupt product state, bypass application logic, and violate Laserfiche Support expectations. This project is for read-only metadata documentation only.
