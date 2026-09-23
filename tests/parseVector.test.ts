import { describe, it, expect } from "vitest";
import { parseCVSS31Vector } from "../src/utils/cvss31";

describe("CVSS v3.1 Vector Parsing & Validation", () => {
  it("parses standard valid vector string correctly", () => {
    const vector = "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H";
    const result = parseCVSS31Vector(vector);

    expect(result.ok).toBe(true);
    expect(result.version).toBe("3.1");
    expect(result.selections).toEqual({
      AV: "N",
      AC: "L",
      PR: "N",
      UI: "N",
      S: "C",
      C: "H",
      I: "H",
      A: "H"
    });
  });

  it("handles non-standard metric ordering in vector string", () => {
    const vector = "CVSS:3.1/S:U/C:H/I:N/A:L/AV:N/AC:H/PR:N/UI:R";
    const result = parseCVSS31Vector(vector);

    expect(result.ok).toBe(true);
    expect(result.selections?.S).toBe("U");
    expect(result.selections?.AV).toBe("N");
    expect(result.selections?.C).toBe("H");
  });

  it("rejects unsupported CVSS versions", () => {
    const vector = "CVSS:2.0/AV:N/AC:L/Au:N/C:P/I:P/A:P";
    const result = parseCVSS31Vector(vector);

    expect(result.ok).toBe(false);
    expect(result.error?.title).toBe("Unsupported Version");
  });

  it("rejects invalid metric option values (e.g. AV:Z)", () => {
    const vector = "CVSS:3.1/AV:Z/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H";
    const result = parseCVSS31Vector(vector);

    expect(result.ok).toBe(false);
    expect(result.error?.title).toBe("Invalid Option Value");
  });

  it("rejects metric elements with extra ':' segments", () => {
    const vector = "CVSS:3.1/AV:N:junk/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H";
    const result = parseCVSS31Vector(vector);

    expect(result.ok).toBe(false);
    expect(result.error?.title).toBe("Malformed Metric");
  });

  it("rejects duplicate metric keys", () => {
    const vector = "CVSS:3.1/AV:N/AV:L/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H";
    const result = parseCVSS31Vector(vector);

    expect(result.ok).toBe(false);
    expect(result.error?.title).toBe("Duplicate Metric");
  });

  it("rejects incomplete vector missing required base metrics", () => {
    const vector = "CVSS:3.1/AV:N/AC:L";
    const result = parseCVSS31Vector(vector);

    expect(result.ok).toBe(false);
    expect(result.error?.title).toBe("Incomplete Vector");
  });

  it("rejects empty or non-string inputs", () => {
    expect(parseCVSS31Vector("").ok).toBe(false);
    expect(parseCVSS31Vector(null).ok).toBe(false);
    expect(parseCVSS31Vector(undefined).ok).toBe(false);
  });
});
