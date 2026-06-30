/*
Forms design and lookup inventory reporting pattern.

Target: reporting database, not the Forms product database.
Product schema evidence: Forms 12.0.2509.20409 AI export.

Usage:
  1. Open in SQL Server Management Studio with SQLCMD Mode enabled.
  2. Set FormsDatabase to the Forms product database name.
  3. Execute from the reporting database where rpt objects should live.
*/

:setvar FormsDatabase "Forms"

IF SCHEMA_ID(N'rpt') IS NULL
BEGIN
    EXEC(N'CREATE SCHEMA rpt AUTHORIZATION dbo;');
END;
GO

CREATE OR ALTER VIEW rpt.vw_FormsDesignInventory
AS
SELECT
    bp.bp_id,
    bp.name AS process_name,
    bp.friendly_name AS process_friendly_name,
    p.process_id,
    p.process_name AS process_version_name,
    f.form_id,
    f.name AS form_name,
    f.title AS form_title,
    f.friendly_name AS form_friendly_name,
    f.is_public,
    f.form_type,
    f.date_created AS form_created,
    f.date_updated AS form_updated,
    fld.field_id,
    fld.attribute_id,
    fld.position AS field_position,
    fld.label AS field_label,
    fld.custom_field_name,
    fld.type AS field_type,
    fld.is_required,
    ds.attribute_name AS variable_name,
    ds.attribute_type AS variable_type,
    ds.x_path,
    ds.member_path,
    SYSUTCDATETIME() AS reporting_read_utc
FROM [$(FormsDatabase)].dbo.cf_forms AS f
LEFT JOIN [$(FormsDatabase)].dbo.cf_form_process_mapping AS fpm
    ON f.form_id = fpm.form_id
LEFT JOIN [$(FormsDatabase)].dbo.cf_bp_processes AS p
    ON fpm.process_id = p.process_id
LEFT JOIN [$(FormsDatabase)].dbo.cf_business_processes AS bp
    ON p.bp_id = bp.bp_id
LEFT JOIN [$(FormsDatabase)].dbo.cf_fields AS fld
    ON f.form_id = fld.form_id
LEFT JOIN [$(FormsDatabase)].dbo.cf_bp_dataset AS ds
    ON fld.attribute_id = ds.attribute_id
    AND p.process_id = ds.process_id;
GO

CREATE OR ALTER VIEW rpt.vw_FormsExternalLookupSources
AS
SELECT
    db.database_id,
    db.database_display_name,
    db.database_type,
    db.sql_server,
    db.sql_database,
    db.authentication,
    db.driver,
    db.register_time,
    tbl.datasource_id AS table_datasource_id,
    tbl.table_schema,
    tbl.table_name,
    sp.datasource_id AS procedure_datasource_id,
    sp.stored_procedure_name,
    SYSUTCDATETIME() AS reporting_read_utc
FROM [$(FormsDatabase)].dbo.cf_external_databases AS db
LEFT JOIN [$(FormsDatabase)].dbo.cf_external_dbtables AS tbl
    ON db.database_id = tbl.database_id
LEFT JOIN [$(FormsDatabase)].dbo.cf_external_stored_procedures AS sp
    ON db.database_id = sp.database_id;
GO

CREATE OR ALTER VIEW rpt.vw_FormsFieldLookupMappings
AS
SELECT
    m.mapping_id,
    m.lookup_rule_id,
    m.form_id,
    f.name AS form_name,
    f.title AS form_title,
    m.field_id,
    fld.label AS field_label,
    fld.custom_field_name,
    m.external_datasource_column,
    m.second_external_datasource_column,
    m.position,
    m.is_columntable_expanded,
    SYSUTCDATETIME() AS reporting_read_utc
FROM [$(FormsDatabase)].dbo.cf_field_column_mapping AS m
LEFT JOIN [$(FormsDatabase)].dbo.cf_forms AS f
    ON m.form_id = f.form_id
LEFT JOIN [$(FormsDatabase)].dbo.cf_fields AS fld
    ON m.form_id = fld.form_id
    AND m.field_id = fld.field_id;
GO

CREATE OR ALTER PROCEDURE rpt.usp_FormsDesignInventory
    @ProcessNameContains nvarchar(255) = NULL,
    @FormNameContains nvarchar(255) = NULL,
    @FieldNameContains nvarchar(255) = NULL,
    @Top int = 1000
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @EffectiveTop int = CASE WHEN @Top BETWEEN 1 AND 10000 THEN @Top ELSE 1000 END;

    SELECT TOP (@EffectiveTop)
        bp_id,
        process_name,
        process_friendly_name,
        process_id,
        process_version_name,
        form_id,
        form_name,
        form_title,
        field_id,
        attribute_id,
        field_label,
        custom_field_name,
        field_type,
        variable_name,
        variable_type,
        x_path,
        member_path
    FROM rpt.vw_FormsDesignInventory
    WHERE
        (@ProcessNameContains IS NULL OR process_name LIKE N'%' + @ProcessNameContains + N'%' OR process_friendly_name LIKE N'%' + @ProcessNameContains + N'%')
        AND (@FormNameContains IS NULL OR form_name LIKE N'%' + @FormNameContains + N'%' OR form_title LIKE N'%' + @FormNameContains + N'%')
        AND (@FieldNameContains IS NULL OR field_label LIKE N'%' + @FieldNameContains + N'%' OR custom_field_name LIKE N'%' + @FieldNameContains + N'%' OR variable_name LIKE N'%' + @FieldNameContains + N'%')
    ORDER BY process_name, form_name, field_position, field_id;
END;
GO
