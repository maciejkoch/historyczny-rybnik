export function isLocalCreator(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.location.hostname === 'localhost' &&
    ['4200', '4300'].includes(window.location.port)
  );
}
