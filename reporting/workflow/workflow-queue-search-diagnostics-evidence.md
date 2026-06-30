# Workflow Queue and Search Diagnostics Evidence

Product/version: Workflow `12.0.2605.385`

## Goal

Provide read-only queue-size, search-activity, and instance-completion diagnostics with row/date filters.

## Confirmed Schema Evidence

- `dbo.workflow_task_queue_data.task_id -> dbo.workflow_task_queue.task_id`.
- `dbo.search_entry.search_id` aligns with `dbo.search_instance.search_id`.
- `dbo.search_entry_log.search_id` aligns with `dbo.search_instance_log.search_id`.
- `dbo.instance_completion` stores Workflow instance completion and retry timestamps.

## Queue Sources Processed

- [Workflow activity search SQL error ambiguous column name](https://answers.laserfiche.com/questions/62128/Workflow-activity-search-SQL-error-ambiguous-column-name)
- [A transport-level error has occurred when receiving results from the server](https://answers.laserfiche.com/questions/105587/A-transportlevel-error-has-occurred-when-receiving-results-from-the-server-provider-TCP-Provider-error-0--The-semaphore-timeout-period-has-expired)
- [workflow_task_queue_data table size very large](https://answers.laserfiche.com/questions/128584/workflowTaskQueuedata-table-size-very-large--Using-SQL-Express-database)

## Cautions

- Queue payload columns can contain workflow runtime details; the public view exposes payload sizes, not payload text.
- Add date filters before running diagnostics against large Workflow databases.
- Create reporting objects in a separate reporting database.
