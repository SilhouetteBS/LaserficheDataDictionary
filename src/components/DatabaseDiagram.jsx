import { useMemo } from 'react';
import { buildDatabaseDiagram } from '../data/diagram.js';
import { MetadataStat } from './MetadataStat.jsx';

export function DatabaseDiagram({
  diagramQuery,
  edgeType,
  focusKey,
  mode,
  depth,
  zoom,
  onDiagramQueryChange,
  onEdgeTypeChange,
  onFocusKeyChange,
  onModeChange,
  onDepthChange,
  onZoomChange,
  productName,
  version,
  onSelectTable,
}) {
  const diagram = useMemo(
    () => buildDatabaseDiagram(version, diagramQuery, edgeType, focusKey, mode, depth),
    [depth, diagramQuery, edgeType, focusKey, mode, version],
  );
  const focusedNode = focusKey ? diagram.positionedByKey.get(focusKey) : null;

  function resetView() {
    onDiagramQueryChange('');
    onFocusKeyChange('');
    onModeChange('focused');
    onDepthChange(1);
    onZoomChange(1);
  }

  return (
    <section className="detail-surface">
      <div className="detail-heading">
        <div>
          <p className="product-label">{productName} {version.version}</p>
          <h2>Database diagram</h2>
          <p>Visual map of exported SQL foreign keys and SQL expression dependencies.</p>
        </div>
        <div className="diagram-controls">
          <label>
            <span>Find object</span>
            <input
              value={diagramQuery}
              onChange={(event) => onDiagramQueryChange(event.target.value)}
              placeholder="Filter diagram"
            />
          </label>
          <label>
            <span>Mode</span>
            <select value={mode} onChange={(event) => onModeChange(event.target.value)}>
              <option value="focused">Focused</option>
              <option value="full">Full database</option>
            </select>
          </label>
          <label>
            <span>Edges</span>
            <select value={edgeType} onChange={(event) => onEdgeTypeChange(event.target.value)}>
              <option value="all">All</option>
              <option value="foreignKey">Foreign keys</option>
              <option value="dependency">Dependencies</option>
            </select>
          </label>
          <label>
            <span>Zoom</span>
            <select value={zoom} onChange={(event) => onZoomChange(Number(event.target.value))}>
              <option value={0.75}>75%</option>
              <option value={1}>100%</option>
              <option value={1.25}>125%</option>
              <option value={1.5}>150%</option>
            </select>
          </label>
        </div>
      </div>

      <div className="diagram-summary" aria-label="Diagram summary">
        <MetadataStat label="Objects" value={diagram.nodes.length} />
        <MetadataStat label="Edges" value={diagram.edges.length} />
        <MetadataStat label="Tables" value={diagram.nodes.filter((node) => node.type === 'table').length} />
        <MetadataStat label="Dependencies" value={diagram.edges.filter((edge) => edge.type === 'dependency').length} />
      </div>

      <div className="diagram-toolbar">
        <div className="diagram-legend" aria-label="Diagram legend">
          <span><i className="legend-fk" /> Foreign key</span>
          <span><i className="legend-dependency" /> Dependency</span>
          <span><i className="legend-focus" /> Focused object</span>
        </div>
        <label className="diagram-depth-control">
          <span>Depth</span>
          <select
            disabled={mode !== 'focused' || !focusKey}
            value={depth}
            onChange={(event) => onDepthChange(Number(event.target.value))}
          >
            <option value={1}>1 hop</option>
            <option value={2}>2 hops</option>
          </select>
        </label>
        <button className="text-button" type="button" onClick={resetView}>
          Fit / reset
        </button>
        {focusedNode ? (
          <span className="diagram-focus-label">Focused: {focusedNode.key}</span>
        ) : (
          <span className="diagram-focus-label">Select an object to draw focused relationships.</span>
        )}
      </div>

      <div className="diagram-scroll" aria-label="Database relationship diagram">
        <svg
          className="database-diagram"
          role="img"
          style={{ width: `${diagram.width * zoom}px`, height: `${diagram.height * zoom}px` }}
          viewBox={`0 0 ${diagram.width} ${diagram.height}`}
        >
          <title>Database relationships for {productName} {version.version}</title>
          {diagram.groupOrder.map((type) => (
            <g key={type}>
              <text className="diagram-group-label" x={diagram.nodes.find((node) => node.type === type)?.x ?? 0} y="30">
                {diagram.groupLabels[type]}
              </text>
            </g>
          ))}
          {diagram.edges.map((edge) => {
            const from = diagram.positionedByKey.get(edge.from);
            const to = diagram.positionedByKey.get(edge.to);
            const startX = from.x + from.width;
            const startY = from.y + from.height / 2;
            const endX = to.x;
            const endY = to.y + to.height / 2;
            const midX = (startX + endX) / 2;
            return (
              <path
                className={`diagram-edge diagram-edge-${edge.type} ${
                  diagram.highlightedEdges.has(edge.id) ? 'diagram-edge-highlighted' : ''
                }`}
                d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
                key={edge.id}
              />
            );
          })}
          {diagram.nodes.map((node) => (
            <g
              className={`diagram-node diagram-node-${node.type} ${
                node.key === focusKey ? 'diagram-node-focused' : ''
              } ${focusKey && diagram.connectedKeys.has(node.key) ? 'diagram-node-connected' : ''}`}
              key={node.key}
              onClick={() => onFocusKeyChange(node.key)}
              onDoubleClick={() => node.type === 'table' && onSelectTable(node.key)}
              tabIndex={0}
              role="button"
            >
              <title>{node.key}</title>
              <rect x={node.x} y={node.y} width={node.width} height={node.height} rx="6" />
              <text x={node.x + 10} y={node.y + 20}>
                {node.label.length > 28 ? `${node.label.slice(0, 25)}...` : node.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}
