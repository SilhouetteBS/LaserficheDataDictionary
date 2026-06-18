# Data Validation Warning Review

The data validator currently passes with warnings. These warnings are reviewed as data quality signals, not release-blocking errors, unless they move outside the expected classes below.

## Current Summary

- Total warnings: 1,944
- Dependency references resolved: 1,172 of 1,481
- Products covered: Forms, LFDS, Repository, Workflow
- Versions covered:
  - Forms: 11.0.2311.50564, 12.0.2503.10378
  - LFDS: 11.0.2403.2474, 12.0.2506.370
  - Repository: 11.0.2.338, 12.0.1.237
  - Workflow: 11.0.2306.898, 12.0.2508.3111

## Expected Warning Classes

| Warning class | Count | Release impact |
| --- | ---: | --- |
| Dependency rows missing schema metadata | 1,481 | Expected for SQL expression dependency exports. The diagram treats unresolved rows as completeness warnings. |
| Referencing dependency object not exported | 286 | Expected when SQL Server reports helper, alias, pseudo, or caller-dependent references that are not standalone exported objects. |
| Referenced dependency object not exported | 35 | Expected when dependencies point to helper objects or names not present in the exported object sets. |
| Empty views export | 2 | Acceptable for products/versions where the source database exported no views. |
| Empty triggers export | 4 | Acceptable for products/versions where the source database exported no triggers. |
| Table has no exported primary key | 136 | Acceptable for product tables that do not declare a SQL primary key. This should remain visible as schema health guidance. |

## Release-Blocking Warning Changes

Treat these as blockers until reviewed:

- New validator errors.
- Foreign key source or referenced table missing.
- Schema `productKey` or `productVersion` mismatch against the product/version manifest.
- Missing schema or notes files referenced by a manifest.
- Duplicate product keys, duplicate versions, or duplicate table keys.
- A new warning class that is not listed in this document.

## Identity Rules

Product and version identity must come from exported manifest fields:

- `productKey`
- `productName`
- `productVersion`

Do not infer identity from a SQL Server database name. Customer database names can differ between environments.

## Local Environment Metadata

Local SQL Server metadata such as server version, database name, or compatibility level is intentionally not displayed in the app-facing schema snapshots. Those values vary by customer environment and are not stable product documentation.
