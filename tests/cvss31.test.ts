import { describe, it, expect } from "vitest";
import { calculateCVSS31, roundup, getSeverityRating } from "../src/utils/cvss31";

describe("CVSS v3.1 Roundup Utility", () => {
  it("rounds up according to FIRST CVSS 3.1 specification", () => {
    expect(roundup(4.0)).toBe(4.0);
    expect(roundup(4.02)).toBe(4.1);
    expect(roundup(4.0001)).toBe(4.1);
    expect(roundup(0.0)).toBe(0.0);
    expect(roundup(9.91)).toBe(10.0);
    expect(roundup(10.0)).toBe(10.0);
  });
});

describe("Severity Rating Calculation", () => {
  it("correctly maps score boundaries to severity ratings", () => {
    expect(getSeverityRating(0.0).name).toBe("None");
    expect(getSeverityRating(0.1).name).toBe("Low");
    expect(getSeverityRating(3.9).name).toBe("Low");
    expect(getSeverityRating(4.0).name).toBe("Medium");
    expect(getSeverityRating(6.9).name).toBe("Medium");
    expect(getSeverityRating(7.0).name).toBe("High");
    expect(getSeverityRating(8.9).name).toBe("High");
    expect(getSeverityRating(9.0).name).toBe("Critical");
    expect(getSeverityRating(10.0).name).toBe("Critical");
    expect(getSeverityRating(null).name).toBe("?");
  });
});

describe("Official Benchmark CVSS v3.1 Calculations", () => {
  it("calculates CVE-2021-44228 (Log4Shell) as 10.0 Critical", () => {
    const result = calculateCVSS31({
      AV: "N",
      AC: "L",
      PR: "N",
      UI: "N",
      S: "C",
      C: "H",
      I: "H",
      A: "H"
    });

    expect(result.isComplete).toBe(true);
    expect(result.score).toBe(10.0);
    expect(result.scoreString).toBe("10.0");
    expect(result.ratingDetails.name).toBe("Critical");
    expect(result.string).toBe("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H");
  });

  it("calculates CVE-2014-0160 (Heartbleed) as 7.5 High", () => {
    const result = calculateCVSS31({
      AV: "N",
      AC: "L",
      PR: "N",
      UI: "N",
      S: "U",
      C: "H",
      I: "N",
      A: "N"
    });

    expect(result.isComplete).toBe(true);
    expect(result.score).toBe(7.5);
    expect(result.scoreString).toBe("7.5");
    expect(result.ratingDetails.name).toBe("High");
  });

  it("calculates CVE-2020-0601 (CurveBall) as 8.1 High", () => {
    const result = calculateCVSS31({
      AV: "N",
      AC: "L",
      PR: "N",
      UI: "R",
      S: "U",
      C: "H",
      I: "H",
      A: "N"
    });

    expect(result.isComplete).toBe(true);
    expect(result.score).toBe(8.1);
    expect(result.scoreString).toBe("8.1");
    expect(result.ratingDetails.name).toBe("High");
  });

  it("calculates zero score when all impacts are None", () => {
    const result = calculateCVSS31({
      AV: "N",
      AC: "L",
      PR: "N",
      UI: "N",
      S: "U",
      C: "N",
      I: "N",
      A: "N"
    });

    expect(result.isComplete).toBe(true);
    expect(result.score).toBe(0.0);
    expect(result.scoreString).toBe("0.0");
    expect(result.ratingDetails.name).toBe("None");
  });

  it("returns incomplete status when not all metrics are provided", () => {
    const result = calculateCVSS31({
      AV: "N",
      AC: "L"
    });

    expect(result.isComplete).toBe(false);
    expect(result.score).toBeNull();
    expect(result.scoreString).toBe("-");
    expect(result.ratingDetails.name).toBe("?");
  });
});

describe("Invalid metric values", () => {
  const valid = { AV: "N", AC: "L", PR: "N", UI: "N", S: "U", C: "H", I: "H", A: "H" };

  it.each([
    ["unknown value", { AV: "X" }],
    ["wrong case", { S: "u" }],
    ["object prototype key", { AV: "constructor" }],
    ["markup", { C: "<img src=x onerror=alert(1)>" }],
    ["empty string", { A: "" }]
  ])("treats %s as incomplete instead of scoring it", (_, override) => {
    const result = calculateCVSS31({ ...valid, ...override });

    expect(result.isComplete).toBe(false);
    expect(result.score).toBeNull();
    expect(result.scoreString).toBe("-");
    expect(result.string).toBe("");
    expect(result.ratingDetails.name).toBe("?");
  });
});
