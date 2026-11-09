/** A source query can contain buffered duplicates and parent/child zoom tiles at once. */
export interface ClusterCandidate<T> {
  key: string;
  tileZoom: number;
  members: readonly string[];
  value: T;
}

/** Hide a coarse cluster only when finer tiles represent all of its members. */
export function visibleClusterCandidates<T>(candidates: readonly ClusterCandidate<T>[]): ClusterCandidate<T>[] {
  const unique = new Map<string, ClusterCandidate<T>>();
  for (const candidate of candidates) {
    const previous = unique.get(candidate.key);
    if (!previous || candidate.tileZoom > previous.tileZoom) unique.set(candidate.key, candidate);
  }
  const items = [...unique.values()];
  return items.filter((candidate) => {
    if (candidate.members.length < 2) return true;
    const finerMembers = new Set(
      items.filter((other) => other.tileZoom > candidate.tileZoom).flatMap((other) => [...other.members]),
    );
    return !candidate.members.every((member) => finerMembers.has(member));
  });
}
