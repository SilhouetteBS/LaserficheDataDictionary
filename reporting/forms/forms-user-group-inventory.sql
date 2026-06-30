/*
Forms user and group inventory reporting pattern.

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

CREATE OR ALTER VIEW rpt.vw_FormsUsersAndGroups
AS
SELECT
    u.user_id,
    u.username,
    u.displayname,
    u.email,
    u.user_type,
    CASE u.user_type
        WHEN 0 THEN N'Repository user'
        WHEN 1 THEN N'Named user'
        WHEN 2 THEN N'Unknown'
        WHEN 3 THEN N'Participant'
        WHEN 4 THEN N'Participant'
        ELSE N'Unmapped'
    END AS user_type_name,
    u.sid,
    u.lfds_sid,
    u.is_lfadmin,
    u.is_activated AS user_is_activated,
    u.last_login_time,
    g.group_id,
    g.full_group_name,
    g.friendly_name AS group_friendly_name,
    g.group_type,
    g.sid AS group_sid,
    g.is_activated AS group_is_activated,
    SYSUTCDATETIME() AS reporting_read_utc
FROM [$(FormsDatabase)].dbo.cf_users AS u
LEFT JOIN [$(FormsDatabase)].dbo.cf_usergroups_users_mapping AS ug
    ON u.user_id = ug.user_id
LEFT JOIN [$(FormsDatabase)].dbo.cf_usergroups AS g
    ON ug.group_id = g.group_id;
GO

CREATE OR ALTER PROCEDURE rpt.usp_FormsUsersAndGroups
    @NameContains nvarchar(255) = NULL,
    @OnlyActive bit = 1,
    @OnlyAdmins bit = 0,
    @Top int = 500
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @EffectiveTop int = CASE WHEN @Top BETWEEN 1 AND 10000 THEN @Top ELSE 500 END;

    SELECT TOP (@EffectiveTop)
        user_id,
        username,
        displayname,
        email,
        user_type,
        user_type_name,
        is_lfadmin,
        user_is_activated,
        last_login_time,
        group_id,
        full_group_name,
        group_friendly_name,
        group_type,
        group_is_activated
    FROM rpt.vw_FormsUsersAndGroups
    WHERE
        (@NameContains IS NULL
            OR username LIKE N'%' + @NameContains + N'%'
            OR displayname LIKE N'%' + @NameContains + N'%'
            OR email LIKE N'%' + @NameContains + N'%'
            OR full_group_name LIKE N'%' + @NameContains + N'%')
        AND (@OnlyActive = 0 OR ISNULL(user_is_activated, 0) = 1)
        AND (@OnlyAdmins = 0 OR ISNULL(is_lfadmin, 0) = 1)
    ORDER BY displayname, username, full_group_name;
END;
GO
