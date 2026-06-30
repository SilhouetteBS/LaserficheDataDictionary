# Forms Authenticated Participant Sign-Up Evidence

Product/version: Forms `12.0.2603.30215`

## Goal

Provide a read-only reporting pattern for authenticated participant sign-up records and creation dates.

## Confirmed Schema Evidence

- `dbo.cf_users_sign_up.signup_id` identifies the sign-up row.
- `dbo.cf_users_sign_up.fullname` stores the participant name captured for sign-up.
- `dbo.cf_users_sign_up.signup_date` stores the sign-up timestamp.
- `dbo.cf_users_sign_up.invitation_code`, `tenant_id`, and `role_id` provide context for the sign-up record.

## Queue Sources Processed

- [Creation date of a forms authenticated participant](https://answers.laserfiche.com/questions/100971/Creation-date-of-a-forms-authenticated-participant)

## Cautions

- Names and invitation codes can be sensitive. Limit access to the reporting view.
- The script is read-only and should be deployed in a separate reporting database.
