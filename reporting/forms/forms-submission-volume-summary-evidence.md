# Forms Submission Volume Summary Evidence

Product/version: Forms `12.0.2509.20409`

## Goal

Provide a read-only reporting pattern for submission and instance counts by process and status.

## Confirmed Schema Evidence

- `dbo.cf_bp_main_instances` stores process instance identifiers, dates, titles, and status.
- `dbo.cf_business_processes` stores process names and friendly names.
- `dbo.cf_bp_main_instances.process_id -> dbo.cf_bp_processes.process_id -> dbo.cf_business_processes.bp_id`.
- `dbo.cf_submissions.bp_instance_id` connects submitted rows to process instances.
- `dbo.cf_submissions.date_created`, `status`, `priority`, and `is_test_mode` support filtered reporting.

## Queue Sources Processed

- [Top 10 Forms Submissions](https://answers.laserfiche.com/questions/237177/Top-10-Forms-Submissions--An-Experience-Using-AI-To-Write-A-SQL-Query)
- [Report to use for Active Forms](https://answers.laserfiche.com/questions/216937/Report-to-use-for-Active-Forms)

## Cautions

- Validate the process join path in your exported schema. Some Forms versions expose process-version identifiers differently.
- Use date filters on large Forms databases.
- Deploy these objects to a separate reporting database.
