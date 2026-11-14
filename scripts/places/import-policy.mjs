export function preserveLiveFields(value, prior) {
  const result = { ...value };
  // Keep legacy records readable until their gallery actually contains an item.
  if (!prior?.materials && result.materials?.length === 0) delete result.materials;
  if (!prior) return result;
  return {
    ...result,
    ...Object.fromEntries(
      ['location', 'locationVersion', 'createdAt', 'updatedAt'].map((key) => [key, prior[key]]),
    ),
  };
}
