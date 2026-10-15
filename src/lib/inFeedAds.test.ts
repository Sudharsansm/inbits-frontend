import { describe, expect, it } from "vitest";
import { IN_FEED_AD_EVERY, adOrdinalAfter } from "./inFeedAds";

function placements(total: number): number[] {
  const at: number[] = [];
  for (let i = 0; i < total; i++) if (adOrdinalAfter(i, total) !== null) at.push(i);
  return at;
}

describe("adOrdinalAfter", () => {
  it("places the first ad after the 5th post and nothing before it", () => {
    expect(placements(30)[0]).toBe(IN_FEED_AD_EVERY - 1);
    for (let i = 0; i < IN_FEED_AD_EVERY - 1; i++) expect(adOrdinalAfter(i, 30)).toBeNull();
  });

  it("keeps at least 3 organic posts between consecutive ads (brief: 4-6 apart)", () => {
    const at = placements(100);
    expect(at.length).toBeGreaterThan(5);
    for (let i = 1; i < at.length; i++) {
      const organicBetween = at[i] - at[i - 1];
      expect(organicBetween).toBeGreaterThanOrEqual(4);
      expect(organicBetween).toBeLessThanOrEqual(6);
    }
  });

  it("never puts an ad after the last post", () => {
    expect(adOrdinalAfter(4, 5)).toBeNull();
    expect(adOrdinalAfter(4, 6)).toBe(1);
  });

  it("gives each ad a unique, stable ordinal", () => {
    const ordinals = placements(60).map((i) => adOrdinalAfter(i, 60));
    expect(ordinals).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it("returns null for an empty feed", () => {
    expect(adOrdinalAfter(0, 0)).toBeNull();
  });
});