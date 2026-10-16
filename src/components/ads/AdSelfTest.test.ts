import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { detectBrowser, runAdSelfTest } from "./adSelfTest";

function stubBaitHeight(height: number) {
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get: () => height,
  });
}
function setConnection(c: unknown) {
  Object.defineProperty(window.navigator, "connection", { configurable: true, value: c });
}

describe("detectBrowser", () => {
  it("recognises the common phone browsers", () => {
    expect(detectBrowser("Mozilla/5.0 ... SamsungBrowser/24.0 Chrome/117", false)).toBe(
      "Samsung Internet",
    );
    expect(detectBrowser("Mozilla/5.0 ... Chrome/120 Mobile Safari/537.36 OPR/80", false)).toBe(
      "Opera",
    );
    expect(detectBrowser("Mozilla/5.0 (Android) Chrome/120 Mobile Safari/537.36", false)).toBe(
      "Chrome",
    );
    expect(
      detectBrowser("Mozilla/5.0 (iPhone) AppleWebKit Version/17 Mobile Safari/604", false),
    ).toBe("Safari");
    expect(detectBrowser("anything", true)).toContain("Brave");
  });
});

describe("runAdSelfTest verdicts", () => {
  beforeEach(() => {
    stubBaitHeight(10); // ad-looking bait element is shown
    setConnection({ saveData: false, effectiveType: "4g" });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("Google's ad hosts unreachable -> blocked verdict (blocker / DNS / VPN / network)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const r = await runAdSelfTest();
    expect(r.lines.join("\n")).toContain("reach Google ad script: BLOCKED");
    expect(r.verdict).toContain("cannot reach Google's ad servers");
  });

  it("reachable but an ad filter hides ad-looking elements -> filter verdict", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({}));
    stubBaitHeight(0);
    const r = await runAdSelfTest();
    expect(r.lines.join("\n")).toContain("HIDDEN by an ad filter");
    expect(r.verdict).toContain("ad filter on this phone hides ad elements");
  });

  it("reachable, nothing hidden, Data Saver ON -> data saver verdict", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({}));
    setConnection({ saveData: true, effectiveType: "3g" });
    const r = await runAdSelfTest();
    expect(r.lines.join("\n")).toContain("data saver: ON");
    expect(r.verdict).toContain("Data Saver is on");
  });

  it("all clear -> says nothing blocks the phone and points at fill / old build", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({}));
    const r = await runAdSelfTest();
    expect(r.lines.join("\n")).toContain("reach Google ad script: ok");
    expect(r.lines.join("\n")).toContain("ad-like elements: shown normally");
    expect(r.verdict).toContain("nothing on this phone is blocking ads");
    expect(r.verdict).toContain("old build");
    expect(r.lines.some((l) => l.startsWith("build running:"))).toBe(true);
  });

  it("only makes no-cors, credential-less requests to Google's ad hosts", async () => {
    const f = vi.fn().mockResolvedValue({});
    vi.stubGlobal("fetch", f);
    await runAdSelfTest();
    const urls = f.mock.calls.map((c) => String(c[0]));
    expect(urls.every((u) => /googlesyndication\.com|doubleclick\.net/.test(u))).toBe(true);
    for (const c of f.mock.calls) {
      expect(c[1]).toMatchObject({ mode: "no-cors", credentials: "omit" });
    }
  });
});