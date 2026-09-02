// Home's main feed, the Updates reel list, and Search's discover grid all
// read from the same live article buffer. Without coordination, opening
// all three back to back shows the same top headlines three times over —
// which is exactly what was being reported. This is a tiny shared
// registry (module-scope, so it's shared across those pages for the
// current session/tab) of article ids that have already been shown on
// one of those three "primary" surfaces.
//
// Stands (its Channel/Showcase/Journal groupings) deliberately never
// reads or writes this — it's meant to be the one place that always has
// everything, seen elsewhere or not.
const seen = new Set<string>();

// Keep this from growing forever across a very long session — old ids
// are the least likely to still be relevant to "have I seen this
// recently" anyway.
const MAX_TRACKED = 400;

/** Record that these articles were just shown on a primary surface. */
export function markSeen(ids: Iterable<string>): void {
  for (const id of ids) seen.add(id);
  if (seen.size > MAX_TRACKED) {
    const excess = seen.size - MAX_TRACKED;
    const it = seen.values();
    for (let i = 0; i < excess; i++) {
      const next = it.next().value;
      if (next !== undefined) seen.delete(next);
    }
  }
}

/**
 * Drop anything already marked seen on another primary surface. Never
 * returns fewer than `min` items, though — early in a session (or with a
 * small live buffer) excluding everything seen so far could leave a page
 * looking nearly empty, which is worse than an occasional repeat.
 */
export function excludeSeen<T extends { id: string }>(items: T[], min = 8): T[] {
  const rest = items.filter((item) => !seen.has(item.id));
  return rest.length >= min ? rest : items;
}
