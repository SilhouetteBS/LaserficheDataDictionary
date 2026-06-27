/*
Forms active task / Monitor-style reporting pattern.

Target: reporting database, not the Forms product database.
Product schema evidence: Forms 12.0.2509.20409 AI export.

Usage:
  1. Open in SQL Server Management Studio with SQLCMD Mode enabled.
  2. Set FormsDatabase to the Forms product database name.
  3. Execute from the reporting database where rpt objects should live.

Notes:
  - The view reads Forms product tables only.
  - The optional snapshot table is stored in the reporting database and can be indexed.
  - Do not add indexes, views, stored procedures, or other objects to the Forms product database.
*/

:setvar FormsDatabase "Forms"

IF SCHEMA_ID(N'rpt') IS NULL
BEGIN
    EXEC(N'CREATE SCHEMA rpt AUTHORIZATION dbo;');
END;
GO

CREATE OR ALTER VIEW rpt.vw_FormsActiveTasks
AS
SELECT
    m.bp_instance_id,
    m.ref_bp_instance_id,
    m.process_id AS instance_process_id,
    bp.bp_id,
    bp.name AS process_name,
    p.process_name AS process_version_name,
    m.bp_name AS instance_process_name,
    m.title AS instance_title,
    m.start_date AS instance_start_date,
    m.lastacted_date,
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
    w.instance_id AS worker_instance_id,
    w.instance_type,
    w.ref_instance_id,
    w.current_process_id,
    w.current_step_id,
    w.status AS worker_status,
    CASE w.status
        WHEN 1 THEN N'Ready'
        WHEN 2 THEN N'WaitForTrigger'
        WHEN 3 THEN N'Running'
        WHEN 4 THEN N'StepExecuted'
        WHEN 5 THEN N'Sleep'
        WHEN 6 THEN N'Split'
        WHEN 7 THEN N'Merged'
        WHEN 8 THEN N'Complete'
        WHEN 9 THEN N'Terminate'
        WHEN 10 THEN N'Interrupted'
        WHEN 11 THEN N'SuspendedDueToError'
        WHEN 12 THEN N'Free'
        WHEN 13 THEN N'SuspendedDueToTaskError'
        ELSE N'Unknown'
    END AS worker_status_name,
    w.update_date AS worker_update_date,
    r.resume_id,
    r.step_id AS resume_step_id,
    COALESCE(r.step_name, s.name) AS task_name,
    s.step_type,
    r.form_id,
    r.form_name,
    r.resume_count,
    r.status AS resume_status,
    CASE r.status
        WHEN 1 THEN N'New'
        WHEN 2 THEN N'Locked'
        WHEN 3 THEN N'Canceled'
        WHEN 4 THEN N'Deleted'
        WHEN 5 THEN N'Ready'
        WHEN 6 THEN N'Suspended'
        ELSE N'Unknown'
    END AS resume_status_name,
    r.date_created AS task_created_date,
    r.assign_date,
    r.due_date,
    r.current_priority,
    r.owner_snapshot_id,
    owner.username AS owner_username,
    owner.displayname AS owner_display_name,
    owner.email AS owner_email,
    a.approver_id,
    a.is_group AS approver_is_group,
    a.user_snapshot_id AS approver_user_snapshot_id,
    approver.username AS approver_username,
    approver.displayname AS approver_display_name,
    approver.email AS approver_email,
    COALESCE(a.team_id, r.team_id) AS team_id,
    team.name AS team_name,
    CASE
        WHEN a.user_snapshot_id IS NOT NULL THEN N'User'
        WHEN COALESCE(a.team_id, r.team_id) IS NOT NULL THEN N'Team'
        WHEN r.owner_snapshot_id IS NOT NULL THEN N'Owner'
        ELSE N'Unassigned'
    END AS assignment_type,
    SYSUTCDATETIME() AS reporting_read_utc
FROM [$(FormsDatabase)].dbo.cf_bp_worker_instnc_to_resume AS r
JOIN [$(FormsDatabase)].dbo.cf_bp_worker_instances AS w
    ON r.worker_instance_id = w.instance_id
JOIN [$(FormsDatabase)].dbo.cf_bp_main_instances AS m
    ON w.bp_instance_id = m.bp_instance_id
LEFT JOIN [$(FormsDatabase)].dbo.cf_bp_steps AS s
    ON w.current_process_id = s.process_id
    AND w.current_step_id = s.step_id
LEFT JOIN [$(FormsDatabase)].dbo.cf_bp_processes AS p
    ON m.process_id = p.process_id
LEFT JOIN [$(FormsDatabase)].dbo.cf_business_processes AS bp
    ON p.bp_id = bp.bp_id
LEFT JOIN [$(FormsDatabase)].dbo.cf_bp_instance_approvers AS a
    ON r.resume_id = a.resume_id
LEFT JOIN [$(FormsDatabase)].dbo.cf_user_snapshot AS owner
    ON r.owner_snapshot_id = owner.id
LEFT JOIN [$(FormsDatabase)].dbo.cf_user_snapshot AS approver
    ON a.user_snapshot_id = approver.id
LEFT JOIN [$(FormsDatabase)].dbo.teams AS team
    ON COALESCE(a.team_id, r.team_id) = team.id
WHERE
    m.status = 1
    AND r.status IN (1, 2, 5, 6)
    AND w.status <> 8;
GO

IF OBJECT_ID(N'rpt.FormsActiveTasksSnapshot', N'U') IS NULL
BEGIN
    CREATE TABLE rpt.FormsActiveTasksSnapshot
    (
    snapshot_row_id bigint IDENTITY(1,1) NOT NULL,
    bp_instance_id int NOT NULL,
    ref_bp_instance_id int NOT NULL,
    instance_process_id int NOT NULL,
    bp_id int NULL,
    process_name nvarchar(500) NULL,
    process_version_name nvarchar(500) NULL,
    instance_process_name nvarchar(500) NULL,
    instance_title nvarchar(2000) NOT NULL,
    instance_start_date datetime NULL,
    lastacted_date datetime NULL,
    instance_status int NOT NULL,
    instance_status_name nvarchar(50) NOT NULL,
    worker_instance_id int NOT NULL,
    instance_type int NOT NULL,
    ref_instance_id int NULL,
    current_process_id int NOT NULL,
    current_step_id int NOT NULL,
    worker_status int NOT NULL,
    worker_status_name nvarchar(50) NOT NULL,
    worker_update_date datetime NULL,
    resume_id nvarchar(36) NOT NULL,
    resume_step_id int NOT NULL,
    task_name nvarchar(200) NULL,
    step_type varchar(50) NULL,
    form_id int NULL,
    form_name nvarchar(200) NULL,
    resume_count int NOT NULL,
    resume_status tinyint NOT NULL,
    resume_status_name nvarchar(50) NOT NULL,
    task_created_date datetime NULL,
    assign_date datetime NULL,
    due_date datetime NULL,
    current_priority tinyint NOT NULL,
    owner_snapshot_id int NULL,
    owner_username nvarchar(256) NULL,
    owner_display_name nvarchar(500) NULL,
    owner_email nvarchar(500) NULL,
    approver_id int NULL,
    approver_is_group smallint NULL,
    approver_user_snapshot_id int NULL,
    approver_username nvarchar(256) NULL,
    approver_display_name nvarchar(500) NULL,
    approver_email nvarchar(500) NULL,
    team_id int NULL,
    team_name nvarchar(200) NULL,
    assignment_type nvarchar(20) NOT NULL,
    reporting_read_utc datetime2(7) NOT NULL,
    snapshot_refreshed_utc datetime2(7) NOT NULL,
    CONSTRAINT PK_FormsActiveTasksSnapshot PRIMARY KEY CLUSTERED (snapshot_row_id)
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'rpt.FormsActiveTasksSnapshot', N'U')
      AND name = N'IX_FormsActiveTasksSnapshot_Process'
)
BEGIN
    CREATE INDEX IX_FormsActiveTasksSnapshot_Process
    ON rpt.FormsActiveTasksSnapshot (process_name, instance_start_date)
    INCLUDE (bp_instance_id, worker_instance_id, task_name, resume_status_name, assignment_type);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'rpt.FormsActiveTasksSnapshot', N'U')
      AND name = N'IX_FormsActiveTasksSnapshot_Assignee'
)
BEGIN
    CREATE INDEX IX_FormsActiveTasksSnapshot_Assignee
    ON rpt.FormsActiveTasksSnapshot (assignment_type, approver_username, owner_username, team_name)
    INCLUDE (bp_instance_id, process_name, task_name, assign_date, due_date);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'rpt.FormsActiveTasksSnapshot', N'U')
      AND name = N'IX_FormsActiveTasksSnapshot_DueDate'
)
BEGIN
    CREATE INDEX IX_FormsActiveTasksSnapshot_DueDate
    ON rpt.FormsActiveTasksSnapshot (due_date, resume_status)
    INCLUDE (bp_instance_id, process_name, task_name, assignment_type, approver_username, owner_username, team_name);
END;
GO

CREATE OR ALTER PROCEDURE rpt.usp_RefreshFormsActiveTasksSnapshot
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @refreshedUtc datetime2(7) = SYSUTCDATETIME();

    BEGIN TRANSACTION;

    TRUNCATE TABLE rpt.FormsActiveTasksSnapshot;

    INSERT INTO rpt.FormsActiveTasksSnapshot
    (
        bp_instance_id,
        ref_bp_instance_id,
        instance_process_id,
        bp_id,
        process_name,
        process_version_name,
        instance_process_name,
        instance_title,
        instance_start_date,
        lastacted_date,
        instance_status,
        instance_status_name,
        worker_instance_id,
        instance_type,
        ref_instance_id,
        current_process_id,
        current_step_id,
        worker_status,
        worker_status_name,
        worker_update_date,
        resume_id,
        resume_step_id,
        task_name,
        step_type,
        form_id,
        form_name,
        resume_count,
        resume_status,
        resume_status_name,
        task_created_date,
        assign_date,
        due_date,
        current_priority,
        owner_snapshot_id,
        owner_username,
        owner_display_name,
        owner_email,
        approver_id,
        approver_is_group,
        approver_user_snapshot_id,
        approver_username,
        approver_display_name,
        approver_email,
        team_id,
        team_name,
        assignment_type,
        reporting_read_utc,
        snapshot_refreshed_utc
    )
    SELECT
        bp_instance_id,
        ref_bp_instance_id,
        instance_process_id,
        bp_id,
        process_name,
        process_version_name,
        instance_process_name,
        instance_title,
        instance_start_date,
        lastacted_date,
        instance_status,
        instance_status_name,
        worker_instance_id,
        instance_type,
        ref_instance_id,
        current_process_id,
        current_step_id,
        worker_status,
        worker_status_name,
        worker_update_date,
        resume_id,
        resume_step_id,
        task_name,
        step_type,
        form_id,
        form_name,
        resume_count,
        resume_status,
        resume_status_name,
        task_created_date,
        assign_date,
        due_date,
        current_priority,
        owner_snapshot_id,
        owner_username,
        owner_display_name,
        owner_email,
        approver_id,
        approver_is_group,
        approver_user_snapshot_id,
        approver_username,
        approver_display_name,
        approver_email,
        team_id,
        team_name,
        assignment_type,
        reporting_read_utc,
        @refreshedUtc
    FROM rpt.vw_FormsActiveTasks;

    COMMIT TRANSACTION;
END;
GO

CREATE OR ALTER PROCEDURE rpt.usp_GetFormsActiveTasks
    @ProcessName nvarchar(500) = NULL,
    @AssignedUsername nvarchar(256) = NULL,
    @TeamName nvarchar(200) = NULL,
    @DueBefore datetime = NULL,
    @UseSnapshot bit = 1
AS
BEGIN
    SET NOCOUNT ON;

    IF @UseSnapshot = 1
    BEGIN
        SELECT *
        FROM rpt.FormsActiveTasksSnapshot
        WHERE
            (@ProcessName IS NULL OR process_name = @ProcessName)
            AND (@AssignedUsername IS NULL OR approver_username = @AssignedUsername OR owner_username = @AssignedUsername)
            AND (@TeamName IS NULL OR team_name = @TeamName)
            AND (@DueBefore IS NULL OR due_date < @DueBefore)
        ORDER BY due_date, process_name, task_name, bp_instance_id;

        RETURN;
    END;

    SELECT *
    FROM rpt.vw_FormsActiveTasks
    WHERE
        (@ProcessName IS NULL OR process_name = @ProcessName)
        AND (@AssignedUsername IS NULL OR approver_username = @AssignedUsername OR owner_username = @AssignedUsername)
        AND (@TeamName IS NULL OR team_name = @TeamName)
        AND (@DueBefore IS NULL OR due_date < @DueBefore)
    ORDER BY due_date, process_name, task_name, bp_instance_id;
END;
GO
