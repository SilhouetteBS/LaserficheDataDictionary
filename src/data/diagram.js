function normalize(value) {
  return String(value ?? '').toLowerCase().trim();
}

function getObjectLabel(key) {
  return key?.replace(/^dbo\./, '') ?? '';
}

export function buildDatabaseDiagram(version, query, edgeType, focusKey, mode, depth) {
  const nodes = new Map();
  const addNode = (key, type, label = getObjectLabel(key)) => {
    if (!key || nodes.has(key)) {
      return;
    }
    nodes.set(key, { key, type, label });
  };

  version.source.tables.forEach((table) => addNode(table.key, 'table'));
  (version.source.views ?? []).forEach((view) => addNode(view.key, 'view'));
  (version.source.routines ?? []).forEach((routine) => addNode(routine.key, 'routine'));
  (version.source.triggers ?? []).forEach((trigger) => addNode(trigger.name, 'trigger', trigger.name));

  const edges = [];
  if (edgeType === 'all' || edgeType === 'foreignKey') {
    (version.source.foreignKeys ?? []).forEach((foreignKey) => {
      if (nodes.has(foreignKey.sourceTableKey) && nodes.has(foreignKey.referencedTableKey)) {
        edges.push({
          id: `fk:${foreignKey.name}:${foreignKey.sourceTableKey}:${foreignKey.referencedTableKey}`,
          type: 'foreignKey',
          from: foreignKey.sourceTableKey,
          to: foreignKey.referencedTableKey,
          label: foreignKey.name,
        });
      }
    });
  }

  if (edgeType === 'all' || edgeType === 'dependency') {
    (version.source.dependencies ?? []).forEach((dependency, index) => {
      if (nodes.has(dependency.referencingObjectKey) && nodes.has(dependency.referencedObjectKey)) {
        edges.push({
          id: `dep:${index}:${dependency.referencingObjectKey}:${dependency.referencedObjectKey}`,
          type: 'dependency',
          from: dependency.referencingObjectKey,
          to: dependency.referencedObjectKey,
          label: 'depends on',
        });
      }
    });
  }

  const needle = normalize(query);
  let visibleKeys = new Set(nodes.keys());
  if (needle) {
    visibleKeys = new Set();
    nodes.forEach((node) => {
      if (normalize(`${node.key} ${node.label} ${node.type}`).includes(needle)) {
        visibleKeys.add(node.key);
      }
    });
    edges.forEach((edge) => {
      if (visibleKeys.has(edge.from) || visibleKeys.has(edge.to)) {
        visibleKeys.add(edge.from);
        visibleKeys.add(edge.to);
      }
    });
  }

  const connectionDepth = Number(depth) === 2 ? 2 : 1;
  const connectedKeys = new Set();
  if (focusKey && nodes.has(focusKey)) {
    connectedKeys.add(focusKey);
    let frontier = new Set([focusKey]);
    for (let hop = 0; hop < connectionDepth; hop += 1) {
      const nextFrontier = new Set();
      edges.forEach((edge) => {
        if (frontier.has(edge.from) || frontier.has(edge.to)) {
          if (!connectedKeys.has(edge.from)) {
            nextFrontier.add(edge.from);
          }
          if (!connectedKeys.has(edge.to)) {
            nextFrontier.add(edge.to);
          }
          connectedKeys.add(edge.from);
          connectedKeys.add(edge.to);
        }
      });
      frontier = nextFrontier;
    }
  }

  if (mode === 'focused' && connectedKeys.size > 0) {
    visibleKeys = new Set([...visibleKeys].filter((key) => connectedKeys.has(key)));
  }

  const groupOrder = ['table', 'view', 'routine', 'trigger'];
  const groupLabels = {
    table: 'Tables',
    view: 'Views',
    routine: 'Routines',
    trigger: 'Triggers',
  };
  const xByType = {
    table: 40,
    view: 340,
    routine: 640,
    trigger: 940,
  };
  const nodeWidth = 220;
  const nodeHeight = 30;
  const rowGap = 42;
  const topOffset = 64;

  const positionedNodes = [];
  groupOrder.forEach((type) => {
    [...nodes.values()]
      .filter((node) => node.type === type && visibleKeys.has(node.key))
      .sort((left, right) => left.label.localeCompare(right.label, undefined, { sensitivity: 'base' }))
      .forEach((node, index) => {
        positionedNodes.push({
          ...node,
          x: xByType[type],
          y: topOffset + index * rowGap,
          width: nodeWidth,
          height: nodeHeight,
        });
      });
  });

  const positionedByKey = new Map(positionedNodes.map((node) => [node.key, node]));
  let visibleEdges = edges.filter((edge) => positionedByKey.has(edge.from) && positionedByKey.has(edge.to));
  if (mode === 'focused') {
    visibleEdges = focusKey
      ? visibleEdges.filter((edge) => connectedKeys.has(edge.from) && connectedKeys.has(edge.to))
      : [];
  }
  const highlightedEdges = new Set(
    visibleEdges
      .filter((edge) => focusKey && (edge.from === focusKey || edge.to === focusKey))
      .map((edge) => edge.id),
  );
  const maxRows = Math.max(
    1,
    ...groupOrder.map((type) => positionedNodes.filter((node) => node.type === type).length),
  );

  return {
    groupLabels,
    groupOrder,
    width: 1200,
    height: topOffset + maxRows * rowGap + 40,
    nodes: positionedNodes,
    edges: visibleEdges,
    positionedByKey,
    connectedKeys,
    highlightedEdges,
  };
}
