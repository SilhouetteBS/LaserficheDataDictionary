import { X } from 'lucide-react';

function getObjectTypeLabel(type) {
  return {
    table: 'Table',
    view: 'View',
    routine: 'Routine',
    trigger: 'Trigger',
  }[type] ?? type;
}

function getDefinitionText(object) {
  return object?.definition ?? object?.definitionText ?? object?.sqlDefinition ?? object?.objectDefinition ?? '';
}

function getObjectDetailRows(object) {
  if (!object) {
    return [];
  }

  return [
    ['Schema', object.schemaName],
    ['Type', object.typeDescription ?? object.parentObjectTypeDescription],
    ['Parent', object.parentObjectKey],
    ['Disabled', object.isDisabled === undefined ? undefined : object.isDisabled ? 'Yes' : 'No'],
    ['Instead of trigger', object.isInsteadOfTrigger === undefined ? undefined : object.isInsteadOfTrigger ? 'Yes' : 'No'],
    ['Definition hash', object.definitionSha256],
  ].filter(([, value]) => value !== undefined && value !== null && value !== '');
}

export function DiagramObjectDetailPanel({ object, onClose }) {
  if (!object || object.type === 'table') {
    return null;
  }

  return (
    <section className={`diagram-object-detail-panel diagram-object-detail-panel-${object.type}`}>
      <div>
        <p className="snapshot-kicker">{getObjectTypeLabel(object.type)}</p>
        <h3>{object.key}</h3>
        <span>{object.source?.name ?? object.label}</span>
      </div>
      <dl>
        {getObjectDetailRows(object.source).map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{String(value)}</dd>
          </div>
        ))}
        <div>
          <dt>Dependencies</dt>
          <dd>{(object.source?.dependencies ?? []).length.toLocaleString()}</dd>
        </div>
        {object.type === 'routine' && (
          <div>
            <dt>Parameters</dt>
            <dd>{(object.source?.parameters ?? []).length.toLocaleString()}</dd>
          </div>
        )}
      </dl>
      <div className="diagram-object-definition">
        <div>
          <strong>Definition preview</strong>
          <button
            aria-label="Close object details"
            className="relationship-clear-button"
            onClick={onClose}
            title="Close object details"
            type="button"
          >
            <X size={13} />
          </button>
        </div>
        {getDefinitionText(object.source) ? (
          <pre>{getDefinitionText(object.source)}</pre>
        ) : (
          <p>
            Definition text was not included in this export. The exported definition hash is review metadata and
            is not counted as a schema change by itself.
          </p>
        )}
      </div>
    </section>
  );
}
