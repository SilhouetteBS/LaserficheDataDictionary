/*
Workflow wait and completion diagnostics reporting pattern.

Target: reporting database, not the Workflow product database.
Product schema evidence: Workflow 12.0.2605.385 AI export.

Usage:
  1. Open in SQL Server Management Studio with SQLCMD Mode enabled.
  2. Set WorkflowDatabase to the Workflow product database name.
  3. Execute from the reporting database where rpt objects should live.
*/

:setvar WorkflowDatabase "Workflow"

IF SCHEMA_ID(N'rpt') IS NULL
BEGIN
    EXEC(N'CREATE SCHEMA rpt AUTHORIZATION dbo;');
END;
GO

CREATE OR ALTER VIEW rpt.vw_WorkflowWaitConditions
AS
SELECT
    condition_id,
    instance_id,
    workflow_id,
    queue,
    primary_entry,
    condition_type,
    activity_name,
    time AS wait_time,
    DATALENGTH(condition) AS condition_bytes,
    SYSUTCDATETIME() AS reporting_read_utc
FROM [$(WorkflowDatabase)].dbo.wait_condition;
GO

CREATE OR ALTER VIEW rpt.vw_WorkflowCompletionRetryState
AS
SELECT
    instance_completion_id,
    instance_id,
    workflow_id,
    status,
    completion_status,
    completion_time,
    last_try_time,
    last_try_status,
    next_try_time,
    DATALENGTH(state) AS state_bytes,
    SYSUTCDATETIME() AS reporting_read_utc
FROM [$(WorkflowDatabase)].dbo.instance_completion;
GO

CREATE OR ALTER PROCEDURE rpt.usp_WorkflowWaitCompletionDiagnostics
    @FromDate datetime = NULL,
    @OnlyPendingRetries bit = 0,
    @Top int = 500
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @EffectiveTop int = CASE WHEN @Top BETWEEN 1 AND 10000 THEN @Top ELSE 500 END;

    SELECT TOP (@EffectiveTop)
        N'completion' AS diagnostic_type,
        instance_id,
        workflow_id,
        CAST(NULL AS nvarchar(255)) AS activity_name,
        status,
        completion_status,
        completion_time AS event_time,
        last_try_time,
        last_try_status,
        next_try_time,
        state_bytes AS payload_bytes
    FROM rpt.vw_WorkflowCompletionRetryState
    WHERE
        (@FromDate IS NULL OR COALESCE(completion_time, last_try_time, next_try_time) >= @FromDate)
        AND (@OnlyPendingRetries = 0 OR next_try_time IS NOT NULL)

    UNION ALL

    SELECT TOP (@EffectiveTop)
        N'wait_condition' AS diagnostic_type,
        instance_id,
        workflow_id,
        activity_name,
        condition_type AS status,
        CAST(NULL AS int) AS completion_status,
        wait_time AS event_time,
        CAST(NULL AS datetime) AS last_try_time,
        CAST(NULL AS int) AS last_try_status,
        CAST(NULL AS datetime) AS next_try_time,
        condition_bytes AS payload_bytes
    FROM rpt.vw_WorkflowWaitConditions
    WHERE
        (@FromDate IS NULL OR wait_time >= @FromDate)
        AND (@OnlyPendingRetries = 0)
    ORDER BY event_time DESC, diagnostic_type;
END;
GO
