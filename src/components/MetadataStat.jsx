export function MetadataStat({ icon, label, tooltip, value }) {
  return (
    <div className="metadata-stat">
      {icon}
      <span className="metadata-stat-label">
        {label}
        {tooltip && (
          <span className="info-tooltip" tabIndex={0} aria-label={`${label}: ${tooltip}`}>
            i
            <span role="tooltip">{tooltip}</span>
          </span>
        )}
      </span>
      <strong>{value}</strong>
    </div>
  );
}
