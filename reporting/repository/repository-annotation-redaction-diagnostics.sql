/*
Repository annotation and redaction diagnostics reporting pattern.

Target: reporting database, not the Repository product database.
Product schema evidence: Repository 12.0.3.423 AI export.

Usage:
  1. Open in SQL Server Management Studio with SQLCMD Mode enabled.
  2. Set RepositoryDatabase to the repository product database name.
  3. Execute from the reporting database where rpt objects should live.

Notes:
  - Reads annotation, rectangle, page, and entry metadata only.
  - Does not read or export page image, text, annotation bitmap, or attachment binary content.
  - Redaction interpretation should be validated against the target repository version and client behavior.
*/

:setvar RepositoryDatabase "Repository"

IF SCHEMA_ID(N'rpt') IS NULL
BEGIN
    EXEC(N'CREATE SCHEMA rpt AUTHORIZATION dbo;');
END;
GO

CREATE OR ALTER VIEW rpt.vw_RepositoryAnnotationRectangles
AS
SELECT
    a.ann_id,
    a.page_id,
    d.tocid,
    t.name AS entry_name,
    t.parentid,
    d.pagenum,
    a.item_id,
    a.ann_type,
    CASE
        WHEN a.ann_type IN (2, 7) THEN N'Redaction candidate'
        ELSE N'Annotation'
    END AS annotation_category,
    a.ann_created,
    a.ann_lastmod,
    a.ann_visibility,
    a.ann_textsize,
    CASE WHEN NULLIF(LTRIM(RTRIM(ISNULL(a.ann_text, N''))), N'') IS NULL THEN 0 ELSE 1 END AS has_annotation_text,
    a.attach_size,
    a.attach_mime,
    ar.pos AS rectangle_position,
    ar.x1,
    ar.y1,
    ar.x2,
    ar.y2,
    d.img_width,
    d.img_height,
    d.img_size,
    d.txt_size,
    SYSUTCDATETIME() AS reporting_read_utc
FROM [$(RepositoryDatabase)].dbo.ann AS a
LEFT JOIN [$(RepositoryDatabase)].dbo.annrect AS ar
    ON a.ann_id = ar.ann_id
LEFT JOIN [$(RepositoryDatabase)].dbo.doc AS d
    ON a.page_id = d.page_id
LEFT JOIN [$(RepositoryDatabase)].dbo.toc AS t
    ON d.tocid = t.tocid;
GO

CREATE OR ALTER PROCEDURE rpt.usp_RepositoryAnnotationRedactionDiagnostics
    @EntryNameContains nvarchar(255) = NULL,
    @OnlyRedactionCandidates bit = 1,
    @OnlyWithoutText bit = 0,
    @Top int = 500
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @EffectiveTop int = CASE WHEN @Top BETWEEN 1 AND 10000 THEN @Top ELSE 500 END;

    SELECT TOP (@EffectiveTop)
        ann_id,
        page_id,
        tocid,
        entry_name,
        parentid,
        pagenum,
        item_id,
        ann_type,
        annotation_category,
        ann_created,
        ann_lastmod,
        ann_visibility,
        ann_textsize,
        has_annotation_text,
        attach_size,
        attach_mime,
        rectangle_position,
        x1,
        y1,
        x2,
        y2,
        img_width,
        img_height,
        img_size,
        txt_size
    FROM rpt.vw_RepositoryAnnotationRectangles
    WHERE
        (@EntryNameContains IS NULL OR entry_name LIKE N'%' + @EntryNameContains + N'%')
        AND (@OnlyRedactionCandidates = 0 OR annotation_category = N'Redaction candidate')
        AND (@OnlyWithoutText = 0 OR has_annotation_text = 0)
    ORDER BY ann_lastmod DESC, ann_id DESC, rectangle_position;
END;
GO
