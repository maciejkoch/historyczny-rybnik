// A staged API deployment may still carry the currently published SSR bundle.
export function renderContext(bundle, context) {
  if (!bundle.supportsPlaceGallery && context?.place) {
    const { materials, ...place } = context.place;
    return { ...context, place };
  }
  return context;
}
