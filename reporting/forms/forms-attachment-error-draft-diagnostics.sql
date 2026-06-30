/*
Forms attachment, error, and draft diagnostics reporting pattern.

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

CREATE OR ALTER VIEW rpt.vw_FormsAttachmentInventory
AS
SELECT
    a.attachment_id,
    a.file_name,
    a.extension,
    a.length AS attachment_bytes,
    a.uploaded_time,
    a.deleted_on,
    a.is_deleted,
    a.lfentry_id,
    a.volume_id,
    a.storage_type,
    map.bp_data_id,
    d.submission_id,
    d.attribute_id,
    f.label AS field_label,
    f.custom_field_name,
    SYSUTCDATETIME() AS reporting_read_utc
FROM [$(FormsDatabase)].dbo.cf_bp_attachment_data AS a
LEFT JOIN [$(FormsDatabase)].dbo.cf_bp_data_attachment_mapping AS map
    ON a.attachment_id = map.attachment_id
LEFT JOIN [$(FormsDatabase)].dbo.cf_bp_data AS d
    ON map.bp_data_id = d.bp_data_id
LEFT JOIN [$(FormsDatabase)].dbo.cf_fields AS f
    ON d.attribute_id = f.attribute_id;
GO

CREATE OR ALTER VIEW rpt.vw_FormsInstanceErrors
AS
SELECT
    e.id AS error_id,
    e.error_code,
    e.date AS error_date,
    e.message,
    e.bp_instance_id,
    e.bp_id,
    bp.name AS process_name,
    bp.friendly_name AS process_friendly_name,
    m.title AS instance_title,
    m.status AS instance_status,
    SYSUTCDATETIME() AS reporting_read_utc
FROM [$(FormsDatabase)].dbo.bp_instance_errors AS e
LEFT JOIN [$(FormsDatabase)].dbo.cf_business_processes AS bp
    ON e.bp_id = bp.bp_id
LEFT JOIN [$(FormsDatabase)].dbo.cf_bp_main_instances AS m
    ON e.bp_instance_id = m.bp_instance_id;
GO

CREATE OR ALTER VIEW rpt.vw_FormsDraftSubmissions
AS
SELECT
    fs.submission_id,
    fs.process_id,
    bp.bp_id,
    bp.name AS process_name,
    fs.step_id,
    fs.form_id,
    f.name AS form_name,
    f.title AS form_title,
    fs.draft_email,
    fs.draft_name,
    fs.draft_contains,
    fs.code_expiration,
    SYSUTCDATETIME() AS reporting_read_utc
FROM [$(FormsDatabase)].dbo.cf_form_submissions AS fs
LEFT JOIN [$(FormsDatabase)].dbo.cf_bp_processes AS p
    ON fs.process_id = p.process_id
LEFT JOIN [$(FormsDatabase)].dbo.cf_business_processes AS bp
    ON p.bp_id = bp.bp_id
LEFT JOIN [$(FormsDatabase)].dbo.cf_forms AS f
    ON fs.form_id = f.form_id;
GO

CREATE OR ALTER PROCEDURE rpt.usp_FormsAttachmentErrorDiagnostics
    @FromDate datetime = NULL,
    @OnlyDeletedAttachments bit = 0,
    @Top int = 500
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @EffectiveTop int = CASE WHEN @Top BETWEEN 1 AND 10000 THEN @Top ELSE 500 END;

    SELECT TOP (@EffectiveTop)
        N'attachment' AS diagnostic_type,
        attachment_id AS object_id,
        file_name AS object_name,
        extension,
        attachment_bytes,
        uploaded_time AS event_date,
        is_deleted,
        field_label,
        custom_field_name
    FROM rpt.vw_FormsAttachmentInventory
    WHERE
        (@FromDate IS NULL OR uploaded_time >= @FromDate)
        AND (@OnlyDeletedAttachments = 0 OR ISNULL(is_deleted, 0) = 1)
    ORDER BY event_date DESC, object_id DESC;
END;
GO
