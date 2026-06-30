/*
Forms submission volume summary reporting pattern.

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

CREATE OR ALTER VIEW rpt.vw_FormsSubmissionVolume
AS
SELECT
    bp.bp_id,
    bp.name AS process_name,
    bp.friendly_name AS process_friendly_name,
    bp.is_activated,
    bp.is_deleted,
    bp.is_archived,
    m.bp_instance_id,
    m.ref_bp_instance_id,
    m.title AS instance_title,
    m.start_date AS instance_start_date,
    m.end_date AS instance_end_date,
    m.status AS instance_status,
    CASE m.status
        WHEN 1 THEN N'Running'
        WHEN 2 THEN N'Complete'
        WHEN 3 THEN N'Canceled'
        WHEN 4 THEN N'TerminatedByError'
        WHEN 5 THEN N'TerminatedByEndEvent'
        WHEN 99 THEN N'Archived'
        ELSE N'Unknown'
    END AS instance_status_name,
    s.submission_id,
    s.date_created AS submission_date_created,
    s.action AS submission_action,
    s.status AS submission_status,
    s.priority AS submission_priority,
    s.is_test_mode,
    SYSUTCDATETIME() AS reporting_read_utc
FROM [$(FormsDatabase)].dbo.cf_bp_main_instances AS m
LEFT JOIN [$(FormsDatabase)].dbo.cf_bp_processes AS p
    ON m.process_id = p.process_id
LEFT JOIN [$(FormsDatabase)].dbo.cf_business_processes AS bp
    ON p.bp_id = bp.bp_id
LEFT JOIN [$(FormsDatabase)].dbo.cf_submissions AS s
    ON m.bp_instance_id = s.bp_instance_id;
GO

CREATE OR ALTER PROCEDURE rpt.usp_FormsSubmissionCounts
    @FromDate datetime = NULL,
    @ToDate datetime = NULL,
    @IncludeTestMode bit = 0,
    @Top int = 25
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @EffectiveTop int = CASE WHEN @Top BETWEEN 1 AND 1000 THEN @Top ELSE 25 END;

    SELECT TOP (@EffectiveTop)
        process_name,
        process_friendly_name,
        instance_status,
        instance_status_name,
        COUNT_BIG(DISTINCT bp_instance_id) AS instance_count,
        COUNT_BIG(submission_id) AS submission_count,
        MIN(submission_date_created) AS first_submission_date,
        MAX(submission_date_created) AS last_submission_date
    FROM rpt.vw_FormsSubmissionVolume
    WHERE
        (@FromDate IS NULL OR submission_date_created >= @FromDate OR instance_start_date >= @FromDate)
        AND (@ToDate IS NULL OR submission_date_created < @ToDate OR instance_start_date < @ToDate)
        AND (@IncludeTestMode = 1 OR ISNULL(is_test_mode, 0) = 0)
    GROUP BY
        process_name,
        process_friendly_name,
        instance_status,
        instance_status_name
    ORDER BY submission_count DESC, instance_count DESC, process_name;
END;
GO
