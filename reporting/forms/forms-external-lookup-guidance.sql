/*
Forms external lookup and data-source guidance.

This is a schema-neutral guidance artifact. It does not query the Forms product
database. Use it as a starting pattern for customer-owned lookup databases that
Forms lookup rules can read from.

Target: customer-owned reporting or lookup database.
*/

IF SCHEMA_ID(N'rpt') IS NULL
BEGIN
    EXEC(N'CREATE SCHEMA rpt AUTHORIZATION dbo;');
END;
GO

/*
Example lookup table shape. Adapt this to your own external data source.
Do not create this table in a Laserfiche product database.
*/
IF OBJECT_ID(N'rpt.FormLookupOptions', N'U') IS NULL
BEGIN
    CREATE TABLE rpt.FormLookupOptions
    (
        lookup_key nvarchar(255) NOT NULL,
        display_value nvarchar(255) NOT NULL,
        sort_order int NOT NULL CONSTRAINT DF_FormLookupOptions_sort_order DEFAULT (0),
        is_active bit NOT NULL CONSTRAINT DF_FormLookupOptions_is_active DEFAULT (1),
        CONSTRAINT PK_FormLookupOptions PRIMARY KEY CLUSTERED (lookup_key, display_value)
    );
END;
GO

CREATE OR ALTER PROCEDURE rpt.usp_FormLookupOptions
    @LookupKey nvarchar(255),
    @Top int = 500
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @EffectiveTop int = CASE WHEN @Top BETWEEN 1 AND 5000 THEN @Top ELSE 500 END;

    SELECT TOP (@EffectiveTop)
        display_value
    FROM rpt.FormLookupOptions
    WHERE lookup_key = @LookupKey
      AND is_active = 1
    ORDER BY sort_order, display_value;
END;
GO

/*
Operational notes:
  - Prefer simple SELECT statements or stored procedures that return a stable,
    narrow result set for Forms lookup rules.
  - Avoid linked-server chains when possible; they can parse successfully in
    SSMS but fail from application connection contexts.
  - Keep lookup data in a customer-owned database, not in a Laserfiche product
    database.
*/
