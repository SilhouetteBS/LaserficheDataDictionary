# Forms Attachment, Error, and Draft Diagnostics Evidence

Product/version: Forms `12.0.2509.20409`

## Goal

Provide read-only diagnostics for Forms attachments, instance errors, and saved draft rows.

## Confirmed Schema Evidence

- `dbo.cf_bp_attachment_data` stores attachment names, extension, size, upload time, deletion marker, repository entry ID, and storage metadata.
- `dbo.cf_bp_data_attachment_mapping.attachment_id -> dbo.cf_bp_attachment_data.attachment_id`.
- `dbo.cf_bp_data_attachment_mapping.bp_data_id -> dbo.cf_bp_data.id`.
- `dbo.cf_bp_data.attribute_id` aligns with `dbo.cf_fields.attribute_id`.
- `dbo.bp_instance_errors` stores error code, date, message, instance ID, and business process ID.
- `dbo.cf_form_submissions` stores draft-related submission rows, form ID, process ID, step ID, draft email/name, and expiration.

## Queue Sources Processed

- [Validate PDF headers for Forms attachments](https://answers.laserfiche.com/questions/131478/Validate-PDF-headers-for-Forms-attachments)
- [Custom Field in Report](https://answers.laserfiche.com/questions/188200/Custom-Field-in-Report)
- [Resubmitting Previously Submitted Form Data](https://answers.laserfiche.com/questions/165126/Resubmitting-Previously-Submitted-Form-Data)
- [Delete Completed/Cancelled Forms from SQL](https://answers.laserfiche.com/questions/137948/Delete-CompletedCancelled-Forms-from-SQL-Forms-102)
- [Forms Logs in Web Interface](https://answers.laserfiche.com/questions/172983/Forms-Logs-in-Web-Interface)
- [View all saved Drafts as an Admin](https://answers.laserfiche.com/questions/163792/View-all-saved-Drafts-as-an-Admin)

## Cautions

- Attachment names, draft emails, and error messages can contain sensitive information.
- This pattern does not expose attachment binary contents.
- Do not use cleanup or delete statements from source posts as reporting guidance.
