import { describe, expect, it } from "vitest";
import { IN_FEED_AD_EVERY, MAX_IN_FEED_ADS_PER_SESSION, adOrdinalAfter } from "./inFeedAds";

function placements(total: number): number[] {
  const at: number[] = [];
  for (let i = 0; i < total; i++) if (adOrdinalAfter(i, total) !== null) at.push(i);
  return at;
}

describe("adOrdinalAfter", () => {
  it("is configured for 2 posts then 1 ad", () => {
    expect(IN_FEED_AD_EVERY).toBe(2);
  });

  it("places the first ad after the Nth post and nothing before it", () => {
    expect(placements(30)[0]).toBe(IN_FEED_AD_EVERY - 1);
    for (let i = 0; i < IN_FEED_AD_EVERY - 1; i++) expect(adOrdinalAfter(i, 30)).toBeNull();
  });

  it("puts exactly N organic posts between consecutive ads", () => {
    const at = placements(100);
    expect(at.length).toBeGreaterThan(5);
    for (let i = 1; i < at.length; i++) expect(at[i] - at[i - 1]).toBe(IN_FEED_AD_EVERY);
  });

  it("never puts an ad after the last post", () => {
    const n = IN_FEED_AD_EVERY;
    expect(adOrdinalAfter(n - 1, n)).toBeNull(); // Nth post is also the last
    expect(adOrdinalAfter(n - 1, n + 1)).toBe(1); // a post follows it
  });

  it("gives each ad a unique, stable, consecutive ordinal", () => {
    const total = 60;
    const ordinals = placements(total).map((i) => adOrdinalAfter(i, total));
    expect(ordinals).toEqual(ordinals.map((_, k) => k + 1));
    expect(new Set(ordinals).size).toBe(ordinals.length);
  });

  it("returns null for an empty feed", () => {
    expect(adOrdinalAfter(0, 0)).toBeNull();
  });

  it("never places more than MAX_IN_FEED_ADS_PER_SESSION ads in one continuous scroll", () => {
    // A very long infinite-scroll session: far more posts than the cap
    // would otherwise produce ads for.
    const total = (MAX_IN_FEED_ADS_PER_SESSION + 10) * IN_FEED_AD_EVERY;
    const at = placements(total);
    expect(at.length).toBe(MAX_IN_FEED_ADS_PER_SESSION);
    const ordinals = at.map((i) => adOrdinalAfter(i, total));
    expect(Math.max(...(ordinals as number[]))).toBe(MAX_IN_FEED_ADS_PER_SESSION);
    // Beyond the cap, later posts get no trailing ad at all.
    expect(adOrdinalAfter(total - 1, total)).toBeNull();
  });
});