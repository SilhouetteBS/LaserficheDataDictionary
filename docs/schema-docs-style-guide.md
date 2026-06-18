# Schema Documentation Style Guide

Use this guide when editing table, column, object, and reporting notes.

## Voice

- Write for read-only reporting, troubleshooting, and education.
- Describe what exported metadata shows; avoid claiming unsupported Laserfiche business behavior.
- Use product and version labels from manifests. Do not rely on SQL Server database names.

## Confidence

- `confirmed`: verified against reliable product knowledge or documentation.
- `observed`: observed from exported schema patterns and relationships.
- `inferred`: likely based on names, dependencies, or shape, but still needs review.
- `unknown`: generated placeholder or undocumented.
- `deprecated`: historical or replaced object.
- `do_not_rely_on`: known unsafe or unsuitable for reporting.

## Required Review Metadata

- `reviewStatus`: `draft`, `in_review`, `approved`, or `stale`.
- `owner`: person or team responsible for the note.
- `reviewer`: person or team that reviewed the note.
- `lastReviewedAt`: ISO date, required for approved notes.

## Avoid

- Write guidance such as `INSERT`, `UPDATE`, `DELETE`, `MERGE`, `TRUNCATE`, `DROP`, or `ALTER`.
- Environment-specific database names.
- Placeholder language such as `TBD`, `TODO`, or `manual purpose documentation pending`.
