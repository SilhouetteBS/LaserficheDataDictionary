# Forms Active Task / Monitor-Style Reporting Evidence

Product/version: Forms `12.0.2509.20409`

This pattern is public-safe. It records schema evidence from the AI export package and does not include private Laserfiche Answers source-review details.

## Goal

Provide a reporting-database object that returns active Forms task rows with process, instance, step, owner, approver, and team context.

## Confirmed Schema Evidence

- `dbo.cf_bp_main_instances.status`: `1 = Running`.
- `dbo.cf_bp_worker_instances.status`: worker status mapping includes `2 = WaitForTrigger`, `8 = Complete`, `11 = SuspendedDueToError`, and `13 = SuspendedDueToTaskError`.
- `dbo.cf_bp_worker_instnc_to_resume.status`: resumable task status mapping includes `1 = New`, `2 = Locked`, `3 = Canceled`, `4 = Deleted`, `5 = Ready`, and `6 = Suspended`.
- `dbo.cf_bp_main_instances.process_id -> dbo.cf_bp_processes.process_id`: confirmed foreign key `FK_bp_main_insts_bp_process`.
- `dbo.cf_bp_processes.bp_id -> dbo.cf_business_processes.bp_id`: confirmed foreign key `FK_bp_processes_biz_process`.
- `dbo.cf_bp_worker_instnc_to_resume.worker_instance_id -> dbo.cf_bp_worker_instances.instance_id`: confirmed foreign key `FK_bp_insts_to_resume_w_inst`.
- `dbo.cf_bp_worker_instances.current_process_id/current_step_id -> dbo.cf_bp_steps.process_id/step_id`: confirmed foreign key `FK_bp_worker_insts_bp_step`.
- `dbo.cf_bp_instance_approvers.resume_id -> dbo.cf_bp_worker_instnc_to_resume.resume_id`: confirmed foreign key `FK_cf_bp_instance_approvers_cf_bp_worker_instnc_to_resume`.
- `dbo.cf_bp_instance_approvers.user_snapshot_id -> dbo.cf_user_snapshot.id`: confirmed foreign key `FK_approver_user_snapshot`.
- `dbo.cf_bp_instance_approvers.team_id -> dbo.teams.id`: confirmed foreign key `FK_team_instance_approvers`.
- `dbo.cf_bp_worker_instnc_to_resume.owner_snapshot_id -> dbo.cf_user_snapshot.id`: confirmed foreign key `FK_owner_snapshot_worker_instnc_to_resume`.
- `dbo.cf_bp_worker_instnc_to_resume.team_id -> dbo.teams.id`: confirmed foreign key `FK_team_worker_instnc_to_resume`.

## Queue Sources Processed

- [Forms Instance Monitoring](https://answers.laserfiche.com/questions/102452/Forms-Instance-Monitoring)
- [Troubleshoot Forms SQL Blockers](https://answers.laserfiche.com/questions/233803/Troubleshoot-Forms-SQL-Blockers)
- [Forms report with start time and end time for each User Task](https://answers.laserfiche.com/questions/212282/Forms-report-with--start-time-and-end-time-for-each-User-Task-in-Forms-process)
- [Report to use for Active Forms](https://answers.laserfiche.com/questions/216937/Report-to-use-for-Active-Forms)
- [Forms Report to Dynamically show all tasks started by you](https://answers.laserfiche.com/questions/184820/Forms-Report-to-Dynamically-show-all-tasks-started-by-you)
- [Generating Report on Unassigned Tasks](https://answers.laserfiche.com/questions/208760/Generating-Report-on-Unassigned-Tasks)
- [delete outstanding forms from a deleted account](https://answers.laserfiche.com/questions/233682/delete-outstanding-forms-from-a-deleted-account)
- [Current step information from Monitor page](https://answers.laserfiche.com/questions/215801/How-can-I-retrieve-the-current-step-information-from-an-SQL-table-which-is-displayed-on-the-Monitor-page)
- [Forms SQL query for all instances at a gateway step](https://answers.laserfiche.com/questions/197726/Forms-SQL-query-for-all-instances-at-a-gateway-step)
- [Forms Inbox Email Reminder](https://answers.laserfiche.com/questions/76772/Forms-Inbox-Email-Reminder)
- [Number of active Forms tasks for each user type](https://answers.laserfiche.com/questions/131323/Number-of-active-Forms-tasks-for-each-user-type)
- [Custom Reporting | Task Names](https://answers.laserfiche.com/questions/223652/Custom-Reporting--Task-Names)
- [Report on Reassigned Tasks within a Forms Process](https://answers.laserfiche.com/questions/160384/Report-on-Reassigned-Tasks-within-a-Forms-Process)
- [Forms 10.4 task reassignment for users who don't have a license](https://answers.laserfiche.com/questions/221322/Forms-104-task-reassignment-for-users-who-dont-have-a-license)
- [Determining Step ID/Name in Workflow When Started by a Forms Process](https://answers.laserfiche.com/questions/146710/Determining-Step-IDName-in-Workflow-When-Started-by-a-Forms-Process)
- [Does Laserfiche Forms has an API](https://answers.laserfiche.com/questions/203576/Does-Laserfiche-Forms-has-an-API)
- [Cannot send email notifications to a user](https://answers.laserfiche.com/questions/207661/Cannot-send-email-notifications-to-a-user)

## Cautions

- `dbo.cf_bp_worker_instances.bp_instance_id -> dbo.cf_bp_main_instances.bp_instance_id` exists in the export as `FK_bp_worker_insts_bp_m_inst`, but it is marked not trusted. The relationship is still used because it is the runtime parent instance path, but it should be validated with row counts in each environment.
- A normal cross-database view should not be treated as an indexed view. If the live view is too expensive, refresh the reporting-database snapshot table and index that table.
- Usernames, display names, and email addresses are personal data. Restrict permissions on reporting objects that expose assignee information.
- The script intentionally filters to active Forms instances and active resumable task statuses. If a report needs completed/canceled task history, create a separate history pattern using archive/history tables.

## Validation Queries

Run these in the reporting database after deploying the script:

```sql
SELECT resume_status, resume_status_name, worker_status, worker_status_name, COUNT_BIG(*) AS row_count
FROM rpt.vw_FormsActiveTasks
GROUP BY resume_status, resume_status_name, worker_status, worker_status_name
ORDER BY resume_status, worker_status;
```

```sql
SELECT assignment_type, COUNT_BIG(*) AS row_count
FROM rpt.vw_FormsActiveTasks
GROUP BY assignment_type
ORDER BY assignment_type;
```

```sql
EXEC rpt.usp_RefreshFormsActiveTasksSnapshot;

SELECT COUNT_BIG(*) AS snapshot_row_count
FROM rpt.FormsActiveTasksSnapshot;
```
