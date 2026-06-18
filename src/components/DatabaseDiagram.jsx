import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { buildDatabaseDiagram } from '../data/diagram.js';
import { getEdgeGeometry } from '../data/diagramGeometry.js';
import { DiagramCanvas } from './DiagramCanvas.jsx';
import { DiagramMiniMap } from './DiagramMiniMap.jsx';
import { DiagramObjectDetailPanel } from './DiagramObjectDetailPanel.jsx';
import { DiagramToolbar } from './DiagramToolbar.jsx';
import { FocusedRelationshipPanel } from './FocusedRelationshipPanel.jsx';
import { MetadataStat } from './MetadataStat.jsx';

function xmlEscape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function downloadText(filename, value, type) {
  const blob = new Blob([value], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadJson(filename, value) {
  downloadText(filename, `${JSON.stringify(value, null, 2)}\n`, 'application/json');
}

export function DatabaseDiagram({
  diagramQuery,
  edgeType,
  focusKey,
  mode,
  depth,
  zoom,
  objectTypeFilters,
  presets,
  showSecondHopEdges,
  connectedOnly,
  onDiagramQueryChange,
  onEdgeTypeChange,
  onFocusKeyChange,
  onModeChange,
  onDepthChange,
  onZoomChange,
  onObjectTypeFiltersChange,
  onApplyPreset,
  onShowSecondHopEdgesChange,
  onConnectedOnlyChange,
  onSavePreset,
  productName,
  version,
  onSelectTable,
}) {
  const diagramScrollRef = useRef(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState('');
  const [pinnedEdgeId, setPinnedEdgeId] = useState('');
  const [copiedLabel, setCopiedLabel] = useState('');
  const [compactColumns, setCompactColumns] = useState(false);
  const [curvedConnectors, setCurvedConnectors] = useState(false);
  const [highContrastDiagram, setHighContrastDiagram] = useState(false);
  const [relationshipPanelCollapsed, setRelationshipPanelCollapsed] = useState(false);
  const [relationshipPanelWidth, setRelationshipPanelWidth] = useState(320);
  const [selectedObjectKey, setSelectedObjectKey] = useState('');
  const [relationshipDirectionFilter, setRelationshipDirectionFilter] = useState('all');
  const [diagramViewport, setDiagramViewport] = useState({
    clientHeight: 0,
    clientWidth: 0,
    scrollHeight: 0,
    scrollLeft: 0,
    scrollTop: 0,
    scrollWidth: 0,
  });
  const zoomSteps = [0.25, 0.5, 0.75, 1, 1.25, 1.5];
  const diagram = useMemo(
    () => buildDatabaseDiagram(
      version,
      diagramQuery,
      edgeType,
      focusKey,
      mode,
      depth,
      objectTypeFilters,
      { connectedOnly },
    ),
    [connectedOnly, depth, diagramQuery, edgeType, focusKey, mode, objectTypeFilters, version],
  );
  const focusedNode = focusKey ? diagram.positionedByKey.get(focusKey) : null;
  const visibleDiagramEdges = showSecondHopEdges
    ? diagram.edges
    : diagram.edges.filter((edge) => edge.hop !== 2);
  const visibleRelationshipDetails = diagram.relationshipDetails.filter((relationship) => {
    if (relationshipDirectionFilter === 'incoming') {
      return relationship.to === focusKey;
    }
    if (relationshipDirectionFilter === 'outgoing') {
      return relationship.from === focusKey;
    }
    return true;
  });
  const activeEdgeId = hoveredEdgeId || pinnedEdgeId;
  const selectedRelationship = activeEdgeId
    ? diagram.relationshipDetails.find((relationship) => relationship.id === activeEdgeId)
    : null;
  const selectedObject = selectedObjectKey ? diagram.positionedByKey.get(selectedObjectKey) : null;
  const relationshipCounts = {
    all: diagram.relationshipDetails.length,
    incoming: diagram.relationshipDetails.filter((relationship) => relationship.to === focusKey).length,
    outgoing: diagram.relationshipDetails.filter((relationship) => relationship.from === focusKey).length,
    foreignKey: diagram.relationshipDetails.filter((relationship) => relationship.type === 'foreignKey').length,
    dependency: diagram.relationshipDetails.filter((relationship) => relationship.type === 'dependency').length,
  };
  const relationshipSections = [
    {
      type: 'foreignKey',
      label: 'Foreign keys',
      relationships: visibleRelationshipDetails.filter((relationship) => relationship.type === 'foreignKey'),
    },
    {
      type: 'dependency',
      label: 'Dependencies',
      relationships: visibleRelationshipDetails.filter((relationship) => relationship.type === 'dependency'),
    },
  ].filter((section) => section.relationships.length > 0);
  const visibleEdgeGeometries = useMemo(() => {
    const geometries = new Map();
    visibleDiagramEdges.forEach((edge) => {
      const geometry = getEdgeGeometry(edge, diagram, { curve: curvedConnectors, focusKey, mode });
      if (geometry) {
        geometries.set(edge.id, geometry);
      }
    });
    return geometries;
  }, [curvedConnectors, diagram, focusKey, mode, visibleDiagramEdges]);
  const clippedEdgeCount = useMemo(() => {
    if (!diagramViewport.clientWidth || !diagramViewport.clientHeight) {
      return 0;
    }

    const visibleBounds = {
      bottom: (diagramViewport.scrollTop + diagramViewport.clientHeight) / zoom,
      left: diagramViewport.scrollLeft / zoom,
      right: (diagramViewport.scrollLeft + diagramViewport.clientWidth) / zoom,
      top: diagramViewport.scrollTop / zoom,
    };
    return visibleDiagramEdges.filter((edge) => {
      const geometry = visibleEdgeGeometries.get(edge.id);
      if (!geometry) {
        return false;
      }

      const edgeLeft = Math.min(geometry.startX, geometry.midX, geometry.endX);
      const edgeRight = Math.max(geometry.startX, geometry.midX, geometry.endX);
      const edgeTop = Math.min(geometry.startY, geometry.endY);
      const edgeBottom = Math.max(geometry.startY, geometry.endY);
      return (
        edgeLeft < visibleBounds.left ||
        edgeRight > visibleBounds.right ||
        edgeTop < visibleBounds.top ||
        edgeBottom > visibleBounds.bottom
      );
    }).length;
  }, [diagramViewport, visibleDiagramEdges, visibleEdgeGeometries, zoom]);
  const showUnresolvedDependencyStatus = diagram.unresolvedDependencyCount > 0 && edgeType !== 'foreignKey';
  const showDiagramStatusRow = showUnresolvedDependencyStatus || clippedEdgeCount > 0;

  useEffect(() => {
    updateDiagramViewport();
    const scrollContainer = diagramScrollRef.current;
    if (!scrollContainer) {
      return undefined;
    }

    const workspace = scrollContainer.closest('.workspace');
    scrollContainer.addEventListener('scroll', updateDiagramViewport, { passive: true });
    workspace?.addEventListener('scroll', updateDiagramViewport, { passive: true });
    globalThis.addEventListener('resize', updateDiagramViewport);
    return () => {
      scrollContainer.removeEventListener('scroll', updateDiagramViewport);
      workspace?.removeEventListener('scroll', updateDiagramViewport);
      globalThis.removeEventListener('resize', updateDiagramViewport);
    };
  }, [diagram.height, diagram.width, zoom]);

  useEffect(() => {
    if (mode === 'focused' && focusedNode) {
      globalThis.requestAnimationFrame(() => centerBounds(getNodeBounds([focusedNode.key])));
    }
  }, [focusKey, focusedNode, mode]);

  function updateDiagramViewport() {
    const scrollContainer = diagramScrollRef.current;
    if (!scrollContainer) {
      return;
    }

    const scrollRect = scrollContainer.getBoundingClientRect();
    const workspace = scrollContainer.closest('.workspace');
    const hasInternalVerticalScroll = scrollContainer.scrollHeight > scrollContainer.clientHeight + 1;
    const hasWorkspaceScroll = workspace && !hasInternalVerticalScroll;
    let viewportTop = scrollContainer.scrollTop;
    let viewportHeight = scrollContainer.clientHeight;
    let viewportLeft = scrollContainer.scrollLeft;
    let viewportWidth = scrollContainer.clientWidth;

    if (hasWorkspaceScroll) {
      const workspaceRect = workspace.getBoundingClientRect();
      const diagramTopInWorkspace = workspace.scrollTop + scrollRect.top - workspaceRect.top;
      viewportHeight = Math.min(scrollContainer.scrollHeight, workspace.clientHeight);
      viewportTop = Math.min(
        Math.max(0, workspace.scrollTop - diagramTopInWorkspace),
        Math.max(0, scrollContainer.scrollHeight - viewportHeight),
      );
    } else {
      const viewportRect = workspace?.getBoundingClientRect() ?? {
        bottom: globalThis.innerHeight,
        left: 0,
        right: globalThis.innerWidth,
        top: 0,
      };
      const visibleLeft = Math.max(0, viewportRect.left - scrollRect.left);
      const visibleTop = Math.max(0, viewportRect.top - scrollRect.top);
      const visibleRight = Math.min(scrollRect.width, viewportRect.right - scrollRect.left);
      const visibleBottom = Math.min(scrollRect.height, viewportRect.bottom - scrollRect.top);
      viewportWidth = Math.max(0, visibleRight - visibleLeft) || viewportWidth;
      viewportHeight = Math.max(0, visibleBottom - visibleTop) || viewportHeight;
      viewportLeft += visibleLeft;
      viewportTop += visibleTop;
    }

    setDiagramViewport({
      clientHeight: viewportHeight,
      clientWidth: viewportWidth,
      scrollHeight: scrollContainer.scrollHeight,
      scrollLeft: viewportLeft,
      scrollTop: viewportTop,
      scrollWidth: scrollContainer.scrollWidth,
    });
  }

  function resetView() {
    onDiagramQueryChange('');
    onFocusKeyChange('');
    onModeChange('full');
    onDepthChange(1);
    onZoomChange(1);
  }

  function selectDiagramNode(node) {
    if (!node) {
      return;
    }

    onFocusKeyChange(node.key);
    onModeChange('focused');
    onDepthChange(1);
    if (node.type !== 'table' && edgeType === 'foreignKey') {
      onEdgeTypeChange('dependency');
    }
  }

  function handleDiagramNodeKeyDown(event, node) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    selectDiagramNode(node);
  }

  async function copyText(label, text) {
    if (!text) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.append(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }

    setCopiedLabel(label);
    globalThis.setTimeout(() => setCopiedLabel(''), 1600);
  }

  function openDiagramObject(node) {
    if (node.type === 'table') {
      onSelectTable(node.key);
      return;
    }

    setSelectedObjectKey(node.key);
  }

  function getDiagramEdgeGeometry(edge) {
    return visibleEdgeGeometries.get(edge.id) ?? getEdgeGeometry(edge, diagram, {
      curve: curvedConnectors,
      focusKey,
      mode,
    });
  }

  function changeZoom(delta) {
    const currentIndex = Math.max(0, zoomSteps.indexOf(zoom));
    const nextIndex = Math.max(0, Math.min(zoomSteps.length - 1, currentIndex + delta));
    onZoomChange(zoomSteps[nextIndex]);
  }

  function getNodeBounds(keys) {
    const nodes = keys
      .map((key) => diagram.positionedByKey.get(key))
      .filter(Boolean);
    if (nodes.length === 0) {
      return null;
    }

    return {
      bottom: Math.max(...nodes.map((node) => node.y + node.height)),
      left: Math.min(...nodes.map((node) => node.x)),
      right: Math.max(...nodes.map((node) => node.x + node.width)),
      top: Math.min(...nodes.map((node) => node.y)),
    };
  }

  function getDiagramBounds() {
    return {
      bottom: diagram.height,
      left: 0,
      right: diagram.width,
      top: 0,
    };
  }

  function getSelectedBounds() {
    if (selectedRelationship) {
      const edgeBounds = getNodeBounds([selectedRelationship.from, selectedRelationship.to]);
      if (edgeBounds) {
        return edgeBounds;
      }
    }

    if (mode === 'focused' && focusedNode) {
      const directKeys = new Set([focusedNode.key]);
      visibleDiagramEdges
        .filter((edge) => edge.hop !== 2 && (edge.from === focusedNode.key || edge.to === focusedNode.key))
        .forEach((edge) => {
          directKeys.add(edge.from);
          directKeys.add(edge.to);
        });
      return getNodeBounds([...directKeys]);
    }

    return getDiagramBounds();
  }

  function centerBounds(bounds, nextZoom = zoom) {
    const scrollContainer = diagramScrollRef.current;
    if (!scrollContainer || !bounds) {
      return;
    }

    const centerX = ((bounds.left + bounds.right) / 2) * nextZoom;
    const centerY = ((bounds.top + bounds.bottom) / 2) * nextZoom;
    scrollContainer.scrollTo({
      left: Math.max(0, centerX - scrollContainer.clientWidth / 2),
      top: Math.max(0, centerY - scrollContainer.clientHeight / 2),
    });
    updateDiagramViewport();
  }

  function getFitZoom(bounds) {
    const scrollContainer = diagramScrollRef.current;
    if (!scrollContainer || !bounds) {
      return zoom;
    }

    const width = Math.max(1, bounds.right - bounds.left);
    const height = Math.max(1, bounds.bottom - bounds.top);
    const availableWidth = Math.max(1, scrollContainer.clientWidth - 80);
    const availableHeight = Math.max(1, scrollContainer.clientHeight - 80);
    const fitZoom = Math.min(1.5, Math.max(0.25, Math.min(availableWidth / width, availableHeight / height)));
    return zoomSteps.reduce((best, step) => (
      Math.abs(step - fitZoom) < Math.abs(best - fitZoom) ? step : best
    ), zoomSteps[0]);
  }

  function fitBounds(bounds) {
    if (!bounds) {
      return;
    }

    const nextZoom = getFitZoom(bounds);
    onZoomChange(nextZoom);
    globalThis.requestAnimationFrame(() => centerBounds(bounds, nextZoom));
  }

  function resetDiagramView() {
    onZoomChange(1);
    globalThis.requestAnimationFrame(() => {
      if (focusedNode) {
        centerBounds(getNodeBounds([focusedNode.key]), 1);
      } else {
        diagramScrollRef.current?.scrollTo({ left: 0, top: 0 });
      }
      updateDiagramViewport();
    });
  }

  function centerFocusedObject() {
    if (!focusedNode) {
      return;
    }

    centerBounds(getNodeBounds([focusedNode.key]));
  }

  function panDiagram(deltaX, deltaY) {
    const scrollContainer = diagramScrollRef.current;
    if (!scrollContainer) {
      return;
    }

    scrollContainer.scrollBy({ left: deltaX, top: deltaY, behavior: 'smooth' });
  }

  function moveMiniMapViewport(event) {
    const scrollContainer = diagramScrollRef.current;
    if (!scrollContainer || diagram.width <= 0 || diagram.height <= 0) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const ratioX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const ratioY = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    const workspace = scrollContainer.closest('.workspace');
    scrollContainer.scrollTo({
      left: Math.max(0, ratioX * scrollContainer.scrollWidth - scrollContainer.clientWidth / 2),
      top: Math.max(0, ratioY * scrollContainer.scrollHeight - scrollContainer.clientHeight / 2),
      behavior: 'smooth',
    });

    if (workspace && scrollContainer.scrollHeight <= scrollContainer.clientHeight + 1) {
      const scrollRect = scrollContainer.getBoundingClientRect();
      const workspaceRect = workspace.getBoundingClientRect();
      const diagramTopInWorkspace = workspace.scrollTop + scrollRect.top - workspaceRect.top;
      workspace.scrollTo({
        top: Math.max(0, diagramTopInWorkspace + ratioY * scrollContainer.scrollHeight - workspace.clientHeight / 2),
        behavior: 'smooth',
      });
    }
    globalThis.setTimeout(updateDiagramViewport, 180);
  }

  function clearFocus() {
    onFocusKeyChange('');
    onModeChange('full');
    setHoveredEdgeId('');
    setPinnedEdgeId('');
  }

  function getEdgeClassName(edge, baseClassName) {
    const isRelationshipSelected = mode === 'focused' && Boolean(activeEdgeId);
    return `${baseClassName} diagram-edge-${edge.type} ${
      diagram.highlightedEdges.has(edge.id) ? 'diagram-edge-highlighted' : ''
    } ${edge.hop === 2 ? 'diagram-edge-second-hop' : ''} ${
      activeEdgeId === edge.id ? 'diagram-edge-selected' : ''
    } ${
      isRelationshipSelected && activeEdgeId !== edge.id ? 'diagram-edge-dimmed' : ''
    }`;
  }

  function shouldRenderHighlightOverlay(edge) {
    if (!diagram.highlightedEdges.has(edge.id)) {
      return false;
    }

    return !activeEdgeId || activeEdgeId === edge.id;
  }

  function changeObjectTypeFilter(type, checked) {
    onObjectTypeFiltersChange({
      ...objectTypeFilters,
      [type]: checked,
    });
  }

  function setQuickEdgeFilter(nextEdgeType) {
    onEdgeTypeChange(nextEdgeType);
    setHoveredEdgeId('');
    setPinnedEdgeId('');
  }

  function setDirectionFilter(nextDirectionFilter) {
    setRelationshipDirectionFilter(nextDirectionFilter);
    setHoveredEdgeId('');
    setPinnedEdgeId('');
  }

  function selectRelationship(edgeId) {
    setPinnedEdgeId((currentEdgeId) => (currentEdgeId === edgeId ? '' : edgeId));
    setHoveredEdgeId('');
    scrollRelationshipColumnsIntoView(edgeId);
  }

  function handleEdgeKeyDown(event, edgeId) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    selectRelationship(edgeId);
  }

  function clearSelectedRelationship() {
    setPinnedEdgeId('');
    setHoveredEdgeId('');
  }

  function getEdgeTooltip(edge) {
    const geometry = getDiagramEdgeGeometry(edge);
    if (edge.type === 'foreignKey') {
      return [
        `Foreign key: ${edge.label}`,
        `From: ${edge.from}`,
        `To: ${edge.to}`,
        `Source columns: ${edge.sourceColumnSummary || 'Unknown'}`,
        `Target columns: ${edge.targetColumnSummary || 'Unknown'}`,
        geometry?.sourceColumnHidden || geometry?.targetColumnHidden
          ? 'Column anchor: referenced row is outside the visible card and uses the nearest card edge.'
          : null,
        `Status: ${edge.status}`,
      ].filter(Boolean).join('\n');
    }

    return [
      `Dependency: ${edge.label}`,
      `From: ${edge.from} (${edge.referencingType || 'Object'})`,
      `To: ${edge.to} (${edge.referencedType || 'Object'})`,
      `Status: ${edge.status}`,
    ].join('\n');
  }

  function getEndpointTextAnchor(startX, endX, isStart) {
    if (startX <= endX) {
      return isStart ? 'start' : 'end';
    }
    return isStart ? 'end' : 'start';
  }

  function getEndpointLabelX(startX, endX, isStart) {
    const offset = 10;
    if (startX <= endX) {
      return isStart ? startX + offset : endX - offset;
    }
    return isStart ? startX - offset : endX + offset;
  }

  function scrollColumnIntoView(tableKey, columnName) {
    if (!tableKey || !columnName) {
      return;
    }

    const diagramRoot = diagramScrollRef.current;
    if (!diagramRoot) {
      return;
    }

    const tableBox = [...diagramRoot.querySelectorAll('.diagram-box')]
      .find((box) => box.dataset.nodeKey === tableKey);
    const columnRow = [...tableBox?.querySelectorAll('.diagram-column-row') ?? []]
      .find((row) => row.dataset.columnName === columnName);
    columnRow?.scrollIntoView({ block: 'center', inline: 'nearest' });
  }

  function scrollRelationshipColumnsIntoView(edgeId) {
    const relationship = diagram.relationshipDetails.find((item) => item.id === edgeId);
    const firstColumn = relationship?.columns?.[0];
    if (!relationship || relationship.type !== 'foreignKey' || !firstColumn) {
      return;
    }

    globalThis.requestAnimationFrame(() => {
      scrollColumnIntoView(relationship.from, firstColumn.sourceColumnName);
      scrollColumnIntoView(relationship.to, firstColumn.referencedColumnName);
    });
  }

  function getExportSvgString({ viewportOnly = false } = {}) {
    const left = viewportOnly ? Math.max(0, diagramViewport.scrollLeft / zoom) : 0;
    const top = viewportOnly ? Math.max(0, diagramViewport.scrollTop / zoom) : 0;
    const width = viewportOnly && diagramViewport.clientWidth
      ? Math.min(diagram.width - left, diagramViewport.clientWidth / zoom)
      : diagram.width;
    const height = viewportOnly && diagramViewport.clientHeight
      ? Math.min(diagram.height - top, diagramViewport.clientHeight / zoom)
      : diagram.height;
    const edgeMarkup = visibleDiagramEdges.map((edge) => {
      const geometry = getDiagramEdgeGeometry(edge);
      if (!geometry) {
        return '';
      }
      const stroke = edge.type === 'dependency' ? '#7a6992' : '#0b6f72';
      const dash = edge.type === 'dependency' ? ' stroke-dasharray="6 5"' : '';
      return `<path d="${xmlEscape(geometry.path)}" fill="none" stroke="${stroke}" stroke-width="1.8"${dash}><title>${xmlEscape(edge.label)}</title></path>`;
    }).join('\n');
    const nodeMarkup = diagram.nodes.map((node) => {
      const accent = {
        table: '#68747d',
        view: '#2f6fed',
        routine: '#17895d',
        trigger: '#a75b00',
      }[node.type] ?? '#68747d';
      const rows = node.type === 'table'
        ? node.columns.slice(0, compactColumns ? 8 : 12).map((column, index) =>
          `<text x="${node.x + 12}" y="${node.y + 48 + index * 15}" font-size="10" fill="#132231">${xmlEscape(column.name)} ${xmlEscape(column.dataType)}</text>`,
        ).join('\n')
        : `<text x="${node.x + 12}" y="${node.y + 50}" font-size="11" fill="#42515d">${xmlEscape(node.key)}</text>`;
      return `<g>
  <rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" fill="#ffffff" stroke="${accent}" stroke-width="2" />
  <rect x="${node.x}" y="${node.y}" width="${node.width}" height="28" fill="#f0f2f3" stroke="${accent}" stroke-width="1" />
  <rect x="${node.x}" y="${node.y}" width="5" height="${node.height}" fill="${accent}" />
  <text x="${node.x + 12}" y="${node.y + 19}" font-size="12" font-weight="700" fill="#061421">${xmlEscape(node.label)}</text>
  ${rows}
</g>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(width)}" height="${Math.ceil(height)}" viewBox="${left} ${top} ${width} ${height}">
  <title>${xmlEscape(productName)} ${xmlEscape(version.version)} database diagram</title>
  <rect x="${left}" y="${top}" width="${width}" height="${height}" fill="#fbfdfe" />
  ${edgeMarkup}
  ${nodeMarkup}
</svg>`;
  }

  function exportDiagramSvg() {
    downloadText(`${version.source.productKey}-${version.version}-diagram.svg`, getExportSvgString(), 'image/svg+xml');
  }

  async function exportDiagramPng() {
    const svg = getExportSvgString({ viewportOnly: true });
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth || Math.max(1, Math.round(diagramViewport.clientWidth || diagram.width));
    canvas.height = image.naturalHeight || Math.max(1, Math.round(diagramViewport.clientHeight || diagram.height));
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => {
      if (!blob) {
        return;
      }
      const pngUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `${version.source.productKey}-${version.version}-diagram-viewport.png`;
      link.click();
      URL.revokeObjectURL(pngUrl);
    }, 'image/png');
  }

  function exportSelectedRelationship() {
    if (!selectedRelationship) {
      return;
    }
    downloadJson(`${version.source.productKey}-${version.version}-relationship.json`, selectedRelationship);
  }

  return (
    <section className={highContrastDiagram ? 'detail-surface diagram-high-contrast' : 'detail-surface'}>
      <div className="detail-heading">
        <div>
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
            <span className="zoom-control">
              <button
                aria-label="Zoom out"
                disabled={zoom <= 0.25}
                onClick={() => changeZoom(-1)}
                title="Zoom out"
                type="button"
              >
                <ZoomOut size={15} />
              </button>
              <select value={zoom} onChange={(event) => onZoomChange(Number(event.target.value))}>
                <option value={0.25}>25%</option>
                <option value={0.5}>50%</option>
                <option value={0.75}>75%</option>
                <option value={1}>100%</option>
                <option value={1.25}>125%</option>
                <option value={1.5}>150%</option>
              </select>
              <button
                aria-label="Zoom in"
                disabled={zoom >= 1.5}
                onClick={() => changeZoom(1)}
                title="Zoom in"
                type="button"
              >
                <ZoomIn size={15} />
              </button>
            </span>
          </label>
        </div>
      </div>

      <div className="diagram-summary" aria-label="Diagram summary">
        <MetadataStat
          label="Objects"
          tooltip="The total number of schema objects currently visible in the diagram. This includes tables plus selected non-table SQL objects, such as views, stored procedures, functions, and triggers, when dependency edges are shown."
          value={diagram.nodes.length}
        />
        <MetadataStat
          label="Edges"
          tooltip="The total number of relationship lines currently drawn between visible objects."
          value={visibleDiagramEdges.length}
        />
        <MetadataStat
          label="Tables"
          tooltip="The number of database tables currently visible in the diagram."
          value={diagram.nodes.filter((node) => node.type === 'table').length}
        />
        <MetadataStat
          label="Dependencies"
          tooltip="The number of SQL expression dependency lines currently visible, such as views or routines that reference another object."
          value={visibleDiagramEdges.filter((edge) => edge.type === 'dependency').length}
        />
      </div>

      <DiagramToolbar
        compactColumns={compactColumns}
        connectedOnly={connectedOnly}
        curvedConnectors={curvedConnectors}
        depth={depth}
        edgeType={edgeType}
        focusedNode={focusedNode}
        highContrastDiagram={highContrastDiagram}
        mode={mode}
        objectTypeFilters={objectTypeFilters}
        presets={presets}
        selectedRelationship={selectedRelationship}
        showSecondHopEdges={showSecondHopEdges}
        onCenterFocusedObject={centerFocusedObject}
        onChangeObjectTypeFilter={changeObjectTypeFilter}
        onClearFocus={clearFocus}
        onDepthChange={onDepthChange}
        onExportDiagramPng={exportDiagramPng}
        onExportDiagramSvg={exportDiagramSvg}
        onExportSelectedRelationship={exportSelectedRelationship}
        onApplyPreset={onApplyPreset}
        onFitDiagram={() => fitBounds(getDiagramBounds())}
        onFitSelection={() => fitBounds(getSelectedBounds())}
        onPanDiagram={panDiagram}
        onResetFilters={resetView}
        onResetView={resetDiagramView}
        onSavePreset={onSavePreset}
        onSetCompactColumns={setCompactColumns}
        onSetConnectedOnly={onConnectedOnlyChange}
        onSetCurvedConnectors={setCurvedConnectors}
        onSetHighContrastDiagram={setHighContrastDiagram}
        onSetShowSecondHopEdges={onShowSecondHopEdgesChange}
      />

      {showDiagramStatusRow ? (
        <div className="diagram-status-row" role="note" aria-label="Diagram status warnings">
          {showUnresolvedDependencyStatus ? (
            <span className="diagram-status-pill">
              <strong>Unresolved dependencies</strong>
              <span className="info-tooltip" tabIndex={0} aria-label="Unresolved dependencies: SQL Server reported dependency rows that could not be matched to exported tables, views, routines, or triggers. These are warnings for diagram completeness and do not necessarily mean the database is invalid.">
                i
                <span role="tooltip">
                  SQL Server reported dependency rows that could not be matched to exported tables, views, routines,
                  or triggers. These are warnings for diagram completeness and do not necessarily mean the database is
                  invalid.
                </span>
              </span>
              <b>{diagram.unresolvedDependencyCount}</b>
            </span>
          ) : null}
          {clippedEdgeCount > 0 ? (
            <span className="diagram-status-pill">
              <strong>Off-screen lines</strong>
              <span className="info-tooltip" tabIndex={0} aria-label="Off-screen lines: Some relationship connectors extend outside the currently visible diagram viewport. Use Fit diagram, the mini-map, pan controls, or scroll the diagram to bring them into view.">
                i
                <span role="tooltip">
                  Some relationship connectors extend outside the currently visible diagram viewport. Use Fit diagram,
                  the mini-map, pan controls, or scroll the diagram to bring them into view.
                </span>
              </span>
              <b>{clippedEdgeCount}</b>
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="diagram-explainer" role="note">
        <strong>Foreign keys vs. dependencies:</strong>
        <span>
          foreign keys are exported SQL constraints between table columns; dependencies are SQL expression references
          from views, routines, or triggers to another object and may include aliases or caller-dependent references.
        </span>
      </div>

      <div className="diagram-mobile-message" role="note">
        The database diagram is simplified on narrow screens. Use a wider viewport for the full interactive layout,
        connector inspection, and minimap navigation.
      </div>

      <DiagramObjectDetailPanel object={selectedObject} onClose={() => setSelectedObjectKey('')} />

      {copiedLabel && (
        <div className="copy-toast" role="status">
          Copied {copiedLabel}
        </div>
      )}

      <div
        className={`${focusedNode ? 'diagram-stage focused' : 'diagram-stage'} ${
          relationshipPanelCollapsed ? 'relationship-panel-collapsed' : ''
        }`}
        style={{ '--relationship-panel-width': `${relationshipPanelWidth}px` }}
      >
        <FocusedRelationshipPanel
          activeEdgeId={activeEdgeId}
          collapsed={relationshipPanelCollapsed}
          edgeType={edgeType}
          focusedNode={focusedNode}
          pinnedEdgeId={pinnedEdgeId}
          relationshipCounts={relationshipCounts}
          relationshipDirectionFilter={relationshipDirectionFilter}
          relationshipPanelWidth={relationshipPanelWidth}
          relationshipSections={relationshipSections}
          selectedRelationship={selectedRelationship}
          visibleRelationshipDetails={visibleRelationshipDetails}
          onClearSelectedRelationship={clearSelectedRelationship}
          onCopyRelationshipName={(label) => copyText('relationship', label)}
          onRelationshipBlur={() => setHoveredEdgeId('')}
          onRelationshipFocus={setHoveredEdgeId}
          onRelationshipHoverEnd={() => setHoveredEdgeId('')}
          onRelationshipHoverStart={setHoveredEdgeId}
          onSelectRelationship={selectRelationship}
          onSetDirectionFilter={setDirectionFilter}
          onSetEdgeFilter={setQuickEdgeFilter}
          onSetPanelCollapsed={setRelationshipPanelCollapsed}
          onSetPanelWidth={setRelationshipPanelWidth}
        />

        <div className="diagram-scroll-frame">
          <span className="diagram-scroll-hint" aria-hidden="true">Scroll or use pan controls for more</span>
          <div className="diagram-scroll" aria-label="Database relationship diagram" ref={diagramScrollRef}>
            <DiagramCanvas
              activeEdgeId={activeEdgeId}
              compactColumns={compactColumns}
              diagram={diagram}
              focusKey={focusKey}
              mode={mode}
              pinnedEdgeId={pinnedEdgeId}
              productName={productName}
              version={version}
              visibleDiagramEdges={visibleDiagramEdges}
              zoom={zoom}
              getDiagramEdgeGeometry={getDiagramEdgeGeometry}
              getEdgeClassName={getEdgeClassName}
              getEdgeTooltip={getEdgeTooltip}
              getEndpointLabelX={getEndpointLabelX}
              getEndpointTextAnchor={getEndpointTextAnchor}
              shouldRenderHighlightOverlay={shouldRenderHighlightOverlay}
              onCopyObjectKey={(objectKey) => copyText('object', objectKey)}
              onEdgeBlur={() => setHoveredEdgeId('')}
              onEdgeClick={selectRelationship}
              onEdgeFocus={setHoveredEdgeId}
              onEdgeKeyDown={handleEdgeKeyDown}
              onEdgeMouseEnter={setHoveredEdgeId}
              onEdgeMouseLeave={() => setHoveredEdgeId('')}
              onNodeDoubleClick={(node) => node.type === 'table' && onSelectTable(node.key)}
              onNodeKeyDown={handleDiagramNodeKeyDown}
              onNodeOpen={openDiagramObject}
              onNodeSelect={selectDiagramNode}
            />
            <DiagramMiniMap
              diagram={diagram}
              diagramViewport={diagramViewport}
              zoom={zoom}
              onMoveViewport={moveMiniMapViewport}
            />
            </div>
          </div>
        </div>
    </section>
  );
}
