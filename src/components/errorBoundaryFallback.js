export function getErrorBoundaryFallback(error) {
  return {
    title: 'Unable to render this view',
    message: error?.message ?? 'Unexpected rendering error.',
  };
}
