import { describe, expect, it } from "vitest";
import { countryFlag, languageName, sourceOriginLabel } from "./sourceOrigin";

describe("languageName", () => {
  it("maps known ISO codes to display names", () => {
    expect(languageName("en")).toBe("English");
    expect(languageName("HI")).toBe("Hindi");
  });

  it("falls back to the uppercased code for unknown languages", () => {
    expect(languageName("xx")).toBe("XX");
  });

  it("returns an empty string for an empty code", () => {
    expect(languageName("")).toBe("");
  });
});

describe("countryFlag", () => {
  it("maps known locations to a flag emoji", () => {
    expect(countryFlag("India")).toBe("🇮🇳");
    expect(countryFlag("Global")).toBe("🌐");
  });

  it("uses a generic pin for an unknown but non-empty location", () => {
    expect(countryFlag("Narnia")).toBe("📍");
  });

  it("returns an empty string when there is no location", () => {
    expect(countryFlag("")).toBe("");
  });
});

describe("sourceOriginLabel", () => {
  it("combines flag, location and language into one label", () => {
    expect(sourceOriginLabel("India", "en")).toBe("🇮🇳 India · English");
  });

  it("still prefixes a generic pin for an unrecognized location", () => {
    expect(sourceOriginLabel("Narnia", "en")).toBe("📍 Narnia · English");
  });

  it("returns an empty string when both location and language are unknown", () => {
    expect(sourceOriginLabel("", "")).toBe("");
  });
});
