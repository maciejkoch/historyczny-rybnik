export function preserveLiveFields(value, prior) {
  if (!prior) return value;
  return {
    ...value,
    ...Object.fromEntries(
      ['location', 'locationVersion', 'createdAt', 'updatedAt'].map((key) => [key, prior[key]]),
    ),
  };
}
