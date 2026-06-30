# Forms Session Diagnostics Evidence

Product/version: Forms `12.0.2603.30215`

## Goal

Provide read-only diagnostics for Forms sessions, last activity, user context, and session-variable row counts without exposing raw session variable values.

## Confirmed Schema Evidence

- `dbo.cf_sessions` stores session identity, user, IP address, machine, last active timestamp, session type, and group SID.
- `dbo.cf_sessions.user_id -> dbo.cf_users.user_id` provides Forms user context.
- `dbo.cf_session_variables.sess_id -> dbo.cf_sessions.id` stores variable rows associated with a session.

## Queue Sources Processed

- [Forms SQL queries are consuming all the server resources](https://answers.laserfiche.com/questions/118286/Forms-SQL-queries-are-consuming-all-the-server-resources)

## Cautions

- Session rows can expose user, IP address, machine, and activity timing information.
- Raw `variable_value` content is intentionally not selected; the script exposes byte counts for diagnostics.
- Deploy reporting objects outside the Forms product database.
