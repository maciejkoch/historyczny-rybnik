export function validMentionDate(value: string): boolean {
  if (!value || /^\d{4}$/.test(value)) return true;
  const match = /^(?:(\d{2})-)?(\d{2})-(\d{4})$/.exec(value);
  if (!match) return false;
  const [, day, month, year] = match;
  const m = Number(month),
    y = Number(year);
  if (m < 1 || m > 12 || y < 1) return false;
  if (!day) return true;
  const d = Number(day);
  const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  return d >= 1 && d <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
}
export function displayMentionDate(value: string | null | undefined): string {
  const v = value ?? '';
  return v.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$3-$2-$1').replace(/^(\d{4})-(\d{2})$/, '$2-$1');
}
export function storeMentionDate(value: string): string | null {
  return (
    value.replace(/^(\d{2})-(\d{2})-(\d{4})$/, '$3-$2-$1').replace(/^(\d{2})-(\d{4})$/, '$2-$1') ||
    null
  );
}
