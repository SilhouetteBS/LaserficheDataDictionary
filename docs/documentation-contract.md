# Documentation Contract

## Product Model

Each product versions independently:

```text
product
  version
    schema snapshot
    manual notes
    generated comparison data
```

Products planned:

- Forms
- LFDS
- Repository
- Workflow

## Documentation Confidence

- `confirmed`: verified from strong evidence or trusted product knowledge
- `observed`: verified by watching values change during product actions
- `inferred`: likely based on names, relationships, code paths, stored procedures, or data patterns
- `unknown`: not yet understood
- `deprecated`: present but believed to be obsolete
- `do_not_rely_on`: internal, unstable, or unsafe for reporting dependencies

## Manual Notes Shape

```yaml
product: forms
version: "12.x"
tables:
  dbo.ExampleTable:
    displayName: Example Table
    confidence: inferred
    summary: Stores an example business entity.
    safeReportingNotes:
      - Read-only queries only.
      - Join to dbo.ExampleLookup by ExampleLookupId.
    warnings:
      - Do not update records directly.
    columns:
      ExampleId:
        confidence: confirmed
        purpose: Primary identifier for the example entity.
        allowedValues: []
        relatedTables:
          - table: dbo.ExampleChild
            column: ExampleId
            relationshipType: referenced_by
            confidence: inferred
```

