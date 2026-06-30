# Repository Storage, Recycle Bin, and Security Diagnostics Evidence

Product/version: Repository `12.0.3.423`

## Goal

Provide read-only storage, recycle-bin, volume, account-cache, trustee, trusted group, and trusted login reporting context.

## Confirmed Schema Evidence

- `dbo.recycle_bin.tocid` aligns with `dbo.toc.tocid`.
- `dbo.toc.vol_id -> dbo.vol.vol_id`.
- `dbo.account_cache.account_sid` aligns with repository identity SID fields.
- `dbo.trustee.sid`, `dbo.trusted_group.sid`, and `dbo.trusted_login.sid` expose repository identity/security context.

## Queue Sources Processed

- [Is there a way to find out the recycle bin size of a repository?](https://answers.laserfiche.com/questions/56763/Is-there-a-way-to-find-out-the-recycle-bin-size-of-a-repository)
- [General database error while searching with one user but not with admin account](https://answers.laserfiche.com/questions/203436/General-database-error-while-searching-with-one-user-but-not-with-admin-account)
- [SQL Server temp database size](https://answers.laserfiche.com/questions/103672/SQL-Server-temp-database-size)
- [SQL Table for finding electronic file location](https://answers.laserfiche.com/questions/77337/SQL-Table-for-finding-electronic-file-location)
- [Error executing SQL command](https://answers.laserfiche.com/questions/68697/Error-executing-SQL-command)
- [Where are Windows Account details stored in SQL](https://answers.laserfiche.com/questions/63116/Where-are-Windows-Account-details-stored-in-SQL)
- [lookup a repository folder](https://answers.laserfiche.com/questions/157902/lookup-a-repository-folder)
- [Getting the Created By field](https://answers.laserfiche.com/questions/160770/Getting-the-Created-By-field)

## Cautions

- Repository volume paths, account names, SIDs, and trusted identity mappings can be sensitive.
- This pattern does not read volume files directly and does not recommend changing repository security rows.
- Deploy reporting objects outside the Repository product database.
