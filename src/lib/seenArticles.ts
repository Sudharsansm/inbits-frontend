// Home's main feed, the Updates reel list, and Search's discover grid all
// read from the same live article buffer. Without coordination, opening
// all three back to back shows the same top headlines three times over —
// which is exactly what was being reported. This is a tiny shared
// registry (module-scope, so it's shared across those pages for the
// current session/tab) of which "primary" surfaces (home / updates /
// search) have each shown a given article id.
//
// Stands (its Channel/Showcase/Journal groupings) deliberately never
// reads or writes this — it's meant to be the one place that always has
// everything, seen elsewhere or not.
//
// IMPORTANT: this is keyed per-surface (id -> Set<surface>), not a flat
// "have we shown this anywhere" set. A flat set caused a real bug: Home
// would mark its own visible posts as seen, and on the very next render
// (e.g. after `loadMore`, a socket push, or simply navigating back with
// the feed's cache intact) it would filter those same ids back out of
// *itself* — silently shrinking/reordering the list it had just shown.
// That's what made "tap a story, hit Back" land you somewhere else
// instead of the same post: the feed you returned to wasn't the same
// list you left. Tracking per-surface lets each page ignore its own
// past marks and only exclude ids a *different* surface has shown.
const seenBy = new Map<string, Set<string>>();

// Keep this from growing forever across a very long session — old ids
// are the least likely to still be relevant to "have I seen this
// recently" anyway.
const MAX_TRACKED = 400;

/** Record that these articles were just shown on `surface`. */
export function markSeen(ids: Iterable<string>, surface: string): void {
  for (const id of ids) {
    let set = seenBy.get(id);
    if (!set) {
      set = new Set();
      seenBy.set(id, set);
    }
    set.add(surface);
  }
  if (seenBy.size > MAX_TRACKED) {
    const excess = seenBy.size - MAX_TRACKED;
    const it = seenBy.keys();
    for (let i = 0; i < excess; i++) {
      const next = it.next().value;
      if (next !== undefined) seenBy.delete(next);
    }
  }
}

/**
 * Drop anything already marked seen on a *different* primary surface —
 * but never anything only this same `surface` has shown itself, so a
 * page never ends up excluding its own previously-displayed items.
 * Never returns fewer than `min` items, though — early in a session (or
 * with a small live buffer) excluding everything seen elsewhere could
 * leave a page looking nearly empty, which is worse than an occasional
 * repeat.
 */
export function excludeSeen<T extends { id: string }>(
  items: T[],
  surface: string,
  min = 8,
): T[] {
  const rest = items.filter((item) => {
    const set = seenBy.get(item.id);
    if (!set) return true;
    for (const s of set) {
      if (s !== surface) return false; // seen elsewhere -> exclude
    }
    return true; // only ever seen on `surface` itself -> keep
  });
  return rest.length >= min ? rest : items;
}
