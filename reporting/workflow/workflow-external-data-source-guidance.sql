/*
Workflow external data-source guidance.

This is a schema-neutral guidance artifact. It does not query the Workflow
product database. Use it as a starting pattern for customer-owned SQL data
sources that Workflow Query Data or Custom Query activities can read from.

Target: customer-owned reporting, staging, or lookup database.
*/

IF SCHEMA_ID(N'rpt') IS NULL
BEGIN
    EXEC(N'CREATE SCHEMA rpt AUTHORIZATION dbo;');
END;
GO

IF OBJECT_ID(N'rpt.WorkflowLookupStaging', N'U') IS NULL
BEGIN
    CREATE TABLE rpt.WorkflowLookupStaging
    (
        lookup_key nvarchar(255) NOT NULL,
        lookup_value nvarchar(4000) NOT NULL,
        updated_utc datetime2(3) NOT NULL CONSTRAINT DF_WorkflowLookupStaging_updated_utc DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_WorkflowLookupStaging PRIMARY KEY CLUSTERED (lookup_key)
    );
END;
GO

CREATE OR ALTER PROCEDURE rpt.usp_WorkflowLookupValue
    @LookupKey nvarchar(255)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        lookup_key,
        lookup_value,
        updated_utc
    FROM rpt.WorkflowLookupStaging
    WHERE lookup_key = @LookupKey;
END;
GO

/*
Operational notes:
  - Use customer-owned staging tables for long-running or expensive external
    lookups.
  - Keep result sets narrow and predictable for Workflow tokens.
  - Test through the same data-source connection and account used by Workflow.
  - Avoid writing helper objects into Laserfiche product databases.
*/
