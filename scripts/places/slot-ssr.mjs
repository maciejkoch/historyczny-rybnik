export function configureSlotSsr(config, target) {
  if (!/^dev-[123]$/.test(target)) throw new Error('Unknown slot');
  const route = config.hosting.rewrites.find((rewrite) => rewrite.source === '/miejsca/**');
  if (!route?.function || route.function.functionId !== 'placesDevWeb')
    throw new Error('Unexpected SSR rewrite');
  const functionName = `placesDevWeb${target.slice(-1)}`;
  route.function.functionId = functionName;
  route.function.pinTag = true;
  config.hosting.site = `historyczny-rybnik-${target}`;
  return functionName;
}
