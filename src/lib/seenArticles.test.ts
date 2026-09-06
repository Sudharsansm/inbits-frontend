import { describe, expect, it } from "vitest";
import { excludeSeen, markSeen } from "./seenArticles";

// Use unique ids per test (module-level state is shared across the whole
// file) so tests can't interfere with each other's marks.
function items(ids: string[]) {
  return ids.map((id) => ({ id }));
}

describe("excludeSeen", () => {
  it("keeps items nothing has marked seen", () => {
    const list = items(["a1", "a2", "a3"]);
    expect(excludeSeen(list, "home", 1)).toEqual(list);
  });

  it("excludes an item seen on a different surface", () => {
    markSeen(["b1"], "updates");
    const list = items(["b1", "b2", "b3"]);
    const result = excludeSeen(list, "home", 1);
    expect(result.map((i) => i.id)).not.toContain("b1");
  });

  it("does not exclude an item a surface marked seen on itself", () => {
    markSeen(["c1"], "home");
    const list = items(["c1", "c2", "c3"]);
    const result = excludeSeen(list, "home", 1);
    expect(result.map((i) => i.id)).toContain("c1");
  });

  it("never drops below `min` items even if everything was seen elsewhere", () => {
    markSeen(["d1", "d2", "d3"], "updates");
    const list = items(["d1", "d2", "d3"]);
    const result = excludeSeen(list, "home", 2);
    // Filtering would leave 0, which is below min=2, so the original
    // list is returned unfiltered rather than showing an empty page.
    expect(result).toEqual(list);
  });
});
