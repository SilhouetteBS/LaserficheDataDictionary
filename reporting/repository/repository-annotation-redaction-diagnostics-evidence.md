# Repository annotation and redaction diagnostics

## Review status

- Source type: Laserfiche Answers community SQL and schema-derived reporting pattern.
- Validation: Schema matched against Repository 12.0.3.423 export.
- Live tested: No.
- Safety: Read-only. Creates reporting objects in a separate reporting database only.

## Related Answers posts

- [Redactions without Text](https://answers.laserfiche.com/questions/77035/Redactions-without-Text)
- [Retrieve Physical File Path of TIFFs and E-Docs Using Entry ID in Laserfiche](https://answers.laserfiche.com/questions/227206/Retrieve-Physical-File-Path-of-TIFFs-and-EDocs-Using-Entry-ID-in-Laserfiche)
- [Redaction and annotation troubleshooting context from processed Answers queue](../../docs/answers-sql-processed-batch-2026-07-01.md)

## Schema objects used

- `dbo.ann`
- `dbo.annrect`
- `dbo.doc`
- `dbo.toc`

## Notes

The published script does not copy the original Answers SQL verbatim. It converts the useful idea into a support-conscious reporting pattern that avoids product database writes and avoids exposing binary page, attachment, or annotation content.

Redaction type semantics can vary by client behavior and repository version. Treat the `Redaction candidate` label as a review aid, not a legal or records-management determination.
