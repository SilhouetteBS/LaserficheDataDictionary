function normalize(value) {
  return String(value ?? '').toLowerCase().trim();
}

export function getColumnUsages(version, query) {
  const needle = normalize(query);
  if (!needle) {
    return [];
  }

  const results = [];
  version.tables.forEach((table) => {
    table.columns.forEach((column) => {
      if (normalize(`${column.name} ${column.dataType} ${column.purpose}`).includes(needle)) {
        const indexedBy = table.indexes
          .filter((index) => index.columns.some((indexedColumn) => indexedColumn.columnName === column.name))
          .map((index) => index.name);
        const foreignKeys = [
          ...(table.source.outgoingForeignKeys ?? []),
          ...(table.source.incomingForeignKeys ?? []),
        ].filter((foreignKey) =>
          foreignKey.columns.some(
            (foreignKeyColumn) =>
              foreignKeyColumn.sourceColumnName === column.name ||
              foreignKeyColumn.referencedColumnName === column.name,
          ),
        );

        results.push({
          tableKey: table.id,
          columnName: column.name,
          dataType: column.dataType,
          indexedBy,
          foreignKeys: foreignKeys.map((foreignKey) => foreignKey.name),
        });
      }
    });
  });

  return results.slice(0, 200);
}

export function getReviewItems(version) {
  return version.tables
    .filter((table) => table.confidence === 'unknown' || table.confidence === 'inferred')
    .map((table) => ({
      key: table.id,
      confidence: table.confidence,
      hasManualNotes: table.hasManualNotes,
      columnsNeedingReview: table.columns.filter((column) => column.confidence === 'unknown').length,
    }))
    .sort((left, right) => {
      if (left.hasManualNotes !== right.hasManualNotes) {
        return left.hasManualNotes ? 1 : -1;
      }
      return right.columnsNeedingReview - left.columnsNeedingReview;
    });
}

export function getTableImpactItems(version) {
  const dependencyCounts = new Map();
  (version.source.dependencies ?? []).forEach((dependency) => {
    [dependency.referencingObjectKey, dependency.referencedObjectKey].forEach((key) => {
      if (key) {
        dependencyCounts.set(key, (dependencyCounts.get(key) ?? 0) + 1);
      }
    });
  });

  return version.tables
    .map((table) => {
      const relationshipCount = table.relationships.length;
      const dependencyCount = dependencyCounts.get(table.id) ?? 0;
      const indexCount = table.indexes.length;
      const triggerCount = table.triggers.length;
      const unknownColumns = table.columns.filter((column) => column.confidence === 'unknown').length;
      const score =
        relationshipCount * 3 +
        dependencyCount * 2 +
        indexCount +
        triggerCount * 4 +
        unknownColumns * 0.25 +
        (table.hasManualNotes ? 0 : 8);

      return {
        key: table.id,
        confidence: table.confidence,
        hasManualNotes: table.hasManualNotes,
        relationshipCount,
        dependencyCount,
        indexCount,
        triggerCount,
        unknownColumns,
        score: Number(score.toFixed(2)),
      };
    })
    .sort((left, right) => right.score - left.score || left.key.localeCompare(right.key));
}

export function getSchemaHealthItems(version) {
  return version.tables
    .map((table) => {
      const primaryKeys = table.keys.filter((key) => key.type === 'PK');
      const untrustedForeignKeys = [
        ...(table.source.outgoingForeignKeys ?? []),
        ...(table.source.incomingForeignKeys ?? []),
      ].filter((foreignKey) => foreignKey.isNotTrusted || foreignKey.isDisabled);
      const computedColumns = table.columns.filter((column) => column.source.isComputed);
      const identityColumns = table.columns.filter((column) => column.source.isIdentity);
      const riskFlags = [
        /audit|history|log|snapshot|security|user|role|group|license|identity/i.test(table.id)
          ? 'sensitive or historical table'
          : '',
        table.triggers.length > 0 ? 'triggered table' : '',
        primaryKeys.length === 0 ? 'no exported primary key' : '',
        untrustedForeignKeys.length > 0 ? 'disabled or untrusted foreign key' : '',
        computedColumns.length > 0 ? 'computed columns' : '',
      ].filter(Boolean);

      return {
        key: table.id,
        riskFlags,
        primaryKeyCount: primaryKeys.length,
        untrustedForeignKeyCount: untrustedForeignKeys.length,
        triggerCount: table.triggers.length,
        computedColumnCount: computedColumns.length,
        identityColumnCount: identityColumns.length,
      };
    })
    .filter((item) => item.riskFlags.length > 0)
    .sort((left, right) => right.riskFlags.length - left.riskFlags.length || left.key.localeCompare(right.key));
}
