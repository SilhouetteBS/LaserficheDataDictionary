# Laserfiche Answers SQL Examples Ready for Review

Processed: 2026-06-30

This page summarizes the current `Ready for review` SQL-example queue from the private Laserfiche Answers research output. It intentionally stores source links, schema-match notes, and public-safe review decisions instead of copying raw forum SQL.

`Partially validated` means at least one referenced object matched an imported schema. It does not mean the SQL was tested against a live Laserfiche environment.

## Review Outcome

- Ready queue processed: 32 items.
- Public-safe read-only candidates: 30 items.
- Object-definition candidates needing extra review: 2 items.
- Direct-write, destructive, and weak candidates were not promoted from the queue.
- Forms active-task and Monitor-style items should remain consolidated into `reporting/forms/forms-active-task-monitor.sql` instead of being published as many overlapping snippets.
- Additional public-safe pending items are now represented by supplemental Reporting guide scripts for Forms submission volume, LFDS directory account state, Repository page/search diagnostics, and Workflow wait/completion diagnostics.

## Forms

Most Forms-ready items overlap around active instances, current task reporting, user/team assignment, task duration, and field-value lookup. The reusable output should be a small set of reporting-database patterns, not separate one-off SQL copies.

| Source | Schema objects matched | Review action |
| --- | --- | --- |
| [Forms Instance Monitoring](https://answers.laserfiche.com/questions/102452/Forms-Instance-Monitoring) | `bp_instance_errors`, `cf_bp_main_instances`, `cf_bp_worker_instance_history`, `cf_bp_worker_instances`, `cf_bp_worker_instnc_to_resume` | Keep as evidence for the consolidated active-task/Monitor reporting pattern. Replace comma joins and hard-coded database names. |
| [How do I find a specific form submission on my Forms database?](https://answers.laserfiche.com/questions/153974/How-do-I-find-a-specific-form-submission-on-my-Forms-database) | `cf_bp_data`, `cf_bp_main_instances`, `cf_fields`, `cf_submissions` | Candidate for a field-value-to-instance lookup pattern. Remove hard-coded database names. |
| [Troubleshoot Forms SQL Blockers](https://answers.laserfiche.com/questions/233803/Troubleshoot-Forms-SQL-Blockers) | `cf_bp_main_instances`, `cf_bp_processes`, `cf_bp_steps`, `cf_bp_worker_instance_history`, `cf_bp_worker_instances`, `calculatestepstagecycle` | Candidate diagnostic example for blocker/long-running task investigation. |
| [Top 10 Forms Submissions](https://answers.laserfiche.com/questions/237177/Top-10-Forms-Submissions--An-Experience-Using-AI-To-Write-A-SQL-Query) | `cf_bp_main_instances`, `cf_business_processes` | Candidate for a lightweight submission-count example with explicit date filters. |
| [Query Forms SQL database to Find Instance based on Field Value](https://answers.laserfiche.com/questions/201522/Query-Forms-SQL-database-to-Find-Instance-based-on-Field-Value) | `cf_bp_data`, `cf_bp_main_instances`, `cf_bp_step_form_mapping`, `cf_bp_worker_instnc_to_resume`, `cf_business_processes`, `cf_form_submissions`, `cf_submissions` | Candidate for the same field-value-to-instance pattern; compare with the submission lookup source above. |
| [Forms report with start time and end time for each User Task](https://answers.laserfiche.com/questions/212282/Forms-report-with--start-time-and-end-time-for-each-User-Task-in-Forms-process) | `cf_bp_main_instances`, `cf_bp_steps`, `cf_bp_worker_instance_history`, `cf_bp_worker_instances` | Candidate task-duration example. Replace `SELECT *` and hard-coded database names. |
| [Report to use for Active Forms](https://answers.laserfiche.com/questions/216937/Report-to-use-for-Active-Forms) | `cf_bp_main_instances`, `cf_bp_processes`, `cf_business_processes` | Keep as active-instance evidence; likely covered by the active-task pattern. |
| [Forms Report to Dynamically show all tasks started by you](https://answers.laserfiche.com/questions/184820/Forms-Report-to-Dynamically-show-all-tasks-started-by-you) | `cf_bp_main_instances`, `cf_bp_steps`, `cf_bp_worker_instance_history`, `cf_bp_worker_instances`, `cf_bp_worker_instnc_to_resume`, `cf_user_snapshot`, `cf_users`, `teams` | Keep as assignment-report evidence. Replace `SELECT *` and comma joins. |
| [Generating Report on Unassigned Tasks](https://answers.laserfiche.com/questions/208760/Generating-Report-on-Unassigned-Tasks) | `cf_bp_main_instances`, `cf_bp_steps`, `cf_bp_worker_instance_history`, `cf_bp_worker_instances`, `cf_bp_worker_instnc_to_resume`, `cf_user_snapshot`, `cf_users`, `teams` | Keep as unassigned/team task evidence. Add date or status filters. |
| [delete outstanding forms from a deleted account](https://answers.laserfiche.com/questions/233682/delete-outstanding-forms-from-a-deleted-account) | `cf_bp_main_instances`, `cf_bp_worker_instance_history`, `cf_bp_worker_instances`, `cf_bp_worker_instnc_to_resume`, `cf_user_snapshot`, `cf_users`, `teams` | Use only the read-only discovery portion as evidence for account/task reassignment reporting. Do not publish direct modification guidance. |
| [Current step information from Monitor page](https://answers.laserfiche.com/questions/215801/How-can-I-retrieve-the-current-step-information-from-an-SQL-table-which-is-displayed-on-the-Monitor-page) | `cf_bp_main_instances`, `cf_bp_steps`, `cf_bp_worker_instance_history`, `cf_bp_worker_instances`, `cf_bp_worker_instnc_to_resume`, `cf_user_snapshot`, `cf_users`, `teams` | Keep as current-step evidence for the active-task/Monitor pattern. Replace comma joins and add filters. |

## LFDS

LFDS-ready items center on directory objects, login/license metadata, identity providers, and SAML mappings.

| Source | Schema objects matched | Review action |
| --- | --- | --- |
| [Account lock status in batch](https://answers.laserfiche.com/questions/206318/Any-ways-to-get-Laserfiche-Directory-account-lock-status-in-batch) | `directory_objects` | Candidate for a directory-object account-state example. |
| [User last log in in Forms](https://answers.laserfiche.com/questions/151526/Querying-LFDS-database-for-user-last-log-in-in-Forms) | `account_cache`, `user_licenses`, `user_logins` | Candidate for last-login and license context reporting. |
| [Directory Server Database query help](https://answers.laserfiche.com/questions/204411/Directory-Server-Database-query-help) | `directory_objects`, `user_licenses` | Candidate for user/license lookup. Remove hard-coded database names. |
| [Forms Participant Licenses](https://answers.laserfiche.com/questions/199134/Create-user-in-LFDS-with-Forms-Participant-Licenses) | `master_license` | Use only as license-allocation context. Replace hard-coded database names and comma joins. |
| [Number of licenses we own](https://answers.laserfiche.com/questions/184000/Number-of-licenses-we-ownin-the-database) | `account_cache`, `container_limits`, `directory_objects`, `user_licenses`, `user_logins` | Candidate for license inventory reporting. Remove hard-coded database names. |
| [Linking multiple SAML identity providers](https://answers.laserfiche.com/questions/213876/Linking-multiple-SAML-identity-providers-through-common-username) | `directory_objects`, `identity_providers`, `saml_lf_sid_mappings` | Candidate for SAML identity correlation. Replace comma joins. |

## Repository

Repository-ready items cluster around `toc`, `doc`, volume/path metadata, field/template metadata, and search-result diagnostic tables.

| Source | Schema objects matched | Review action |
| --- | --- | --- |
| [audit trail database tables](https://answers.laserfiche.com/questions/73236/audit-trail-database-tables) | `propdef`, `propval` | Use as metadata context only; Audit Trail is a separate product/database and should not be conflated with Repository field tables. |
| [Mimic a repository search using SQL](https://answers.laserfiche.com/questions/156668/How-to-mimic-a-repository-search-using-a-SQL-query) | `propval`, `toc` | Candidate for metadata-search explanation. Replace `SELECT *` and hard-coded database names. |
| [Lookup Rules query metadata in repository](https://answers.laserfiche.com/questions/207941/Feature-Request--Ability-to-use-Lookup-Rules-in-Forms-to-query-metadata-in-repository) | `propdef`, `propset`, `propval` | Candidate for template/field lookup guidance. Remove hard-coded database names. |
| [Number of licenses we own](https://answers.laserfiche.com/questions/184000/Number-of-licenses-we-ownin-the-database) | `account_cache` | Product classification overlaps LFDS; prefer the LFDS license inventory pattern. |
| [Color and black-and-white page counts](https://answers.laserfiche.com/questions/168368/Query-to-see-how-many-pages-in-repository-are-in-color-and-black--white) | `doc` | Candidate for document/page-count reporting. Replace comma joins. |
| [Specific metadata query](https://answers.laserfiche.com/questions/201363/SQL-query-on-LF-Server-tables-for-specific-metadata) | `propdef`, `propset`, `propval`, `pset_props`, `toc` | Object-definition candidate. Review before converting to a reusable example. |
| [Unknown SQL performance impact](https://answers.laserfiche.com/questions/66306/Unknown-SQL-have-a-performance-impact-on-Laseriche) | `entry_tag`, `searchresult10`, `sess_tag` | Diagnostic context only. Do not recommend `NOLOCK` without documenting dirty-read tradeoffs. |
| [General database error 9008 during search](https://answers.laserfiche.com/questions/221495/While-we-search-within-repository-we-got-error--Error-executing-SQL-command-General-database-error-9008) | `active_doc`, `searchresult13` | Diagnostic context only. Do not promote `NOLOCK` as default guidance. |
| [ORA-32033 unsupported column aliasing](https://answers.laserfiche.com/questions/78110/sql-statement-returns-ORA32033-unsupported-column-aliasing) | `document_signatures`, `entry_tag`, `version_group`, `vhist_toc` | Candidate compatibility note for Oracle-style syntax limitations. Replace comma joins. |
| [SQL Query for Laserfiche 9](https://answers.laserfiche.com/questions/71311/SQL-Query-for-Laserfiche-9) | `propval`, `toc` | Historical reference. Validate against current Repository versions before using. |
| [Document path table](https://answers.laserfiche.com/questions/67002/What-table-in-SQL-is-the-document-path-located) | `doc`, `toc`, `vol` | Candidate for a path/volume reporting explanation. |

## Workflow

Workflow-ready items focus on search activity logs, completion tables, wait conditions, and task queue sizing.

| Source | Schema objects matched | Review action |
| --- | --- | --- |
| [Workflow activity search ambiguous column](https://answers.laserfiche.com/questions/62128/Workflow-activity-search-SQL-error-ambiguous-column-name) | `bp_instance`, `search_entry`, `search_entry_log`, `search_instance`, `search_instance_log`, `search_rep`, `search_status`, `search_status_log` | Candidate diagnostic example for search activity tables. |
| [Connection pool timeout](https://answers.laserfiche.com/questions/105585/Timeout-expired--The-timeout-period-elapsed-prior-to-obtaining-a-connection-from-the-pool--This-may-have-occurred-because-all-pooled-connections-were-in-use-and-max-pool-size-was-reached) | `wait_condition` | Object-definition candidate. Use as schema context, not a standalone reporting query yet. |
| [Transport-level semaphore timeout](https://answers.laserfiche.com/questions/105587/A-transportlevel-error-has-occurred-when-receiving-results-from-the-server-provider-TCP-Provider-error-0--The-semaphore-timeout-period-has-expired) | `instance_completion` | Candidate for completed-instance diagnostics. Replace comma joins. |
| [workflow_task_queue_data table size](https://answers.laserfiche.com/questions/128584/workflowTaskQueuedata-table-size-very-large--Using-SQL-Express-database) | `search_instance`, `workflow_task_queue`, `workflow_task_queue_data` | Candidate for queue-size reporting. Add row limits/date filters before publishing runnable SQL. |

## Next Promotion Targets

1. Forms: keep `reporting/forms/forms-active-task-monitor.sql` as the first published runnable script and add a separate field-value-to-instance lookup pattern.
2. LFDS: create a read-only user/license inventory script using `directory_objects`, `user_licenses`, `user_logins`, and `container_limits`.
3. Repository: create a metadata lookup/path reporting script using `toc`, `doc`, `vol`, `propdef`, `propset`, and `propval`.
4. Workflow: create a queue-size and search-activity diagnostic script with row/date filters.

## Published Supplemental Patterns

- Forms: `reporting/forms/forms-submission-volume-summary.sql`
- LFDS: `reporting/lfds/lfds-directory-account-state.sql`
- Repository: `reporting/repository/repository-page-and-search-diagnostics.sql`
- Workflow: `reporting/workflow/workflow-wait-completion-diagnostics.sql`

## Future Candidate Processing

The 22 `Needs schema verification` candidates were processed after the initial queue promotion.

- Promoted as schema-matched public patterns:
  - Forms: `reporting/forms/forms-user-group-inventory.sql`
  - Repository: `reporting/repository/repository-query-compatibility-helpers.sql`
- Promoted as schema-neutral public guidance:
  - Forms: `reporting/forms/forms-external-lookup-guidance.sql`
  - Workflow: `reporting/workflow/workflow-external-data-source-guidance.sql`
- Covered by existing patterns instead of new standalone scripts:
  - LFDS account-state, group, named-user, and login context are covered by the LFDS user/license and directory account-state patterns.
  - Repository metadata/table dictionary and LFQL-style metadata lookup context are covered by the Repository path/metadata and query compatibility patterns.
- Kept as reference-only rather than executable product-database scripts:
  - SQL Server setup, Azure SQL supportability, Workflow Cloud connection setup, timeout design, dynamic field design, and schedule-control discussions.

## Non-Promoted Queue Processing

The remaining 146 queue rows were processed as public-safe exclusions/reference rows in `docs/answers-sql-processed-exclusions.md`.

- 77 rows were excluded from runnable scripts because they were unsafe, write-oriented, destructive, environment setup, or support-directed.
- 23 rows were not promoted because they required manual extraction and supportability review.
- 46 rows were kept as reference only because they had insufficient SQL or schema signal.

## General Cleanup Rules Applied

- Do not rely on a database name; use parameters, SQLCMD variables, synonyms, or deployment-time configuration.
- Replace comma joins with explicit `JOIN` syntax.
- Replace `SELECT *` with explicit column lists.
- Avoid `NOLOCK` in published examples unless the dirty-read tradeoff is documented for a diagnostic-only query.
- Add `TOP`, date filters, or status filters for large production databases.
- Publish examples as reporting-database objects, not as objects created inside Laserfiche product databases.
