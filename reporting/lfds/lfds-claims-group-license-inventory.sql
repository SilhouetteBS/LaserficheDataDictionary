/*
LFDS claims, group, and license inventory reporting pattern.

Target: reporting database, not the LFDS product database.
Product schema evidence: LFDS 12.0.2603.369 AI export.

Usage:
  1. Open in SQL Server Management Studio with SQLCMD Mode enabled.
  2. Set LfdsDatabase to the LFDS product database name.
  3. Execute from the reporting database where rpt objects should live.
*/

:setvar LfdsDatabase "LFDS"

IF SCHEMA_ID(N'rpt') IS NULL
BEGIN
    EXEC(N'CREATE SCHEMA rpt AUTHORIZATION dbo;');
END;
GO

CREATE OR ALTER VIEW rpt.vw_LfdsClaimsGroupsLicenses
AS
SELECT
    o.id AS directory_object_id,
    o.sid,
    o.name,
    o.type AS object_type,
    o.flags,
    p.name AS identity_provider_name,
    p.type AS identity_provider_type,
    ac.claim_id,
    ac.str_val AS claim_value,
    ac.ordinal AS claim_ordinal,
    ul.type AS license_type,
    l.last_login,
    l.target_app AS last_login_target_app,
    gm.group_sid,
    g.name AS group_name,
    SYSUTCDATETIME() AS reporting_read_utc
FROM [$(LfdsDatabase)].dbo.directory_objects AS o
LEFT JOIN [$(LfdsDatabase)].dbo.identity_providers AS p
    ON o.provider_id = p.id
LEFT JOIN [$(LfdsDatabase)].dbo.additional_claims AS ac
    ON o.sid = ac.sid
LEFT JOIN [$(LfdsDatabase)].dbo.user_licenses AS ul
    ON o.sid = ul.sid
LEFT JOIN [$(LfdsDatabase)].dbo.user_logins AS l
    ON o.sid = l.sid
LEFT JOIN [$(LfdsDatabase)].dbo.group_membership AS gm
    ON o.sid = gm.member_sid
LEFT JOIN [$(LfdsDatabase)].dbo.directory_objects AS g
    ON gm.group_sid = g.sid;
GO

CREATE OR ALTER PROCEDURE rpt.usp_LfdsClaimsGroupsLicenses
    @NameContains nvarchar(255) = NULL,
    @GroupNameContains nvarchar(255) = NULL,
    @OnlyLicensed bit = 0,
    @Top int = 1000
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @EffectiveTop int = CASE WHEN @Top BETWEEN 1 AND 10000 THEN @Top ELSE 1000 END;

    SELECT TOP (@EffectiveTop)
        directory_object_id,
        sid,
        name,
        object_type,
        identity_provider_name,
        claim_id,
        claim_value,
        license_type,
        last_login,
        last_login_target_app,
        group_sid,
        group_name
    FROM rpt.vw_LfdsClaimsGroupsLicenses
    WHERE
        (@NameContains IS NULL OR name LIKE N'%' + @NameContains + N'%')
        AND (@GroupNameContains IS NULL OR group_name LIKE N'%' + @GroupNameContains + N'%')
        AND (@OnlyLicensed = 0 OR license_type IS NOT NULL)
    ORDER BY name, group_name, claim_id;
END;
GO
