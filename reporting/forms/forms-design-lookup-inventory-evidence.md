# Forms Design and Lookup Inventory Evidence

Product/version: Forms `12.0.2509.20409`

## Goal

Provide read-only inventory views for Forms process definitions, form definitions, fields, variables, external lookup data sources, and lookup field mappings.

## Confirmed Schema Evidence

- `dbo.cf_forms` stores form names, titles, public flag, type, and design timestamps.
- `dbo.cf_fields` stores field labels, custom variable names, field type, required flag, and `attribute_id`.
- `dbo.cf_bp_dataset.attribute_id` aligns with field `attribute_id` for process variable context.
- `dbo.cf_form_process_mapping.form_id -> dbo.cf_forms.form_id`.
- `dbo.cf_form_process_mapping.process_id -> dbo.cf_bp_processes.process_id`.
- `dbo.cf_bp_processes.bp_id -> dbo.cf_business_processes.bp_id`.
- `dbo.cf_external_databases`, `dbo.cf_external_dbtables`, and `dbo.cf_external_stored_procedures` describe configured external lookup sources.
- `dbo.cf_field_column_mapping` stores lookup rule field-to-column mappings.

## Queue Sources Processed

- [SQL query for Form lookups](https://answers.laserfiche.com/questions/225408/SQL-query-for-Form-lookups)
- [Lookup tables in Forms, where used?](https://answers.laserfiche.com/questions/227968/Lookup-tables-in-Forms-where-used)
- [query forms database for Forms, Fields and variables per business process](https://answers.laserfiche.com/questions/166490/query-forms-database-for-Forms-Fields-and-variables-per-business-process)
- [Show variable names with field location on form](https://answers.laserfiche.com/questions/226145/Show-variable-names-with-field-location-on-form)
- [Last Person to Edit Forms](https://answers.laserfiche.com/questions/116789/Last-Person-to-Edit-Forms)
- [Forms - How to find a reference to a form in the process](https://answers.laserfiche.com/questions/184061/Forms--How-to-find-a-reference-to-a-form-in-the-process)
- [Forms Database Tables Documentation](https://answers.laserfiche.com/questions/120310/Forms-Database-Tables-Documentation)

## Cautions

- External lookup connection rows can include server and database names. Restrict access to these reporting views.
- This pattern exposes metadata about form design, not submitted row data.
- Deploy reporting objects outside the Forms product database.
