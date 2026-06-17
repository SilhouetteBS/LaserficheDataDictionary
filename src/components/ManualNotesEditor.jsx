import { useEffect, useState } from 'react';
import { Upload } from 'lucide-react';

const confidenceLabels = {
  confirmed: 'Confirmed',
  observed: 'Observed',
  inferred: 'Inferred',
  unknown: 'Unknown',
  deprecated: 'Deprecated',
  do_not_rely_on: 'Do not rely',
};

export function ManualNotesEditor({
  localNote,
  localNotesKey,
  localNoteChanged,
  selectedTable,
  onExportLocalNotes,
  onExportVersionNotes,
  onImportLocalNotes,
  onClear,
  onSave,
}) {
  const [draft, setDraft] = useState({
    summary: '',
    confidence: selectedTable.confidence,
    safeReportingNotes: '',
    warnings: '',
  });

  useEffect(() => {
    setDraft({
      summary: localNote?.summary ?? selectedTable.summary ?? '',
      confidence: localNote?.confidence ?? selectedTable.confidence,
      safeReportingNotes: (localNote?.safeReportingNotes ?? []).join('\n'),
      warnings: (localNote?.warnings ?? []).join('\n'),
    });
  }, [localNote, selectedTable]);

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function saveDraft() {
    onSave(selectedTable.id, {
      summary: draft.summary.trim(),
      confidence: draft.confidence,
      safeReportingNotes: draft.safeReportingNotes
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
      warnings: draft.warnings
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
    });
  }

  return (
    <section className="manual-notes-panel">
      <div className="section-title-row">
        <h3>Manual documentation notes</h3>
        <span>{localNoteChanged ? 'Local draft differs' : localNote ? 'Matches current notes' : 'No local draft'}</span>
      </div>
      <div className="notes-editor-grid">
        <label>
          <span>Confidence</span>
          <select value={draft.confidence} onChange={(event) => updateDraft('confidence', event.target.value)}>
            {Object.entries(confidenceLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="notes-editor-wide">
          <span>Summary</span>
          <textarea
            value={draft.summary}
            onChange={(event) => updateDraft('summary', event.target.value)}
            rows={3}
          />
        </label>
        <label>
          <span>Safe reporting notes</span>
          <textarea
            value={draft.safeReportingNotes}
            onChange={(event) => updateDraft('safeReportingNotes', event.target.value)}
            placeholder="One note per line"
            rows={4}
          />
        </label>
        <label>
          <span>Warnings</span>
          <textarea
            value={draft.warnings}
            onChange={(event) => updateDraft('warnings', event.target.value)}
            placeholder="One warning per line"
            rows={4}
          />
        </label>
      </div>
      <div className="notes-editor-actions">
        <button className="text-button" type="button" onClick={saveDraft}>
          Save local note
        </button>
        <button className="text-button" type="button" onClick={() => onClear(selectedTable.id)}>
          Clear local note
        </button>
        <button className="text-button" type="button" onClick={onExportLocalNotes}>
          Export local notes
        </button>
        <button className="text-button" type="button" onClick={onExportVersionNotes}>
          Export notes.json
        </button>
        <label className="import-notes-button">
          <Upload size={16} />
          <span>Import notes</span>
          <input accept="application/json,.json" type="file" onChange={onImportLocalNotes} />
        </label>
      </div>
      <p className="notes-editor-footnote">
        Local storage key: <code>{localNotesKey}</code>. Export notes.json produces a product/version notes file ready
        for review before copying into the data folder.
      </p>
    </section>
  );
}
