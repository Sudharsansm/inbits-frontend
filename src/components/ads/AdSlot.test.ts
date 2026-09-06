import { describe, expect, it, vi, afterEach } from "vitest";
import { isAdSenseConfigured } from "./AdSlot";

function withHostname(hostname: string, fn: () => void) {
  const original = window.location;
  Object.defineProperty(window, "location", {
    value: { ...original, hostname },
    writable: true,
  });
  try {
    fn();
  } finally {
    Object.defineProperty(window, "location", { value: original, writable: true });
  }
}

describe("isAdSenseConfigured", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects placeholder slot IDs (all zeros) even on a real host", () => {
    withHostname("inbits.app", () => {
      expect(isAdSenseConfigured("0000000000")).toBe(false);
      expect(isAdSenseConfigured("0")).toBe(false);
    });
  });

  it("rejects any slot when running on localhost", () => {
    withHostname("localhost", () => {
      expect(isAdSenseConfigured("1234567890")).toBe(false);
    });
  });

  it("rejects any slot on 127.0.0.1", () => {
    withHostname("127.0.0.1", () => {
      expect(isAdSenseConfigured("1234567890")).toBe(false);
    });
  });

  it("accepts a real-looking slot ID on a real host", () => {
    withHostname("inbits.app", () => {
      expect(isAdSenseConfigured("1234567890")).toBe(true);
    });
  });
});