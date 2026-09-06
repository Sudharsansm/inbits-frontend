import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("joins plain class strings", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("drops falsy values", () => {
    const skip = false;
    expect(cn("a", skip && "b", undefined, null, "c")).toBe("a c");
  });

  it("resolves conflicting Tailwind utilities, keeping the last one", () => {
    // tailwind-merge should collapse these to just the final padding
    // class rather than emitting both (which is what a naive template
    // string / clsx-only join would do).
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("supports the conditional-object form", () => {
    expect(cn("base", { active: true, hidden: false })).toBe("base active");
  });
});
