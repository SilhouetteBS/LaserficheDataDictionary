/*
Forms authenticated participant sign-up reporting pattern.

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

CREATE OR ALTER VIEW rpt.vw_FormsAuthenticatedParticipantSignups
AS
SELECT
    signup_id,
    fullname,
    signup_date,
    invitation_code,
    tenant_id,
    role_id,
    SYSUTCDATETIME() AS reporting_read_utc
FROM [$(FormsDatabase)].dbo.cf_users_sign_up;
GO

CREATE OR ALTER PROCEDURE rpt.usp_FormsAuthenticatedParticipantSignups
    @FromDate datetime = NULL,
    @ToDate datetime = NULL,
    @NameContains nvarchar(255) = NULL,
    @Top int = 500
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @EffectiveTop int = CASE WHEN @Top BETWEEN 1 AND 10000 THEN @Top ELSE 500 END;

    SELECT TOP (@EffectiveTop)
        signup_id,
        fullname,
        signup_date,
        invitation_code,
        tenant_id,
        role_id
    FROM rpt.vw_FormsAuthenticatedParticipantSignups
    WHERE
        (@FromDate IS NULL OR signup_date >= @FromDate)
        AND (@ToDate IS NULL OR signup_date < DATEADD(day, 1, @ToDate))
        AND (@NameContains IS NULL OR fullname LIKE N'%' + @NameContains + N'%')
    ORDER BY signup_date DESC, signup_id DESC;
END;
GO
