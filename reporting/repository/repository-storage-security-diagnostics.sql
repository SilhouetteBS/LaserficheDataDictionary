/*
Repository storage, recycle bin, and security diagnostics reporting pattern.

Target: reporting database, not the Repository product database.
Product schema evidence: Repository 12.0.3.423 AI export.

Usage:
  1. Open in SQL Server Management Studio with SQLCMD Mode enabled.
  2. Set RepositoryDatabase to the repository product database name.
  3. Execute from the reporting database where rpt objects should live.
*/

:setvar RepositoryDatabase "Repository"

IF SCHEMA_ID(N'rpt') IS NULL
BEGIN
    EXEC(N'CREATE SCHEMA rpt AUTHORIZATION dbo;');
END;
GO

CREATE OR ALTER VIEW rpt.vw_RepositoryRecycleBinInventory
AS
SELECT
    rb.tocid,
    rb.orig_parent,
    rb.orig_name,
    rb.deleted,
    rb.deleter,
    t.etype,
    t.vol_id,
    v.vol_name,
    t.pagecount,
    t.textcount,
    t.edoc_size,
    SYSUTCDATETIME() AS reporting_read_utc
FROM [$(RepositoryDatabase)].dbo.recycle_bin AS rb
LEFT JOIN [$(RepositoryDatabase)].dbo.toc AS t
    ON rb.tocid = t.tocid
LEFT JOIN [$(RepositoryDatabase)].dbo.vol AS v
    ON t.vol_id = v.vol_id;
GO

CREATE OR ALTER VIEW rpt.vw_RepositorySecurityIdentityInventory
AS
SELECT
    ac.account_sid,
    ac.account_name,
    ac.friendly_name,
    ac.organization,
    ac.isuser AS account_is_user,
    tr.trustee_id,
    tr.trustee_name,
    tr.isuser AS trustee_is_user,
    tr.trustee_flags,
    tr.last_active,
    tr.bad_logins,
    tg.trustee_id AS trusted_group_trustee_id,
    tl.userid AS trusted_login_userid,
    SYSUTCDATETIME() AS reporting_read_utc
FROM [$(RepositoryDatabase)].dbo.account_cache AS ac
LEFT JOIN [$(RepositoryDatabase)].dbo.trustee AS tr
    ON ac.account_sid = tr.sid
LEFT JOIN [$(RepositoryDatabase)].dbo.trusted_group AS tg
    ON ac.account_sid = tg.sid
LEFT JOIN [$(RepositoryDatabase)].dbo.trusted_login AS tl
    ON ac.account_sid = tl.sid;
GO

CREATE OR ALTER VIEW rpt.vw_RepositoryVolumeStorage
AS
SELECT
    v.vol_id,
    v.vol_name,
    v.fixpath,
    v.rempath,
    v.maxsize,
    v.cursize,
    v.curdisksize,
    v.vol_created,
    COUNT_BIG(t.tocid) AS entry_count,
    SUM(CONVERT(bigint, ISNULL(t.edoc_size, 0))) AS electronic_document_bytes,
    SUM(CONVERT(bigint, ISNULL(t.pagecount, 0))) AS page_count,
    SYSUTCDATETIME() AS reporting_read_utc
FROM [$(RepositoryDatabase)].dbo.vol AS v
LEFT JOIN [$(RepositoryDatabase)].dbo.toc AS t
    ON v.vol_id = t.vol_id
GROUP BY
    v.vol_id,
    v.vol_name,
    v.fixpath,
    v.rempath,
    v.maxsize,
    v.cursize,
    v.curdisksize,
    v.vol_created;
GO

CREATE OR ALTER PROCEDURE rpt.usp_RepositoryStorageSecurityDiagnostics
    @VolumeNameContains nvarchar(255) = NULL,
    @AccountNameContains nvarchar(255) = NULL,
    @Top int = 500
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @EffectiveTop int = CASE WHEN @Top BETWEEN 1 AND 10000 THEN @Top ELSE 500 END;

    SELECT TOP (@EffectiveTop)
        vol_id,
        vol_name,
        maxsize,
        cursize,
        curdisksize,
        entry_count,
        electronic_document_bytes,
        page_count
    FROM rpt.vw_RepositoryVolumeStorage
    WHERE @VolumeNameContains IS NULL OR vol_name LIKE N'%' + @VolumeNameContains + N'%'
    ORDER BY electronic_document_bytes DESC, entry_count DESC;

    SELECT TOP (@EffectiveTop)
        account_sid,
        account_name,
        friendly_name,
        organization,
        account_is_user,
        trustee_id,
        trustee_name,
        last_active,
        bad_logins
    FROM rpt.vw_RepositorySecurityIdentityInventory
    WHERE @AccountNameContains IS NULL OR account_name LIKE N'%' + @AccountNameContains + N'%' OR friendly_name LIKE N'%' + @AccountNameContains + N'%'
    ORDER BY account_name, friendly_name;
END;
GO
