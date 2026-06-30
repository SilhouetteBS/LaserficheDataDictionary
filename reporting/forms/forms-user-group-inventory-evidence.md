# Forms User and Group Inventory Evidence

Product/version: Forms `12.0.2509.20409`

## Goal

Provide a read-only Forms user, user-type, administrator, activation, login, and group-membership reporting pattern.

## Confirmed Schema Evidence

- `dbo.cf_users` stores Forms user names, display names, email addresses, user type, administrator flag, activation flag, LFDS SID, and login timestamps.
- `dbo.cf_usergroups_users_mapping.user_id -> dbo.cf_users.user_id`.
- `dbo.cf_usergroups_users_mapping.group_id -> dbo.cf_usergroups.group_id`.
- `dbo.cf_usergroups` stores Forms group names, friendly names, group type, activation flag, and SID values.

## Queue Sources Processed

- [Named users list](https://answers.laserfiche.com/questions/122499/Named-users-list)
- [Get group name in Forms](https://answers.laserfiche.com/questions/149043/Get-group-name-in-Forms)
- [Join login and username](https://answers.laserfiche.com/questions/141935/Join-login-and-username)
- [Participant User Not Seeing Anything After Logging In](https://answers.laserfiche.com/questions/64738/Participant-User-Not-Seeing-Anything-After-Logging-In)
- [SQL Query to Find Forms Processes User Has Access Rights To](https://answers.laserfiche.com/questions/224490/SQL-Query-to-Find-Forms-Processes-User-Has-Access-Rights-To)

## Cautions

- User names, email addresses, SIDs, group membership, and login timestamps can be sensitive.
- `user_type` labels are based on community queue context and should be validated against the installed Forms version.
- Deploy reporting objects outside the Forms product database.
