const confidenceLabels = {
  confirmed: 'Confirmed',
  observed: 'Observed',
  inferred: 'Inferred',
  unknown: 'Unknown',
  deprecated: 'Deprecated',
  do_not_rely_on: 'Do not rely',
};

export function ConfidenceBadge({ value }) {
  return <span className={`confidence confidence-${value}`}>{confidenceLabels[value] ?? value}</span>;
}
