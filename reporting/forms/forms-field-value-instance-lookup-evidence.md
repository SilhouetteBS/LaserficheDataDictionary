# Forms Field-Value to Instance Lookup Evidence

Product/version: Forms `12.0.2603.30215`

This pattern is public-safe. It records schema evidence from the AI export package and the processed SQL-example review queue without copying raw Laserfiche Answers SQL.

## Goal

Find Forms process instances and submissions that contain a matching submitted field value.

## Confirmed Schema Evidence

- `dbo.cf_bp_data.submission_id -> dbo.cf_submissions.submission_id`
- `dbo.cf_submissions.bp_instance_id -> dbo.cf_bp_main_instances.bp_instance_id`
- `dbo.cf_bp_data.attribute_id` aligns with `dbo.cf_fields.attribute_id` for field metadata.
- `dbo.cf_fields.label`, `dbo.cf_fields.custom_field_name`, and `dbo.cf_fields.type` provide field context.
- `dbo.cf_bp_main_instances.status` uses the documented Forms instance status mapping.

## Queue Sources Processed

- [How do I find a specific form submission on my Forms database?](https://answers.laserfiche.com/questions/153974/How-do-I-find-a-specific-form-submission-on-my-Forms-database)
- [Query Forms SQL database to Find Instance based on Field Value](https://answers.laserfiche.com/questions/201522/Query-Forms-SQL-database-to-Find-Instance-based-on-Field-Value)

## Cautions

- Field values can include personal or sensitive information. Restrict reporting permissions.
- Repeated fields can produce multiple rows per submission through `repeat_id` and `member_path`.
- The script intentionally avoids hard-coded database names and should be deployed in a separate reporting database.
