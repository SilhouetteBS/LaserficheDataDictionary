export function DiagramMiniMap({ diagram, diagramViewport, zoom, onMoveViewport }) {
  return (
    <button
      aria-label="Diagram mini-map. Click to move the viewport."
      className="diagram-mini-map"
      onClick={onMoveViewport}
      title="Diagram mini-map. Click to move the viewport."
      type="button"
    >
      <svg preserveAspectRatio="none" viewBox={`0 0 ${diagram.width} ${diagram.height}`}>
        {diagram.nodes.map((node) => (
          <rect
            className={`diagram-mini-map-node diagram-mini-map-node-${node.type}`}
            height={node.height}
            key={node.key}
            width={node.width}
            x={node.x}
            y={node.y}
          />
        ))}
        {diagramViewport.scrollWidth > 0 && diagramViewport.scrollHeight > 0 ? (
          <rect
            className="diagram-mini-map-viewport"
            height={Math.min(diagram.height, diagramViewport.clientHeight / zoom)}
            width={Math.min(diagram.width, diagramViewport.clientWidth / zoom)}
            x={Math.min(
              Math.max(0, diagramViewport.scrollLeft / zoom),
              Math.max(0, diagram.width - diagramViewport.clientWidth / zoom),
            )}
            y={Math.min(
              Math.max(0, diagramViewport.scrollTop / zoom),
              Math.max(0, diagram.height - diagramViewport.clientHeight / zoom),
            )}
          />
        ) : null}
      </svg>
    </button>
  );
}
