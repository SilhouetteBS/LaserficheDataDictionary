# LFDS Directory Account State Evidence

Product/version: LFDS `12.0.2603.369`

## Goal

Provide read-only account-state and group-membership context for LFDS directory objects.

## Confirmed Schema Evidence

- `dbo.directory_objects` stores identity names, SIDs, flags, provider IDs, and login failure fields.
- `dbo.user_logins.sid` aligns with `dbo.directory_objects.sid`.
- `dbo.group_membership.member_sid` and `group_sid` connect users to group directory objects.
- `dbo.identity_providers.id` connects provider context to directory objects.

## Queue Sources Processed

- [Any ways to get Laserfiche Directory account lock status in batch?](https://answers.laserfiche.com/questions/206318/Any-ways-to-get-Laserfiche-Directory-account-lock-status-in-batch)
- [How to query User with organization in LFDS Database?](https://answers.laserfiche.com/questions/187013/How-to-query-User-with-organization-in-LFDS-Database-)

## Cautions

- Directory names, SIDs, login activity, and group membership can be sensitive.
- Interpret `flags` values cautiously; validate against the LFDS version and observed behavior.
- Deploy reporting objects outside the LFDS product database.
