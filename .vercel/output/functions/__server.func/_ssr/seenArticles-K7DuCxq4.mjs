const seenBy = /* @__PURE__ */ new Map();
const MAX_TRACKED = 400;
function markSeen(ids, surface) {
  for (const id of ids) {
    let set = seenBy.get(id);
    if (!set) {
      set = /* @__PURE__ */ new Set();
      seenBy.set(id, set);
    }
    set.add(surface);
  }
  if (seenBy.size > MAX_TRACKED) {
    const excess = seenBy.size - MAX_TRACKED;
    const it = seenBy.keys();
    for (let i = 0; i < excess; i++) {
      const next = it.next().value;
      if (next !== void 0) seenBy.delete(next);
    }
  }
}
function excludeSeen(items, surface, min = 8) {
  const rest = items.filter((item) => {
    const set = seenBy.get(item.id);
    if (!set) return true;
    for (const s of set) {
      if (s !== surface) return false;
    }
    return true;
  });
  return rest.length >= min ? rest : items;
}
export {
  excludeSeen as e,
  markSeen as m
};
