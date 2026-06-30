# Workflow External Data Source Guidance Evidence

Product/version: Workflow, schema-neutral

## Goal

Provide public-safe guidance for Workflow Query Data and Custom Query activity patterns that use customer-owned SQL data sources.

## Queue Sources Processed

- [LF Forms and Workflow query linked SQL or MySQL Server](https://answers.laserfiche.com/questions/66314/LF-Forms-and-Workflow-query-Linked-SQL-or-MySQL-Server-possible-at-all-)
- [Connecting SQL Database to Laserfiche Cloud Workflows](https://answers.laserfiche.com/questions/230095/Connecting-SQL-Database-to-Laserfiche-Cloud-Workflows)
- [Creating Dynamic Nested Fields in Laserfiche by avoiding SQL](https://answers.laserfiche.com/questions/115077/Creating-Dynamic-Nested-Fields-in-Laserfiche-by-avoiding-SQL)
- [Workflow Database Activities query time out](https://answers.laserfiche.com/questions/47242/Workflow-Database-Activities-query-time-out)
- [Track token iterations](https://answers.laserfiche.com/questions/83672/Track-token-iterations)
- [Stop schedule for workflow](https://answers.laserfiche.com/questions/196997/Stop-schedule-for-workflow)

## Cautions

- This artifact is not a Workflow product database query.
- Use staging tables or stored procedures in customer-owned databases for expensive lookups.
- Validate result-set shape because Workflow token creation depends on returned columns and rows.
