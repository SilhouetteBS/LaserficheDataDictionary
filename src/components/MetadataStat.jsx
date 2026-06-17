export function MetadataStat({ icon, label, value }) {
  return (
    <div className="metadata-stat">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
