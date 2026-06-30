# Repository Query Compatibility Helpers Evidence

Product/version: Repository `12.0.3.423`

## Goal

Provide read-only helper patterns for repository schema-version checks, Workflow query token conflicts, and binary-to-hex conversion.

## Confirmed Schema Evidence

- `dbo.dboptions.optionname` and `optionvalue` store repository option values including schema version.
- `dbo.toc` stores entry identity, name, type, created/modified dates, deletion marker, and creator binary value.
- `dbo.propval` and `dbo.propdef` are already covered by the path and metadata lookup pattern.

## Queue Sources Processed

- [LF Repository - SQL table details with table schema and dictionary](https://answers.laserfiche.com/questions/223444/LF-Repository--SQL-table-details-with-table-schema-and-dictionary)
- [Azure DBs for repositories](https://answers.laserfiche.com/questions/218919/Azure-DBs-for-repositories)
- [LFQL Through Workflow](https://answers.laserfiche.com/questions/50622/LFQL-Through-Workflow)
- [SQL Database looking for LF Server version 8.6.1](https://answers.laserfiche.com/questions/89879/SQL-Database-looking-for-LF-Server-version-861)
- [Token not found error in Custom Query](https://answers.laserfiche.com/questions/132492/Token-not-found-error-in-Custom-Query)
- [How can I store the binary hex value from a SQL Query without Workflow converting it](https://answers.laserfiche.com/questions/48378/How-can-I-store-the-binary-hex-value-from-a-SQL-Query-without-Workflow-conveting-it-to-a-series-of-decimal-numbers)
- [SQL database schema does not match error 9110](https://answers.laserfiche.com/questions/52173/SQL-database-schema-does-not-match-error-9110)

## Cautions

- Repository version checks are diagnostic only and should not replace supported upgrade planning.
- Parameterize Workflow Custom Query patterns that contain percent signs or parentheses.
- Do not expose binary identifiers or converted hex values broadly unless there is a clear reporting need.
