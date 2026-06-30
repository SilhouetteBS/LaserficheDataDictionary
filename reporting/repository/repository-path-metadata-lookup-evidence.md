# Repository Path and Metadata Lookup Evidence

Product/version: Repository `12.0.3.423`

## Goal

Provide read-only entry, volume, page, template, and field metadata lookup objects for reporting databases.

## Confirmed Schema Evidence

- `dbo.toc.parentid` points to parent entries in `dbo.toc`.
- `dbo.toc.vol_id -> dbo.vol.vol_id`.
- `dbo.toc.pset_id -> dbo.propset.pset_id`.
- `dbo.propval.tocid -> dbo.toc.tocid`.
- `dbo.propval.prop_id -> dbo.propdef.prop_id`.
- `dbo.doc.tocid -> dbo.toc.tocid`.

## Queue Sources Processed

- [How to mimic a repository search using a SQL query?](https://answers.laserfiche.com/questions/156668/How-to-mimic-a-repository-search-using-a-SQL-query)
- [Feature Request: Ability to use Lookup Rules in Forms to query metadata in repository](https://answers.laserfiche.com/questions/207941/Feature-Request--Ability-to-use-Lookup-Rules-in-Forms-to-query-metadata-in-repository)
- [Query to see how many pages in repository are in color and black & white?](https://answers.laserfiche.com/questions/168368/Query-to-see-how-many-pages-in-repository-are-in-color-and-black--white)
- [SQL query on LF Server tables for specific metadata](https://answers.laserfiche.com/questions/201363/SQL-query-on-LF-Server-tables-for-specific-metadata)
- [What table in SQL is the document path located?](https://answers.laserfiche.com/questions/67002/What-table-in-SQL-is-the-document-path-located)
- [Audit trail on Number of Records in Each Folder](https://answers.laserfiche.com/questions/154758/Audit-trail-on-Number-of-Records-in-Each-Folder)

## Cautions

- Repository metadata tables can be very large. Use filters, TOP limits, and reporting snapshots for repeated reports.
- `bin_val` is intentionally excluded from the public pattern because it can contain binary metadata.
- The script avoids `NOLOCK`; add it only for explicitly accepted dirty-read diagnostics.
