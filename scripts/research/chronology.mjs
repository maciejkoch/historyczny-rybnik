export function bounds(d) {
  if (!d) return null;
  const start = (s) => (s.length === 4 ? s + '-01-01' : s.length === 7 ? s + '-01' : s);
  const end = (s) => {
    if (s.length === 4) return s + '-12-31';
    if (s.length === 7) {
      const [y, m] = s.split('-').map(Number);
      return s + '-' + new Date(Date.UTC(y, m, 0)).getUTCDate();
    }
    return s;
  };
  return [start(d.from), end(d.to || d.from)];
}
export function materialMatchesMention(material, mention) {
  if (material.classification !== 'historical' || mention.verification !== 'verified') return false;
  const m = bounds(material.depictedDate || material.originalDate),
    d = bounds(mention.documentedDate);
  return Boolean(
    m &&
    d &&
    m[0] >= d[0] &&
    m[1] <= d[1] &&
    mention.evidence.some((e) => material.sourceDocumentIds.includes(e.documentId)),
  );
}
export function documentedDates(mentions) {
  const dates = new Map();
  for (const m of mentions.filter((m) => m.verification === 'verified' && m.documentedDate)) {
    const key = JSON.stringify(m.documentedDate);
    if (!dates.has(key)) dates.set(key, { date: m.documentedDate, mentionIds: [] });
    dates.get(key).mentionIds.push(m.id);
  }
  return [...dates.values()].sort((a, b) => a.date.from.localeCompare(b.date.from));
}
