# Workflow Wait and Completion Diagnostics Evidence

Product/version: Workflow `12.0.2605.385`

## Goal

Provide read-only diagnostic views for Workflow wait conditions and completion retry state.

## Confirmed Schema Evidence

- `dbo.wait_condition` stores condition, queue, activity, instance, workflow, and wait-time context.
- `dbo.instance_completion` stores Workflow completion state, retry timestamps, and retry status fields.
- The public views expose payload byte counts instead of raw condition/state payload text.

## Queue Sources Processed

- [Connection pool timeout](https://answers.laserfiche.com/questions/105585/Timeout-expired--The-timeout-period-elapsed-prior-to-obtaining-a-connection-from-the-pool--This-may-have-occurred-because-all-pooled-connections-were-in-use-and-max-pool-size-was-reached)
- [Transport-level semaphore timeout](https://answers.laserfiche.com/questions/105587/A-transportlevel-error-has-occurred-when-receiving-results-from-the-server-provider-TCP-Provider-error-0--The-semaphore-timeout-period-has-expired)

## Cautions

- Raw condition and state payloads may contain sensitive runtime details. The public pattern reports byte sizes only.
- Use date filters before running diagnostics in large Workflow environments.
- Deploy reporting objects outside the Workflow product database.
