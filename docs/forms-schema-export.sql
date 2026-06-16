/*
  Laserfiche Forms SQL Server schema export

  Run this against one Laserfiche Forms database to export metadata for the
  public data dictionary project. This reads metadata only. It does not read
  business rows and does not modify the database.
*/

SET NOCOUNT ON;

DECLARE @ProductName nvarchar(100) = N'Forms';
DECLARE @ProductVersion nvarchar(50) = N'REPLACE_WITH_FORMS_VERSION';
DECLARE @DatabaseRole nvarchar(50) = N'forms';
DECLARE @ExportedBy nvarchar(256) = SUSER_SNAME();
DECLARE @ExportedAtUtc datetime2(0) = SYSUTCDATETIME();

SELECT
  @ProductName AS productName,
  @ProductVersion AS productVersion,
  @DatabaseRole AS databaseRole,
  DB_NAME() AS databaseName,
  @@SERVERNAME AS serverName,
  CAST(SERVERPROPERTY('ProductVersion') AS nvarchar(128)) AS sqlServerProductVersion,
  CAST(SERVERPROPERTY('ProductLevel') AS nvarchar(128)) AS sqlServerProductLevel,
  CAST(SERVERPROPERTY('Edition') AS nvarchar(128)) AS sqlServerEdition,
  @ExportedAtUtc AS exportedAtUtc,
  @ExportedBy AS exportedBy
FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;

SELECT
  s.name AS schemaName,
  t.name AS tableName,
  t.object_id AS objectId,
  t.create_date AS createdAt,
  t.modify_date AS modifiedAt,
  SUM(p.rows) AS rowCountEstimate,
  CAST(CASE WHEN t.is_ms_shipped = 1 THEN 1 ELSE 0 END AS bit) AS isMsShipped,
  ep.value AS description
FROM sys.tables t
JOIN sys.schemas s ON s.schema_id = t.schema_id
LEFT JOIN sys.partitions p ON p.object_id = t.object_id AND p.index_id IN (0, 1)
LEFT JOIN sys.extended_properties ep
  ON ep.major_id = t.object_id
  AND ep.minor_id = 0
  AND ep.name = N'MS_Description'
WHERE t.is_ms_shipped = 0
GROUP BY s.name, t.name, t.object_id, t.create_date, t.modify_date, t.is_ms_shipped, ep.value
ORDER BY s.name, t.name
FOR JSON PATH;

SELECT
  s.name AS schemaName,
  t.name AS tableName,
  c.name AS columnName,
  c.column_id AS ordinal,
  ty.name AS dataType,
  CASE
    WHEN ty.name IN (N'nchar', N'nvarchar') AND c.max_length > 0 THEN c.max_length / 2
    WHEN ty.name IN (N'char', N'varchar', N'binary', N'varbinary') THEN c.max_length
    WHEN c.max_length = -1 THEN -1
    ELSE NULL
  END AS maxLength,
  c.precision,
  c.scale,
  CAST(c.is_nullable AS bit) AS isNullable,
  CAST(c.is_identity AS bit) AS isIdentity,
  CAST(c.is_computed AS bit) AS isComputed,
  dc.definition AS defaultDefinition,
  cc.definition AS computedDefinition,
  ep.value AS description
FROM sys.columns c
JOIN sys.tables t ON t.object_id = c.object_id
JOIN sys.schemas s ON s.schema_id = t.schema_id
JOIN sys.types ty ON ty.user_type_id = c.user_type_id
LEFT JOIN sys.default_constraints dc
  ON dc.parent_object_id = c.object_id
  AND dc.parent_column_id = c.column_id
LEFT JOIN sys.computed_columns cc
  ON cc.object_id = c.object_id
  AND cc.column_id = c.column_id
LEFT JOIN sys.extended_properties ep
  ON ep.major_id = c.object_id
  AND ep.minor_id = c.column_id
  AND ep.name = N'MS_Description'
WHERE t.is_ms_shipped = 0
ORDER BY s.name, t.name, c.column_id
FOR JSON PATH;

SELECT
  fk.name AS foreignKeyName,
  parentSchema.name AS sourceSchemaName,
  parentTable.name AS sourceTableName,
  parentColumn.name AS sourceColumnName,
  referencedSchema.name AS referencedSchemaName,
  referencedTable.name AS referencedTableName,
  referencedColumn.name AS referencedColumnName,
  fkc.constraint_column_id AS columnOrdinal,
  fk.delete_referential_action_desc AS deleteAction,
  fk.update_referential_action_desc AS updateAction,
  CAST(fk.is_disabled AS bit) AS isDisabled,
  CAST(fk.is_not_trusted AS bit) AS isNotTrusted
FROM sys.foreign_keys fk
JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
JOIN sys.tables parentTable ON parentTable.object_id = fk.parent_object_id
JOIN sys.schemas parentSchema ON parentSchema.schema_id = parentTable.schema_id
JOIN sys.columns parentColumn
  ON parentColumn.object_id = fkc.parent_object_id
  AND parentColumn.column_id = fkc.parent_column_id
JOIN sys.tables referencedTable ON referencedTable.object_id = fk.referenced_object_id
JOIN sys.schemas referencedSchema ON referencedSchema.schema_id = referencedTable.schema_id
JOIN sys.columns referencedColumn
  ON referencedColumn.object_id = fkc.referenced_object_id
  AND referencedColumn.column_id = fkc.referenced_column_id
WHERE parentTable.is_ms_shipped = 0
ORDER BY parentSchema.name, parentTable.name, fk.name, fkc.constraint_column_id
FOR JSON PATH;

