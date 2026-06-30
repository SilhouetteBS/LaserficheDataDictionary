/*
Forms session diagnostics reporting pattern.

Target: reporting database, not the Forms product database.
Product schema evidence: Forms 12.0.2603.30215 AI export.

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

CREATE OR ALTER VIEW rpt.vw_FormsSessionDiagnostics
AS
SELECT
    s.id AS session_id,
    s.tenant_id,
    s.user_id,
    u.username,
    u.displayname,
    u.email,
    s.ip_address,
    s.machine,
    s.last_active,
    s.session_type,
    s.group_sid,
    COUNT_BIG(v.id) AS session_variable_count,
    SYSUTCDATETIME() AS reporting_read_utc
FROM [$(FormsDatabase)].dbo.cf_sessions AS s
LEFT JOIN [$(FormsDatabase)].dbo.cf_users AS u
    ON s.user_id = u.user_id
LEFT JOIN [$(FormsDatabase)].dbo.cf_session_variables AS v
    ON s.id = v.sess_id
GROUP BY
    s.id,
    s.tenant_id,
    s.user_id,
    u.username,
    u.displayname,
    u.email,
    s.ip_address,
    s.machine,
    s.last_active,
    s.session_type,
    s.group_sid;
GO

CREATE OR ALTER VIEW rpt.vw_FormsSessionVariables
AS
SELECT
    s.id AS session_id,
    s.user_id,
    u.username,
    s.last_active,
    v.id AS session_variable_id,
    v.variable_name,
    DATALENGTH(v.variable_value) AS variable_value_bytes,
    SYSUTCDATETIME() AS reporting_read_utc
FROM [$(FormsDatabase)].dbo.cf_session_variables AS v
LEFT JOIN [$(FormsDatabase)].dbo.cf_sessions AS s
    ON v.sess_id = s.id
LEFT JOIN [$(FormsDatabase)].dbo.cf_users AS u
    ON s.user_id = u.user_id;
GO

CREATE OR ALTER PROCEDURE rpt.usp_FormsSessionDiagnostics
    @LastActiveSince datetime = NULL,
    @UserNameContains nvarchar(255) = NULL,
    @OnlyWithVariables bit = 0,
    @Top int = 500
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @EffectiveTop int = CASE WHEN @Top BETWEEN 1 AND 10000 THEN @Top ELSE 500 END;

    SELECT TOP (@EffectiveTop)
        session_id,
        tenant_id,
        user_id,
        username,
        displayname,
        email,
        ip_address,
        machine,
        last_active,
        session_type,
        session_variable_count
    FROM rpt.vw_FormsSessionDiagnostics
    WHERE
        (@LastActiveSince IS NULL OR last_active >= @LastActiveSince)
        AND (@UserNameContains IS NULL
            OR username LIKE N'%' + @UserNameContains + N'%'
            OR displayname LIKE N'%' + @UserNameContains + N'%'
            OR email LIKE N'%' + @UserNameContains + N'%')
        AND (@OnlyWithVariables = 0 OR session_variable_count > 0)
    ORDER BY last_active DESC, session_id DESC;
END;
GO
