const keys = [
  'product',
  'version',
  'view',
  'table',
  'q',
  'confidence',
  'notes',
  'from',
  'to',
  'objectType',
  'objectQuery',
  'diagramFocus',
  'diagramQuery',
  'diagramMode',
  'diagramEdges',
  'diagramDepth',
  'diagramZoom',
  'diagramTypes',
  'diagramSecondHop',
  'diagramConnectedOnly',
];

export function readUrlState(search = window.location.search) {
  const params = new URLSearchParams(search);
  return Object.fromEntries(keys.map((key) => [key, params.get(key) ?? '']));
}

export function buildUrlStatePath(state, currentSearch, pathname = '/', hash = '') {
  const params = new URLSearchParams(currentSearch);
  keys.forEach((key) => {
    const value = state[key];
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
  });

  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ''}${hash}`;
}

export function writeUrlState(
  state,
  {
    currentSearch = window.location.search,
    pathname = window.location.pathname,
    hash = window.location.hash,
    history = window.history,
  } = {},
) {
  const nextUrl = buildUrlStatePath(state, currentSearch, pathname, hash);
  history.replaceState(null, '', nextUrl);
  return nextUrl;
}
