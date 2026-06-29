# Security Policy

## Reporting Sensitive Data Exposure

If you believe a schema export, issue, screenshot, or published
file includes sensitive data, do not open a public issue with the sensitive
details.

Contact the maintainers privately and include:

- the affected URL, issue, or file path
- the type of exposure, without repeating the sensitive value
- when you noticed it
- whether the value is still visible publicly

## What Counts As Sensitive

Do not submit or publish:

- table row data
- customer names or customer-specific values
- document, folder, form submission, or workflow instance values
- SQL Server database names
- SQL Server server names
- SQL Server version, compatibility level, file paths, or instance configuration
- credentials, connection strings, tokens, API keys, certificates, or secrets
- screenshots that show production records
- private internal notes or source-review artifacts

## Maintainer Response

When sensitive data is reported, maintainers should:

1. Remove or hide the public content as quickly as possible.
2. Determine whether repository history needs to be rewritten or purged.
3. Ask the submitter to regenerate metadata-only exports when needed.
4. Document the incident privately.
5. Publish a sanitized correction only after privacy review passes.

## Public Build Boundary

The public site must be a static, read-only build. Import preview, manual notes
editing, notes import, and notes export are local/internal review capabilities
only.

## Support Boundary

This is an unofficial FicheBait community resource. It is not Laserfiche support
documentation and does not make direct writes to Laserfiche product databases
supported.
