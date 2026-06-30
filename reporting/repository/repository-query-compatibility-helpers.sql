/*
Repository query compatibility helper pattern.

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

CREATE OR ALTER VIEW rpt.vw_RepositorySchemaVersion
AS
SELECT
    optionname,
    optionvalue,
    SYSUTCDATETIME() AS reporting_read_utc
FROM [$(RepositoryDatabase)].dbo.dboptions
WHERE optionname = N'version';
GO

CREATE OR ALTER VIEW rpt.vw_RepositoryEntryCreatorHex
AS
SELECT TOP (1000)
    t.tocid,
    t.name AS entry_name,
    t.etype,
    CONVERT(varchar(max), t.creator, 1) AS creator_hex,
    t.created,
    t.modified,
    SYSUTCDATETIME() AS reporting_read_utc
FROM [$(RepositoryDatabase)].dbo.toc AS t
WHERE t.creator IS NOT NULL
ORDER BY t.modified DESC, t.tocid DESC;
GO

CREATE OR ALTER PROCEDURE rpt.usp_RepositoryFolderNamePattern
    @NamePattern nvarchar(255),
    @Top int = 500
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @EffectiveTop int = CASE WHEN @Top BETWEEN 1 AND 10000 THEN @Top ELSE 500 END;

    SELECT TOP (@EffectiveTop)
        t.tocid,
        t.parentid,
        t.name,
        t.etype,
        t.created,
        t.modified
    FROM [$(RepositoryDatabase)].dbo.toc AS t
    WHERE t.del_tocid = 0
      AND t.etype = 0
      AND t.name LIKE @NamePattern
    ORDER BY t.modified DESC, t.tocid DESC;
END;
GO

/*
Workflow token note:
  If a LIKE pattern contains percent signs followed by parentheses, Workflow may
  interpret it as token syntax. Parameterize the pattern instead of embedding it
  directly in Workflow activity text.
*/
