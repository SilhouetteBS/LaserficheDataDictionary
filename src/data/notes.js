export function localNotesToVersionNotes(localNotes, localNotesKey, productKey, productVersion) {
  const tableNotes = localNotes[localNotesKey] ?? {};
  return {
    productKey,
    productVersion,
    tables: Object.fromEntries(
      Object.entries(tableNotes).map(([tableKey, note]) => [
        tableKey,
        {
          confidence: note.confidence,
          summary: note.summary,
          safeReportingNotes: note.safeReportingNotes ?? [],
          warnings: note.warnings ?? [],
        },
      ]),
    ),
  };
}

export function isLocalNoteDifferent(localNote, table) {
  if (!localNote) {
    return false;
  }

  return (
    (localNote.summary ?? '') !== (table.summary ?? '') ||
    (localNote.confidence ?? '') !== (table.confidence ?? '') ||
    JSON.stringify(localNote.safeReportingNotes ?? []) !== JSON.stringify(table.safeReportingNotes ?? []) ||
    JSON.stringify(localNote.warnings ?? []) !== JSON.stringify(table.warnings ?? [])
  );
}
