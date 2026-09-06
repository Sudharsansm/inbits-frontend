import { describe, expect, it, vi } from "vitest";
import { formatCount, formatRelativeTime } from "./format";

describe("formatCount", () => {
  it("returns small numbers unchanged", () => {
    expect(formatCount(0)).toBe("0");
    expect(formatCount(999)).toBe("999");
  });

  it("abbreviates thousands with a K suffix", () => {
    expect(formatCount(1000)).toBe("1K");
    expect(formatCount(1500)).toBe("1.5K");
    expect(formatCount(12345)).toBe("12.3K");
  });

  it("drops a trailing .0 rather than showing 1.0K", () => {
    expect(formatCount(2000)).toBe("2K");
  });
});

describe("formatRelativeTime", () => {
  it("returns an empty string for an empty input", () => {
    expect(formatRelativeTime("")).toBe("");
  });

  it("falls back to the raw string for unparseable input instead of throwing", () => {
    expect(formatRelativeTime("not-a-date")).toBe("not-a-date");
  });

  it("labels sub-minute timestamps as 'Just now'", () => {
    const now = new Date("2026-01-01T12:00:00Z");
    vi.setSystemTime(now);
    expect(formatRelativeTime(now.toISOString())).toBe("Just now");
    vi.useRealTimers();
  });

  it("shows minutes ago for timestamps under an hour old", () => {
    const now = new Date("2026-01-01T12:30:00Z");
    vi.setSystemTime(now);
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60_000).toISOString();
    expect(formatRelativeTime(tenMinutesAgo)).toBe("10m ago");
    vi.useRealTimers();
  });

  it("shows hours ago for timestamps under a day old", () => {
    const now = new Date("2026-01-01T12:00:00Z");
    vi.setSystemTime(now);
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60_000).toISOString();
    expect(formatRelativeTime(threeHoursAgo)).toBe("3h ago");
    vi.useRealTimers();
  });

  it("labels exactly one day old as 'Yesterday'", () => {
    const now = new Date("2026-01-02T12:00:00Z");
    vi.setSystemTime(now);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60_000).toISOString();
    expect(formatRelativeTime(oneDayAgo)).toBe("Yesterday");
    vi.useRealTimers();
  });

  it("falls back to a full date beyond a week old", () => {
    const now = new Date("2026-02-01T12:00:00Z");
    vi.setSystemTime(now);
    const longAgo = new Date("2026-01-01T12:00:00Z").toISOString();
    const result = formatRelativeTime(longAgo);
    expect(result).not.toMatch(/ago$/);
    expect(result.length).toBeGreaterThan(0);
    vi.useRealTimers();
  });
});
