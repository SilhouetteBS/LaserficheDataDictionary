# Forms External Lookup Guidance Evidence

Product/version: Forms, schema-neutral

## Goal

Provide public-safe guidance for Forms lookup rules that read customer-owned SQL data sources, stored procedures, or views.

## Queue Sources Processed

- [Forms SQL Function Lookup](https://answers.laserfiche.com/questions/61668/Forms-SQL-Funcion-Lookup)
- [Form Lookup](https://answers.laserfiche.com/questions/173089/Form-Lookup)
- [Set drop-down field default when populating with database query](https://answers.laserfiche.com/questions/68625/Set-dropdown-field-default-when-populating-with-database-query)
- [Lookup rule not working on public form](https://answers.laserfiche.com/questions/165147/Lookup-rule-not-working-on-public-form)
- [LF Forms and Workflow query linked SQL or MySQL Server](https://answers.laserfiche.com/questions/66314/LF-Forms-and-Workflow-query-Linked-SQL-or-MySQL-Server-possible-at-all-)
- [How to create a workflow to auto generate a report](https://answers.laserfiche.com/questions/226520/How-to-create-a-workflow-to-auto-generate-a-report)

## Cautions

- This artifact is not a Laserfiche product database query.
- Keep lookup tables, helper views, and helper procedures in customer-owned databases.
- Validate stored procedure and linked-server behavior through the same account and driver used by Forms.
