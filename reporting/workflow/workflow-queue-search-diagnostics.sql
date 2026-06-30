/*
Workflow queue and search diagnostics reporting pattern.

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

CREATE OR ALTER VIEW rpt.vw_WorkflowTaskQueue
AS
SELECT
    q.task_id,
    q.task_type_id,
    q.status,
    q.status_time,
    q.next_try,
    q.retry_count,
    d.start_time,
    d.owner_id,
    d.instance_id,
    d.activity_name,
    d.queue_name,
    DATALENGTH(d.task_data) AS task_data_bytes,
    DATALENGTH(d.task_result) AS task_result_bytes,
    SYSUTCDATETIME() AS reporting_read_utc
FROM [$(WorkflowDatabase)].dbo.workflow_task_queue AS q
LEFT JOIN [$(WorkflowDatabase)].dbo.workflow_task_queue_data AS d
    ON q.task_id = d.task_id;
GO

CREATE OR ALTER VIEW rpt.vw_WorkflowSearchActivity
AS
SELECT
    N'current' AS source_table,
    si.search_id,
    si.instance_id,
    si.parent_instance_id,
    si.version,
    si.workflow_rule,
    si.workflow_user,
    si.workflow_id,
    se.repository_id,
    se.activity_name,
    se.entry_id,
    se.entry_name,
    se.entry_path,
    se.is_starting_entry,
    SYSUTCDATETIME() AS reporting_read_utc
FROM [$(WorkflowDatabase)].dbo.search_instance AS si
LEFT JOIN [$(WorkflowDatabase)].dbo.search_entry AS se
    ON si.search_id = se.search_id
UNION ALL
SELECT
    N'log' AS source_table,
    sil.search_id,
    sil.instance_id,
    sil.parent_instance_id,
    sil.version,
    sil.workflow_rule,
    sil.workflow_user,
    sil.workflow_id,
    sel.repository_id,
    sel.activity_name,
    sel.entry_id,
    sel.entry_name,
    sel.entry_path,
    sel.is_starting_entry,
    SYSUTCDATETIME() AS reporting_read_utc
FROM [$(WorkflowDatabase)].dbo.search_instance_log AS sil
LEFT JOIN [$(WorkflowDatabase)].dbo.search_entry_log AS sel
    ON sil.search_id = sel.search_id;
GO

CREATE OR ALTER VIEW rpt.vw_WorkflowInstanceCompletion
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

CREATE OR ALTER PROCEDURE rpt.usp_WorkflowQueueDiagnostics
    @FromDate datetime = NULL,
    @QueueName nvarchar(255) = NULL,
    @OnlyWithRetries bit = 0,
    @Top int = 500
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @EffectiveTop int = CASE WHEN @Top BETWEEN 1 AND 10000 THEN @Top ELSE 500 END;

    SELECT TOP (@EffectiveTop)
        task_id,
        task_type_id,
        status,
        status_time,
        next_try,
        retry_count,
        start_time,
        owner_id,
        instance_id,
        activity_name,
        queue_name,
        task_data_bytes,
        task_result_bytes
    FROM rpt.vw_WorkflowTaskQueue
    WHERE
        (@FromDate IS NULL OR COALESCE(status_time, start_time, next_try) >= @FromDate)
        AND (@QueueName IS NULL OR queue_name = @QueueName)
        AND (@OnlyWithRetries = 0 OR ISNULL(retry_count, 0) > 0)
    ORDER BY COALESCE(status_time, start_time, next_try) DESC, task_id DESC;
END;
GO
