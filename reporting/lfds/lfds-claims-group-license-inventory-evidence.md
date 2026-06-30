# LFDS Claims, Group, and License Inventory Evidence

Product/version: LFDS `12.0.2603.369`

## Goal

Provide read-only inventory for LFDS directory objects, additional claims, group membership, licenses, and login context.

## Confirmed Schema Evidence

- `dbo.directory_objects.sid` aligns with `dbo.additional_claims.sid`, `dbo.user_licenses.sid`, `dbo.user_logins.sid`, and `dbo.group_membership.member_sid`.
- `dbo.group_membership.group_sid` aligns with group rows in `dbo.directory_objects.sid`.
- `dbo.directory_objects.provider_id -> dbo.identity_providers.id`.

## Queue Sources Processed

- [In Progress Forms Tasks](https://answers.laserfiche.com/questions/211569/In-Progress-Forms-Tasks)
- [SQL Query to retrieve the email, username, display name and the License Type](https://answers.laserfiche.com/questions/131649/SQL-Query-to-retrieve-the-email-username-display-name-and-the-License-Type)
- [Export a list of all the groups and respective users in LF directory server](https://answers.laserfiche.com/questions/205004/How-can-one-export-a-list-of-all-the-groups-and-respective-users-in-LF-directory-server)
- [Add LFDS Groups to SQL Query](https://answers.laserfiche.com/questions/217062/Add-LFDS-Groups-to-SQL-Query)
- [How to adjust a form's functionality based on the group the user is in](https://answers.laserfiche.com/questions/194574/How-to-adjust-a-forms-functionality-based-on-the-group-the-user-is-in)
- [Query for Forms](https://answers.laserfiche.com/questions/199344/Query-for-Forms)
- [LFDS User License Display Limitations](https://answers.laserfiche.com/questions/172516/LFDS-User-License-Display-Limitations)
- [From Workflows, retrieving email and manager info for LFDS Trustees](https://answers.laserfiche.com/questions/147922/From-Workflows-retrieving-email-and-manager-info-for-LFDS-Thrustees)

## Cautions

- Claims, SIDs, names, group membership, login history, and license rows can expose sensitive identity information.
- `additional_claims.bin_val` is intentionally excluded.
- Deploy reporting objects outside the LFDS product database.
