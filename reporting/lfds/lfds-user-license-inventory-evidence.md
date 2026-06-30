# LFDS User and License Inventory Evidence

Product/version: LFDS `12.0.2603.369`

## Goal

Provide read-only inventory views for LFDS directory users, login activity, license rows, container limits, identity providers, and SAML SID mappings.

## Confirmed Schema Evidence

- `dbo.directory_objects.sid` aligns with `dbo.user_licenses.sid`.
- `dbo.directory_objects.sid` aligns with `dbo.user_logins.sid`.
- `dbo.directory_objects.provider_id -> dbo.identity_providers.id`.
- `dbo.saml_lf_sid_mappings.saml_sid` and `lf_sid` align with directory object SIDs.
- `dbo.container_limits` stores license/resource instance limits.

## Queue Sources Processed

- [Any ways to get Laserfiche Directory account lock status in batch?](https://answers.laserfiche.com/questions/206318/Any-ways-to-get-Laserfiche-Directory-account-lock-status-in-batch)
- [Querying LFDS database for user last log in in Forms](https://answers.laserfiche.com/questions/151526/Querying-LFDS-database-for-user-last-log-in-in-Forms)
- [Directory Server Database query help](https://answers.laserfiche.com/questions/204411/Directory-Server-Database-query-help)
- [Number of licenses we own](https://answers.laserfiche.com/questions/184000/Number-of-licenses-we-ownin-the-database)
- [Linking multiple SAML identity providers through common username](https://answers.laserfiche.com/questions/213876/Linking-multiple-SAML-identity-providers-through-common-username)

## Cautions

- Directory object names and login activity can be personal data.
- License type values should be interpreted against the installed LFDS version and licensing model.
- The script avoids hard-coded database names and should be deployed in a separate reporting database.
